const express = require('express');
const app = express();
const path = require("path");
const util = require('util');
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy');
const cron = require("node-cron");
const Datastore = require('nedb');
const passport = require('passport');
const flash    = require('connect-flash');
const session      = require('express-session');
const assert = require('assert');
const http = require('http').Server(app);
require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log 


//needed for running as nexe
global.approot  = path.dirname(process.execPath);
try{
    //running as compiled exe file (nexe)
    global.config = require(global.approot  + '/server_config');
    console.log("Running as compiled file")
}catch(e){
    //running as local script
    global.config = require(__dirname + '/server_config');
    global.approot  = __dirname;
    console.log("Running as node script")
}

    /*
app.put("/proxy/*",function(req, res, next) {
    console.log( req.body)
     next();
})
*/
//forward requests to ffastrans # export variable for debugging: set DEBUG=express-http-proxy (onwindows)
app.use('/proxy', proxy("http://"+global.config.STATIC_API_HOST+":"+global.config.STATIC_API_PORT,{
  parseReqBody: false,
  reqBodyEncoding: null,
  reqAsBuffer: true,
    proxyReqBodyDecorator: function(bodyContent, srcReq) {
    //bodyContent=(srcReq.body)
    console.log("proxy")
    return bodyContent;
  }
}));//TODO: read ffastrans server and port from config


    
// get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//init DB
global.db={};
global.db.jobs = new Datastore({ filename: global.approot  + "/database/jobs" });
global.db.jobs.loadDatabase(function (err) {    //database is vacuumed at startup
  assert.equal(null, err);
});
global.db={};
global.db.config = new Datastore({ filename: global.approot  + "/database/config" });
global.db.config.loadDatabase(function (err) {    //database is vacuumed at startup
  assert.equal(null, err);
});

//init job fetching cron every 1 second - we use cron instead of setTimeout or interval because cron might be needed in future for other stuff
var jobfetcher = require("./node_components/cron_tasks/jobfetcher");
cron.schedule("* * * * * *", function() {
    if (!global.dbfetcheractive){
        global.dbfetcheractive = true;
        try{
            jobfetcher.fetchjobs();
        }catch (ex){
            console.trace("Error, jobfetcher exception. " + ex)
        }
        global.dbfetcheractive = false;
    }else{
        console.log("Jobfetcher still active, that should not happen");
    }
});
    
    

//Respond to client events socket.io
var jobcontrol = require("./node_components/jobcontrol_socketio");
  

//init live connection to clients using socket.io
global.socketio = require('socket.io')(http);
global.socketio.on('connection', function(socket){
  console.log('New socket io client connected');
    socket.on('*', function(data){
        var regex = /cancel/
        var result = data.data[0].match(regex);
        var cmd = data.data[0];
        var obj = data.data[1];
        if (cmd == "pausejob"){
            jobcontrol.pausejob(obj);
        }else{
            
            
        }
        
        
    })
  socket.on('disconnect', function(){
    console.log('client disconnected');
  });
  });



var wildcard = require('socketio-wildcard')();
global.socketio.use(wildcard);
global.socketio.on('*', function(obj){
   console.log("Cancel command received");
});

//log all requests
app.use(function(req, res, next) {
    //console.log(req.originalUrl);
    next();
});


// serve static websites

//allow access to dynamic stuff
require("./upload_backend/common")(app, express);
require("./upload_backend/saverename")(app, express);
require("./upload_backend/getFullUploadPath")(app, express);
//require("./node_components/redirect")(app, express);
require("./node_components/filebrowser")(app, express);
require("./node_components/getbrowselocations")(app, express);
require("./node_components/serveconfig")(app, express);

//catch all uncaught exceptions - keeps the server running
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

//favicon
app.use('/favicon.ico', express.static('webinterface/images/favicon.ico'));


// required for passport
app.use(session({ 
                    secret: 'you_will_never_guess_the_secret' ,    
                    resave: true,
                    saveUninitialized: true
    }));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());            // use connect-flash for flash messages stored in session for this crappy ejs stuff
require('./node_components/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./node_components/passport/passport')(passport); // pass passport for configuration
//redirect views - for passport
app.set('views', path.join(__dirname, './node_components/passport/views/'));


//startup
console.log('Hello and welcome, thank you for using FFAStrans') 
http.listen(global.config.STATIC_WEBSERVER_LISTEN_PORT, () => console.log('Running on http://localhost:' + global.config.STATIC_WEBSERVER_LISTEN_PORT));



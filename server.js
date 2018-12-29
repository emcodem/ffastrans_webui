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
const fs = require('fs');
const socket = require('socket.io');
const socketwildcard = require('socketio-wildcard');
require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log 

//needed for running as nexe - access to local files (database) is different 
global.approot  = path.dirname(process.execPath);
if (fs.existsSync(global.approot + "/database/")) {
    console.log("Running as compiled file")
}else{
    global.approot  = __dirname;
    console.log("Running as node script - developer mode")   
    if (!fs.existsSync(global.approot + "/database/")){
        console.error("Database does not exist, please create it:" + global.approot + "/database/config");
    }
}
        
//Before DB init, we need socket.io
var jobcontrol = require("./node_components/jobcontrol_socketio");
  
//init live connection to clients using socket.io
global.socketio = socket(http);
var wildcard = socketwildcard();
global.socketio.use(wildcard);
global.socketio.on('connection', function(socket){
  console.log('New socket io client connected');
    socket.on('*', function(data){
        var regex = /cancel/
        var result = data.data[0].match(regex);
        var cmd = data.data[0];
        var obj = data.data[1];
        if (cmd == "pausejob"){
            jobcontrol.pausejob(obj);
        }else{}
    })
  socket.on('disconnect', function(){
    console.log('client disconnected');
  });
});

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

//get global config
require( './node_components/server_config').get(init);


function init(conf){
    //callback for global config get method, initializes rest of server
    
    global.config = conf;
    
    //proxy, forward requests to ffastrans # export variable for debugging: set DEBUG=express-http-proxy (onwindows)
    app.use('/proxy', proxy("http://"+global.config.STATIC_API_HOST+":"+global.config.STATIC_API_PORT,{
      parseReqBody: false,
      reqBodyEncoding: null,
      reqAsBuffer: true,
        proxyReqBodyDecorator: function(bodyContent, srcReq) {
       //the "" is important here, it works around that node adds strange bytes to the request body, looks like BOM but isn't
       //we actually want the body to be forwarded unmodified
        bodyContent=(""+srcReq.body) 
        return bodyContent;
      }
    }));

    // get information from html forms
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    //init job fetching cron every 3 seconds - we use cron instead of setTimeout or interval because cron might be needed in future for other stuff
    var jobfetcher = require("./node_components/cron_tasks/jobfetcher");
    cron.schedule("*/3 * * * * *", function() {
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

    //log all requests
    app.use(function(req, res, next) {
        //console.log(req.originalUrl);
        next();
    });

    //allow access to dynamic stuff
    require("./upload_backend/common")(app, express);
    require("./upload_backend/saverename")(app, express);
    require("./upload_backend/getFullUploadPath")(app, express);
    require("./node_components/filebrowser")(app, express);
    require("./node_components/getserverconfig")(app, express);
    require("./node_components/logparser")(app, express);
    require("./node_components/views/adminconfig")(app, express);

    //catch all uncaught exceptions - keeps the server running
    process.on('uncaughtException', function(err) {
      console.trace('Caught exception: ' + err);
    });

    //favicon
    app.use('/favicon.ico', express.static('./webinterface/images/favicon.ico'));

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

        http.listen(global.config.STATIC_WEBSERVER_LISTEN_PORT, () => console.log('Running on http://localhost:' + global.config.STATIC_WEBSERVER_LISTEN_PORT)).on('error', function(err) { 
            console.log(err)//prevents the program keeps running when port is in use
            if (err.code == "EADDRINUSE"){
                const { exec } = require('child_process');
                   exec('netstat -ano |findstr '+global.config.STATIC_WEBSERVER_LISTEN_PORT, (err, stdout, stderr) => {
                      console.log("\nError starting webserver, please check if Port "+global.config.STATIC_WEBSERVER_LISTEN_PORT+" is in use or the server is already running... " ) 
                      if (err) {
                        console.log("was not able to start netstat, please enter it manually")
                        process.exit();
                      }
                        console.log(`stdout: ${stdout}`);
                        
                        console.log("\n\n Please see above what processid (rightmost number) is LISTENING to Port "+global.config.STATIC_WEBSERVER_LISTEN_PORT+ " and close the process")
                        process.exit();
                   })
                
                
                
        }});
    
    
}




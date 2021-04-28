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
const ffastrans_new_rest_api = require("./rest_service");
// const blocked = require('blocked-at')
// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

//register special mime types
//express.mime.type['locallink'] = 'application/internet-shortcut';
console.log(express.mime)
//job scheduler - TODO: reset isactive state at program start
global.jobScheduler = require("./node_components/cron_tasks/scheduled_jobs.js");

//LOGGING
require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log
//LOGGING SETUP WINSTON
//redirect console.log functions
//console.log = function () {return logger.info.apply(logger, arguments)};
//console.error = function () {return logger.error.apply(logger, arguments)};
//console.warn = function () { return logger.warn.apply(logger, arguments) };
//console.info = function () { return logger.warn.apply(logger, arguments) };
//END OF LOGGING SETUP


//catch all uncaught exceptions - keeps the server running
process.on('uncaughtException', function(err) {
  console.trace('Global unexpected error: ' , err);
  if (err.stack){
      err.stackTraceLimit = Infinity;
      console.error(err.stack);
    }
    if (err.name === 'AssertionError') {
        // handle the assertion here or just ignore it..
        console.log("HERE WE GO, MEDIAINFO FOOLED US");
    }
});
process.on('unhandledRejection', (reason, promise) => {
    console.trace('Global unexpected error: ' , reason);
    if (reason.stack) {
        console.error(reason.stack);
    }
})

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
//register supported functions
global.socketio.on('connection', function(_socket){
  console.log('New socket io client connected, client: ' + _socket.id);
  global.socketio.emit("logged_in_users_count", global.socketio.engine.clientsCount);
  console.log("Count of concurrent connections: " + global.socketio.engine.clientsCount);
  
  //send back the socketio id to the client
    _socket.emit("socketid",_socket.id);
  
  //register to all events from client
    _socket.on('*', function(data){
        var regex = /cancel/
        var result = data.data[0].match(regex);
        var cmd = data.data[0];
        var obj = data.data[1];
        if (cmd == "pausejob"){
            jobcontrol.pausejob(obj);
            return;
        }
        if (cmd == "deletejob"){
            jobcontrol.deletejob(obj);
            return;
        }
        if (cmd == "deletealljobs"){
            jobcontrol.deletealljobs();
            return;
        }
    })
    
    //client disconnected
  _socket.on('disconnect', function(){
    global.socketio.emit("logged_in_users_count", global.socketio.engine.clientsCount);
    console.log("Count of concurrent connections: " + global.socketio.engine.clientsCount);
    console.log('client disconnected');
    
  });
});

//init DB
global.db={};
global.db.jobs = new Datastore({ filename: global.approot  + "/database/jobs" });
global.db.jobs.loadDatabase(function (err) {    //database is vacuumed at startup
  assert.equal(null, err);
});

global.db.config = new Datastore({ filename: global.approot  + "/database/config" });
global.db.config.loadDatabase(function (err) {    //database is vacuumed at startup
  assert.equal(null, err);
});

//get global config
require( './node_components/server_config').get(init);


function init(conf){
    //callback for global config get method, initializes rest of server
    
    global.config = conf;
        
    // required for passport
    app.use(session({ 
                        secret: 'you_will_never_guess_the_secret' ,    
                        resave: true,
                        saveUninitialized: true
        }));
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash());            // use connect-flash for flash messages stored in session for this crappy ejs stuff
    
    //redirect views - for passport
    app.set('views', path.join(__dirname, '.f/node_components/passport/views/'));

    //NEW REST API - replaces the builtin ffastrans api, possible TODO: move this out of here to be standalone service delivered with ffastrans base
    var about_url = ("http://" + global.config["STATIC_API_HOST"] + ":" + global.config["STATIC_API_PORT"] + "/api/json/v2/about");
    var _request = require('retry-request', {
        request: require('request')
    });
	
    //we need to get install directory when running as part of webinterface, before we can start new api
    _request(about_url, {noResponseRetries:50000,timeout:1000}, (error, response, body) => {
        
        if (error) {
            console.log("Fatal error, cannot start new_rest_api, did not get about page from ffastrans " + error);
            return;
        };
        console.log("Starting up REST API on Port " + global.config["STATIC_API_NEW_PORT"]);
        
        var api_root = path.join(__dirname, 'rest_service');
        ffastrans_new_rest_api.init(global.config["STATIC_API_HOST"] ,global.config["STATIC_API_PORT"], global.config["STATIC_API_NEW_PORT"]);
        
    })
    //PROXY, forward requests to ffastrans # export variable for debugging: set DEBUG=express-http-proxy (onwindows)
    //DEPRECATED, USE NEW API AND PROXY
    app.use('/proxy', proxy("http://"+global.config.STATIC_API_HOST+":"+global.config.STATIC_API_PORT,{
        onProxyReq: function (proxyReq, req, res) {
            console.log(proxyReq)
        },
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

    //PROXY, forward requests to ffastrans # export variable for debugging: set DEBUG=express-http-proxy (onwindows)
    app.use('/new_proxy', proxy("http://" + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT, {
        logLevel: "info",
        proxyTimeout: 1000,
        onProxyReq: function (proxyReq, req, res) {
                                    console.log(proxyReq) 
                                },
        parseReqBody: false,
        reqBodyEncoding: null,
        reqAsBuffer: true,
        proxyReqBodyDecorator: function (bodyContent, srcReq) {
            //the "" is important here, it works around that node adds strange bytes to the request body, looks like BOM but isn't
            //we actually want the body to be forwarded unmodified
            console.debug("Proxying API call, request url: " , srcReq.url)
            bodyContent = ("" + srcReq.body)
            return bodyContent;
        }
    }));

    // get information from POST like messages
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    //init job fetching cron every 3 seconds - we use cron instead of setTimeout or interval because cron might be needed in future for other stuff
    var jobfetcher = require("./node_components/cron_tasks/jobfetcher");
    
    cron.schedule("*/5 * * * * *", function() {
        //GET LATEST JOBS FROM FFASTRANS API      
        if (!global.dbfetcheractive){
            global.dbfetcheractive = true;
            try{
                jobfetcher.fetchjobs();
            }catch (ex){
                console.trace("Error, jobfetcher exception. " + ex)
            }
            global.dbfetcheractive = false;
        }else{
            console.error("Jobfetcher still active, that should not happen");
        }
    })
    cron.schedule("*/2 * * * * *", function() {
    //SCHEDULED JOBS
        if (!global.jobscheduleractive){
            global.jobscheduleractive = true;
                try{
                    jobScheduler.execute();
                }catch (ex){
                    //TODO: what to do when scheduler runs into error?
                    console.trace("Error, scheduler exception. " + ex)
                }
                global.jobscheduleractive = false;
        }else{
            console.error("Scheduler still active, that should not happen!");
        }
        
    });

    //log all requests
    app.use(function(req, res, next) {
        //console.log("REQUEST: " + req.originalUrl);
        next();
    });

    //allow access to dynamic stuff

    require('./node_components/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
    require('./node_components/passport/passport')(passport); // pass passport for configuration
    require("./upload_backend/common")(app, express);
    require("./upload_backend/saverename")(app, express);
    require("./upload_backend/getFullUploadPath")(app, express);
    require("./node_components/filebrowser")(app, express);
    require("./node_components/getserverconfig")(app, express);
    require("./node_components/logparser")(app, express);
    require("./node_components/views/adminconfig")(app, express);
    require("./node_components/views/gethistoryjobsajax_treegrid")(app, express);
    require("./node_components/views/getactivejobsajax_treegrid")(app, express);
    require("./node_components/databasemaintenance")(app, express);
    require("./node_components/views/userlist")(app, express);
    require("./node_components/views/usergrouplist")(app, express);
    require("./node_components/views/usergrouprightslist")(app, express);
    require("./node_components/views/getworkflowlist")(app, passport);
    require("./node_components/views/getworkflowdetails")(app, passport);
    require("./node_components/views/scheduledjobs")(app, passport);
    require("./node_components/get_userpermissions")(app, passport);
    require("./node_components/resumeable_backend.js")(app, passport);
    require("./node_components/mediainfo.js")(app, passport);
	require("./node_components/activedirectory_tester.js")(app, passport);
    //favicon
    app.use('/favicon.ico', express.static('./webinterface/images/favicon.ico'));


    //startup server
    console.log('\x1b[32mHello and welcome, thank you for using FFAStrans') 

    http.listen(global.config.STATIC_WEBSERVER_LISTEN_PORT, () => console.log('\x1b[36m%s\x1b[0m','Running on http://localhost:' + global.config.STATIC_WEBSERVER_LISTEN_PORT)).on('error', function(err) { 
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




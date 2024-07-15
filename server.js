const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
global.expressapp = app;
const path = require("path");
const util = require('util');
const bodyParser = require('body-parser');
const proxy = require('express-http-proxy');
const cron = require("node-cron");
const AsyncNedb  = require('@seald-io/nedb');
const Mongod = require("./node_components/mongodb_server/mongod");
const portfinder = require("portfinder");
const passport = require('passport');
global.passport = passport;
const axios = require('axios');

const session      = require('express-session');
const assert = require('assert');
const fs = require('fs-extra');
const socket = require('socket.io');

const socketwildcard = require('socketio-wildcard');
const configmgr = require( './node_components/server_config')
const database_controller = require('./node_components/common/database_controller')
const ffastrans_new_rest_api = require("./rest_service");

const { Player } = require( './node_components/player')

const logfactory = require("./node_components/common/logger")
const dns = require('node:dns');
dns.setDefaultResultOrder("ipv4first"); //node 18 tends to take ipv6 first, this forces it to use ipv4first.
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0; //as we have a self-signed example cert, we allow self-signed
// const blocked = require('blocked-at')
// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

//LOGGING
require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

//catch all uncaught exceptions - keeps the server running
process.on('uncaughtException', function(err) {
  console.trace('Global unexpected error: ' , err);
  if (err.stack){
      err.stackTraceLimit = Infinity;
      console.error(err.stack);
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
if (fs.existsSync(path.join(global.approot, "/database/"))) {
    console.log("Running as compiled file")
}else{
    global.approot  = __dirname;
    console.log("Running as node script - developer mode")  
    if (!fs.existsSync(global.approot + "/database/")){
        console.error("Database does not exist, please create it:" + global.approot + "/database/config");
    }
}

//fire up logger, overrides console log
var logger = logfactory.getLogger("webint");
console.log = (...args)     => logger.info.call(logger, ...args);
console.info = (...args)    => logger.info.call(logger, ...args);
console.warn = (...args)    => logger.warn.call(logger, ...args);
console.error = (...args)   => logger.error.call(logger, ...args);
console.debug = (...args)   => logger.debug.call(logger, ...args);

//job scheduler - TODO: reset isactive state at program start
global.jobScheduler = require("./node_components/cron_tasks/scheduled_jobs.js");

//Before DB init, we need socket.io
var jobcontrol = require("./node_components/jobcontrol_socketio");

//init DB
global.db={};
global.db.config = new AsyncNedb({ filename: global.approot  + "/database/config" });

global.db.config.loadDatabase(function (err) {    //database is vacuumed at startup
  assert.equal(null, err);
});

//get global config
configmgr.get(init);

async function connectDb(){

    //fire up database process
    var dbpath = path.join(global.approot, "/database/job_db");
    await fs.ensureDir(dbpath);
    console.log("Database path:",dbpath)
    var dbPort = await portfinder.getPortPromise({port: 8010, stopPort: 8020});
    var dblogger = logfactory.getLogger("database");
    console.log("Database port: " + dbPort);
    global.db.mongod = new Mongod(dbpath);
    global.db.mongod.port = dbPort;
    global.db.mongod.start();
    
    dblogger.info("Database port: ",dbPort);
    global.db.mongod.onStdOut = function(data){
        dblogger.info(data.toString());
    }
    global.db.mongod.onStdErr = function(data){
        dblogger.error(data.toString());
    }
    global.db.mongod.onExit = function(data){
        dblogger.info("database process exited, code: ",data);
        //todo:restart DB? Anyway, we must inform clients continuously...
		setTimeout(function(){
            dblogger.info("Initiating connect retry in 3 seconds");
            global.socketio.emit("databaseerror", "Job Database process exited, please restart webinterface service and read log files");
            connectDb()
        },3000);
        // setInterval(function(){
		// 	//show errormsg forever as we do not attempt to reconnect
		// 	
		// }, 3000);
    }

    //connect to database, store connection in global object
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:"+dbPort+"/";//jobs
    var mongoclient;
	try{ 
		mongoclient = await MongoClient.connect(url)
	}catch(ex){
		// var myInterval = setInterval(function(){
		// 	//show errormsg forever as we do not attempt to reconnect
		// 	
		// }, 3000);
        setTimeout(function(){
            dblogger.info("Initiating connect retry in 3 seconds");
            global.socketio.emit("error", "Fatal Error connecting to job history database, view db logs and restart service!" + " Message: " + ex);
            connectDb()
        },3000);
	}
    
    const db = mongoclient.db("webinterface");
    global.db.jobs = db.collection('jobs');
    global.db.deleted_jobs = db.collection('deleted_jobs');

    var old_dbpath = path.join(global.approot, "/database/jobs");
    if (fs.existsSync(old_dbpath)){
        //jobfetcher.importLegacyDatabase(old_dbpath);
    }
    //ensure db indexes
    //try{await global.db.jobs.createIndex({ worfklow:"text"}, { default_language: "english" });}catch(ex){};
	try{await global.db.deleted_jobs.createIndex({ job_id:     -1 });}catch(ex){} //must be -1 for global.db.jobs.distinct("workflow");
    try{await global.db.jobs.createIndex({ workflow:     "text" });}catch(ex){} 
    //try{await global.db.jobs.createIndex({ workflow:     -1 });}catch(ex){} //must be -1 for global.db.jobs.distinct("workflow");
    try{await global.db.jobs.createIndex({ job_end:     1 });}catch(ex){}
    try{await global.db.jobs.createIndex({ job_start:   1 });}catch(ex){}
    try{await global.db.jobs.createIndex({ deleted:     1 });}catch(ex){}
    try{await global.db.jobs.createIndex({ state:       -1 });}catch(ex){}
    try{await global.db.jobs.createIndex({ job_id:      -1 });}catch(ex){}
    try{await global.db.jobs.createIndex({ job_id:       1 });}catch(ex){}
    try{await global.db.jobs.createIndex({ state:       1,job_start:   1 });}catch(ex){}
    db_connected_first_time();
}

function db_connected_first_time(){
    //these functions may depend on working database
    
    start_cron();
}


function start_cron(){

    let maintenance_funcs = require("./node_components/cron_tasks/maintenance");
    cron.schedule("*/5 * * * * *", async function() {
    //JOBFETCHER     
        if (!global.dbfetcheractive){
            global.dbfetcheractive = true;
            try{
                await global.jobfetcher.fetchjobs();
            }catch (ex){
                console.trace("Error, jobfetcher exception. ", ex)
            }
            global.dbfetcheractive = false;
        }else{
            console.error("Jobfetcher still active, that should not happen");
        }
    })

    cron.schedule("0 0 0-23 * * *", async function() {
    //MAINTENANCE
            try{
                await maintenance_funcs.exec_all();
            }catch(ex){
                console.error("Error in automatic Maintenance: ",ex)
            }
    })

    maintenance_funcs.exec_all();

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
    
}

async function init(conf){
	global.config = conf;

	connectDb(); //async startup and connect to db, it fires messages to userinterface on it's own in case of error

    //NON Password protected stuff

    require("./node_components/metrics_control.js")(app);//metrics control must work unauthorized
    app.use('/webinterface/images/F364x64.png', express.static('./webinterface/images/F364x64.png'));

    //mustache setup and login page
    app.set('views', `${__dirname}/webinterface/components`);
    app.set('view engine', 'mustache');
    app.engine('mustache', mustacheExpress());
    app.use ('/webinterface/components/login.html', function(req,res){
        //changed from static login.html to mustache dynamically rendered
        
        res.render("login.mustache",
          {
            instanceName:global.config.LOGIN_WELCOME_MESSAGE || '<img class="brand_image" alt="" height="20px" src="/webinterface/images/F364x64.png" title="" width="20px" style="margin-bottom:6px;float:left">&nbsp;FFAStrans Web Interface'
          }
        )
    });

    //EVERYTHING FROM HERE IS PASSWORD PROTECTED (i think)
    // required for passport
	var farFuture = new Date(new Date().getTime() + (1000*60*60*24*365*10)); // ~10y
    app.use(session({
                        secret:             'you_will_never_guess_the_secret' ,    
                        resave:             true,
                        saveUninitialized:  true,
						cookie:             { maxAge: farFuture }
        }));

    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
   
    //init job fetching cron every 3 seconds - we use cron instead of setTimeout or interval because cron might be needed in future for other stuff
	
	console.log("Checking alternate jobfetcher",path.join(global.approot,"alternate-server/jobfetcher.js"))
	if (fs.existsSync(path.join(global.approot,"alternate-server/jobfetcher.js"))){

        
		/* alternate server allows to disable inbuild jobfetcher - so webint can be used with another system than ffastrans*/
		console.log("detected alternate jobfetcher module");
		global.jobfetcher = require(path.join(global.approot,"alternate-server/jobfetcher.js"));
		global.config["alternate-server"] = true;
	}
	else{
		console.log("No alternate server detected");
		global.jobfetcher = require("./node_components/cron_tasks/jobfetcher");
		global.config["alternate-server"] = false;
    }
    
	if (!global.config["alternate-server"]){
		delete global.config["ffastrans-about"];
		//NEW REST API - replaces the builtin ffastrans api, possible TODO: move this out of here to be standalone service delivered with ffastrans base
		var about_url = ("http://" + global.config["STATIC_API_HOST"] + ":" + global.config["STATIC_API_PORT"] + "/api/json/v2/about");
		console.log("NOT running on alternate-server, getting FFAStrans API about:",about_url);
		var got_connection = false;
        async function connectApi(){
            while(!got_connection){
                try{
                    var res = await axios.get(about_url)
                    global["ffastrans-about"] = res.data;
                    console.log("FFAStrans config:",global["ffastrans-about"]);
                    ffastrans_new_rest_api.init(global.config["STATIC_API_HOST"] ,global.config["STATIC_API_PORT"], global.config["STATIC_API_NEW_PORT"]);
                    got_connection = true;
                }catch(exc){
                    console.error("Could not get ffastrans about");
                    await sleep(1000);
                }   
            }
        }
        connectApi();
	}

    //PROXY, forward requests to ffastrans # export variable for debugging: set DEBUG=express-http-proxy (onwindows)
    //DEPRECATED, USE NEW API AND PROXY
    app.use('/proxy', proxy("http://"+global.config.STATIC_API_HOST+":"+global.config.STATIC_API_PORT,{
        onProxyReq: function (proxyReq, req, res) {
            console.log(proxyReq)
        },
        parseReqBody: true,
		reqBodyEncoding: null,
		reqAsBuffer: true,
    //     proxyReqBodyDecorator: function(bodyContent, srcReq) {
    //    //the "" is important here, it works around that node adds strange bytes to the request body, looks like BOM but isn't
    //    //we actually want the body to be forwarded unmodified
    //     bodyContent=(""+srcReq.body) 
    //     return bodyContent;
    //   }
    }));

    //PROXY, forward to new api, port 3003 default
    var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    app.use('/new_proxy', proxy(protocol + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT, {
        limit: '100mb',
        logLevel: "info",
        proxyTimeout: global.config.STATIC_API_TIMEOUT,
        onProxyReq: function (proxyReq, req, res) {
                                    console.log("proxying request to:",protocol + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT) 
                                },
        parseReqBody: true,
        reqBodyEncoding: null,
        reqAsBuffer: true,
        proxyReqBodyDecorator: function (bodyContent, srcReq) {
            //the "" is important here, it works around that node adds strange bytes to the request body, looks like BOM but isn't
            //we actually want the body to be forwarded unmodified
            console.debug("Proxying API call, request to url: " , protocol + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT)
            if (typeof(srcReq.body) == "object"){
                bodyContent = ("" + JSON.stringify(srcReq.body));
            }else{
                bodyContent = ("" + srcReq.body);
                console.debug("Body:",srcReq.body)
            }

            return bodyContent;
        }
    }));

    function selectGrafanaProxy(req){
        /* this "calculates" target url for proxy request. A parameter named url has to be in get parameters*/
        return global.config.grafana_base;
    }

    app.use('/grafana_proxy', proxy(selectGrafanaProxy, {
        /* use like: /grafana_proxy?url=http://grafanaserver/pad... */
        logLevel: "info", // TODO : configure grafana serve_from_sub_path 
        proxyTimeout: 2000,
        onProxyReq: function (proxyReq, req, res) {
                                    console.log(proxyReq) 
                                },
        parseReqBody: true,
        reqBodyEncoding: null,
        reqAsBuffer: true,
        proxyReqBodyDecorator: function (bodyContent, srcReq) {
            //the "" is important here, it works around that node adds strange bytes to the request body, looks like BOM but isn't
            //we actually want the body to be forwarded unmodified
            console.log("Proxying Grafana call: " , srcReq.url)
            bodyContent = ("" + srcReq.body)
            return bodyContent;
        }
    }));
	
    //log all requests
    app.use(function(req, res, next) {
        //console.debug("REQUEST: " + "[" + req.originalUrl + "]");
        if (req.url.indexOf("dhtmlx.css") != -1){
            var stop = 1;
        }
        next();
    });

    //"routes"

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
    require("./node_components/views/userlist")(app, express);
    require("./node_components/views/usergrouplist")(app, express);
    require("./node_components/views/usergrouprightslist")(app, express);
    require("./node_components/views/getworkflowlist")(app, passport);
    require("./node_components/views/getworkflowdetails")(app, passport);
    require("./node_components/views/scheduledjobs")(app, passport);
    require("./node_components/views/browselocations")(app, express);
    require("./node_components/views/getjobstate")(app, express);
    require("./node_components/views/localdrives")(app, express);

    require("./node_components/get_userpermissions")(app, passport);
    require("./node_components/resumeable_backend.js")(app, passport);
    require("./node_components/mediainfo.js")(app, passport);
	require("./node_components/activedirectory_tester.js")(app, passport);
	require("./node_components/admin_alert_email_tester.js")(app, passport);
	require("./node_components/farmadmin_install_service.js")(app, passport);
    require("./node_components/databasemaintenance")(app, express);
    require("./node_components/views/databasemaintenance_views")(app, passport);

    
    //favicon
    app.use('/favicon.ico', express.static('./webinterface/images/favicon.ico'));

    //startup server
    console.log('\x1b[32mHello and welcome, thank you for using FFAStrans')
	var path_to_privkey = global.approot  	+ '/cert/key.pem';
	var path_to_cert = global.approot  		+ '/cert/cert.pem';
    var path_to_pfx  = global.approot  		+ '/cert/cert.pfx';

	var key_password = global.config["STATIC_WEBSERVER_HTTPS_PK_PASSWORD"];
    try{
        if (global.config["STATIC_WEBSERVER_ENABLE_HTTPS"] == 'true'){
            const https = require('https');
            if (fs.existsSync(path_to_pfx)){
                //cert is pfx
                httpsServer = https.createServer({
                    pfx: fs.readFileSync(path_to_pfx),
                    passphrase: key_password
                }, app);                  
            }else{
                //cert is pem
                httpsServer = https.createServer({
                    key: fs.readFileSync(path_to_privkey),
                    cert: fs.readFileSync(path_to_cert),
                    passphrase: key_password
                }, app);      
            }
            
            httpsServer.listen(global.config.STATIC_WEBSERVER_LISTEN_PORT, () => {
                console.log('HTTPS Server running on port',global.config.STATIC_WEBSERVER_LISTEN_PORT);
                initSocketIo(httpsServer);
            });

        }else{
            startStandardHttpServer();
        }
    }catch(ex){
        console.error("Fatal Error starting webserver on https, using http.");
        console.error(ex);
    }
    
}

function startStandardHttpServer(){
    const http = require('http').Server(app);
		
    http.listen(global.config.STATIC_WEBSERVER_LISTEN_PORT, () => {
        console.log('\x1b[36m%s\x1b[0m','Running on http://localhost:' + global.config.STATIC_WEBSERVER_LISTEN_PORT);
        initSocketIo(http);	
    }).on('error', handleListenError);
}

function handleListenError(err){
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
		}
}

function initSocketIo(created_httpserver){
		
	//init live connection to clients using socket.io
	global.socketio = socket(created_httpserver);
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
			var cmd = data.data[0];
			var obj = data.data[1];
            if (cmd == "echo"){
                _socket.emit("echo",_socket.id);
            }
			if (cmd == "player"){
				let thisplayer = new Player();
				//player has it's own socket io connection, should be ok to attach event only for this socket.
				obj = JSON.parse(obj);
				if (obj.file){//opens file
					thisplayer.initiate(_socket,obj);
				}

				return;
			}
			
			//non player commands are logged
			
			console.log("Received jobcommand via socket.io",data);
			//var regex = /cancel/
			//var result = data.data[0].match(regex);

			if (cmd == "pausejob"){
				jobcontrol.pausejob(obj);
				return;
			}
			if (cmd == "deletejob"){
				//obj is job_id array
                try{
                    obj = JSON.parse(obj);
				    database_controller.deleteRecords(obj);
                }catch(ex){
                    console.log("Error deleting jobs: ",ex);
                }
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

	
}

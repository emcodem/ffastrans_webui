'use strict';

// const blocked = require('blocked-at')
// blocked((time, stack) => {
  // if (time > 40){console.log(`Blocked for ${time}ms, operation started here:`, stack)}
// })

//this app can be required by other apps

/* this module is currently driven by webserver main, but it should be able to run standalone */
/* todo: when running standalone, get port and approot from some config or so  */
/* DO NOT USE global objects of webserver here!!! */

const path = require("path");
//const request = require("request");
const fs = require("fs");
const fsPromises = require('fs').promises;
const dns = require('node:dns');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { workerData, parentPort } = require('worker_threads');
const logfactory = require("../shared_modules/logger.js");
/* swagger init */
const { initialize } = require('express-openapi');
/* internal modules */
const FilesystemWatcher = require("./api/controllers/common/filesystem_watcher.js");

dns.setDefaultResultOrder("ipv4first"); //node 18 tends to take ipv6 first, this forces it to use ipv4first.

const blocked = require('blocked-at')
blocked((time, stack) => {
  if (time > 200)
    console.log(`Blocked for ${time}ms, operation started here:`, stack)
})


global.approot  = path.dirname(process.execPath); //bad practice, the logger uses global.approot instead of taking a parameter where to write logs
var path_to_privkey = path.join(global.approot, '/cert/key.pem');
var path_to_cert = path.join(global.approot, '/cert/cert.pem');

if (fs.existsSync(path.join(global.approot, "/database/"))) {
  console.log("Running as compiled file")
}else{
  global.approot  = __dirname;
  path_to_privkey = path.join(global.approot,"..", '/cert/key.pem');
  path_to_cert = path.join(global.approot,"..", '/cert/cert.pem');
  console.log("Running as node script - developer mode")  
}
var logger = logfactory.getLogger("rest_api");

console.log = (...args)     => logger.info.call(logger, ...args);
console.info = (...args)    => logger.info.call(logger, ...args);
console.warn = (...args)    => logger.warn.call(logger, ...args);
console.error = (...args)   => {
  // Serialize error objects properly and capture stack trace
  const stack = new Error().stack;
  const callerLine = stack.split('\n')[2]; // Get the line that called console.error
  logger.error.call(logger, `Called from: ${callerLine}`, ...args);
};
console.debug = (...args)   => logger.debug.call(logger, ...args);


module.exports = {
  init: init,
  changeInstallPath:changeInstallPath
};

if (workerData){
  //workerData is set, this script was loaded as WebWorker thread
  console.log("Startup as worker thread detected, params:",workerData);
  init(workerData.port,workerData.path,workerData.globalconf);
}

function init (_listenport,_ffastranspath,globalconf = {}) {
    //todo: we dont need this anymore when we split this off from rest_service and make it a standalone service
    console.log("init called, arguments: ", arguments)
	  changeInstallPath(_ffastranspath);
    start_server(_listenport,globalconf);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   

async function getFfastransProcessPromise() {
  try {
      let { stdout, stderr } = await exec('wmic process get ProcessId,ParentProcessId,CommandLine');
      let regexp = /"(.+?)rest_service.exe|(.+?)ffastrans.exe"/gi;
      let ffas_exe_path = stdout.match(regexp);
      ffas_exe_path = ffas_exe_path[0].replaceAll("\"","");
      return path.dirname(ffas_exe_path);
  } catch (e) {
      console.trace(e); 
  }
}

function changeInstallPath(newPath){
  
  if(!path.isAbsolute(newPath)) {
      newPath = path.resolve(global.approot,newPath); /* ! if in the future we run rest_service module standalone, global approot is not available anymore */
  }
  if (global.api_config)
    console.log("Detected move of FFAStrans installation, resetting paths to",newPath);
  global.api_config = { };
  global.api_config["s_SYS_DIR"] = newPath;
  global.api_config["s_SYS_CACHE_DIR"]    = path.join(global.api_config["s_SYS_DIR"] , "Processors/db/cache/");
  global.api_config["s_SYS_CONFIGS_DIR"]    = path.join(global.api_config["s_SYS_DIR"] , "Processors/db/configs/");
  global.api_config["s_SYS_JOB_DIR"]      = path.join(global.api_config["s_SYS_DIR"] , "Processors/db/cache/jobs/");
  global.api_config["s_SYS_WORKFLOW_DIR"] = path.join(global.api_config["s_SYS_DIR"] , "Processors/db/configs/workflows/");
}

function handleListenError(err){
	console.log(err)//prevents the program keeps running when port is in use
}

async function start_server( _listenport,globalconf){
	//GLOBAL CONFIG - the keyword global here will make the sub-objects available in all scripts that run in same process

    
    
    // var about_url = ("http://" + _host + ":" + _hostport + "/api/json/v2/about");
    // var install_info;
    // while  (true){
    //     try{
    //         console.log("calling",about_url);
    //         install_info = await doRequest(about_url);
    //         install_info = JSON.parse(install_info);
    //         break;
    //     }catch(ex){
    //         console.error("Error getting install info, is FFAStrans API online?", about_url)
    //     }
    // }
    
    //kick off refresh config interval in case the ffastrans installation was moved
    // changeInstallPath();  
    
    // //set global config
    // global.api_config = { };
    // global.api_config["s_SYS_DIR"]              = install_info["about"]["general"]["install_dir"] + "/";
    // global.api_config["s_SYS_CACHE_DIR"]        = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
    // global.api_config["s_SYS_CONFIGS_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/configs/";
    // global.api_config["s_SYS_JOB_DIR"]          = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
    // global.api_config["s_SYS_WORKFLOW_DIR"]     = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";

	//API WEBSERVER
    const express = require('express');
    const app = express();
    const bodyParser = require('body-parser');

    app.use((req, res, next) => {
        // Allow multipart/form-data for file upload endpoints
        if (req.url.includes('/getjoblog') && req.method === 'POST') {
            console.log("request to", req.method, req.url);
            return next();
        }
        
        if (!req.is('application/json') && ['PATCH', 'POST', 'PUT'].includes(req.method)){
            //we didnt quickly find out how to make bodyParser support any content-type so we need application/json for POST
            res.status(400);
            res.json({"message":"you must set content-type:application/json"})
            res.end();
        } else {
            console.log("request to",req.method,req.url);
            next();
        }
    });
    
    //logs request respondtimes 
    const getDurationInMilliseconds = (start) => {
        const NS_PER_SEC = 1e9
        const NS_TO_MS = 1e6
        const diff = process.hrtime(start)
        return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS
    }

    app.use((req, res, next) => {

      const start = process.hrtime()
      res.on('finish', () => {            
          const durationInMilliseconds = getDurationInMilliseconds (start)
          if (durationInMilliseconds > 200){
            console.warn("Over 200ms response Time (" + durationInMilliseconds.toLocaleString() + " ms),",req.method , req.originalUrl);
          }
      })
      next();
    })

    //must use bodyparser in order to retrieve post messages as req.body
    // Skip bodyParser for file upload endpoints - busboy will handle it
    app.use((req, res, next) => {
        if (req.url.includes('/getjoblog') && req.method === 'POST') {
            return next();
        }
        bodyParser.json({ limit: '500mb' })(req, res, next);
    });

    //startup server
    console.log('\x1b[32mNew API starting up...') 

    global.MY_OWN_LISTEN_PORT = _listenport;

	if (globalconf.STATIC_WEBSERVER_ENABLE_HTTPS == "true"){
    console.log("Using https protocol");
		var key_password = globalconf["STATIC_WEBSERVER_HTTPS_PK_PASSWORD"];
    const https = require('https');
		const httpsServer = https.createServer({
		  key: fs.readFileSync(path_to_privkey),
		  cert: fs.readFileSync(path_to_cert),
		  passphrase: key_password
		}, app);
		
		httpsServer.listen(_listenport, () => {
			console.log('HTTPS Server running on port',_listenport);
		});
		
	}else{
		const http = require('http').Server(app);
		http.listen(_listenport, () => {
			console.log('\x1b[36m%s\x1b[0m','Running on http://localhost:' + _listenport);
		}).on('error', handleListenError);
  }
  console.log('Web API Server started, check out http://127.0.0.1:' + _listenport + '/docs');

  var all_swag_operations = {
      /* most or all of our controllers serve v2 and v3, so we just register all operations at once, even if the yamls might not use all of them */
      /* add new operationids from swagger.yaml here */
      about_post :        require( "./api/controllers/about.js").post,
      about :             require( "./api/controllers/about.js").get,
      hello:              require( "./api/controllers/hello_world.js").get,
      get_job_log:        require( "./api/controllers/get_job_log.js").get,
      uploadJobZip:       require( "./api/controllers/get_job_log.js").post,
      get_job_details:    require( "./api/controllers/get_job_details.js").get,
      get_branch_log:     require( "./api/controllers/get_branch_log.js").get,
      get_mediainfo:      require( "./api/controllers/get_mediainfo.js").get,
      tickets:            require( "./api/controllers/tickets.js").get,
      machines:           require( "./api/controllers/machines.js").get,
      machines_post:      require( "./api/controllers/machines.js").post,
      machines_delete:    require( "./api/controllers/machines.js").delete,
      metrics:            require( "./api/controllers/metrics.js").get,
      review:             require( "./api/controllers/review.js").get,
      review_delete:      require( "./api/controllers/review.js").do_delete,
      jobs_post :         require( "./api/controllers/jobs.js").post_jobs,
      jobs_put :          require( "./api/controllers/jobs.js").put,
      jobs_get:           require( "./api/controllers/jobs.js").get,
      jobvars:            require( "./api/controllers/jobvars.js").get,
      jobs_v2:            require( "./api/controllers/jobs.js").get,
      presets:            require( "./api/controllers/presets.js").get,
      presets_post:       require( "./api/controllers/presets.js").post,
      presets_delete:     require( "./api/controllers/presets.js").delete,
      workflow_put :      require( "./api/controllers/workflows.js").put,
      workflow_post :     require( "./api/controllers/workflows.js").post,
      workflows :         require( "./api/controllers/workflows.js").get,
      workflows_v2 :      require( "./api/controllers/workflows.js").get,
      workflows_status :  require( "./api/controllers/workflows_status.js").get,
      variables :         require( "./api/controllers/variables.js").get,
      variables_post :    require( "./api/controllers/variables.js").post,
      variables_delete :  require( "./api/controllers/variables.js").delete
  }

  let swaggerDocument; 
  /*
    "require a yaml file" does not work in cjs but it will trigger webpack compilation 
    to use yaml-loader and nicely pack the yaml to the rest of the script
  */
    
  try{
    //for run as script or included as file in nexe build
    let _yaml_location = path.join('rest_service/api/swagger/swagger.yaml');
    swaggerDocument = YAML.load(_yaml_location);
  }catch(ex){
    //for webpack compilation only, it triggers yaml-loader.
    swaggerDocument = require('./api/swagger/swagger.yaml').default;
  }
    


  console.log("swaggerDocument",swaggerDocument)
  var swag_config = {
      app,
      apiDoc:  swaggerDocument, // required config
      operations: all_swag_operations,
      // Disable request validation for multipart/form-data to allow file uploads
      consumesMiddleware: {
        'multipart/form-data': (req, res, next) => {
          // Skip validation, let busboy handle it in the controller
          req.body = req.body || {};
          next();
        }
      }
	};

  initialize(swag_config);

  // Add error handler middleware to catch and properly format errors
  app.use((err, req, res, next) => {
    console.error('Express error handler caught:', err);
    console.error('Error stack:', err.stack);

    // If headers already sent, delegate to default Express error handler
    if (res.headersSent) {
      console.error('Headers already sent, cannot send error response');
      return next(err);
    }
    
    // Send JSON error response with stack trace
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      status: statusCode,
      path: req.path,
      method: req.method,
      stack: err.stack,
      details: err.errors || undefined
    });
  });

  //finally, initalize swagger UI by loading the yaml files (which point to the operations)



	app.use('/', swaggerUi.serve);
  app.get('/', swaggerUi.setup(swaggerDocument)); //only serves the swagger docs on /, anything else must be a method or returns 404


  //initialize filesystem watchers
  global.workflowFileSystemWatcher = 
  new FilesystemWatcher(path.join(global.api_config["s_SYS_CONFIGS_DIR"], "/workflows"));
}
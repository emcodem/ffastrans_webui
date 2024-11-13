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
const request = require("request");
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

dns.setDefaultResultOrder("ipv4first"); //node 18 tends to take ipv6 first, this forces it to use ipv4first.

global.approot  = path.dirname(process.execPath); //bad practice, the logger uses global.approot instead of taking a parameter where to write logs
if (fs.existsSync(path.join(global.approot, "/database/"))) {
  console.log("Running as compiled file")
}else{
  global.approot  = __dirname;
  console.log("Running as node script - developer mode")  
}
var logger = logfactory.getLogger("rest_api");

console.log = (...args)     => logger.info.call(logger, ...args);
console.info = (...args)    => logger.info.call(logger, ...args);
console.warn = (...args)    => logger.warn.call(logger, ...args);
console.error = (...args)   => logger.error.call(logger, ...args);
console.debug = (...args)   => logger.debug.call(logger, ...args);


module.exports = {
  init: init,
  changeInstallPath:changeInstallPath
};

if (workerData){
  console.log("Startup as worker thread detected, params:",workerData);
  init(workerData.port,workerData.path);
}

function init (_listenport,_ffastranspath) {
    //todo: we dont need this anymore when we split this off from rest_service and make it a standalone service
    console.log("init called, arguments: ", arguments)
	  changeInstallPath(_ffastranspath);
    start_server(_listenport);
}

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
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

async function renewInstallInfo(about_url){
    return;
    //refresh ffastrans install info infinitely
    while (true){
        await sleep(1000);
        var install_info;
        var skip_api = false;
        var resolved_path;
        try{
            //try to get path from tasklist
            try{
              let ffasPath = await getFfastransProcessPromise();
              await fsPromises.access(ffasPath);//throws error if not exist
              resolved_path = ffasPath;
              skip_api = true;
            }catch(ex){
              console.error("Could not update ffastrans install path from tasklist, ",ex)
            }

            if (! skip_api){
              //old method, ask ffastrans api. this is problematic because up to 1.4, the install path was not updated when moving ffastrans in the ffastrans.json
              console.log("Fallback refresh install path, trying to read from FFAStrans about API")
              install_info = await doRequest(about_url);
              resolved_path = JSON.parse(install_info)["about"]["general"]["install_dir"];  
            }
          
          if (global.api_config["s_SYS_DIR"] != resolved_path + "/"){
            console.log("Detected move of FFAStrans installation, resetting paths");
            global.api_config["s_SYS_DIR"] = resolved_path + "/";
            global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
            global.api_config["s_SYS_CONFIGS_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/configs/";
            global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
            global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";
          }
        }catch(ex){
            console.error("Error getting install info, is FFAStrans API online?", about_url)
        }

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

async function start_server( _listenport){
	//GLOBAL CONFIG - the keyword global here will make the sub-objects available in all scripts that run in same process

    var _approot = __dirname;
    
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
        if (!req.is('application/json') && ['PATCH', 'POST', 'PUT'].includes(req.method)){
            //we didnt quickly find out how to make bodyParser support any content-type so we need application/json for POST
            res.status(400);
            res.json({"message":"you must set content-type:application/json"})
            res.end();
        } else {
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
    // app.use(bodyParser.json())
    app.use(bodyParser.json({ limit: '250mb' }));

    //startup server
    console.log('\x1b[32mNew API starting up...') 

	if ("config" in global && global.config["STATIC_WEBSERVER_ENABLE_HTTPS"] == 'true'){
		//only when started from webint server.js, global.config exists
		var path_to_privkey = global.approot  	+ '/cert/key.pem';
		var path_to_cert = global.approot  		+ '/cert/cert.pem';
		var key_password = global.config["STATIC_WEBSERVER_HTTPS_PK_PASSWORD"];
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
        about_post :        require(_approot + "/api/controllers/about").post,
        about :             require(_approot + "/api/controllers/about").get,
        hello:              require(_approot + "/api/controllers/hello_world").get,
        get_job_log:        require(_approot + "/api/controllers/get_job_log").get,
        get_job_details:    require(_approot + "/api/controllers/get_job_details").get,
        get_mediainfo:      require(_approot + "/api/controllers/get_mediainfo").get,
        tickets:            require(_approot + "/api/controllers/tickets").get,
        machines:           require(_approot + "/api/controllers/machines").get,
        machines_post:      require(_approot + "/api/controllers/machines").post,
        machines_delete:    require(_approot + "/api/controllers/machines").delete,
        metrics:            require(_approot + "/api/controllers/metrics").get,
        review:             require(_approot + "/api/controllers/review").get,
        review_delete:      require(_approot + "/api/controllers/review").do_delete,
        history :           require(_approot + "/api/controllers/history").get,
        jobs :              require(_approot + "/api/controllers/jobs").post,
        jobs_put :          require(_approot + "/api/controllers/jobs").put,
        jobs_get:           require(_approot + "/api/controllers/jobs").get,
        jobs_v2:            require(_approot + "/api/controllers/jobs").get,
        presets:            require(_approot + "/api/controllers/presets").get,
        presets_post:       require(_approot + "/api/controllers/presets").post,
        presets_delete:     require(_approot + "/api/controllers/presets").delete,
        workflow_put :      require(_approot + "/api/controllers/workflows").put,
        workflow_post :     require(_approot + "/api/controllers/workflows").post,
        workflows :         require(_approot + "/api/controllers/workflows").get,
        workflows_v2 :      require(_approot + "/api/controllers/workflows").get,
        variables :         require(_approot + "/api/controllers/variables").get,
        variables_post :    require(_approot + "/api/controllers/variables").post,
        variables_delete :  require(_approot + "/api/controllers/variables").delete
    }

    var swag_config = {
        app,
        apiDoc: _approot + "/api/swagger/swagger.yaml", // required config
        operations: all_swag_operations
	};

    initialize(swag_config);

    //finally, initalize swagger UI by loading the yaml files (which point to the operations)
	
    var _yaml_location = path.join(__dirname, '/api/swagger/swagger.yaml');
	const swaggerDocument = YAML.load(_yaml_location);
	app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

}
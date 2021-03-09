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
const request = require("request")
//logging

//require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log

//start_server(3003,"C:\\dev\\ffastrans_webui\\rest_service","C:\\dev\\FFAStrans\\");
exports.init = function (_host, _hostport, _listenport) {
    //todo: we dont need this anymore when we split this off from rest_service and make it a standalone service
	start_server(_host, _hostport, _listenport);
    
    var about_url = ("http://" + _host + ":" + _hostport + "/api/json/v2/about");
    renewInstallInfo(about_url);
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

async function renewInstallInfo(about_url){
    //refresh ffastrans install info infinitely
    while (true){
        await sleep(15000);
        var install_info;
        try{
            install_info = await doRequest(about_url);
            install_info = JSON.parse(install_info);
        }catch(ex){
            console.error("Error getting install info, is FFAStrans API online?", about_url)
        }
        
        if (global.api_config["s_SYS_DIR"] != install_info["about"]["general"]["install_dir"] + "/"){
            console.log("Detected move of FFAStrans installation, resetting paths");
            global.api_config["s_SYS_DIR"] = install_info["about"]["general"]["install_dir"] + "/";
            global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
            global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
            global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";
        }
    }
}

async function start_server(_host, _hostport, _listenport){
	//GLOBAL CONFIG - the keyword global here will make the sub-objects available in all scripts that run in same process
    //as this service might run standalone without webint at some time, we need to take care to have our own global config
    var _approot = __dirname;
    
    var about_url = ("http://" + _host + ":" + _hostport + "/api/json/v2/about");
    var install_info;
    while  (true){
        try{
            console.log("calling",about_url);
            install_info = await doRequest(about_url);
            install_info = JSON.parse(install_info);
            break;
        }catch(ex){
            console.error("Error getting install info, is FFAStrans API online?", about_url)
        }
    }
    
    //kick off refresh config interval in case the ffastrans installation was moved
    
    
    //set global config
    global.api_config = { };
    global.api_config["s_SYS_DIR"] = install_info["about"]["general"]["install_dir"] + "/";
    global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
    global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
    global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";

	//API WEBSERVER
    const app = require('express')();
    let { initialize } = require('express-openapi');
    
    console.log("Approt: ", _approot);
    var swag_config = {
        app,
        apiDoc: _approot + "/api/swagger/swagger.yaml", // required config
        //paths: path.resolve(__dirname, 'api/controllers'),
        operations: {
            hello: require(_approot + "/api/controllers/hello_world").get,
            get_job_log: require(_approot + "/api/controllers/get_job_log").get,
            get_job_details: require(_approot + "/api/controllers/get_job_details").get,
            get_mediainfo: require(_approot + "/api/controllers/get_mediainfo").get,
			tickets: require(_approot + "/api/controllers/tickets").get,
        }
	};

    initialize(swag_config);


	var port = _listenport || 65446;
	app.listen(port);
    console.log('Web API Server started, check out http://127.0.0.1:' + port + '/docs');
    /*
    //UNHANDLED EXCEPTIONS KEEP THE SERVER RUNNING - todo: reactivate when running as standalone module
    process.on('uncaughtException', function (err) {
        console.trace('Global unexpected error: ' + err);
        if (err.stack) {
            console.error(err.stack);
        }
        if (err.name === 'AssertionError') {
            // handle the assertion here or just ignore it..
            console.log("HERE WE GO, MEDIAINFO FOOLED US");
        }
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.trace('Global unexpected error: ' + err);
        if (err.stack) {
            console.error(err.stack);
        }
    })
 */
	//API DOCS and testing page
	const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    var _yaml_location = path.join(__dirname, '/api/swagger/swagger.yaml');
	const swaggerDocument = YAML.load(_yaml_location);
	app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	
}
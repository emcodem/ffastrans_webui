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
const dns = require('node:dns');
dns.setDefaultResultOrder("ipv4first"); //node 18 tends to take ipv6 first, this forces it to use ipv4first.

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
            global.api_config["s_SYS_CONFIGS_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/configs/";
            global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
            global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";
        }
    }
}

function handleListenError(err){
	console.log(err)//prevents the program keeps running when port is in use
			
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
    global.api_config["s_SYS_DIR"]              = install_info["about"]["general"]["install_dir"] + "/";
    global.api_config["s_SYS_CACHE_DIR"]        = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
    global.api_config["s_SYS_CONFIGS_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/configs/";
    global.api_config["s_SYS_JOB_DIR"]          = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
    global.api_config["s_SYS_WORKFLOW_DIR"]     = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";

	//API WEBSERVER
    const express = require('express');
    const app = express();
    const bodyParser = require('body-parser');

    app.use((req, res, next) => {
        if (['PATCH', 'POST', 'PUT'].includes(req.method) && !req.is('application/json')) {
            //we didnt quickly find out how to make bodyParser support any content-type so we need application/json for POST
            res.status(400);
            res.json({"message":"you must set content-type:application/json"})
            res.end();
        } else {
            next();
        }
    });

    app.use(bodyParser.json())

    //startup server
    console.log('\x1b[32mNew API starting up...') 
	var path_to_privkey = global.approot  	+ '/cert/key.pem';
	var path_to_cert = global.approot  		+ '/cert/cert.pem';
	var key_password = global.config["STATIC_WEBSERVER_HTTPS_PK_PASSWORD"];
	if (global.config["STATIC_WEBSERVER_ENABLE_HTTPS"] == 'true'){
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

    let { initialize } = require('express-openapi');
    
    console.log("Approt: ", _approot);
    var swag_config = {
        app,
        apiDoc: _approot + "/api/swagger/swagger.yaml", // required config
        operations: {
            hello: require(_approot + "/api/controllers/hello_world").get,
            get_job_log: require(_approot + "/api/controllers/get_job_log").get,
            get_job_details: require(_approot + "/api/controllers/get_job_details").get,
            get_mediainfo: require(_approot + "/api/controllers/get_mediainfo").get,
			tickets: require(_approot + "/api/controllers/tickets").get,
            machines: require(_approot + "/api/controllers/machines").get,
            metrics: require(_approot + "/api/controllers/metrics").get,
            review: require(_approot + "/api/controllers/review").get,
            review_delete: require(_approot + "/api/controllers/review").do_delete,
            jobs: require(_approot + "/api/controllers/jobs").get,
            ["api/v2/jobs"] :require(_approot + "/api/controllers/jobs").get,
        }
	};

    initialize(swag_config);

    console.log('Web API Server started, check out http://127.0.0.1:' + _listenport + '/docs');
  
	//API DOCS and testing page
	const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    var _yaml_location = path.join(__dirname, '/api/swagger/swagger.yaml');
	const swaggerDocument = YAML.load(_yaml_location);
	app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	
}
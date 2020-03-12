'use strict';

//this app can be required by other apps

/* this module is currently driven by webserver main, but it should be able to run standalone */
/* todo: when running standalone, get port and approot from some config or so  */
/* DO NOT USE global objects of webserver here!!! */
const path = require("path");
//logging

//require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log

exports.init = function (port, approot, ffas_root) {
    //todo: we dont need this anymore when we split this off from rest_service and make it a standalone service
	start_server(port,approot,ffas_root);
}

function start_server(_port,_approot,_ffas_root){
	//GLOBAL CONFIG - the keyword global here will make the sub-objects available in all scripts that run in same process
    //as this service might run standalone without webint at some time, we need to take care to have our own global config
    console.log("REST API Service detected installdir: " + _ffas_root)
    global.api_config = {
        s_SYS_DIR: _ffas_root
    }

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
        }
	};

    initialize(swag_config);


	var port = _port || 65446;
	app.listen(port);
    console.log('Web API Server started, check out http://127.0.0.1:' + port + '/docs');


	//API DOCS and testing page
	const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    var _yaml_location = path.join(__dirname, '/api/swagger/swagger.yaml');
	const swaggerDocument = YAML.load(_yaml_location);
	app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	
}
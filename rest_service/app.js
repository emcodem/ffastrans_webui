'use strict';

//this app can be required by other apps

/* this module is currently driven by webserver main, but it should be able to run standalone */
/* todo: when running standalone, get port and approot from some config or so  */
/* DO NOT USE global objects of webserver here!!! */
const path = require("path");
//logging

//require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log

exports.init = function (port, approot) {
	start_server(port,approot);
}

function start_server(_port,_approot){
	//GLOBAL CONFIG - the keyword global here will make the sub-objects available in all scripts that run in same process
    //as this service might run standalone without webint at some time, we need to take care to have our own global config

    global.api_config = {
        s_SYS_DIR: "C:\\dev\\ffastrans_rework\\FFAStrans\\"
    }

    global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
    global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
    global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";


	//API WEBSERVER
	const SwaggerExpress = require('swagger-express-mw');
	const app = require('express')();
	module.exports = app; // for testing

	var swag_config = {
	  appRoot: _approot // required config
	};

	SwaggerExpress.create(swag_config, function(err, swaggerExpress) {
	  if (err) { throw err; }

	  // install middleware
	  swaggerExpress.register(app);

	  var port = _port || 65446;
	  app.listen(port);
        console.log('Web API Server started, check out http://127.0.0.1:' + port + '/docs');

	});

	//API DOCS and testing page
	const swaggerUi = require('swagger-ui-express');
    const YAML = require('yamljs');
    var _yaml_location = path.join(__dirname, '/api/swagger/swagger.yaml');
	const swaggerDocument = YAML.load(_yaml_location);
	app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	
}
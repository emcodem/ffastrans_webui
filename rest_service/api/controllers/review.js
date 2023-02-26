'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const common = require("./common/ticket_helpers.js");
const path = require('path');
const axios = require('axios');

module.exports = {
    get: get
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function get(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    var jobid = req.query.jobid;
    var s_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"review","queue"),"");
    console.debug("get_job_details called for: " + jobid);
	var returnjson = [];
	try {
        var allfiles = await fsPromises.readdir(s_path, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var contents = await fsPromises.readFile(path.join(s_path,allfiles[_idx]), 'utf8');
                contents = contents.replace(/^\uFEFF/, '');
                returnjson.push(contents);
            }catch(ex){}
        }
        
        res.json(returnjson);
        res.end();
	} catch(err) {
        if (err.code == "ENOENT"){
            res.json([]);
            res.end();
        }
		console.debug(err);
		return res.status(500).json({description: err.stack});
	}
}

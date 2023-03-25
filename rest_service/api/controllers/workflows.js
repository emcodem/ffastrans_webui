'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");

module.exports = {
    get: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
    /* writes a new jobticket to disk for ffastrans to process */
    
 var o_req = req.body;
	try {
        var o_return = {discovery:req.headers.referer,workflows:[]};
        //read all workflows 
        var s_wf_path = path.join(path.join(global.api_config["s_SYS_CONFIGS_DIR"],"workflows"),"");
        o_return.workflows = await common.json_files_to_array_cached(s_wf_path);
        res.json(o_return);
        res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({message:err.toString(),description: err});
	}

}








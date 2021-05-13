'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const path = require("path")
// const DEBUG_MODE_ON = true;
// if (!DEBUG_MODE_ON) {
    // console = console || {};
    // console.log = function(){};
// }

module.exports = {
    get: start
};


/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
	try {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
	    var o_return = {};
        var workflow_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/hosts/");
        
        o_return["machines"] = await jsonfiles_to_array(workflow_folder);
       
		res.json(o_return);
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}


//all files in all directories to array
async function jsonfiles_to_array(dir) {
        //console.time("jsonfiles_to_array " + dir);
		if (!dir){return}
		var returnarray=[];
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var contents = await fsPromises.readFile(path.join(dir,allfiles[_idx]), 'utf8');
                contents = contents.replace(/^\uFEFF/, '');
                var newitem = (JSON.parse(contents, 'utf8'))//removes BOM	;
                returnarray.push(newitem)
            }catch(ex){
                console.log("Could parse Json from file:",path.join(dir,allfiles[_idx]),ex)
            }
        }
        //console.timeEnd("jsonfiles_to_array " + dir);
		return returnarray;
}



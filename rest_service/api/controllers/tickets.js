'use strict';
//var util = require('util');
const fs = require('fs')
const path = require("path")

module.exports = {
    get: start
};

//all files in all directories to array
function jsonfiles_to_array(dir) {

		if (!dir){return}
		console.log("---")
		var returnarray=[];
		Array.prototype.concat(fs.readdirSync(dir)).forEach(
			element => returnarray.push(JSON.parse(fs.readFileSync(path.join(dir,element), 'utf8').replace(/^\uFEFF/, '')))//removes BOM	
		)
		return returnarray;
			
}
/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
	try {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
		var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"running");
	    var o_return = {};
		o_return["running"] = jsonfiles_to_array(s_tick_path,"running");
		o_return["queue"] = jsonfiles_to_array(s_tick_path,"queue");
		o_return["pending"] = jsonfiles_to_array(s_tick_path,"pending");
		res.json(o_return);
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

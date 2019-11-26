'use strict';
//var util = require('util');
const fs = require('fs')

module.exports = {
  get_job_log: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function start(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
	var jobid = req.swagger.params.jobid.value || 'stranger';
	console.debug("get_job_log called for: " + jobid);
	
	//check if full log exists, if yes, serve contents
    const path = global.api_config["s_SYS_JOB_DIR"] + jobid + "/full_log.json";  //C:\dev\FFAStrans1.0.0_beta1\Processors\db\cache\jobs\20191116-1019-1699-3067-cb691333052e\full_log.json
	console.debug("trying to find file " + path)
	try {
	  if (fs.existsSync(path)) {
		console.debug("File exists, returning contents");
		res.sendFile(path)
		console.log("returned");
	  }else{
		return res.status(404).json({});		  
	  }
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

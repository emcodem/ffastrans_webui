'use strict';
//var util = require('util');
const fs = require('fs');
const strip_bom = require('strip-bom');
var path = require('path');

module.exports = {
  get: start
};


/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function start(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    var jobid = req.query.jobid;
	console.debug("get_job_log called for: " + jobid);
	
	//check if full log exists, if yes, serve contents
    const path = global.api_config["s_SYS_JOB_DIR"] + jobid + "/full_log.json";  //C:\dev\FFAStrans1.0.0_beta1\Processors\db\cache\jobs\20191116-1019-1699-3067-cb691333052e\full_log.json
	console.debug("trying to find file " + path)
	try {
	  if (fs.existsSync(path)) {
		console.debug("Full Log file exists, returning contents");
          
          res.set('Content-Type', 'application/json')
          //res.send("{}")
          res.sendFile(path);
	  }else{
		//serve log for running job
          console.log("Serving log from running job");
        serveRunningLog(global.api_config["s_SYS_JOB_DIR"]  + jobid + "/log/",0,0,res);
      }
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

function serveRunningLog(jobdir, start, end, response) {
    //a running job has multiple logs, find all files on filesystem by date
    var files = fs.readdirSync(jobdir)
              .map(function(v) { 
                  return {
                           name: jobdir + v,
                           time:fs.statSync(jobdir + v).mtime.getTime()
                         }; 
               })
              .sort(function(a, b) { return a.time - b.time; })
              .map(function (v) { return v.name; });    
    //concat and serve all logs
    response.set('Content-Type', 'application/json')
    response.write("[");
    require("async").concat(files, readFile, function (err, buffers) {
        if (err) {
            console.log(err);
        }
        console.log("Num found log files: " + buffers.length);
        for (i = 0; i < buffers.length; i++) {
            response.write(strip_bom(buffers[i].toString()));
            if (i < buffers.length - 1) {
                response.write(",");
            }
        }
        response.write("]");
        response.end();
    })   
         
}

function readFile(file, cb) {
    require('fs').readFile(file, cb)
}

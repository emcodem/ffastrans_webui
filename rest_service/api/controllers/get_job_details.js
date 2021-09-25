'use strict';
//var util = require('util');
const fs = require('fs')

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
    console.debug("get_job_details called for: " + jobid);
	//check if full log exists, if yes, serve contents
    const job_description_path = global.api_config["s_SYS_JOB_DIR"] + jobid + "/.json";  //C:\dev\FFAStrans1.0.0_beta1\Processors\db\cache\jobs\20191116-1019-1699-3067-cb691333052e\.json
    console.debug("Locating file " + job_description_path)
	try {
        if (fs.existsSync(job_description_path)) {
            console.debug("File exists, reading contents");
          //res.sendFile(path) //cannot use sendfile here as it will freak out about the filename starting with .
            fs.readFile(job_description_path, 'utf8', function (err, job_file_contents) {
                if (err) {
                    console.error(err);
                    res_error();
                    return;
                }
                //remove UTF8 BOM
                if (job_file_contents.charCodeAt(0) === 0xFEFF) {
                    job_file_contents = job_file_contents.substr(1);
                }
              //enrich job obj with workflow object
                console.debug("Parsing Job Json... " + job_file_contents )
                var o_job = JSON.parse(job_file_contents);
                if (fs.existsSync(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflow.json")) {
                    console.debug("workflow exists in jobdir " + global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflow.json")
                    fs.readFile(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflow.json", 'utf8', function (err, wf_file_contents) {
                        if (err) {
                            console.error(err);
                            res_error();
                        }
                        wf_file_contents = wf_file_contents.trim();
                        o_job["wf_object"] = JSON.parse(wf_file_contents);
                        console.debug("responding with wf_object")
                        respond((o_job));
                        return;
                    });
                }else if (fs.existsSync(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflows")){
                    var wf_path = global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflows";
                    console.log("workflows folder found in ",global.api_config["s_SYS_JOB_DIR"],",assuming ffastrans Version 1.3");
                    var files = fs.readdirSync(wf_path);
                    if (files.length < 1){
                        console.error("Expected at least 1 file in ",wf_path);
                        res_error("Expected at least 1 file in ",wf_path);
                        return;
                    }
                    //serve first found workflow file. TODO: for 1.3, check if we can have more than 1 workflow here
                    fs.readFile(wf_path + "/" + files[0], 'utf8', function (err, wf_file_contents) {
                        if (err) {
                            console.error(err);
                            res_error();
                            return;
                        }
                        wf_file_contents = wf_file_contents.trim();
                        o_job["wf_object"] = JSON.parse(wf_file_contents);
                        console.debug("responding with wf_object")
                        respond(o_job);
                        return;
                    });
                    return;
                }
                
                else {
                    console.log("no workflow json found, trying ",global.api_config["s_SYS_WORKFLOW_DIR"] + "workflow.json")
                    try {
                        var wf_id = JSON.parse(job_file_contents)["workflow"]["id"];
                        if (fs.existsSync(global.api_config["s_SYS_WORKFLOW_DIR"] + "workflow.json")) {
                            fs.readFile(global.api_config["s_SYS_WORKFLOW_DIR"] + "workflow.json"), 'utf8', function(err, wf_file_contents) {
                                wf_file_contents = wf_file_contents.trim();
                                o_job["wf_object"] = JSON.parse(wf_file_contents);
                                respond(o_job);
                                return;
                            }
                        }
                    } catch (ex) {
                        console.error("Error getting Workflow for jobid: " + jobid);
                        res_error("Unexpected error getting get_job_details");
                        return;
                    }
                }
              console.error("Unexpected error getting get_job_details serving " + job_file_contents.length + " bytes");
              res_error("Unexpected error getting get_job_details");
          });
        
            function res_error() {
                return res.status(500).json({});
            }

            function respond(s_contents) {
                //send answer to HTTP request
                res.json(s_contents);
                res.end();
                return;
            }
        } else {
            console.debug("File does not exists, returning 404");
		return res.status(404).json({});		  
	  }
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

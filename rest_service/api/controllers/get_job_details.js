'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const common = require("./common/helpers.js");
const path = require('path');
const axios = require('axios');

module.exports = {
    get: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    var jobid = req.query.jobid;
    console.debug("get_job_details called for: " + jobid);
	//check if full log exists, if yes, serve contents
    const job_description_path = path.join(global.api_config["s_SYS_JOB_DIR"], jobid, ".json");  //C:\dev\FFAStrans1.0.0_beta1\Processors\db\cache\jobs\20191116-1019-1699-3067-cb691333052e\.json
    //console.debug("Locating file " + job_description_path)
	try {
            if (!await fs.promises.exists(job_description_path)) {
                const ajob = path.join(global.api_config["s_SYS_CACHE_DIR"] ,"archive", 'jobs', jobid.substring(0, 8), jobid + '.7z');
                console.log("job don't exist, searching archive: ", ajob)
                const z7path = path.join(global.api_config["s_SYS_DIR"], 'processors', 'resources', '7zr.exe');
                const out = path.join(global.api_config["s_SYS_JOB_DIR"], jobid);
                await common.exeCmd(`"${z7path}" x "${ajob}" -y -o"${out}"`);
            }
            if (await fs.promises.exists(job_description_path)) {
                //console.debug("File exists, reading contents");
                var job_file_contents = await common.readfile_cached(job_description_path, false);
                //remove UTF8 BOM
                if (job_file_contents.charCodeAt(0) === 0xFEFF) {
                    job_file_contents = job_file_contents.substr(1);
                }

                //enrich job obj with workflow object
                var o_job = JSON.parse(job_file_contents);

                //security check, is this an abandoned job?
                const full_log_path = path.join(global.api_config["s_SYS_JOB_DIR"], jobid, "full_log.json");
                if (await fs.promises.exists(full_log_path)){
                    if ("status" in o_job){
                        o_job["status"] = "finished"
                    }
                }
                if (await fs.promises.exists(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflow.json")) {
                    console.debug("workflow exists in jobdir " + global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflow.json")
                    fs.readFile(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflow.json", 'utf8', function (err, wf_file_contents) {
                        if (err) {
                            console.error("cannot get jobdetails",err);
                            res_error();
                        }
                        wf_file_contents = wf_file_contents.trim();
                        o_job["wf_object"] = JSON.parse(wf_file_contents);
                        console.debug("responding with wf_object")
                        respond((o_job));
                        return;
                    });
                    return;
                }else if (await fs.promises.exists(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflows")){
                    //from ffastrans 1.3 we may have sub-workflows
                    var dir = global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflows";
                    o_job["workflows"] = {};
                    var allfiles = await fsPromises.readdir(global.api_config["s_SYS_JOB_DIR"] + jobid + "/workflows", { withFileTypes: false });
                    for (var _idx in allfiles){
                        try{
                            var newitem = await common.readfile_cached(path.join(dir,allfiles[_idx]), true)//removes BOM	;
                            if (newitem["wf_id"] == o_job["workflow"]["id"]){
                                //this is the mother workflow
								console.log("Main Workflow detected: ", o_job["workflow"]["id"]);
								//console.log("Main WF JSON: ",JSON.stringify(newitem));
								var _cp = JSON.stringify(newitem);
                                o_job["wf_object"] = JSON.parse(_cp);
                            }
                            var cur_wf_id = o_job["workflow"]["id"];
                            o_job["workflows"][newitem["wf_id"]] = newitem;
                        }catch(ex){
                            console.log("Could parse Json from file:",path.join(dir,allfiles[_idx]),ex)
                        }
                    }
                    respond(o_job);
                    
                    return;
                }
                
                else {
                    console.log("no workflow json found, trying ",global.api_config["s_SYS_WORKFLOW_DIR"] + "workflow.json")
                    try {
                        var wf_id = JSON.parse(job_file_contents)["workflow"]["id"];
                        if (await fs.promises.exists(global.api_config["s_SYS_WORKFLOW_DIR"] + "workflow.json")) {
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
            var nonrunning = await get_job_from_tickets(jobid);
            if (nonrunning){
                console.log("get_job_details returns job from tickets folder instead of work_dir (non running job)")
                res.json(nonrunning);
                res.end();
                return;
            }
            
            console.debug("File does not exists, returning 404");
            return res.status(404).json({});		  
	  }
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

async function get_job_from_tickets(lookfor_jobid){
    // if we have no running job, serve ticket from db/tickets folder
    var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    var url = protocol + global.config["STATIC_API_HOST"] + ":" + global.config["STATIC_API_NEW_PORT"] + "/tickets" ;
    const resp = await axios.get(url);

    var found_ticket = false;
    for (var state in resp["data"]["tickets"]){
        resp["data"]["tickets"][state].forEach(function(job){
            if (job["job_id"] == lookfor_jobid){
                
                found_ticket = job;
            }
        })
    }
    
    return found_ticket;
}
'use strict';
//var util = require('util');
const fs = require('fs');
const strip_bom = require('strip-bom');
var path = require('path');
const common = require("./common/helpers.js");
const active = require("./common/ffastrans_active_jobs.js");

//map a finished branch json "status" field to a display state string.
//1=success, 0=error, 2=cancelled (see buildSplitInfo in ffastrans_history_jobs.js / jobfetcher.js)
function statusToState(status){
  switch (status){
    case 1: return "finished";
    case 0: return "error";
    case 2: return "cancelled";
    default: return "unknown";
  }
}

fs.promises.exists = async function(f) {
  try {
    await fs.promises.stat(f);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  get: get
};

async function get(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  let jobid     = req.query.jobid;
  let filter_branchid  = req.query.branchid || "";
  let list_only = req.query.list_only || false;
  console.debug("listFinishedBranches called for: " + jobid);
  res.set('Content-Type', 'application/json');

	let returnobj = {is_complete:false,all_branch_count:0,branches:[]};//{id, end_time}

  const full_log_path   = path.join(global.api_config["s_SYS_JOB_DIR"], jobid, "full_log.json");
  const branch_log_path = path.join(global.api_config["s_SYS_JOB_DIR"], jobid , "finished");
	try {
    if (!await fs.promises.exists(full_log_path)) {
      const ajob = path.join(global.api_config["s_SYS_CACHE_DIR"] ,"archive", 'jobs', jobid.substring(0, 8), jobid + '.7z');
      console.log("job don't exist, searching archive: ", ajob)
      const z7path = path.join(global.api_config["s_SYS_DIR"], 'processors', 'resources', '7zr.exe');
      const out = path.join(global.api_config["s_SYS_JOB_DIR"], jobid);
      await common.exeCmd(`"${z7path}" x "${ajob}" -y -o"${out}"`);
    }
	  if (await fs.promises.exists(full_log_path))
      returnobj.is_complete = true;

    //list FINISHED branch jsons (the "finished" folder may not exist yet for a
    //running job that has not completed a single branch - in that case we still
    //want to return the running branches below, so don't bail out here).
    let branch_objects = [];//{name:1-0-0,object:json,state:"finished"}
    if (await fs.promises.exists(branch_log_path)){
      let logs_and_jsons = await fs.promises.readdir(branch_log_path);
      let json_files = logs_and_jsons.filter(f=>{return !f.match(/_log\.json$/)});
      returnobj.all_branch_count = json_files.length;

      for (let i=0;i<json_files.length;i++){

        let current_branch_id = json_files[i].replace(".json","");
        if (filter_branchid != "" && current_branch_id != filter_branchid)
          continue;
        if (list_only){
          branch_objects.push({name:current_branch_id,object:{}});
          continue;
        }
        //read file contents
        try{

          let o_branch = await fs.promises.readFile(path.join(branch_log_path,json_files[i]));
          o_branch = JSON.parse(strip_bom(o_branch.toString()));
          branch_objects.push({name:current_branch_id,object:o_branch,state:statusToState(o_branch.status)});
        }catch(ex){
          console.error("Cannot read branch json",ex);
        }
      }

      branch_objects = branch_objects.sort((a,b)=>{
        return  a.object.end_time > b.object.end_time
      })
    }

    //append RUNNING branches from the monitor folder (only while the job runs).
    //Reuse getActiveJobs which reads s_SYS_CACHE_DIR/monitor[/.list]/<jobid>~<split_id>.json
    if (!returnobj.is_complete && !list_only){
      try{
        let finished_names = new Set(branch_objects.map(b=>b.name));
        let running = await active.getActiveJobs(0, 1000, [jobid], true); //[{job_id,split_id}]
        for (let r of running){
          let split_id = r.split_id;
          if (!split_id || finished_names.has(split_id)) continue;
          if (filter_branchid != "" && split_id != filter_branchid) continue;
          branch_objects.push({name:split_id,object:{result:""},state:"running"});
        }
      }catch(ex){
        console.error("Cannot read running branches",ex);
      }
    }

    returnobj.branches = branch_objects;

    res.json(returnobj);

	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}

}

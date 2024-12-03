'use strict';
//var util = require('util');
const fs = require('fs');
const strip_bom = require('strip-bom');
var path = require('path');
const common = require("./common/helpers.js");

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

    if (!await fs.promises.exists(branch_log_path)){
      res.status(404);
      res.end();
      return;
    }

    //list branch jsons
    let logs_and_jsons = await fs.promises.readdir(branch_log_path);
    let json_files = logs_and_jsons.filter(f=>{return !f.match(/_log\.json$/)});
    returnobj.all_branch_count = json_files.length;

    let branch_objects = [];//{name:1-0-0,object:json}
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
        branch_objects.push({name:current_branch_id,object:o_branch});
      }catch(ex){
        console.error("Cannot read branch json",ex);
      }
    }

    branch_objects = branch_objects.sort((a,b)=>{
      return  a.object.end_time > b.object.end_time
    })
    returnobj.branches = branch_objects;
    
    res.json(returnobj);

	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}

}

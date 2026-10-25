'use strict';
//var util = require('util');
const fs = require('fs');
const strip_bom = require('strip-bom');
var path = require('path');
const common = require("./common/helpers.js");
const active = require("./common/ffastrans_active_jobs.js");
const jobFiles = require('./common/job_log_files.js');

//map a finished branch json "status" field to a display state string.
//1=success, 0=error, 2=cancelled (see buildSplitInfo in ffastrans_history_jobs.js / jobfetcher.js)
function statusToState(status, branch){
  switch (status){
    case '1':
    case 1: return "finished";
    case '0':
    case 0: return "error";
    case '2':
    case 2: return "cancelled";
    case 'success':
    case 'finished': return 'finished';
    case 'error': return 'error';
    case 'canceled':
    case 'cancelled': return 'cancelled';
    // 1.5 saves completed split-point snapshots in finished/ with a
    // running status and end_time, even after the child branches finish.
    case 'running': return branch.end_time ? 'finished' : 'running';
    default: return "unknown";
  }
}

module.exports = {
  get: get
};

async function get(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  let jobid     = req.query.jobid;
  let filter_branchid  = req.query.branchid || "";
  let list_only = req.query.list_only === true || req.query.list_only === 'true' || req.query.list_only === '1';
  res.set('Content-Type', 'application/json');

	let returnobj = {is_complete:false,all_branch_count:0,branches:[]};//{id, end_time}

	try {
    const jobDir = await jobFiles.restoreArchivedJob(jobid);
    const full_log_path = path.join(jobDir, 'full_log.json');
    const branch_log_path = path.join(jobDir, 'finished');
    returnobj.is_complete = await jobFiles.isConsolidatedLogReady(full_log_path) && !(await active.getBusyJobIds()).has(jobid);

    //list FINISHED branch jsons (the "finished" folder may not exist yet for a
    //running job that has not completed a single branch - in that case we still
    //want to return the running branches below, so don't bail out here).
    let branch_objects = [];//{name:1-0-0,object:json,state:"finished"}
    const logs_and_jsons = await readDirectory(branch_log_path);
    if (logs_and_jsons.length){
      // Older engines preserve an earlier attempt as <split>.<time>_<host>
      // when retrying a branch; these are JSON snapshots without .json suffixes.
      let json_files = logs_and_jsons.filter(f=>f.isFile() &&
        (/\.json$/i.test(f.name) || /^\d+(?:-\d+)*\.\d+_.+$/.test(f.name)) &&
        !/_log\.json$/i.test(f.name)).map(f=>f.name);
      returnobj.all_branch_count = json_files.length;

      for (let i=0;i<json_files.length;i++){

        let current_branch_id = json_files[i].replace(/\.json$/i, '');
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
          if (!o_branch || typeof o_branch !== 'object' || Array.isArray(o_branch)) throw new Error('Invalid branch description');
          if (!o_branch.split_id) o_branch.split_id = current_branch_id.replace(/\.\d+_.+$/, '');
          branch_objects.push({name:current_branch_id,object:o_branch,state:statusToState(o_branch.state ?? o_branch.status, o_branch)});
        }catch(ex){
          // Keep polling when a finished ticket has not finished writing yet.
          returnobj.is_complete = false;
          console.error("Cannot read branch json",ex);
        }
      }

      branch_objects = branch_objects.sort((a,b)=>{
        return String(a.object.end_time || '').localeCompare(String(b.object.end_time || '')) || a.name.localeCompare(b.name)
      })
    }

    //append RUNNING branches from the monitor folder (only while the job runs).
    //Reuse getActiveJobs which reads s_SYS_CACHE_DIR/monitor[/.list]/<jobid>~<split_id>.json
    if (!returnobj.is_complete && !list_only){
      try{
        let running = await active.getActiveJobs(0, 1000, [jobid], true); //[{job_id,split_id}]
        // The monitor carries display information; the running ticket carries
        // the branch path required when selecting an ongoing branch in the UI.
        const ticketDir = path.join(global.api_config.s_SYS_CACHE_DIR, 'tickets', 'running');
        const tickets = new Map();
        for (const entry of await readDirectory(ticketDir)) {
          if (!entry.isFile()) continue;
          const file = entry.name;
          const parts = file.split('~');
          if (parts[1] !== jobid || !parts[3] || !/\.json$/i.test(file)) continue;
          const split_id = parts[3].replace(/\.json$/i, '');
          tickets.set(split_id, { job_id: jobid, split_id, path: [], result: '' });
          try {
            const ticket = await common.readJsonFile(path.join(ticketDir, file));
            if (!ticket || typeof ticket !== 'object' || Array.isArray(ticket) || (ticket.job_id && ticket.job_id !== jobid)) continue;
            ticket.job_id = jobid;
            ticket.split_id = split_id;
            tickets.set(split_id, ticket);
          } catch (error) {
            console.debug('Cannot read running branch ticket:', file, error.message);
          }
        }
        // A ticket can be published before its monitor marker (or while the
        // monitor is being refreshed). Either source proves a live branch.
        for (const split_id of tickets.keys()) {
          if (!running.some(branch => branch.split_id === split_id)) running.push({ split_id });
        }
        for (let r of running){
          let split_id = r.split_id;
          if (!split_id) continue;
          if (filter_branchid != "" && split_id != filter_branchid) continue;
          const ticket = tickets.get(split_id) || { job_id: jobid, split_id, path: [], result: '' };
          // Retried branches can reuse IDs still present in finished/.
          branch_objects = branch_objects.filter(branch => branch.name !== split_id);
          branch_objects.push({name:split_id,object:ticket,state:"running"});
        }
      }catch(ex){
        console.error("Cannot read running branches",ex);
      }
    }

    returnobj.branches = branch_objects;

    res.json(returnobj);

	} catch(err) {
		if (err.statusCode !== 400) console.debug(err);
		return res.status(err.statusCode || 500).json({description: err.message});
	}

}

async function readDirectory(directory) {
  try {
    return await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(error.code)) return [];
    throw error;
  }
}

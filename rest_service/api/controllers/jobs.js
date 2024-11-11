'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");
const ffastrasHistoryHelper = require("./common/ffastrans_history_jobs.js");
const ffastrasActiveJobHelper = require("./common/ffastrans_active_jobs.js");

module.exports = {
    post: post,
    get: get,
    put:put
};

var jobs_cache = {is_refreshing:false,born:0,data:false}
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

async function get(req, res) {
    try{
        
        var start,end;
        try{
            start   = Number(req.query.start)
            end     = Number(req.query.count)
            if (Number.isNaN(start) || Number.isNaN(end)){
                throw new Error("assume defaults")
            }
        }catch(ex){
            start   = 0
            end     = 100
        }

        //if start and end was set, we cannot use cache mode
        if (start != 0 || end != 100){
            let a_jobs    = await ffastrasHistoryHelper.getHistoryJobs(start,end);
            let a_active  = await ffastrasActiveJobHelper.getActiveJobs(start,end);
            let returnobj = {discovery:req.headers.referer,history:a_jobs,active:a_active}
            res.json(returnobj)
            res.end();
            return;
        }
        /* ensure we only read the jobs from filesystem once every x seconds */
        while (jobs_cache.is_refreshing){
            await sleep(1);
        }

        const currentTime = new Date();
        let maxAge = new Date(currentTime.getTime() - 3 * 1000);
        if (jobs_cache.born < maxAge || !jobs_cache.data){
            jobs_cache.is_refreshing = true;
            try{
                
                let a_jobs   = await ffastrasHistoryHelper.getHistoryJobs(start,end);
                let a_active = await ffastrasActiveJobHelper.getActiveJobs(start,end);
                jobs_cache.data   = {discovery:req.headers.referer,history:a_jobs,active:a_active}
            }catch(ex){
                console.error("Error refreshing jobs:",ex)
            }finally{
                jobs_cache.is_refreshing = false;
            }
        }
        res.json(jobs_cache.data)
        res.end();

    }catch(ex){
        console.log("return error")
        console.log(ex)

        return res.status(500).json({message:ex,description: ""});
    }
    
}

async function put(req, res){
    //Pause, resume and abort sub jobs
    //{"action": "<state>","identifier": "","split_id": ""}

    // var example_body = {
    //     "action": "Pause, resume and abort sub jobs",
    //     "job": "",
    //     "split_id": "",
    //     "user" : "username",
    //     "host" : "hostname",
    //     "extra" : {"duration":"millis"}
    // }
    var s_action       = req.body.action;
    var job            = req.body.job;
    var split_id       = req.body.split_id;
    var s_user         = req.body.user;
    var s_host         = req.body.host;
    var s_system       = req.body.system;
    var s_extra        = req.body.value ? req.body.value : false;

    //var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
    var splitpart = split_id ? "~" + split_id : "";
    var statusfile_name = "."+s_action+"~" + job + splitpart;
    
    try{
        if (s_action == 'pause'){
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".pause~" + job + splitpart ),"");
            s_extra = Number(s_extra);
            if(s_extra){
                //auto resume
                console.log("Pause Job with enabled auto resume in " + s_exta + " Millis")
                setTimeout(async function(){
                    fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".pause~" + job + splitpart ));
                },s_extra)
            }
        }
        else if (s_action == 'abort'){
            let done = false;
            if (typeof s_extra === 'string') {
                if (s_extra.match(/mons/)){
                    //abort incoming by move from mons/i one level up
                    const destinationPath = path.join(path.dirname(s_extra), '..', path.basename(s_extra));
                    await fsPromises.rename(s_extra,destinationPath);
                    done = true;
                }
            }
            //by default just write the status abort file
            if (!done)
                await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".abort~" + job + splitpart ),"");

        }
        else if (s_action == 'resume'){
            await fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".pause~" + job + splitpart ))
        }
        else if (s_action == 'priority'){
            s_extra = Number(s_extra);
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".priority~" + job + splitpart ),s_extra.toString());
        }
        else{
            throw new Error("Action not supported: ["+s_action + "]")
        }
        res.json({success:true});
        res.end();
        return;
    }catch(ex){
        console.error("PUT Job error:",ex);
		return res.status(500).json({message:ex.toString()});
    }
}

async function post(req, res) {
    /* writes a new jobticket to disk for ffastrans to process */
    var example_body = {
        "wf_id":"<workflow id>",
        "inputfile":"<full path to file>",
        "start_proc":"<processor node id>",
        "variables": [
           {
              "name":"<s_string>",
              "data":"<string>"
           },
           {
              "name":"<i_string>",
              "data":"<integer>"
           },
           {
              "name":"<f_string>",
              "data":"<number>"
           }
        ]
     }

    var o_req = req.body;
	try {
        var o_return = {};
        //retrieve new ticket class
        var t = new common.JobTicket();
        //initialize with values from request
        await t.init_ticket(req.body.wf_id,req.body.start_proc);
        //set source and variables in ticket
        t.setSource(req.body.inputfile);
        t.variables = req.body.variables;

        //write to disk
        var final_tick = t;
        var fname = await t.getFileName();
        var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
        var tick_pending_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","pending",fname);
        console.log("Creating Job ticket: " + tick_temp_path)
        fs.writeFileSync(tick_temp_path, JSON.stringify(final_tick));
        fs.moveSync(tick_temp_path,tick_pending_path);
        //write file to temp, then move to q

        global;
        var returnobj = {
            "uri": "/jobs/" + t.job_id,
            "job_id": t.job_id
        }
        res.json(returnobj);
        res.end();
	} catch(err) {
		console.error("POST Job Error",err);
		return res.status(500).json({message:err.toString(),description: err});
	}
}







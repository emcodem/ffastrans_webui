'use strict';
const os = require('os')
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
        let o_return = {};
        o_return.jobs = []
        let fullpath, file, newitem, id, split
        let pattern = '*'
        if (req.query.jobid) {
            pattern = req.query.jobid
        }
        let monitor_folder = path.join(global.api_config["s_SYS_CACHE_DIR"], "monitor/");
        let flist = await common._fileList(monitor_folder, pattern + '~*.json', false, true, 'all');
        for (fullpath of flist) {
            try{
                newitem = await common.readfile_cached(fullpath, true)//removes BOM;
                file = path.basename(fullpath);
                file = file.replace('.json', '')
                split = file.split('~')
                id = {job_id: split[0], split_id: split[1]}
                o_return.jobs.push({ ...id, ...newitem })
            }catch(ex){
                console.log("Could not parse Json from file:", fullpath, ex)
            }
        }
        res.json(o_return);
        res.end();
    } catch (err) {
        console.debug(err);
        return res.status(500).json({ description: err });
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
    var job_id = req.body.job_id ? req.body.job_id : req.query.jobid
    var split_id       = req.body.split_id;
    var s_extra = req.body.value ? req.body.value : '';
    if (!req.body.user) {
        req.body.user = common.getUserName()
    }
    if (!req.body.system) {
        req.body.system = os.hostname()
    }
    //var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
    var splitpart = split_id ? "~" + split_id : "";
    
    try{
        if (s_action == 'pause'){
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".pause~" + job_id + splitpart), req.body.user + '@' + req.body.system);
            s_extra = Number(s_extra);
            if(s_extra){
                //auto resume
                console.log("Pause Job with enabled auto resume in " + s_exta + " Millis")
                setTimeout(async function(){
                    fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".pause~" + job_id + splitpart));
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
                await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".abort~" + job_id + splitpart), s_extra.toString() + ':' + req.body.user + '@' + req.body.system);

        }
        else if (s_action == 'resume'){
            await fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".pause~" + job_id + splitpart))
        }
        else if (s_action == 'priority'){
            s_extra = Number(s_extra);
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".priority~" + job_id + splitpart), s_extra.toString());
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
        t.submit.variables = req.body.variables;

        //write to disk
        var final_tick = t;
        var fname = await t.getFileName();
        var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
        var tick_pending_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","pending",fname);
        console.log("Creating Job ticket: " + tick_temp_path);
        //write file to temp, then move to q
        await fsPromises.writeFile(tick_temp_path,JSON.stringify(final_tick));
        await fsPromises.rename(tick_temp_path,tick_pending_path);
        

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







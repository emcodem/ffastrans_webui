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

async function get(req, res) {
    try{
        
        var start,end;
        try{
            start   = parseInt(req.query.start)
            end     = parseInt(req.query.count)
        }catch(ex){
            start   = 0
            end     = 100
        }

        var a_jobs   = await ffastrasHistoryHelper.getHistoryJobs(start,end);
        var a_active = await ffastrasActiveJobHelper.getActiveJobs(start,end);
        var returnob = {discovery:req.headers.referer,history:a_jobs,active:a_active}

        res.json(returnob)
        res.end();

    }catch(ex){
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
    var s_extra        = req.body.extra ? req.body.extra : false;

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
        else if ($s_action = 'abort'){
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".abort~" + job + splitpart ),"");
        }
        else if (s_action == 'resume'){
            await fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".pause~" + job + splitpart ))
        }
        else if (s_action == 'priority'){
            s_extra = Number(s_extra);
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"],"status", ".priority~" + job + splitpart ),s_extra);
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
        var fname = t.getFileName();
        var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
        var tick_pending_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","pending",fname);
        
        fs.writeFileSync(tick_temp_path, JSON.stringify(final_tick));
        fs.moveSync(tick_temp_path,tick_pending_path);
        //write file to temp, then move to q

        global;
        var returnobj = {
            "uri": global["ffastrans-about"].discovery +"/jobs/" + t.job_id,
            "job_id": t.job_id
        }
        res.json(returnobj);
        res.end();
	} catch(err) {
		console.error("POST Job Error",err);
		return res.status(500).json({message:err.toString(),description: err});
	}
}







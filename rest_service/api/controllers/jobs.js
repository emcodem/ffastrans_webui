'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");

module.exports = {
    get: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
  async function start(req, res) {
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
		console.debug(err);
		return res.status(500).json({message:err.toString(),description: err});
	}
}

async function get_running(){
	var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"");
    var a_running = await common.ticket_files_to_array(path.join(s_tick_path,"running"));
   
    //as we dont want to show both at the same time, we ignore the running tickets from mon_folder to prevent showing the same file twice
    var keys_to_ignore = []; 
    for (var key in a_running){
        try{
            var _cur = a_running[key];
            if (! "internal_wf_name" in a_running[key]){//todo: the IF does not work, internal_wf_name is a guid in this case
                a_running[key]["workflow"] = common.get_wf_name(a_running[key]["internal_wf_id"]);
                
            }else{
                a_running[key]["workflow"] = a_running[key]["internal_wf_name"];
            }
            try{
                a_running[key]["sources"] = {"current_file": a_running[key]["sources"]["original_file"]};
            }catch(ex){
                //omit this ticket as it does not carry source file info
                console.error("Running ticket did not contain source file info",a_running[key])
                keys_to_ignore.push(key);
            }

        }catch(ex){
            console.error("Problem parsing running entry: ", a_running[key],ex);
        }
    }
    for (var key in keys_to_ignore){
        delete a_running[key];
    }
    //after deleting we happen to have a weird empty object
    var filtered = a_running.filter(function (el) {
      return el != null;
    });
	return filtered;
	
}








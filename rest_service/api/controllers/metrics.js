'use strict';
/*
Metrics collection can be called every second and therefore MUST avoid long-running stuff, e.g. stat of many files
*/
const fs = require('fs')
const fsPromises = require('fs').promises;
const path = require("path")
const common = require("./common/ticket_helpers.js")
const readLastLines = require('read-last-lines')

    
var   first_call_after_startup = false;
var   caller_ip= 0;
module.exports = {
    get: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
    caller_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!("metrics" in global)){
        first_call_after_startup = true;
        global["metrics"] = {}
    }
    if (!global["metrics"]["monitorlog_reported_erros"]){
        global["metrics"]["monitorlog_reported_erros"] = {};
    }
    if (!global["metrics"]["monitorlog_reported_erros"][caller_ip]){
        global["metrics"]["monitorlog_reported_erros"][caller_ip] = {}

    }
	try {
        // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
	    var o_return = {};
		res.write("ffas_jobs_incoming_count " + await count_incoming() +"\n");
        res.write("ffas_jobs_queue_count " + await count_queue_tickets() +"\n");
		console.log("Metrics found queue tickets: ", await count_queue_tickets() )
        var running = await count_running_tickets()
        res.write("ffas_jobs_running_count " + running[0] + "\n");
        res.write(running[1]);
        res.write(await parse_monitor_log());
        res.write("\n");//last line must-write for prometheus metrics
		res.end();
	} catch(err) {
		console.debug(err);
		res.status(500).write(err.toString());
        return res.end()
	}
}

async function count_running_tickets() {

        //count running tickets and build ffas_running_job entry for metrics output for each running job
		var dir = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets");
        dir = path.join(dir,"running");
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        var allentries = "";
        for (var _idx in allfiles){
            var _entry = "ffas_running_job";
            var _job= "";
            var wfname 
				try{
					wfname = await common.get_wf_name(allfiles[_idx].split("~")[3]);//up to ffastrans 1.2
					
				}catch(ex){
					wfname =await common.get_wf_name(allfiles[_idx].split("~")[4]) //from ffastrans 1.3
				}
            _job+= "{"
            _job+= "job_id=\"" + allfiles[_idx].split("~")[1] +"\",";
            _job+= "wf_name=\"" + wfname + "\",";
            _job+= "hostname=\"" + allfiles[_idx].split("~")[5] + "\"";
            _job+= "}"
            var _stat = await fsPromises.stat(path.join(dir,allfiles[_idx]));
            var delta = Math.abs(_stat["birthtime"] - new Date()) / 1000;   
            _entry+= (_job) + " "+ parseInt(delta);
            allentries += _entry +"\n";
        }

        return [allfiles.length,allentries];
}

async function count_queue_tickets() {
        //global.api_config["s_SYS_CACHE_DIR"]
		var dir = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets");
        dir = path.join(dir,"pending");
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        return allfiles.length;
}

async function count_incoming(){
        var found_incoming = [];
		var s_monitor_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"wfs"),"");
        if (!fs.existsSync(s_monitor_path)){
            //no workflows enabled monitoring yet
            return 0;
        }

        //find all monitor enabled workflows in /cache/wfs folder
        var all_wf_monitor_folders = await fsPromises.readdir(s_monitor_path, { withFileTypes: true });
        for  (var _t in all_wf_monitor_folders){
            //in every workflow folder, find all watches, e.g. db\cache\wfs\GUID\mons\GUID

            if(all_wf_monitor_folders[_t].isDirectory()){
				
                var _mons = s_monitor_path + "\\" + all_wf_monitor_folders[_t].name + "\\mons";
                var _mons_exists = (await fs.promises.stat(_mons).catch(e => false));;
                if (!_mons_exists){
                    continue;
                }
                var _proc_guids = await fsPromises.readdir(_mons, { withFileTypes: true });
                try {
                    for (var _proc in _proc_guids){
                        var _incoming_files = await fsPromises.readdir( _mons+ "\\" +_proc_guids[_proc].name + "\\i", { withFileTypes: false });
                        //in every proc guid folder, find all files in the /i folder (incoming)
                        for (var _incoming in _incoming_files){
                            try{
                                //FOUND SOME INCOMING FILE, PUSH TO output array: note that we could push some more information here like wf_name...
                                found_incoming.push(1);
                            }catch(ex){
                                //console.log("If this error occurs only once, its OK but just for info: could not parse" + _mons + "\\" +_proc_guids[_proc].name + "\\i\\" + _incoming_files[_incoming]  , ex);
                                //console.log("contents",common.readfile_cached(fullpath));
                            }                            
                        }
                        
                    }
                }catch(ex){
                    console.warn("Not very critical " + ex);
                } 
            }
        }
        return found_incoming.length;
}

async function parse_monitor_log(){   
    var monitorlog  = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"monitor"),"log.txt");
    var _stat = await fsPromises.stat(monitorlog);
    var mtime = _stat["mtime"];
    if (global["metrics"]["monitorlog_mtime"] != mtime){
        global["metrics"]["monitorlog_mtime"] = mtime;
    }else{
        return "";//nothing to report if log did not change
            }
            var returnvalue = "";
            var result = await readLastLines.read(monitorlog, 50);//the log.txt can get indefinite in size, we are just interested in updates
    //check number of errors in monitorlog;
    var lines = result.toString().split("\n");
    for  (var _l in lines){
        // line = WF_NAME|STARTDATE|ENDDATE|FILENAME|OUTCOME|INT STATE|JOB_ID~SPLIT_ID
		
        var split = lines[_l].split("|");
        var state = split[5]; //0= error, 1= good, 2= aborted
        if(first_call_after_startup){
            //at startup, just store all currently known error jobs 
            global["metrics"]["monitorlog_reported_erros"][caller_ip][lines[_l]]   = 1;
            continue;
        }else{
            if (state == 0 && !(lines[_l] in global["metrics"]["monitorlog_reported_erros"][caller_ip])){
                global["metrics"]["monitorlog_reported_erros"][caller_ip][lines[_l]]   = 1; //todo: me              
                returnvalue = "ffas_jobs_error_job_info";
                returnvalue+= "{"
                returnvalue+= "job_id=\"" + split[5].split("~")[0] +"\",";
                returnvalue+= "wf_name=\"" + split[0] + "\",";
                returnvalue+= "file=\"" + split[3] + "\",";
                returnvalue+= "status=\"" + split[4] + "\"";
                returnvalue+= "} 1\n"
                console.log("Metrics report new error job. State was:",state,"Message:",returnvalue)
            }
        }
    }
    first_call_after_startup = false;
    return returnvalue;
    
}




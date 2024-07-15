'use strict';
//var util = require('util');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");
// const DEBUG_MODE_ON = true;
// if (!DEBUG_MODE_ON) {
    // console = console || {};
    // console.log = function(){};
// }

module.exports = {
    get: start
};
//HELPERS

async function get_review(){
	var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"review","queue"),"");
    var all_objects = [];
    try{
        var allfiles = await fsPromises.readdir(s_tick_path, { withFileTypes: false });
        for (var _idx in allfiles){
            var split = allfiles[_idx].split("~");
            all_objects.push({
                wf_name:split[0],
                guid:split[1]
            });

        }
        return all_objects;
    }catch(ex){
        return[];
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
                keys_to_ignore.push(key)
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

//workaround the missing ability of ffastrans to tell us about watchfolder status
async function get_incoming(returnarray){
//todo: dont only read files from \i\ folder but also consider files in ..\i\ that are named *.json%shorthash%
        
		var s_monitor_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"wfs"),"");
		//enrich workflow names for pending tickets
		var found_incoming = [];
        //find all monitor enabled workflows in /cache/wfs folder
        var all_wf_monitor_folders = [];
        
        try{
            all_wf_monitor_folders = await fsPromises.readdir(s_monitor_path, { withFileTypes: true });
        }catch(e){
            //no workflows have been enabled for monitoring yet
        }
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
                        for (let i = 0; i < _incoming_files.length; i += 1){
                            try{
                                //FOUND SOME INCOMING FILE, PUSH TO output array
                                var ticket_path = path.join(_mons  , _proc_guids[_proc].name , "i" , _incoming_files[i]); 
                                
                                var newitem = {};
                                //read the incoming json to get details about watched file
                                var f_contents = await common.readfile_cached(ticket_path,true);
                                var _readout = f_contents//removes BOM	;
                                newitem["host"] = _readout["host"]
                                var _realfile = _readout["source"];
                                var myRegexp = /\\wfs\\(.*?)\\mons/gi; //TODO: support workflows that do not have a guid //C:\ffastrans\Processors\db\cache\wfs\20190516132025\mons\20190516-132046-729-69eeea0438bf\i\Die Sofa-Richter F_ 4_d1de.mpg_8D44AB5FBB8AE5D5B00184D9CEDB382B6D243383.json
                                var _matches =  myRegexp.exec(ticket_path);
                                newitem["ticket_path"] = ticket_path;
                                newitem["fullpath"] = _realfile;
                                newitem["sources"] = {"current_file": _realfile};
                                var _stat = await fsPromises.stat(ticket_path);
                                newitem["submit"] = {"time":_stat["birthtime"]};
                                newitem["nodes"] = {"next":"Watchfolder","type":"Watchfolder"};
                                console.log("INCOMING")
                                newitem["internal_wf_name"] = await common.get_wf_name(_matches[1]);
                                found_incoming.push(newitem);
                            }catch(ex){
                                console.log("If this error occurs only once, its OK but just for info: could not parse" + _mons + "\\" +_proc_guids[_proc].name + "\\i\\" + _incoming_files[i]  , ex);
                                console.log("contents",common.readfile_cached(ticket_path))
                            }
                            if (i > 98){
                                console.warn("Incoming files is more than 100, your watchfolder is huge..." + _mons + "\\" +_proc_guids[_proc].name);
                                break;
                            }
							
                        }
                        
                    }
                }catch(ex){
                    //console.warn("Not very critical " + ex);
                } 
            }
        }
      
         return found_incoming;

}

async function get_pending(){
	var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"");
    var a_pending = await common.ticket_files_to_array(path.join(s_tick_path,"pending"));
   
	//TODO this is a dirty workaround: mon_folder tickets that are pending currently dont carry any hint about which source file 
    //also, when mon_folder has something in \i\folder, we show a pending and an incoming job because for whatever reason, mon_folder keeps both alive. 
    //as we dont want to show both at the same time, we ignore the pending tickets from mon_folder to prevent showing the same file twice
    var keys_to_ignore = []; 
    for (var key in a_pending){
        try{
            var _cur = a_pending[key];
            if (! "internal_wf_name" in a_pending[key]){//todo: the IF does not work, internal_wf_name is a guid in this case
                a_pending[key]["workflow"] = common.get_wf_name(a_pending[key]["internal_wf_id"]);
                
            }else{
                a_pending[key]["workflow"] = a_pending[key]["internal_wf_name"];
            }
            try{
                a_pending[key]["sources"] = {"current_file": a_pending[key]["sources"]["original_file"]};
            }catch(ex){
                //omit this ticket as it does not carry source file info
                keys_to_ignore.push(key)
            }
            a_pending[key]["submit"] = a_pending[key]["submit"];
            a_pending[key]["nodes"] = {"next":"None","type":"None"};
        }catch(ex){
            console.error("Problem parsing pending entry: ", a_pending[key]);
        }
    }
    for (var key in keys_to_ignore){
        delete a_pending[key];
    }
    //after deleting we happen to have a weird empty object
    var filtered = a_pending.filter(function (el) {
      return el != null;
    });
	return filtered;
	
}

async function start(req, res) {
	try {
        var o_return = {};
        o_return["tickets"] = {};

  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
        if ("nodetails" in req.query){
            var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"");
            o_return["tickets"]["running"] = await fsPromises.readdir(path.join(s_tick_path,"running"), { withFileTypes: false });
            o_return["tickets"]["queued"] = await fsPromises.readdir(path.join(s_tick_path,"pending"), { withFileTypes: false });
        }else{
        
            //pending means actually queued. The actual queue folder of ffastrans will basically never contain any long living files
            //the real queued folder is more like a temp folder for tickets between pending and running
            o_return["tickets"]["queued"] = await get_pending(); 
            //o_return["tickets"]["queue"] = common.ticket_files_to_array(path.join(s_tick_path,"queue"));
            o_return["tickets"]["incoming"] = await get_incoming();
            o_return["tickets"]["running"] = await get_running();
            o_return["tickets"]["review"] = await get_review();
            
        }

	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
    
    res.json(o_return);
    res.end();
    
}





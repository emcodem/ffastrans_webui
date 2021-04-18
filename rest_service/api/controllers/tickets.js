'use strict';
//var util = require('util');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require("path");
const common = require("./common/ticket_helpers.js");
// const DEBUG_MODE_ON = true;
// if (!DEBUG_MODE_ON) {
    // console = console || {};
    // console.log = function(){};
// }

module.exports = {
    get: start
};
//HELPERS

async function cache_cleaner(){
	for (const key in global.filecache.tickets) {
		try{
            await fsPromises.access(key, fs.constants.R_OK | fs.constants.W_OK)
		}catch(ex){
            //file does not exist, delete from cache
            delete global.filecache.tickets[key];
        }
	}
}


//all files in all directories to array
async function jsonfiles_to_array(dir) {
        //console.time("jsonfiles_to_array " + dir);
		if (!dir){return}
		var returnarray=[];
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var newitem = (JSON.parse(await common.readfile_cached(path.join(dir,allfiles[_idx]), 'utf8')))//removes BOM	;
                var wf_id =  allfiles[_idx].split("~")[3];
                newitem["fullpath"] = path.join(dir,allfiles[_idx]);
                newitem["internal_wf_id"] = wf_id;
                if (! ("internal_wf_name" in newitem)){
                    newitem["internal_wf_name"] = await common.get_wf_name(wf_id);
                }
                //newitem["internal_wf_name"] = wf_id;
                if (! "internal_file_date" in newitem){ //stat only if needed
                    var _stat = await fsPromises.stat(path.join(dir,allfiles[_idx]));
                    newitem["internal_file_date"] = _stat["birthtime"];
                }
                global.filecache.tickets[path.join(dir,allfiles[_idx])] = JSON.stringify(newitem);
                returnarray.push(newitem)
            }catch(ex){
                console.log("Could parse Json from file:",path.join(dir,allfiles[_idx]),ex)
            }
        }
        //console.timeEnd("jsonfiles_to_array " + dir);
		return returnarray;
}

//workaround the missing ability of ffastrans to tell us about watchfolder status
async function get_incoming(returnarray){
//todo: dont only read files from \i\ folder but also consider files in ..\i\ that are named *.json%shorthash%
        
		var s_monitor_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"wfs"),"");
		//enrich workflow names for pending tickets
		var found_incoming = [];
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
                                //FOUND SOME INCOMING FILE, PUSH TO output array
                                var fullpath = _mons + "\\" +_proc_guids[_proc].name + "\\i\\" + _incoming_files[_incoming]; 
                                
                                var newitem = {};
                                //read the incoming json to get details about watched file
                                var f_contents = await common.readfile_cached(fullpath);
                                var _readout = (JSON.parse(f_contents))//removes BOM	;
                                newitem["host"] = _readout["host"]
                                var _realfile = _readout["source"];
                                var myRegexp = /(........-....-....-....-............).*?mons/gi;
                                var _matches =  myRegexp.exec(fullpath);
                                
                                newitem["fullpath"] = _realfile;
                                newitem["sources"] = {"current_file": _realfile};
                                var _stat = await fsPromises.stat(fullpath);
                                newitem["submit"] = {"time":_stat["birthtime"]};
                                newitem["nodes"] = {"next":"Watchfolder","type":"Watchfolder"};
                                console.log("INCOMING")
                                newitem["internal_wf_name"] = await common.get_wf_name(_matches[1]);
                                found_incoming.push(newitem);
                            }catch(ex){
                                console.log("If this error occurs only once, its OK but just for info: could not parse" + _mons + "\\" +_proc_guids[_proc].name + "\\i\\" + _incoming_files[_incoming]  , ex);
                                console.log("contents",common.readfile_cached(fullpath))
                            }
                            if (_incoming > 100){
                                console.warn("Incoming files is more than 100, your watchfolder is huge..." + _mons + "\\" +_proc_guids[_proc].name);
                                break;
                            }
                            
                        }
                        
                    }
                }catch(ex){
                    console.warn("Not very critical " + ex);
                } 
            }
        }
      
         return found_incoming;

}

async function get_pending(){
	var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"");
    var a_pending = await jsonfiles_to_array(path.join(s_tick_path,"pending"));
   
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

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
	try {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
	    var o_return = {};
        o_return["tickets"] = {};
        //pending means actually queued. The actual queue folder of ffastrans will basically never contain any long living files
        //the real queued folder is more like a temp folder for tickets between pending and running
		o_return["tickets"]["queued"] = await get_pending(); 
		//o_return["tickets"]["queue"] = jsonfiles_to_array(path.join(s_tick_path,"queue"));
		o_return["tickets"]["incoming"] = await get_incoming();
		res.json(o_return);
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}





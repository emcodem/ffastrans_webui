'use strict';
//var util = require('util');
const fs = require('fs')
const path = require("path")
const recursive = require('fs-readdir-recursive')

module.exports = {
    get: start
};

//workaround the missing ability of ffastrans to tell us about watchfolder status
async function get_incoming(returnarray){
//todo: dont only read files from \i\ folder but also consider files in ..\i\ that are named *.json%shorthash%

		var s_monitor_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"wfs"),"");
		//enrich workflow names for pending tickets
		var found_incoming = [];
		 await recursive(s_monitor_path).forEach(function(fname){
            
            try{
                if (fname.indexOf("\\i\\") != -1){
                    var newitem = {};
                    var fullpath = path.join (s_monitor_path,fname);
                    //read the monitor incoming record to get the filename of interest
                    var _readout = (JSON.parse(readfile_cached(fullpath)))//removes BOM	;
                    newitem["host"] = _readout["host"]
                    var _realfile = _readout["source"];
                    var myRegexp = /(........-....-....-....-............).*?mons/gi;
                    var _matches =  myRegexp.exec(fullpath);
                    var ctime = fs.statSync(fullpath).birthtime;
                    
                    //console.log("parsed wfid: ",_matches[1])
                    newitem["fullpath"] = _realfile;
                    newitem["sources"] = {"current_file": _realfile};
                    newitem["submit"] = {"time":ctime};
                    newitem["nodes"] = {"next":"Watchfolder","type":"Watchfolder"};
                    newitem["internal_wf_name"] = get_wf_name(_matches[1]);
//                    newitem["internal_wf_id"] = 
                    //console.log("pending:",newitem)
                    found_incoming.push(newitem);
                }else{
                    
                }
                
            }catch(ex){
                console.log(ex)
                
            }
			
		 });
         return found_incoming;
            // for (var x=0;x<returnarray.length;x++){
                

            // }
        
	return [];
}

function get_wf_name(wf_id){
        try{
            var workflow_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/workflows/");
            var wf_path = path.join(workflow_folder,wf_id) + ".json";
            //console.log("Reading worfklow for pending ticket: ", wf_path)
            var wf_obj = readfile_cached(wf_path );
            wf_obj = JSON.parse(wf_obj);
            return wf_obj["wf_name"];
           
        }catch(ex){
            console.error("Error reading workflow for pending ticket: ",ex);
            
        }
    
}

function readfile_cached(fullpath){
	if (! ("filecache" in global)){
		global.filecache = {};
	}
	if (! ("tickets" in global.filecache)){
		global.filecache.tickets = {};
	}
	//delete non existing files in global cache
	for (const key in global.filecache.tickets) {
		if (!fs.existsSync(key)){
				delete global.filecache.tickets[key];
		}
	}
	
	if (fullpath in global.filecache.tickets){
		//serve cached file
		return global.filecache.tickets[fullpath];
	}else{
		//read file, store globally and return content
		try{
			var newitem = fs.readFileSync(fullpath, 'utf8').replace(/^\uFEFF/, '');//removes BOM	;
			global.filecache.tickets[fullpath] = newitem;
			return newitem;
			
		}catch(ex){
			console.error("Unexpected error while reading ticket file",fullpath,ex);
			throw ex;
		}
	}
	
}
//all files in all directories to array
function jsonfiles_to_array(dir) {
		if (!dir){return}
		var returnarray=[];
		//Array.prototype.concat(fs.readdirSync(dir)).forEach(
        fs.readdirSync(dir).forEach(function(fname){
                var newitem = (JSON.parse(readfile_cached(path.join(dir,fname), 'utf8')))//removes BOM	;
                var wf_id =  fname.split("~")[3];
                newitem["fullpath"] = fname;
                newitem["internal_wf_id"] = wf_id;
                returnarray.push(newitem)
            }
            
		);
		return returnarray;
}
/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function start(req, res) {
	try {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
		var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"");
	    var o_return = {};
        o_return["tickets"] = {};
		o_return["tickets"]["queue"] = jsonfiles_to_array(path.join(s_tick_path,"pending"));
		//o_return["tickets"]["queue"] = jsonfiles_to_array(path.join(s_tick_path,"queue"));
		o_return["tickets"]["incoming"] = await get_incoming();
		
		res.json(o_return);
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const path = require("path")

module.exports = {
    get: get,
    post: post,
    delete: do_delete,
};


async function get(req, res) {
	try {
	    var o_return = {};
        var machines_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/hosts/");
        o_return["machines"] = await _jsonfiles_to_array(machines_folder);
        o_return["machines"] = o_return["machines"].filter(o=>{
            return (("last_heartbeat" in o) && o.last_heartbeat != "");//excludes machines that only opened status monitor
         });
		res.json(o_return);
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

async function post(req, res) {
// 	try {
// 	    var o_return = {};
//         var workflow_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/hosts/");
//         o_return["machines"] = await _jsonfiles_to_array(workflow_folder);
//         o_return["machines"] = o_return["machines"].filter(o=>{
//             return (("last_heartbeat" in o) && o.last_heartbeat != "");//excludes machines that only opened status monitor
//          });
// 		res.json(o_return);
// 		res.end();
// 	} catch(err) {
// 		console.debug(err);
// 		return res.status(500).json({description: err});
// 	}
}

async function do_delete(req, res) {
	try {
        var machines_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/hosts/");
        await fsPromises.unlink(path.join(machines_folder,req.query.name + ".json"));
		res.json({"success":true});
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

//all files in all directories to array
async function _jsonfiles_to_array(dir) {
        //console.time("jsonfiles_to_array " + dir);
		if (!dir){return}
		var returnarray=[];
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var contents = await fsPromises.readFile(path.join(dir,allfiles[_idx]), 'utf8');
                contents = contents.replace(/^\uFEFF/, '');
                var newitem = (JSON.parse(contents, 'utf8'))//removes BOM	;
                returnarray.push(newitem)
            }catch(ex){
                console.log("Could parse Json from file:",path.join(dir,allfiles[_idx]),ex)
            }
        }
        //console.timeEnd("jsonfiles_to_array " + dir);
		return returnarray;
}



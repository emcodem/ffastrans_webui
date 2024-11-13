'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const path = require("path")
const common = require("./common/helpers.js");

module.exports = {
    get: get,
    post: post,
    delete: do_delete,
};


async function get(req, res) {
	try {
	    var o_return = {};
        o_return["presets"] = []
        var fullpath
        var presets_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/presets/");
        var flist = await common._fileList(presets_folder, '*.json', true, false, 'all');
        for (fullpath of flist) {
            try{
                var newitem = await common.readfile_cached(fullpath, true)//removes BOM;
                o_return["presets"].push(newitem)
            }catch(ex){
                console.log("Could not parse Json from file:",fullpath,ex)
            }
        }
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




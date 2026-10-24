'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const path = require("path")
const common = require("./common/helpers.js");

module.exports = {
    get: get,
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
                var newitem = await common.readJsonFile(fullpath)//removes BOM;
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


async function do_delete(req, res) {
	try {
        //was deleting from the hosts folder (copy of machines.js), presets live in configs/presets
        var presets_folder = path.join(global.api_config["s_SYS_CACHE_DIR"],"../configs/presets/");
        var preset_file = common.resolveInside(presets_folder, req.query.name + ".json");
        if (!preset_file) {
            return res.status(400).json({description: "name must be inside the presets folder"});
        }
        await fsPromises.unlink(preset_file);
		res.json({"success":true});
		res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}




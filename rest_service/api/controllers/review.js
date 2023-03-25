'use strict';
//var util = require('util');
const fs = require('fs')
const fsPromises = require('fs').promises;
const common = require("./common/helpers.js");
const path = require('path');
const axios = require('axios');

module.exports = {
    get: get,
    do_delete:do_delete
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
async function get(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    var s_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"review","queue"),"");
    console.debug("get review called for: ");
	var returnjson = [];
	try {
        var allfiles = await fsPromises.readdir(s_path, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var contents = await common.readfile_cached(path.join(s_path,allfiles[_idx]), 'utf8');
                contents = contents.replace(/^\uFEFF/, '');
                var _j = JSON.parse(contents);
                _j["review_file"] = allfiles[_idx];
                returnjson.push(JSON.stringify(_j));
            }catch(ex){}
        }
        
        res.json(returnjson);
        res.end();
	} catch(err) {
        if (err.code == "ENOENT"){
            res.json([]);
            res.end();
        }
		console.debug(err);
		return res.status(500).json({description: err.stack});
	}
}

async function do_delete(req, res) {
    // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    try{
      var filename = req.query.filename;
      var s_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"review","queue"),"");
      var to_delete = path.join(s_path,filename);
      console.info("Deleting review ticket file: ", to_delete)
      fs.unlinkSync(to_delete);
      res.json({});
      res.end();
    }catch(err) {
        
		console.error(err);
		return res.status(500).json({description: err.stack});
	}
  }
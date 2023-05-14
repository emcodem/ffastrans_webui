'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");

module.exports = {
    get: getAbout,
    post: postAbout
};


async function getAbout(req, res) {
    var o_req = req.body;
	try {

        var ffas_readout = await readAboutFile();
        var o_return = {
            discovery:  req.headers.referer,
            about:      ffas_readout
        };
        
        res.json(o_return);
        res.end();
	} catch(err) {
        
		console.debug(err);
        return res.status(500).send(err.stack.toString());
	}
}

async function postAbout(req, res) {

    var ffas_readout = readAboutFile();
    var o_req = req.body;
    
    
}

async function readAboutFile(){
    var ffas_json = path.join (global.api_config["s_SYS_CONFIGS_DIR"],"ffastrans.json");
    var ffas_readout = await fsPromises.readFile(ffas_json, 'utf8');
    ffas_readout = ffas_readout.replace(/^\uFEFF/, '');
    ffas_readout = JSON.parse(ffas_readout);
    return ffas_readout;
}
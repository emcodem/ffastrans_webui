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
    //read existing config and check if it has the same number of fields as the submitted one
    try{
        var existing = await readAboutFile();
        validateAbout(existing,o_req);
        var topLevelKey = Object.keys(o_req)[0];
        console.log("Saving ffastrans.json section",topLevelKey);
        existing[topLevelKey] = o_req[topLevelKey];
        writeAboutFile(existing);
        res.json({success:true});
        res.end();
    }catch(ex){
        return res.status(500).send(ex.toString());
    }
}

async function validateAbout(existing,section){
    var topLevelKey = Object.keys(section)[0];
    if (Object.keys(existing[topLevelKey]).length != Object.keys(section[topLevelKey]).length){
        throw new Error("Number of toplevel keys mismatch");
    }
}

async function readAboutFile(){
    var ffas_json = path.join (global.api_config["s_SYS_CONFIGS_DIR"],"ffastrans.json");
    var ffas_readout = await fsPromises.readFile(ffas_json, 'utf8');
    ffas_readout = ffas_readout.replace(/^\uFEFF/, '');
    ffas_readout = JSON.parse(ffas_readout);
    return ffas_readout;
}

async function writeAboutFile(o_contents){
    var ffas_readout = await fsPromises.writeFile(
                                        path.join (global.api_config["s_SYS_CONFIGS_DIR"],"ffastrans.json"),
                                        JSON.stringify(o_contents,null,2), 
                                        'utf8');
}
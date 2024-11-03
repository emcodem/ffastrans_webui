'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    get: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
function start(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
    var filepath = req.query.filepath;
	var do_html = req.query.do_html || false;
    console.debug("get_mediainfo called for: " + filepath);
	//check if full log exists, if yes, serve contents
    try {
        if (fs.existsSync(filepath)) {
            //file exists
        } else {
            console.debug("File does not exist: ", filepath);
            return res.status(404).json({ description: "File does not exist: "+ filepath });
        }
    } catch (err) {
        console.debug(err);
        return res.status(500).json({ description: err.stack });
    }

    main(res, filepath,do_html);
    
}

async function main(res, filepath,do_html) {
    try {
        let data = await MediaInfo(filepath);
        return res.status(200).send(data);
        
    } catch (ex) {
        return res.status(500).send("Error getting mediainfo" + ex);
    }
}

function MediaInfo(file) {
    var args = [].slice.call(arguments);
    var cmd_options = typeof args[0] === "object" ? args.shift() : {};
    var cmd = [];

    cmd.push(getCmd()); // base command
    cmd.push('--Output=HTML'); // args
    cmd.push(file);
    console.log("exec mediainfo",cmd_options)
    return new Promise(function (resolve, reject) {
        exec(cmd.join(' '), cmd_options, function (error, stdout, stderr) {
            if (error !== null || stderr !== '') return reject(error || stderr);
            resolve(stdout);
        });
    });
};

function getCmd() {
    return path.join(global.approot,"tools","mediainfo","mediainfo.exe");
}

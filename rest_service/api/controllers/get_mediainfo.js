'use strict';

const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const { execFile } = require('child_process');

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
    //only absolute paths: a resolved absolute path never starts with "-", so mediainfo can't mistake it for an option
    if (typeof filepath !== "string" || !path.isAbsolute(filepath)) {
        return res.status(400).json({ description: "filepath must be an absolute path" });
    }
    filepath = path.resolve(filepath);
    try {
        if (!fs.existsSync(filepath)) {
            console.debug("File does not exist: ", filepath);
            return res.status(404).json({ description: "File does not exist: "+ filepath });
        }
    } catch (err) {
        console.error("get_mediainfo error checking file", filepath, err);
        return res.status(500).json({ description: "Error checking file" });
    }

    main(res, filepath,do_html);

}

async function main(res, filepath,do_html) {
    try {
        let mediainfo_exe = await findMediainfoExe();
        let data = await mediaInfo(filepath,mediainfo_exe);
        return res.status(200).send(data);

    } catch (ex) {
        console.error("Error getting mediainfo for", filepath, ex);
        return res.status(500).send("Error getting mediainfo");
    }
}

function mediaInfo(file,mediainfo_exe) {
    var args = ['--Output=HTML', file];
    console.log("execFile mediainfo", mediainfo_exe, args)
    //execFile does not use a shell, so metacharacters in the filename are not interpreted
    return new Promise(function (resolve, reject) {
        execFile(mediainfo_exe, args, function (error, stdout, stderr) {
            if (error !== null || stderr !== '') return reject(error || stderr);
            resolve(stdout);
        });
    });
};

async function findMediainfoExe() {
    //todo: we really should find a solution for the global.approot problem, at least we should not locate the exe here.
    var when_complied = path.join(global.approot,"tools","mediainfo","mediainfo.exe");
    var when_run_from_code = path.join(global.approot,"..","tools","mediainfo","mediainfo.exe");
    if (await fsExtra.pathExists (when_complied))
        return when_complied;
    else
        return when_run_from_code;
}

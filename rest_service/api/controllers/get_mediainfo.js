'use strict';

const fs = require('fs')
const mediainfo = require('mediainfo-wrapper');

var json2human = require('json.human');
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
        console.log("Trying mediainfo");
        require('mediainfo-wrapper')(filepath,do_html).then(
            function (data) {
                return res.status(200).send(data);
            }
        ).catch(
            function (error) {
                console.log(error)
                return res.status(500).send("Error getting mediainfo" + error)
            }
        )
    } catch (ex) {
        return res.status(500).send("Error getting mediainfo" + ex);
    }
}


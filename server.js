const express = require('express');
const app = express();
var path = require("path");
const util = require('util')


//needed for running as nexe
var currentFullpath = path.dirname(process.execPath);
var config = require(currentFullpath + '/server_config');

//redirect user config
/*app.get('/', function(req, res,next) {
    
   //todo: redirect static page user_config.js or make dynamic anyway
    console.log(req.originalUrl)
    next();
    //res.sendFile(currentFullpath + "/user_config.js");
    //res.end();
});*/

// serve static websites
app.use(express.static('./'));
app.use(express.static(__dirname + '/webinterface'));

//allow access to dynamic stuff
require("./upload_backend/common")(app, express);
require("./upload_backend/saverename")(app, express);
require("./upload_backend/getFullUploadPath")(app, express);
require("./redirect")(app, express);



//favicon
app.use('/favicon.ico', express.static('webinterface/images/favicon.ico'));



console.log('Hello and welcome, thank you for using FFAStrans') 
app.listen(config.port, () => console.log('Running on http://localhost:' + config.port));



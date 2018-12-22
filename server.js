const express = require('express');
const app = express();
var path = require("path");
const util = require('util')
var bodyParser = require('body-parser')
var proxy = require('express-http-proxy');
require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log 

//needed for running as nexe
var currentFullpath = path.dirname(process.execPath);

try{
    //running as compiled exe file (nexe)
    global.config = require(currentFullpath + '/server_config');
    console.log("Running as compiled file")
}catch(e){
    //running as local script
    global.config = require(__dirname + '/server_config');
    console.log("Running as node script")
}

//log any request
app.use(function(req, res, next) {
    //console.log(req.originalUrl);
    next();
});

//redirect user config
/*app.get('/', function(req, res,next) {
    
   //todo: redirect static page user_config.js or make dynamic anyway
    console.log(req.originalUrl)
    next();
    //res.sendFile(currentFullpath + "/user_config.js");
    //res.end();
});*/

//needed to parse parameters from requests
app.use(bodyParser.urlencoded({ extended: true }));

//forward requests to ffastrans # export variable for debugging: set DEBUG=express-http-proxy (onwindows)
app.use('/proxy', proxy('http://localhost:65445'));//TODO: read ffastrans server and port from config

// serve static websites
app.use(express.static('./'));
app.use(express.static(__dirname + '/webinterface'));

//allow access to dynamic stuff
require("./upload_backend/common")(app, express);
require("./upload_backend/saverename")(app, express);
require("./upload_backend/getFullUploadPath")(app, express);
require("./node_components/redirect")(app, express);
require("./node_components/filebrowser")(app, express);
require("./node_components/getbrowselocations")(app, express);

//catch all uncaught exceptions - keeps the server running
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

//favicon
app.use('/favicon.ico', express.static('webinterface/images/favicon.ico'));

//startup
console.log('Hello and welcome, thank you for using FFAStrans') 
app.listen(global.config.port, () => console.log('Running on http://localhost:' + global.config.port));



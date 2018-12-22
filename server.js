const express = require('express');
const app = express();
var path = require("path");
const util = require('util');
var bodyParser = require('body-parser');
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
    currentFullpath = __dirname;
    console.log("Running as node script")
}

//init DB
global.db={};
var Db = require('tingodb')().Db,
assert = require('assert');
global.db.base = new Db(currentFullpath + "/database", {});
// Fetch a collection to insert document into
global.db.jobcollection = global.db.base.collection("jobcollection");
// test if db works
global.db.jobcollection.insert([{test:'test'}], {w:1}, function(err, result) {
  assert.equal(null, err);
})
  
//log all requests
app.use(function(req, res, next) {
    //console.log(req.originalUrl);
    next();
});

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
require("./node_components/serveconfig")(app, express);
//catch all uncaught exceptions - keeps the server running
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

//favicon
app.use('/favicon.ico', express.static('webinterface/images/favicon.ico'));

//startup
console.log('Hello and welcome, thank you for using FFAStrans') 
app.listen(global.config.STATIC_WEBSERVER_LISTEN_PORT, () => console.log('Running on http://localhost:' + global.config.STATIC_WEBSERVER_LISTEN_PORT));



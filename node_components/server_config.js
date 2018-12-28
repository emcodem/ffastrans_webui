defaultConfig = {};

//you can change these values but check if you created valid javascript
defaultConfig.STATIC_WEBSERVER_LISTEN_PORT = 3002;


defaultConfig.STATIC_USE_WEB_AUTHENTIFICATION = false;
//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
defaultConfig.STATIC_UPLOADPATH = "\\\\localhost\\c$\\temp\\";

//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
//display_names and the locations themselves have to contain the same amount of items!
defaultConfig.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES = ["Local examle","UNC example","D Drive on server"];
defaultConfig.STATIC_ALLOWED_BROWSE_LOCATIONS = ["c:\\","\\\\localhost\\c$\\","D:\\"];

//not yet active, files in upload dir are deleted if older than x hours check/delete happens everytime a new file is uploaded...
//defaultConfig.STATIC_UPLOAD_FILES_MAXAGE = 1;

//FFAStrans server
defaultConfig.STATIC_API_HOST = "localhost";
defaultConfig.STATIC_API_PORT = "65445";

//default user config
//you can change these variables

defaultConfig.STATIC_INIT_RUNNING_GRID_COL_WIDTHS_PERCENT = "50,10,10,10,30,10,0,0,*,0,5"; 
defaultConfig.STATIC_INIT_FINISHED_GRID_COL_WIDTHS_PERCENT = "5,10,0,0,30,10,0,5,*";


//Please do not change these values
defaultConfig.STATIC_START_JOB_URL = "/api/json/v1/jobs/";
defaultConfig.STATIC_GET_WORKFLOWS_URL = "/api/json/v1/workflows";
defaultConfig.STATIC_GET_WORKFLOW_DETAILS_URL = "/api/json/v1/workflows/details";
defaultConfig.STATIC_GET_RUNNING_JOBS_URL = "/api/json/v1/jobs";
defaultConfig.STATIC_GET_FINISHED_JOBS_URL = "/api/json/v1/history";
defaultConfig.STATIC_GET_QUEUED_JOBS_URL =  "/api/json/v1/queue/";
defaultConfig.STATIC_USE_PROXY_URL =  true;

//this line is mandatory, do not remove it!
//module.exports = config;
require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log
module.exports = {
    //set object to config obj
    get: (callback) => {
        //check if we have a config in db, otherwise serve defaultConfig
        global.db.config.findOne({"global.config":{$exists:true}}, function(err, data) {//'global':'config'
            if (err){
                throw err;
            }
            if ((data)){
                console.log("Serving Server config from database");
                callback(data.global.config);
            }else{
                console.warn("No config in database, defaulting to default config");
                global.socketio.emit("admin", "Warning, you see default config.");
                callback (defaultConfig);
            }
        });
            //console.log("after findone")
    },
    getdefault: () => {
        //get the object from database
        console.log("Serving Server default config");
        //console.log(defaultConfig);
        return defaultConfig;
    },
    save: (configobj,callbacksuccess,callbackerror) => {
        //updates config in database
            global.db.config.update({"global.config":{$exists:true}},{global:{config:configobj}},{upsert: true}, function (err, newDoc) {
            if (err){
                callbackerror(err);
            }
            global.config = configobj;
            console.log("Success saving Server Config, config updated")
            callbacksuccess();
        });
    }
};


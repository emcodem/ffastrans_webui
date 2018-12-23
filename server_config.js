config = {};

//TODO: put all this stuff into database

//you can change these values but check if you created valid javascript
config.STATIC_WEBSERVER_LISTEN_PORT = 3002;
config.STATIC_USE_WEB_AUTHENTIFICATION = false;
//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
config.uploadpath = "\\\\localhost\\c$\\temp\\";

//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
//display_names and the locations themselves have to contain the same amount of items!
config.allowed_browse_locations_display_names = ["Local examle","UNC example","D Drive on server"];
config.allowed_browse_locations = ["c:\\","\\\\localhost\\c$\\","D:\\"];

//not yet active, files in upload dir are deleted if older than x hours check/delete happens everytime a new file is uploaded...
config.uploaded_files_maxage = 1;

//FFAStrans server
config.STATIC_API_HOST = "localhost";
config.STATIC_API_PORT = "65445";

//default user config
//you can change these variables

config.STATIC_JOB_POLLING_INTERVAL = "1000";
config.STATIC_INIT_RUNNING_GRID_COL_WIDTHS_PERCENT = "0,10,10,10,30,10,0,0,*,0"; 
config.STATIC_INIT_FINISHED_GRID_COL_WIDTHS_PERCENT = "5,10,0,0,30,10,0,5,*";


//Please do not change these values
config.STATIC_START_JOB_URL = "/api/json/v1/jobs/";
config.STATIC_GET_WORKFLOWS_URL = "/api/json/v1/workflows";
config.STATIC_GET_WORKFLOW_DETAILS_URL = "/api/json/v1/workflows/details";
config.STATIC_GET_RUNNING_JOBS_URL = "/api/json/v1/jobs";
config.STATIC_GET_FINISHED_JOBS_URL = "/api/json/v1/history";
config.STATIC_GET_QUEUED_JOBS_URL =  "/api/json/v1/queue/";

//this line is mandatory, do not remove it!
module.exports = config;


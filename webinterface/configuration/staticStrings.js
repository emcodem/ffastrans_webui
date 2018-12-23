//TODO: serve this file from node and delete this file (put in server_config.js)
//you can change these variables
var STATIC_API_HOST = "localhost";
var STATIC_API_PORT = "65445";
var STATIC_JOB_POLLING_INTERVAL = "1000";
var STATIC_INIT_RUNNING_GRID_COL_WIDTHS_PERCENT = "0,10,10,10,30,10,0,0,*,0"; 
var STATIC_INIT_FINISHED_GRID_COL_WIDTHS_PERCENT = "5,10,0,0,30,10,0,5,*";

//but not those

var STATIC_START_JOB_URL = "/api/json/v1/jobs/";
var STATIC_GET_WORKFLOWS_URL = "/api/json/v1/workflows";
var STATIC_GET_WORKFLOW_DETAILS_URL = "/api/json/v1/workflows/details";
var STATIC_GET_RUNNING_JOBS_URL = "/api/json/v1/jobs";
var STATIC_GET_FINISHED_JOBS_URL = "/api/json/v1/history";
var STATIC_GET_QUEUED_JOBS_URL =  "/api/json/v1/queue/";
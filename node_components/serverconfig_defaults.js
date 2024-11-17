/*

    Default config is what you see on admin page.
    To add a new entry, all you need to do is to write it here. If you have a special type, e.g. not string or array, you also want to modify the admin html page 
    This is designed as backward compatible, e.g. if a user has an existing configdb saved with overriden values and he updates the webint to a version
    which contains new config items, then only config items with their default value should be automatically merged to his existing config.
*/

defaultConfig = {};

defaultConfig.STATIC_FFASTRANS_PATH = "unknown";
defaultConfig.STATIC_GOOGLE_ANALYTICS_ENABLE = "enabled";
defaultConfig.STATIC_WEBUI_HEADER_NAME = "";
defaultConfig.STATIC_SEND_EMAIL_ALERTS = false;
defaultConfig.STATIC_WEBSERVER_LISTEN_PORT = 3002;
defaultConfig.STATIC_WEBSERVER_ENABLE_HTTPS = false;
defaultConfig.STATIC_WEBSERVER_HTTPS_PK_PASSWORD = "webserver";
defaultConfig.database_maintenance_autodelete = 365;

defaultConfig.STATIC_USE_WEB_AUTHENTIFICATION = false;
//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
defaultConfig.STATIC_UPLOADPATH = "\\\\localhost\\c$\\temp\\";


//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
//display_names and the locations themselves have to contain the same amount of items!
// defaultConfig.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES = ["Local examle","UNC example","D Drive on server"];
// defaultConfig.STATIC_ALLOWED_BROWSE_LOCATIONS = ["c:\\","\\\\localhost\\c$\\","D:\\"];
defaultConfig.allowed_browselocations = [
    {
        displayname : "Local Example",
        path : "C:",
        filters : {include:"",exclude:""}
    },
    {
        displayname : "UNC example",
        path : "\\\\localhost\\c$\\",
        filters : {include:"",exclude:""}
    },
]

//FFAStrans server
defaultConfig.STATIC_API_HOSTS = "localhost";
defaultConfig.STATIC_API_HOST = "localhost";
defaultConfig.STATIC_API_PORT = "65445";
defaultConfig.STATIC_API_NEW_PORT = "3003";
defaultConfig.STATIC_API_TIMEOUT = 7000;

defaultConfig.STATIC_RUNNING_GRID_COL_WIDTHS_PERCENT = "5%,35%,10%,20%,10%,10%"; 
defaultConfig.STATIC_FINISHED_GRID_COL_WIDTHS_PERCENT = "5%,35%,10%,5%,10%,20%";

defaultConfig.STATIC_MAX_HISTORY_JOB_COUNT = 20000;
defaultConfig.STATIC_HEADER_JOB_COUNT_DAYS = 30;

defaultConfig.STATIC_METRICS_METRICS_HOST = "localhost"; //who serves prometheus and grafana?

//hidden items. TODO: keep those in separate global object?
defaultConfig.STATIC_START_JOB_URL = "/api/json/v2/jobs/";
defaultConfig.STATIC_GET_WORKFLOWS_URL = "/api/json/v2/workflows";
defaultConfig.STATIC_GET_WORKFLOW_DETAILS_URL = "/api/json/v2/workflows";
defaultConfig.STATIC_GET_WORKFLOW_VARS_URL = "/api/json/v2/workflows/<wf_id>/user_variables";
defaultConfig.STATIC_GET_RUNNING_JOBS_URL = "/api/json/v2/jobs";
defaultConfig.STATIC_GET_FINISHED_JOBS_URL = "/api/json/v2/history";
defaultConfig.STATIC_GET_QUEUED_JOBS_URL =  "/api/json/v2/tickets";
defaultConfig.STATIC_GET_JOB_LOG_URL = "/api/json/v2/joblog/" //+ <job_id>?start=0&count=100

defaultConfig.STATIC_USE_PROXY_URL = true;

//new methods of node api (WEB_API_PORT )
//this API must run on STATIC_API_HOST so we need no config for the host

//NEW API Methods are named static_api...
defaultConfig.STATIC_API_GET_JOB_LOG_URL = "/getjoblog";
defaultConfig.STATIC_API_GET_PENDING_JOBS_URL = "/tickets";

//Metrics URLs default
defaultConfig.grafana_base = "http://localhost:3004/";
defaultConfig.grafana_url_hosts = "/grafana_proxy/d/000000014/windows-node-with-process-info&theme=light";
defaultConfig.grafana_url_jobs = "/grafana_proxy/d/Jlcx_u8Gz/ffastrans-running?orgId=1";

module.exports = defaultConfig;
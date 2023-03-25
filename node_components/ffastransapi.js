const assert = require('assert');
const helpers = require("./common/helpers");
const Request = require("request");
const axios = require("axios")
//todo: implement queued jobs

var m_workflow_cache= {last_update:null,data:[]};

module.exports = {
    /* new exports style: provide function name instead of inline function */
    getWorkflows: getWorkflows,

    /* the following are inline functions, thats old style. we should keep the exports list small and implement functions separately */
    getWorkflowDetails: (callbackSuccess,callbackError) => {
        Request({ url: buildApiUrl(global.config.STATIC_GET_WORKFLOW_DETAILS_URL), method: 'GET'}, function(error, response, body){ 
            if (error){
                callbackError(error)
            }else{
                callbackSuccess(body)
            }
        });
        return;
    },
    getJobLog: (job_id,start,count,callbackSuccess,callbackError) => {
        if (!start){start = 0;}
        if (!count){ count = 300; }
        var url = global.config.STATIC_GET_JOB_LOG_URL + job_id + "?start=" + start + "&count=" + count;
        Request({ url: buildApiUrl(url), method: 'GET'}, function(error, response, body){ 
            if (error){
                console.error("getJobLog Error " + error , url)
                callbackError(error)
                console.error(error.stack)
            }else{
                callbackSuccess(body)
            }
        });
        return;
    },
    getJobDetails: (job_id, callbackSuccess, callbackError) => {
        var _url = helpers.build_new_api_url(global.config["STATIC_API_GET_JOB_LOG_URL"]) ;
        _url +=  "?" + job_id;
        Request({ url: _url, method: 'GET' }, function(error, response, body) {
            if (error) {
                console.error("getJobDetails Error " + error, url)
                callbackError(error)
                console.error(error.stack)
            } else {
                callbackSuccess(body)
            }
        });
        return;
    },
    startJob: (job,callbackSuccess,callbackError) => {
        console.log("Starting job:");
        console.log(job);
        Request({ url: buildApiUrl(global.config.STATIC_START_JOB_URL), method: 'POST',body:job}, function(error, response, body){ 
            if (error){
                console.log(error);
                callbackError(error)
            }else{
                console.log("Success starting ffastrans api job");
                console.log(body);
                callbackSuccess(body);
            }
        });
        return;
    },
};

/* gets all workflows from new api */
async function getWorkflows(){
    
    if (!m_workflow_cache.data || (((new Date) - m_workflow_cache.last_update) > 5000)){
        var url = helpers.build_new_api_url("/workflows");
        var response = await axios.get(url, {timeout: 7000,agent: false, maxSockets: Infinity});
        m_workflow_cache.data = response.data.workflows;
        m_workflow_cache.last_update = new Date();
    }
    return m_workflow_cache.data;
}

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}




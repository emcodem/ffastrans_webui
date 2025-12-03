const assert = require('assert');
const helpers = require("./common/helpers");
// Removed: const Request = require("request");
const axios = require("axios")
//todo: implement queued jobs

var m_workflow_cache= {last_update:null,data:[]};

module.exports = {
    getWorkflows: getWorkflows,

    getWorkflowDetails: async (callbackSuccess, callbackError) => {
        try {
            const response = await fetch(buildApiUrl(global.config.STATIC_GET_WORKFLOW_DETAILS_URL), { method: 'GET' });
            const body = await response.text();
            callbackSuccess(body);
        } catch (error) {
            callbackError(error);
        }
    },
    getJobLog: async (job_id, start, count, callbackSuccess, callbackError) => {
        if (!start) { start = 0; }
        if (!count) { count = 300; }
        const url = buildApiUrl(global.config.STATIC_GET_JOB_LOG_URL + job_id + "?start=" + start + "&count=" + count);
        try {
            const response = await fetch(url, { method: 'GET' });
            const body = await response.text();
            callbackSuccess(body);
        } catch (error) {
            console.error("getJobLog Error", error, url);
            callbackError(error);
            if (error.stack) console.error(error.stack);
        }
    },
    getJobDetails: async (job_id, callbackSuccess, callbackError) => {
        var _url = helpers.build_new_api_url(global.config["STATIC_API_GET_JOB_LOG_URL"]);
        _url +=  "?" + job_id;
        try {
            const response = await fetch(_url, { method: 'GET' });
            const body = await response.text();
            callbackSuccess(body);
        } catch (error) {
            console.error("getJobDetails Error", error, _url);
            callbackError(error);
            if (error.stack) console.error(error.stack);
        }
    },
    startJob: async (job, callbackSuccess, callbackError) => {
        console.log("Starting job:");
        console.log(job);
        job.system = "FFAStrans Web Interface";
        var headers = {
            'Content-Type': 'application/json'
        };
        try {
            const response = await fetch(
                helpers.build_new_api_url("/jobs"),
                {
                    method: 'POST',
                    headers: headers,
                    body: job
                }
            );
            const body = await response.text();
            console.log("Success starting ffastrans api job");
            console.log(body);
            callbackSuccess(body);
        } catch (error) {
            console.log(error);
            callbackError(error);
        }
    },
};

/* gets all workflows from new api */
async function getWorkflows() {
    if (!m_workflow_cache.data || (((new Date) - m_workflow_cache.last_update) > 5000)) {
        var url = helpers.build_new_api_url("/workflows");
        var response = await axios.get(url, {timeout: global.config.STATIC_API_TIMEOUT,agent: false, maxSockets: Infinity});
        m_workflow_cache.data = response.data.workflows;
        m_workflow_cache.last_update = new Date();
    }
    return m_workflow_cache.data;
}

function buildApiUrl(what) {
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}
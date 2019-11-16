const assert = require('assert');
const Request = require("request");
//todo: implement queued jobs
module.exports = {
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

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}



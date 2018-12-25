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
    multiply: (x, y) => {
        return x * y;
    }
};

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}



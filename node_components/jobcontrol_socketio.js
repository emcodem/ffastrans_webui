const assert = require('assert');
const Request = require("request");
//todo: implement queued jobs
module.exports = {
    pausejob: (cancelobj) => {
        cancelobj=JSON.parse(cancelobj)
        console.log("cancelcommand received id: " + cancelobj.id)
        console.log(buildApiUrl(global.config.STATIC_START_JOB_URL) + cancelobj.id)
        console.log(cancelobj.body)
        Request({ url: buildApiUrl(global.config.STATIC_START_JOB_URL) + cancelobj.id, method: 'PUT', json: cancelobj.body}, function(error, response, body){ 
            if (error){
                global.socketio.emit("error", "Error pauseing job, "+ error);
                console.log("Pause command error: "+ error)
            }else{
             global.socketio.emit("msg", body);
                console.log("Pause command OK:" + body);
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



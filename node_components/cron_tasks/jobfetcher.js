const assert = require('assert');
const Request = require("request");
//todo: implement queued jobs

module.exports = {
  fetchjobs: function () {    
    //fetch running jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: 7000},(error, response, body) => {
        if(error) {
            global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        //send the new jobs to connected clients, todo: only notify clients about new stuff
        global.socketio.emit("activejobs", JSON.stringify(JSON.parse(body).jobs));
        //store in database
        for (i=0;i<JSON.parse(body).jobs.length;i++){
             storeActiveJob(JSON.parse(body).jobs[i]);
        }
    });
    
    //fetch queued jobs from api - TODO: this currently dont work in ffastrans api, activate at next version
   /* Request.get(buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL), {timeout: 7000},(error, response, body) => {
        if(error) {
            global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        //send the new jobs to connected clients, todo: only notify clients about new stuff
        global.socketio.emit("queuedjobs", JSON.stringify(JSON.parse(body).jobs));
        //store in database
        for (i=0;i<JSON.parse(body).jobs.length;i++){
             storeActiveJob(JSON.parse(body).jobs[i]);
        }
    });*/
    
    //fetch history jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL), {timeout: 7000},(error, response, body) => {
        if(error) {
            global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        //send the new jobs to connected clients, todo: only notify clients about new stuff
        global.socketio.emit("historyjobs", JSON.stringify(JSON.parse(body).history));
        //store in database
        for (i=0;i<JSON.parse(body).history.length;i++){
            storeFinishedJob(JSON.parse(body).history[i]);
        }
    });   
  }
};

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}

function storeActiveJob(_job){
    return; //creating a unique id did not work, wf_name and job_start is not unique enough. todo: wait for newer ffastrans version
    var newjobIds = [];
    var jobid =  _job.wf_name +" "+ _job.job_start;//currently history jobs don't have an id in ffastrans, assume file and start makes a unique id
        //add missing fields - talk to steinar about one unified job obj
        _job.job_end = "";
        _job.outcome = "";
        _job.guid = jobid;
        _job._id = jobid;
        //store in db
        global.db.jobs.base.insert(jobArray[i], function (err, newDoc) {});  
        //todo: update fields if neccessary
}

function storeFinishedJob(_job){
    return; //creating a unique id did not work, wf_name and job_start is not unique enough. todo: wait for newer ffastrans version
      var jobid =  _job.wf_name +" "+ _job.job_start;//currently history jobs don't have an id in ffastrans, assume file and start makes a unique id
        _job.guid = jobid;
        _job._id = jobid;
        global.db.jobs.base.find({ _id:jobid },  function (err, docArray) {
            if (docArray.length > 1){
                console.log("Found the same jobid ("+jobid+")mulitple times in database, cannot go on");
                return;
            }
            if (docArray){
                var doc =docArray[0];
                if (doc.job_end != _job.job_end){//check if job turned form active to finished, if yes, inerst job_end and outcome
                    console.log("Found that job end needs update, (DBval:"+doc.job_end +"!= jobval:"+ _job.job_end+") calling update function, set " +_job.job_end + " on "+ jobid);
                    console.log(doc);
                    console.log(_job);
                    //need to update record, job most likely was moved from active to finished - the json job strucutre changes in that case
                    global.db.jobs.base.update({"_id":jobid},  { $set: { "job_end": _job.job_end,"outcome":_job.outcome}}, {upsert:false}, function (err,doc,upsert) {
                        if (err){
                            console.trace("Could not update job_end on " + jobid + err)
                        }
                    })
                }//update job_end
            }else{
               global.db.jobs.base.insert(_job, function (err, newDoc) {});  
            }//if doc 
        }) 
}



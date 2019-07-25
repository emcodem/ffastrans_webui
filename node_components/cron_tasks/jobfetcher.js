const assert = require('assert');
const Request = require("request");
//todo: implement queued jobs
var m_jobStates = ["Error","Success","Cancelled","Unknown"];

module.exports = {
  fetchjobs: function () {
    //fetch running jobs from api
    if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
        return;
    }
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: 2000},(error, response, body) => {
        if(error) {
            global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        //send the new jobs to connected clients, todo: only notify clients about new stuff
        global.socketio.emit("activejobs", JSON.stringify(JSON.parse(body).jobs));
        global.socketio.emit("activejobcount", JSON.parse(body).jobs.length);
 
    });
    
    //fetch queued jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL), {timeout: 7000},(error, response, body) => {
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            return;
        }
        if(error) {
            global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        //send the new jobs to connected clients, todo: only notify clients about new stuff

        global.socketio.emit("queuedjobs", JSON.stringify(JSON.parse(body).queue));
        global.socketio.emit("queuedjobcount", JSON.parse(body).queue.length);
        return;
        //store in database

    });
    
    //fetch history jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL), {timeout: 7000},(error, response, body) => {
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            return;
        }
        if(error) {
            global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        var jobArray = JSON.parse(body).history;
        //store history jobs in database
        var newjobsfound = 0;
        for (i=0;i<jobArray.length;i++){
            //todo: check if we need to insert anything before calling insert (save amount of calls per second)
            var guid = hashCode(JSON.stringify(jobArray[i]));//TODO: the +i is just for making every entry unique, this is to workaround missing job ids and split ids in ffastrans 093. DELETE THIS 
            jobArray[i].guid = guid;
            jobArray[i]._id = guid;
            jobArray[i].duration = getDurationStringFromDates(jobArray[i].job_start,jobArray[i].job_end);
            jobArray[i].state = m_jobStates[jobArray[i].state];
            global.db.jobs.insert(jobArray[i], function (err, newDoc) {
                if (err){
                    //console.log("Error inserting history job into DB: " + err)
                }
                if (newDoc){
                    newjobsfound ++;
                    //inform clients about the presence of new history job(s)
                    //todo: calculate duration and store along with object
                    global.socketio.emit("newhistoryjob", newDoc);//inform clients about the current num of history jobs so they can poll for the joblist if they need new jobs
                }
            });
        }

        //inform clients about current job count
        var countObj = {errorjobcount:0,successjobcount:0,cancelledjobcount :0};
        //inform the client about current count in DB
        global.db.jobs.count({"state":"Success","deleted":{ $exists: false }},function(err,success_count){
            countObj.successjobcount=success_count;
            global.db.jobs.count({"state":"Error","deleted":{ $exists: false }},function(err,error_count){
                countObj.errorjobcount=error_count;
                global.db.jobs.count({"state":"Cancelled","deleted":{ $exists: false }},function(err,cancelled_count){
                    countObj.cancelledjobcount=cancelled_count;
                    //push data to client
                    global.socketio.emit("historyjobcount", countObj);
                })
            })
        })
        
    });   
  }
};


/* HELPERS */

function getDurationStringFromDates(start_date,end_date){
        var delta = Math.abs(new Date(end_date) - new Date(start_date)) / 1000;// get total seconds between the times
        var days = Math.floor(delta / 86400);// calculate (and subtract) whole days
        delta -= days * 86400;// calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;// calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;// what's left is seconds
        var seconds = delta % 60;  // in theory the modulus is not required
        return pad(hours) + ":" + pad (minutes) + ":" + pad (seconds);
}

function pad(n, z) { //add leading zero if there is none
  z = z || '0';
  n = n + '';
  return n.length >= 2 ? n : new Array(2 - n.length + 1).join(z) + n;
}

function hashCode (string) {
//this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
  var hash = 0, i, chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}

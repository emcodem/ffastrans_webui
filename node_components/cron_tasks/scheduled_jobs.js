const assert = require('assert');
const Request = require("request");
const parser = require('cron-parser');
var tmp = require('tmp');
tmp.setGracefulCleanup();
const { fork } = require('child_process');
const fs = require('fs');
const isRunning = require('is-running')
tmp.setGracefulCleanup();
const ffastransapi = require("../ffastransapi");
const moment = require("moment");
const asyncdatastore = require("nedb-promise");
const axios = require("axios");

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function() {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};

//0 1 * * * At 01:00.
//* * * * * At every minute
//checks for all scheduled tasks in DB and executes them if neccessary
module.exports = {
    /*ASYNC DB ACCESS EXAMPLE (nedb-promise)!*/
    execute: async function () {
        //get all scheduled jobs from DB
        var DB = asyncdatastore.fromInstance(global.db.config);
        var data = await DB.find({ "scheduled_jobs": { $exists: true } });
        if (data.length>0) {
            for (jobIndex in data){
                try {
                    var current_job = data[jobIndex]["scheduled_jobs"];
                    //check if job needs execution
                    if (! await needsExecution(current_job)){
                        continue;
                    }
                    //START JOB!
                    executeJob(current_job);
                    
                } catch (exec) {
                    console.trace("Error parsing cron entry from scheduled_job, " + exec);
                }
            }//for every job

        } else {
            //no scheduled jobs in DB
        }
        
  },
  
  executeImmediate: async function(id,socketioClientId,informCallback){
        global.db.config.find({ "scheduled_jobs.id": id }, function (err, data) {
            if (err) {
                console.error("FATAL ERROR; could not update scheduled_job "+field+", contact development!")
                throw err;
            }
            if (data){
                
                var current_job = data[0]["scheduled_jobs"];
                console.log("Executing immediate: " + id);
                executeJob(current_job,socketioClientId,informCallback);
                        
            }else{
                console.error("Could not find job in database for executeimmediate, jobid: " + id)
            }  
        
        })

      // var DB = asyncdatastore.fromInstance(global.db.config);
      // var data = await DB.find({ "scheduled_jobs.id": id });
      // console.log("Found Jobs to execute immedate: ", data["scheduled_jobs"])
 
  }
};

//starts job, can be called from multiple sources. socketioClientId and informCallback is only used for handing the log of the process to an client that executed immediate (for testing the script)

function executeJob(current_job,socketioClientId,informCallback){
    console.log("Executing a scheduled job");
	console.log ("SCIRPT",current_job["script"])
	
    tmp.file({ mode: '0777', prefix: 'userscript-', postfix: '.js',discardDescriptor: true },function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) throw err;
        console.log('Scheduled job user script File: ', path);
        var userScript = current_job["script"];
        //write user script into tmp file
        fs.appendFileSync(path, new Buffer(userScript), function (err) {
            if (err) {
                console.error("FATAL ERROR, could not write userscript to tmp file: " + path)
                if (informCallback){
                    informCallback(0);
                }
                throw err;
                };
        });
        //execute tmp file
        const forked = fork(path, [], { silent: true });
		
        //send parameters and infos to the running node script, retrieve in script like process.on('message', (m) => {
		forked.send({"self":current_job});
		
        console.log("Started Scheduled job "+ current_job['job_name']+" PID: " + forked.pid);
        if (informCallback){
            informCallback(forked.pid);
        }
        updateScheduledJob(current_job["id"],"last_start",new Date().toMysqlFormat());
        updateScheduledJob(current_job["id"],"last_pid",forked.pid);
        //console.log(forked.stdout, forked.stderr); // prints "null null"
        
        forked.stderr.on('data', (data) => { 
            //capture stdout 
            console.log("STDERR Message from fork PID " +  forked.pid + ": "+ data);
            //TODO: if client requested, forward message to client!
            if (socketioClientId){
                global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:"ERROR: "+ data })
            }
        })
        forked.stdout.on('data', (data) => { 
            //capture stdout 
            console.log("STDOUT Message from fork PID " +  forked.pid + ": "+ data);
            //TODO: if client requested, forward message to client!
            if (socketioClientId){
                global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:""+data})
            }
        })
		
        /* we basically only receive a message from child through process.send
         * when this is happening, the child submits a json array and wants to start a job*/
         /* JOB START */
        forked.on('message', (msg) => {
            console.log("MESSAGE FROM FORK: " + msg);
            if (current_job["workflow"] == ""){
                console.warn("No Workflow selected!", "number of non started jobs:", msg.length);
                updateScheduledJob(current_job["id"],"last_message","No Workflow selected!");
                return;
            }
            //if we have an array of values, execute the ffastrans job
            try{
                if (msg){
                    var fileArray = msg;
                    var _workflow = JSON.parse(current_job["workflow"]);
					
					try{
						if (current_job["variables"]){
							var _variables = JSON.parse(current_job["variables"]);
							_workflow["variables"] = _variables;
						}
					}catch(exce){
						console.error("Error adding Variables to job, ",exce);
					}
					
					if (!_workflow){
                        console.log("No target workflow configured for scheduled_job " +  current_job["job_name"]);
                        global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:"No target workflow configured for scheduled_job " +  current_job["job_name"] })
                        return;
                    }
                    for (i in fileArray){
                        _workflow['inputfile'] = fileArray[i];
                        ffastransapi.startJob(JSON.stringify(_workflow),function(data){
                            console.log("Return message from ffastrans job: " + data);
                            try{
                                updateScheduledJob(current_job["id"],"last_job_id",JSON.parse(data)["job_id"]);
                                global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:"FFAStrans Job was started, Message: "+ data })
                            }catch(ex){
                                console.log("Error starting ffastrans job, ",ex);
                                global.socketio.to(socketioClientId).emit("logmessage","Error starting ffastrans job, see logs")
                                reportError(current_job,"Error starting workflow. Message:  " + ex + " Workflow: " +_workflow)
                                
                            }
                        },function(err){
                            console.log("Error occured starting ffastrans job: " + err)
                            global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:"Error starting FFAStrans Job, Message: "+ err })
                        });
                        
                    }
                }
            }catch(ex){
                console.error("Error starting workflow: "+ ex);
                console.error("Input was: ",msg);
                console.error("Stacktrace: " + ex.stack);
                console.error("Current Job: ", current_job)
            }
            
        });
        forked.on('error', function(e){
            //forked.send(e);
            console.log("uncaught Exception from fork: " + e)
            global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:e})
        })

        forked.on('exit', (exitcode,signaltype) => {
            (function() {
                var pid = forked.pid;
                updateScheduledJob(current_job["id"],"last_end",new Date().toMysqlFormat());
                updateScheduledJob(current_job["id"],"last_pid",0);
                if (socketioClientId){
                    global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:"Process Ended"})
                }

            })()
            //delete userscript file
            fs.unlink(path, (err) => {
                if (err) {
                    console.log("failed to delete temp script file: " + err);
                } else {     
                    
                }
            });
            
        });
        
        
    });
    
}

function killRunningJob(current_job){
        console.log("Kill cmd: " + current_job['last_pid'])
        if (current_job['last_pid'] != 0 && isRunning(current_job['last_pid'])){
            console.log("Killing Job " + current_job["job_name"] + " with PID " + current_job['last_pid']);
            try{
                process.kill(current_job['last_pid']);
            }catch(ex){
                console.error("Could not kill PID: " , current_job['last_pid'],"Message:",ex)
            }
        }
    
}

function reportError(current_job,msg){
    if ((! current_job["error_list"] )|| current_job["error_list"] == ""){
        current_job["error_list"] = [];
    }
    if (current_job["error_list"].length > 200){
        current_job["error_list"] = [];
    }
    current_job["error_list"].unshift(moment(new Date()).format("YYYY-MM-DD HH:mm:ss") + " " + msg);
    updateScheduledJob(current_job["id"],"error_list",current_job["error_list"]);
    
}

async function needsExecution(current_job){  
   
     //console.log("checking if job needs execution, last PID ",current_job['last_pid'])    
    //check if job is still running
    if (current_job['enabled'] != 1 || current_job["cron"] == ""){
        if (current_job["next_start"] != ""){
               updateScheduledJob(current_job["id"],"next_start","");
               
        }
        updateScheduledJob(current_job["id"],"last_message","Job is disabled or has no crons");
        return false;
    }
    
    
    //job is not running. Check if we need to start it
    var dateOfInterest = current_job["last_start"] || current_job["date_created"] ;
    var options = {
      currentDate: dateOfInterest,
      //endDate: new Date('Wed, 26 Dec 2012 14:40:00 UTC'),
      iterator: false
    };
    crons = current_job["cron"].split(",");
    
    var returnvalue = false; 
    
    for (cron in crons){ //check all configured intervals of current job
        //why do we parse all cron jobs here?
        cron = crons[cron];
        var interval = parser.parseExpression(cron,options);
        var nextExecutionDate = interval.next();
        var _nextdate = new Date(nextExecutionDate);
        var _datenow = new Date();
        if (_nextdate < _datenow){
            console.log("Scheduled job is pending:" , {"_nextdate":_nextdate,"_datenow":_datenow, "nextExecutionDate(fromCron)":new Date(nextExecutionDate),"cron":cron})
            updateScheduledJob(current_job["id"],"last_message","Job is pending execution, nextstart: ",_nextdate);
            returnvalue = true;
        }else{
            returnvalue = false;
        }
        //update "next run" time
        if (current_job["next_start"] != moment(_nextdate).format("YYYY-MM-DD HH:mm:ss")){
            console.log("Updating next start of ",current_job["job_name"], "to",moment(_nextdate).format("YYYY-MM-DD HH:mm:ss"));
            updateScheduledJob(current_job["id"],"next_start",moment(_nextdate).format("YYYY-MM-DD HH:mm:ss"));
        }else{
           
        }
    }
    
    //job is pending but should we really execute it?
    if (returnvalue){

        // if (current_job['last_pid']){ //LAST PID IS A REALLY BAD CHECK; ANOTHER PROCESS MIGHT HAVE THE PID
            // if (current_job['last_pid'] != 0 && isRunning(current_job['last_pid'])){
                // console.log("Scheduled Job is pending " + current_job["job_name"] + " but PID is still running, preventing execution");
                // //todo: check for timeout and reset pid if neccessary 
                // updateScheduledJob(current_job["id"],"last_message","Job is pending but PID is still running " + current_job['last_pid']);
                // return false;
            // }
        // }
        
        if ("last_job_id" in current_job){
            
            if (current_job["last_job_id"] != ""){  
                updateScheduledJob(current_job["id"],"last_message","Detected last Jobid exists, checking if Jobid is active");
                console.log("checking if job is still runing");
                var url = 'http://' + global.config["STATIC_API_HOST"] + ":" + global.config["STATIC_API_NEW_PORT"] + "/tickets?nodetails=true" ;
                
                console.log("calling,",url)
                try{
                    var resp = await axios.get(url);
                    if ("data" in resp){
                        if (JSON.stringify(resp["data"]).indexOf(current_job["last_job_id"]) != -1){
                            updateScheduledJob(current_job["id"],"last_message","Last job is still active");
                            console.log("last_job_id is still active")
                            return false;
                        }else{
                            console.trace(resp["data"],"does contain",current_job["last_job_id"])
                        }
                        
                    }
                }catch(ex){
                    console.error("Could not get information about currently running job, resetting las_job_id",ex);
                    updateScheduledJob(current_job["id"],"last_message","Reset last job id due to error getting job details: " + current_job["last_job_id"] + ex);
                    updateScheduledJob(current_job["id"],"last_job_id","");
                    return true;
                }
            }
        }
    }

    return returnvalue;
}

function updateScheduledJob(id,field,value){
    
   /* global.db.config.find({ "scheduled_jobs.id": id }, function (err, data) {
            console.log(data);
    })
    return;*/
    var setObject = {};
    setObject[ "scheduled_jobs."+ field] = value;
    global.db.config.update({ "scheduled_jobs.id": id },{$set: setObject},{upsert:false,multi:false} ,function (err, count) {
        if (err) {
            console.error("FATAL ERROR; could not update scheduled_job "+field+", contact development!")
            throw err;
        }
        console.log("updated scheduled job ",id, field, value)
        global.db.config.persistence.compactDatafile(); //deletes unused stuff from DB file
        
    })
    
}



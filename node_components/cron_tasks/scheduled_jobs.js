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
const logfactory = require("../../node_components/common/logger")

var logger = logfactory.getLogger("scheduler");
logger.log = logger.info;



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
                    logger.error("Error parsing cron entry from scheduled_job, " + exec);
                }
            }//for every job

        } else {
            //no scheduled jobs in DB
        }
        
  },
  
  executeImmediate: async function(id,socketioClientId,informCallback){
        var DB = asyncdatastore.fromInstance(global.db.config);
        
        var data = await DB.find({ "scheduled_jobs.id": id });
        if (data){
            var current_job = data[0]["scheduled_jobs"];
            logger.log("Executing immediate: " + id);
            return executeJob(current_job,socketioClientId,informCallback);
                    
        }else{
            logger.error("Could not find job in database for executeimmediate, jobid: " + id)
        }  

      // var DB = asyncdatastore.fromInstance(global.db.config);
      // var data = await DB.find({ "scheduled_jobs.id": id });
      // logger.log("Found Jobs to execute immedate: ", data["scheduled_jobs"])
 
  }
};

//starts job, can be called from multiple sources. socketioClientId and informCallback is only used for handing the log of the process to an client that executed immediate (for testing the script)
function formatFilename(str){
    if (!str)
        return "";
    
    return str.replaceAll(/[^a-zA-Z0-9]/g, '');
}

function executeJob(current_job,socketioClientId,informCallback){

    var runId = Math.random();
    var joblogger = logfactory.getLogger(formatFilename(new Date().toISOString()),current_job['job_name']);
    joblogger.info("Job Start: [" + current_job['job_name'] + "]");
    global.socketio.to(socketioClientId).emit("logmessage","Job Start: [" + current_job['job_name'] + "]");
	//logger.log ("SCIRPT",current_job["script"])
	
    tmp.file({ mode: '0777', prefix: 'userscript-', postfix: '.js',discardDescriptor: true },function _tempFileCreated(err, path, fd, cleanupCallback) {
        if (err) throw err;
        logger.log('Scheduled job user script File: ', path);
        var userScript = current_job["script"];
        //write user script into tmp file
        fs.appendFileSync(path, Buffer.from(userScript), function (err) {
            if (err) {
                logger.error("FATAL ERROR, could not write userscript to tmp file: " + path)
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
		
        logger.log("Started Scheduled job "+ current_job['job_name']+" PID: " + forked.pid);
        if (informCallback){
            informCallback(forked.pid);
        }
        updateScheduledJob(current_job["id"],"last_start",new Date().toMysqlFormat());
        updateScheduledJob(current_job["id"],"last_pid",forked.pid);
        //logger.log(forked.stdout, forked.stderr); // prints "null null"
        
        forked.stderr.on('data', (data) => { 
            //capture stdout 
            logger.log("STDERR Message from fork PID " +  forked.pid + ": "+ data);
            //TODO: if client requested, forward message to client!
            if (socketioClientId){
                global.socketio.to(socketioClientId).emit("logmessage",{pid: runId,msg:"ERROR: "+ data });
            }
        })
        forked.stdout.on('data', (data) => { 
            //capture stdout 
            logger.log("STDOUT Message from fork PID " +  forked.pid + ": "+ data);
            //TODO: if client requested, forward message to client!
            if (socketioClientId){
                global.socketio.to(socketioClientId).emit("logmessage",{pid: runId,msg:data.toString()});
            }
        })
		
        /* we basically only receive a message from child through process.send
         * when this is happening, the child submits a json array and wants to start a job*/
         /* JOB START */
        forked.on('message', (msg) => {
            logger.log("MESSAGE FROM FORK: " + msg);
            if (current_job["workflow"] == ""){
                logger.warn("No Workflow selected!", "number of non started jobs:", msg.length);
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
						logger.error("Error adding Variables to job, ",exce);
					}
					
					if (!_workflow){
                        logger.log("No target workflow configured for scheduled_job " +  current_job["job_name"]);
                        global.socketio.to(socketioClientId).emit("logmessage",{pid: runId,msg:"No target workflow configured for scheduled_job " +  current_job["job_name"] })
                        return;
                    }
                    for (i in fileArray){
                        _workflow['inputfile'] = fileArray[i];
                        global.socketio.to(socketioClientId).emit("logmessage",{pid: runId,msg:"Attempting to start FFAStrans workflow..." })
                        ffastransapi.startJob(JSON.stringify(_workflow),function(data){
                            logger.log("Return message from ffastrans job: " + data);
                            try{
                                updateScheduledJob(current_job["id"],"last_job_id",JSON.parse(data)["job_id"]);
                                global.socketio.to(socketioClientId).emit("logmessage",{pid: runId,msg:"FFAStrans Job was started, Message: "+ data })
                            }catch(ex){
                                logger.log("Error starting ffastrans job, ",ex);
                                global.socketio.to(socketioClientId).emit("logmessage","Error starting ffastrans job, see logs")
                                reportError(current_job,"Error starting workflow. Message:  " + ex + " Workflow: " +_workflow)
                                
                            }
                        },function(err){
                            logger.log("Error occured starting ffastrans job: " + err)
                            global.socketio.to(socketioClientId).emit("logmessage",{pid: runId,msg:"Error starting FFAStrans Job, Message: "+ err })
                        });
                        
                    }
                }
            }catch(ex){
                logger.error("Error starting workflow: "+ ex);
                logger.error("Input was: ",msg);
                logger.error("Stacktrace: " + ex.stack);
                logger.error("Current Job: ", current_job)
            }
            
        });
        forked.on('error', function(e){
            //forked.send(e);
            logger.log("uncaught Exception from fork: " + e)
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
                    logger.log("failed to delete temp script file: " + err);
                } else {     
                    
                }
            });
            
        });
        
        
    });
    return runId;    
}

function killRunningJob(current_job){
        logger.log("Kill cmd: " + current_job['last_pid'])
        if (current_job['last_pid'] != 0 && isRunning(current_job['last_pid'])){
            logger.log("Killing Job " + current_job["job_name"] + " with PID " + current_job['last_pid']);
            try{
                process.kill(current_job['last_pid']);
            }catch(ex){
                logger.error("Could not kill PID: " , current_job['last_pid'],"Message:",ex)
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
   
    //todo: should we check if job is still running? (which is not that easy ^^)
    if (current_job['enabled'] != 1 || current_job["cron"] == ""){
        if (current_job["next_start"] != "")
            updateScheduledJob(current_job["id"],"next_start","");

        // var msg = "Job is disabled or has no crons";
        // if (current_job.last_message != msg)
        //     updateScheduledJob(current_job["id"],"last_message",msg);
        
        return false;
    }
    
    
    //job is not running. Check if we need to start it
   
    var last_start_date = current_job["last_start"] || current_job["date_created"] ;
    crons = current_job["cron"].split(",");
    var returnvalue = false; 
    
    //collect youngest next start time of all registered crons
    var youngest_next = new Date("9999"); //hight start date, year 9999
    for (var _idx in crons){ 
        var _cur_cron = crons[_idx];
        var _interval = parser.parseExpression(_cur_cron,{//parseExpression func needs last_start_date to calcualte next interval
            currentDate: last_start_date,
            iterator: false
          });
        var current_next = new Date(_interval.next());
        if (current_next < youngest_next){
            youngest_next = current_next;
        }
    }

    var formatted_youngest = moment(youngest_next).format("YYYY-MM-DD HH:mm:ss");
    //update database entry if needed
    if (current_job["next_start"] != formatted_youngest){
        updateScheduledJob(current_job["id"],"next_start",formatted_youngest);
        //updateScheduledJob(current_job["id"],"last_message","Job is pending execution, nextstart: " + formatted_youngest);
    }

    //start job if needed
    if (youngest_next < new Date()){
        //job should be started now.
        //updateScheduledJob(current_job["id"],"last_message","Job is pending execution, nextstart: " + formatted_youngest);
        
        returnvalue = true;
    }




    // for (cron in crons){ 
    //     cron = crons[cron];
    //     var interval = parser.parseExpression(cron,options);
    //     var nextExecutionDate = interval.next();
    //     var _nextdate = new Date(nextExecutionDate);
    //     var _datenow = new Date();
    //     if (_nextdate && _nextdate < _datenow){
    //         logger.log("Scheduled job is pending:" , {"interval.next()":_nextdate,"_datenow":_datenow, "nextExecutionDate(fromCron)":new Date(nextExecutionDate),"cron":cron})
    //         updateScheduledJob(current_job["id"],"last_message","Job is pending execution, nextstart: " + _nextdate);
    //         returnvalue = true; //if any of the crons matches, we return true
    //     }
    //     //update "next run" time
    //     if (current_job["next_start"] != moment(_nextdate).format("YYYY-MM-DD HH:mm:ss")){
    //         logger.log(current_job["job_name"],"stored next start does not match calculated next start: ",current_job["next_start"]," != ",moment(_nextdate).format("YYYY-MM-DD HH:mm:ss") )
    //         logger.log("Updating next start of ",current_job["job_name"], "to",moment(_nextdate).format("YYYY-MM-DD HH:mm:ss"));
    //         updateScheduledJob(current_job["id"],"next_start",moment(_nextdate).format("YYYY-MM-DD HH:mm:ss"));
    //     }
    // }
    
    //job is pending but should we really execute it?
    if (returnvalue){

        if ("last_job_id" in current_job){
            if (current_job["last_job_id"] != ""){
                updateScheduledJob(current_job["id"],"last_message","Detected last Jobid exists, checking if Jobid is active");
                logger.log("checking if job is still runing");
                var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
                var url = protocol + global.config["STATIC_API_HOST"] + ":" + global.config["STATIC_API_NEW_PORT"] + "/tickets?nodetails=true" ;
                logger.log("calling,",url)
                try{
                    var resp = await axios.get(url);
                    if ("data" in resp){
                        if (JSON.stringify(resp["data"]).indexOf(current_job["last_job_id"]) != -1){
                            updateScheduledJob(current_job["id"],"last_message","Last job is still active");
                            logger.log("last_job_id is still active")
                            return false;
                        }else{
                            logger.error(resp["data"],"does contain",current_job["last_job_id"])
                        }
                        
                    }
                }catch(ex){
                    logger.error("Could not get information about currently running job, resetting las_job_id",ex);
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
            logger.log(data);
    })
    return;*/
    var setObject = {};
    setObject[ "scheduled_jobs."+ field] = value;
    global.db.config.update({ "scheduled_jobs.id": id },{$set: setObject},{upsert:false,multi:false} ,function (err, count) {
        if (err) {
            logger.error("FATAL ERROR; could not update scheduled_job "+field+", contact development!")
            throw err;
        }
        logger.log("updated scheduled job ",id, field, value)
        global.db.config.compactDatafile(); //deletes unused stuff from DB file
        
    })
    
}



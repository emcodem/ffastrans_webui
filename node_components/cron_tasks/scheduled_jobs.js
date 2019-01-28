const assert = require('assert');
const Request = require("request");
const parser = require('cron-parser');
var tmp = require('tmp');
const { fork } = require('child_process');
const fs = require('fs');
const isRunning = require('is-running')
tmp.setGracefulCleanup();
const ffastransapi = require("../ffastransapi");

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
    execute: function () {
        //get all scheduled jobs from DB
        global.db.config.find({ "scheduled_jobs": { $exists: true } }, function (err, data) {//get all groups from user
            if (err) {
                throw err;
            }
            if (data.length>0) {
                for (jobIndex in data){
                    try {
                        var current_job = data[jobIndex]["scheduled_jobs"];
                        //check if job needs execution
                        if (!needsExecution(current_job)){
                            continue;
                        }
                        //START JOB!
                        executeJob(current_job);
                        
                    } catch (exec) {
                        console.log("Error parsing cron entry from scheduled_job, " + exec);
                    }
                }//for every job

            } else {
                //no scheduled jobs in DB, create a default job!
                console.log("No Scheduled jobs stored in DB");
            }
        });
  },
  
  executeImmediate:function(id,socketioClientId,informCallback){
      global.db.config.findOne({ "scheduled_jobs.id": id },function (err, data) {
        if (err) {
            console.error("FATAL ERROR; could not update scheduled_job "+field+", contact development!")
            throw err;
        }
        if (data){
            console.log("Executing immediate: " + id);
            executeJob(data["scheduled_jobs"],socketioClientId,informCallback);
        }else{
            console.error("Could not find job in database for executeimmediate, jobid: " + id)
        }
        
    })
      
      
  }
};

//starts job, can be called from multiple sources. socketioClientId and informCallback is only used for handing the log of the process to an client that executed immediate (for testing the script)

function executeJob(current_job,socketioClientId,informCallback){
    tmp.file({ mode: 0644, prefix: 'userscript-', postfix: '.js' },function _tempFileCreated(err, path, fd, cleanupCallback) {
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
        const forked = fork(path,[],{ silent: true });
        console.log("Started Scheduled job "+ current_job['job_name']+" PID: " + forked.pid);
        if (informCallback){
            informCallback(forked.pid);
        }
        updateScheduledJob(current_job["id"],"last_start",new Date().toMysqlFormat());
        updateScheduledJob(current_job["id"],"last_pid",forked.pid);
        forked.stdout.on('data', (data) => { 
            //capture stdout 
            console.log("STDOUT Message from fork PID " +  forked.pid + ": "+ data);
            //TODO: if client requested, forward message to client!
            if (socketioClientId){
                console.log("Emitting logmessage")
                global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:""+data})
            }
        })

        forked.on('message', (msg) => {
            console.log("MESSAGE FROM FORK: " + msg);
            //if we have an array of values, execute the ffastrans job
            try{
                if (msg){
                    var fileArray = msg;
                    var _workflow = JSON.parse(current_job["workflow"]);
                    if (!_workflow){
                        console.log("Now target workflow configured for scheduled_job " +  current_job["job_name"]);
                        return;
                    }
                    for (i in fileArray){
                        _workflow['inputfile'] = fileArray[i];
                        ffastransapi.startJob(JSON.stringify(_workflow),function(){},function(){});
                    }
                }
            }catch(ex){
                console.error("Error starting workflow: "+ ex);
                console.error(msg);
            }
            
        });
        forked.on('exit', (exitcode,signaltype) => {
            (function() {
                var pid = forked.pid;
                updateScheduledJob(current_job["id"],"last_end",new Date().toMysqlFormat());
                updateScheduledJob(current_job["id"],"last_pid",0);
                if (socketioClientId){
                    global.socketio.to(socketioClientId).emit("logmessage",{pid: forked.pid,msg:"Process Ended"})
                }
                //delete userscript file
                fs.unlink(path, (err) => {
                    if (err) {
                        console.log("failed to delete temp script file: " + err);
                    } else {                            
                    }
                });
            })()
        });
        
        
    });
}

function needsExecution(current_job){    
         
    //check if job is still running
    if (current_job['enabled'] != 1){
        
        return false;
    }
    if (current_job['last_pid']){
        if (current_job['last_pid'] != 0 && isRunning(current_job['last_pid'])){
            console.log("Scheduled Job " + current_job["job_name"] + " is still running");
            //todo: check for timeout and reset pid if neccessary 
            return false;
        }
    }
    //job is not running. Check if we need to start it
    var dateOfInterest = current_job["last_start"]||current_job["date_created"];
    var options = {
      currentDate: dateOfInterest,
      //endDate: new Date('Wed, 26 Dec 2012 14:40:00 UTC'),
      iterator: false
    };
    
    crons = current_job["cron"].split(",");
    for (cron in crons){
        cron = crons[cron]
        var interval = parser.parseExpression(cron,options);
        var nextExecutionDate = interval.next();
        if ((new Date(nextExecutionDate) < new Date())){
            console.log("Created or last run: "  + dateOfInterest);
            console.log("DATE INTERVAL: "  + nextExecutionDate);
            console.log("CURRENT DATE: "  + new Date());
            return true;
        }else{
            return false;
        }
    }
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
        global.db.config.persistence.compactDatafile(); //deletes unused stuff from DB file
        
    })
    
}



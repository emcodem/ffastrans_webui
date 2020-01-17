const assert = require('assert');
const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
//todo: implement queued jobs
var m_jobStates = ["Error","Success","Cancelled","Unknown"];

module.exports = {
  fetchjobs: function () {
    //fetch running jobs from api
    if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
        return;
    }
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: 4000},(error, response, body) => {
            if(error) {
                global.socketio.emit("error", 'Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error('Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error(error);
                return;
            }
                
            var jobArray;		
            try{
                jobArray = JSON.parse(body).jobs;
            }catch(exc){
                console.error("Error occured while parsing active jobs to json: " + exc + body)
            }
            
            for (i=0;i<jobArray.length;i++){
                jobArray[i]["guid"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
                var idx = jobArray[i]["guid"].split("~");
                //data for client display
                jobArray[i]["key"] = jobArray[i]["guid"];//for fancytree internal purpose
                jobArray[i].guid = jobArray[i]["guid"]
                jobArray[i]._id = jobArray[i].guid;
                jobArray[i].state = "Active";
                jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
                jobArray[i].file = jobArray[i]["source"]
                jobArray[i].outcome = jobArray[i]["status"]
                jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
                jobArray[i].wf_name = jobArray[i]["workflow"];
                
            }//for all jobs
                       
           //todo: store last active jobs array in DB for immediate client initialisation?
           
        //send the new jobs to connected clients, todo: only notify clients about new stuff
		try{
			global.socketio.emit("activejobs", JSON.stringify(jobArray));
			global.socketio.emit("activejobcount", jobArray.length);
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc + body)
		}
    });
    
    //fetch queued jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL), {timeout: 7000},(error, response, body) => {        
        
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            return;
        }
        if(error) {
            global.socketio.emit("error", 'Error getting Queued Jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
            return;
        }
        
        
        //send the new jobs to connected clients, todo: only notify clients about new stuff
		try{
            if (JSON.parse(body)["tickets"]["queue"]){
                global.socketio.emit("queuedjobs", JSON.stringify(JSON.parse(body)["tickets"]["queue"]));
                global.socketio.emit("queuedjobcount", JSON.parse(body)["tickets"]["queue"].length);                
            }else{
                global.socketio.emit("queuedjobs", "[]");
                global.socketio.emit("queuedjobcount", 0);               
            }
		}catch(exc){
			console.error("Error occured while sending queuedjobs to clients: " + exc + body)
		}
		return;
        //store in database

    });
    
    //fetch history jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL), {timeout: 7000},(error, response, body) => {
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            return;
        }
        if(error) {
            global.socketio.emit("error", 'Error retrieving queued jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + error   );
            return;
        }

        if (global.lasthistory == body){
            return;
        }
        global.lasthistory = body;
        
        var jobArray;		
		try{
			jobArray = JSON.parse(body).history;
		}catch(exc){
			console.error("Error occured while parsing history jobs to json: " + exc + body)
		}
		//store history jobs in database
        var newjobsfound = 0;
//TRY GET CHILDS FOR TREEGRID        
        
        //restructure array from ffastrans,build famliy tree
        
        for (i = 0; i < jobArray.length; i++){

                //only jobguid plus split makes each job entry unique
                jobArray[i]["guid"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
            
                //data for client display
                jobArray[i]["key"] = jobArray[i]["guid"];//for fancytree internal purpose
                jobArray[i].guid = jobArray[i]["guid"]
                jobArray[i]._id = jobArray[i].guid;
                jobArray[i].state = m_jobStates[jobArray[i]["state"]];
                jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
                jobArray[i].file = jobArray[i]["source"]
                jobArray[i].outcome = jobArray[i]["result"]
                jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
                jobArray[i].job_end = getDate(jobArray[i]["end_time"]);
                jobArray[i].duration = (getDurationStringFromDates(jobArray[i].job_start, jobArray[i].job_end )+"");
                jobArray[i].wf_name = jobArray[i]["workflow"];
                //internal data for sorting
                //jobArray[i]["id"] = 1;
                jobArray[i]["sort_family_name"] = jobArray[i]["job_id"];
                //jobArray[i]["sort_child_id"] = jobArray[i]["split_id"];                
                if (jobArray[i]["sort_family_index"] === "undefined"){
                    jobArray[i]["sort_family_index"] = 1;//first anchestor in family
                }
                //jobArray[i]["sort_parent_id"] = 0; //finds out parent id, e.g. split id 132 is second child of parent_id 3.
                jobArray[i]["sort_generation"] = 1;
                //workaround splitid does not allow us to parse family tree
            if (jobArray[i]["split_id"].startsWith("1-")) { //this is the grandfather
                    jobArray[i]["sort_generation"] = 0;
                } 
        }
        
//END OF Family sorting
        jobArray = getFancyTreeArray(jobArray);

        for (i=0;i<jobArray.length;i++){

            //Unique ID is now jobid~splitid + time_end!!!
            
            (function(job_to_insert){   //this syntax is used to pass current job to asnyc function so we can emit it
                //upsert history record (if family_member_count changed)
                global.db.jobs.update({"_id":jobArray[i]["guid"],"sort_family_member_count": { $lt: jobArray[i]["sort_family_member_count"]}},jobArray[i],{upsert:true},function(err, docs){
                if(docs > 0 ){
                        console.log("inserted " + job_to_insert["source"])
                        console.log("emitting newhistjob");
                        global.socketio.emit("newhistoryjob", job_to_insert);//inform clients about the current num of history job

                }else{
                //        console.log("Job already exists");
                }
                    
                })//job update
            })(jobArray[i]);//pass current job as job_to_insert param to store it in scope of update function
            continue;            
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

function getDate(str){
    //ffastrans date:2019-10-14T21:22:35.046-01.00
    var re = new RegExp("-.....");
    
    var parsed = moment.parseZone(str.replace(/.00$/,":00"))
    return parsed.format("YYYY-MM-DD HH:mm:ss");
    //var newdatestr = (str.replace("T"," ").replace("-01.00",""))
    //try {
    //    var dt = date.parse(str.replace("T", " ").replace("-01.00", ""), "YYYY-MM-DD HH:mm:ss.SSS")
    //    return date.parse(str.replace("T", " ").replace("-01.00", ""), "YYYY-MM-DD HH:mm:ss.SSS")
    //}catch(e){
    //    console.error("Could not parse date string: " + str + " replaced: "+ newdatestr);
    //    return str;
    //}
    
}

function getDurationStringFromDates(start_date,end_date){
        //sconsole.log(start_date,end_date)
        var delta = Math.abs(new Date(end_date) - new Date(start_date)) / 1000;// get total seconds between the times
        var days = Math.floor(delta / 86400);// calculate (and subtract) whole days
        delta -= days * 86400;// calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;// calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;// what's left is seconds
        var seconds = delta % 60;  // in theory the modulus is not required
        //if (!hours) {
        //    console.log("----------------------  hours is null");
        //    console.log(Math.floor(delta / 3600) % 24)
        //}

        return pad(hours) + ":" + pad (minutes) + ":" + pad ((seconds+"").replace(/\.\d+/,"")); //TODO: seconds now contain ms... split this off
}

function pad(num) {
    var s = num+"";
    while (s.length < 2) s = "0" + s;
    return s;
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

function getFancyTreeArray(jobArray){
    
        //find out all parents
        var godfathers = jobArray.filter(function (el) {
                //return el["sort_generation"] === 0; 
            return el["sort_generation"] === 0;
        });
        console.log("Num godfathers ", godfathers.length) 
        //find out all subjobs of same id
        for (var i in godfathers){
            
            var godfather = godfathers[i]; 
            var family_name = godfather["sort_family_name"]; //family_name is actually jobguid
            var family = jobArray.filter(function (el) {
                return el["sort_family_name"] === family_name;
             });
             godfather["sort_family_member_count"] = family.length;
              //array of families now contains all family members but flat only
             
             //build family tree             
             var generation_count = 1;
             if (family.length > 1){
                //it is family with childs, get out how many generations we have
                generation_count = Math.max.apply(Math, family.map(function(o) { return o["sort_generation"]; }))  
             }
             
            //foreach generation
            var generations = []
           
            for (genidx=0;genidx<generation_count;genidx++){
                //foreach parent in this generation
                _parents = family.filter(function (el) {return el["sort_generation"] == genidx})
                //console.log(_parents)
                //find children of current parent in current generation
                for (paridx=0;paridx<_parents.length;paridx++){
                    _parents[paridx]["children"] = family.filter(function (el) {
                        if (el["state"] == "Error"){
                            godfather["state"] = "Error";
                            godfather["outcome"] += ", Branch [" + el["split_id"]+"]: " + el["outcome"];
                        }
                         return (el["sort_generation"] == genidx+1 && el["sort_family_index"] == _parents[paridx]["sort_child_id"]) ;
                    });
                }                
            }
            //godfather now contains full family tree
                
            }
        
        return godfathers;

    
}
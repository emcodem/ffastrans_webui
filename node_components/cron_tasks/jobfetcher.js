const assert = require('assert');
const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
const path = require("path")
// const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere
//todo: implement queued jobs
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

module.exports = {
    fetchjobs: function () {

    //inform clients about current job count
    var countObj = { errorjobcount: 0, successjobcount: 0, cancelledjobcount: 0 };
    //inform the client about current count in DB
    global.db.jobs.count({ "state": "Success", "deleted": { $exists: false } }, function (err, success_count) {
        //console.log("successcount", success_count)
        countObj.successjobcount = success_count;
        global.db.jobs.count({ "state": "Error", "deleted": { $exists: false } }, function (err, error_count) {
            countObj.errorjobcount = error_count;
            global.db.jobs.count({ "state": "Cancelled", "deleted": { $exists: false } }, function (err, cancelled_count) {
                countObj.cancelledjobcount = cancelled_count;
                //push data to client
                global.socketio.emit("historyjobcount", countObj);
            })
        })
    })//end of counting

    //fetch running jobs from api
    if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
        return;
    }
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: 5000,agent: false,maxSockets: Infinity}, function (error, response, body)  {
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
                try{
                    jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
                }catch(exc){
                    console.log("Could not parse start time from API response jobarray entry:",jobArray[i],exc);
                }
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
    Request.get("http://localhost:3003/tickets", {timeout: 5000},(error, response, body) => {   
        
        //TODO: merge Active and queued call
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            console.error("Fatal, lobal.config.STATIC_USE_PROXY_URL is true but should be false! ")
            return;
        }
        if(error) {
            console.log('Internal Error getting Queued Jobs,  ' + "http://localhost:3003/tickets", error)
            global.socketio.emit("error", 'Internal Error getting Queued Jobs,  ' + "http://localhost:3003/tickets");
            return;
        }
		try{
		//QUEUED JOBS (in ffastrans queued folder)
			
			var q_obj = JSON.parse(body)["tickets"]["queued"];
			if (q_obj !== undefined) {
				for (i=0; i<q_obj.length;i++){
							q_obj[i]["key"] = JSON.stringify(q_obj[i]).hashCode();
							q_obj[i]["split_id"] = ""
							q_obj[i]["state"] = "Queued";
							q_obj[i]["title"] = "Queued";
							q_obj[i]["steps"] = "";
							q_obj[i]["progress"] = "0";
							q_obj[i]["workflow"] = q_obj[i]["workflow"]; //todo: implement workflow in ffastrans tickets api for pending jobs
							if ("sources" in q_obj[i]){
								q_obj[i]["file"] = path.basename(q_obj[i]["sources"]["current_file"]);
							}
							q_obj[i]["host"] = "Queued";
							q_obj[i]["status"] = "Queued";
                            try{
							q_obj[i]["job_start"] = getDate(q_obj[i]["submit"]["time"]);
                            }catch(ex){
                                console.log("getdate failed on:" ,q_obj[i])
                            }
							q_obj[i]["proc"] = "Queued";
				}
			}
			
			//send the new jobs to connected clients, todo: only notify clients about new stuff
				if (JSON.parse(body)["tickets"]["queued"]){
                    
					global.socketio.emit("queuedjobs", JSON.stringify(q_obj));
					global.socketio.emit("queuedjobcount", JSON.parse(body)["tickets"]["queued"].length);                
				}else{
                    console.log("Error, we should not come here, queued")
					global.socketio.emit("queuedjobs", "[]");
					global.socketio.emit("queuedjobcount", 0);               
				}
		}catch(exc){
			console.error("Error occured while sending queuedjobs to clients: " + exc )
			console.error(exc.stack)
            console.error(q_obj[i])
		}
		//WATCHFOLDER Incoming
        try{
		//transform to match activejobs structure
			
			var q_obj = JSON.parse(body)["tickets"]["incoming"];
			if (q_obj !== undefined) {
				for (i=0; i<q_obj.length;i++){
							q_obj[i]["key"] = JSON.stringify(q_obj[i]).hashCode();
                            
							q_obj[i]["split_id"] = ""
							q_obj[i]["state"] = "Incoming";
							q_obj[i]["title"] = "Incoming";
							q_obj[i]["steps"] = "";
							q_obj[i]["progress"] = "0";
							q_obj[i]["workflow"] = q_obj[i]["internal_wf_name"]; 
							q_obj[i]["file"] = path.basename(q_obj[i]["sources"]["current_file"]);
							q_obj[i]["status"] = "Incoming";
							q_obj[i]["job_start"] = getDate(q_obj[i]["submit"]["time"]);
							q_obj[i]["proc"] = "Watchfolder";
				}
			}
			
			//send the new jobs to connected clients, todo: only notify clients about new stuff
			
				if (JSON.parse(body)["tickets"]["incoming"]){
                    
					global.socketio.emit("incomingjobs", JSON.stringify(q_obj));
					global.socketio.emit("incomingjobcount", JSON.parse(body)["tickets"]["incoming"].length);                
				}else{
                    console.log("Error, we should not come here, keyword: incoming")
					global.socketio.emit("incomingjobs", "[]");
					global.socketio.emit("incomingjobcount", 0);               
				}
		}catch(exc){
			console.error("Error occured while sending incoming to clients: " + exc )
			console.error(exc.stack)
            console.error(q_obj[i])
		}
		return;
        //store in database

    });
    
//fetch HISTORY jobs from api
    Request.get(buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL), {timeout: 5000},async function(error, response, body) {
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            return;
        }
        if(error) {
            console.log("Error retrieving finished jobs",buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL),error)
            global.socketio.emit("error", 'Error retrieving finished jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + error   );
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
                jobArray[i]["sort_family_name"] = jobArray[i]["job_id"];
                                        
                //workaround splitid does not allow us to parse family tree
                //get out if the lowest splitid of all jobs in array with this jobids
                var a_family = jobArray.filter(function (el) {
                    return el["job_id"] === jobArray[i]["job_id"];
                });

                var oldest_job = jobArray[i];
                
                for (x=0;x<a_family.length;x++){
                    if (getDate(a_family[x]["end_time"]) < getDate(oldest_job["end_time"]) ){
                        oldest_job = a_family[x];
                    }
                }
                //mark oldest job a grandfather job
                if (jobArray[i] == oldest_job){
                    jobArray[i]["sort_family_index"] = 0;//its a grandfather
                    jobArray[i]["sort_generation"] = 0;
                    //Reset other's family status, there can be only one grandfather
                    a_family.forEach(function(_cur){
                        if (_cur["split_id"] != jobArray[i]["split_id"]){
                            _cur["sort_family_index"] = 1;
                            _cur["sort_generation"] = 1;//its a childjob
                        }
                    })
                    
                }else{
                    jobArray[i]["sort_family_index"] = 1;
                    jobArray[i]["sort_generation"] = 1;//its a childjob
                }
        }
        
        jobArray = await getFancyTreeArray(jobArray);
//END OF Family sorting
        
        for (i=0;i<jobArray.length;i++){
            (function(job_to_insert){   //this syntax is used to pass current job to asnyc function so we can emit it
                //NEDB BUG HERE: upsert didnt work conistently, so we switched to update
                global.db.jobs.update({"_id":jobArray[i]["guid"],"sort_family_member_count": { $lt: jobArray[i]["sort_family_member_count"]}},jobArray[i],{upsert:true},function(err, docs){
                    if(docs > 0 ){
                            console.log("New History Job: " + job_to_insert["source"])
                            global.socketio.emit("newhistoryjob", job_to_insert);//inform clients about the current num of history job
                    }else{
                        
                    }
                })//job update
            })(jobArray[i]);//pass current job as job_to_insert param to store it in scope of update function
            continue;            
        }//for

        
    });   
  }
};

/* HELPERS */

async function getFancyTreeArray(jobArray){
    
        //find out all parents
        var godfathers = jobArray.filter(function (el) {
            return el["sort_generation"] === 0;
        });
        console.log("New History data, Number of Jobs ", godfathers.length, "Number of splits", jobArray.length);
        //find out all subjobs of same id
        for (var i in godfathers){
            var godfather = godfathers[i]; 
            var current_family_name = godfather["sort_family_name"]; //family_name is actually jobguid
            var family = jobArray.filter(function (el) {
                return el["sort_family_name"] === current_family_name;
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
            //for (genidx=0;genidx<generation_count;genidx++){
                //foreach parent in this generation
                _parents = family.filter(function (el) {return el["sort_generation"] == 1})
                
                //find children of current parent in current generation
                godfather["children"] = family.filter(function (el) {
                    if (el["state"] == "Error"){
                        godfather["state"] = "Error";
                        godfather["outcome"] += ", Branch [" + el["split_id"]+"]: " + el["outcome"];
                        //todo: change error state also in DB
                    }
                    if (el["state"] != "Error"){
                        //change godfather state to success if any subsequent node succeeded
                        godfather["state"] = "Success";
                        godfather["title"] = "Success";
                    }
                    return (el["sort_generation"] == 1) ;
                });
                //}                
            }
            //godfather now contains full family tree

        return godfathers;

    
}

async function countJobsAsync(countobj) {
    let count = await new Promise((resolve, reject) => {
        global.db.jobs.count(countobj, (err, count) => {
            if (err) reject(err);
            resolve(count);
        });
    });
    return count ;
}

function getDate(str){
    //ffastrans date:2019-10-14T21:22:35.046-01.00
    var re = new RegExp(".....$");
    var tz = str.match(/.(\d\d)$/);
	tz = tz[1];
	if (tz == "50")
		tz = "30"
	var to_parse = str.replace(/...$/,":" + tz);
    var parsed = moment.parseZone(to_parse)
    return parsed.format("YYYY-MM-DD HH:mm:ss");
    
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

function buildNewApiUrl(){
    return "http://" + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT + "/tickets"
}

/* STRUCTS */
Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
	var hash = 0, i, chr;
	for (i = 0; i < this.length; i++) {
	  chr   = this.charCodeAt(i);
	  hash  = ((hash << 5) - hash) + chr;
	  hash |= 0; // Convert to 32bit integer
	}
	return hash;
  }
});
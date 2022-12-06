const assert = require('assert');
const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
const path = require("path");
var smptMail = require("../common/send_smpt_email")
// const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere

var alert_sent = false;
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

var executioncount = 0;
// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

module.exports = {
    fetchjobs: async function () {	
	
	executioncount++
    //inform clients about current job count

	if (executioncount % 5 == 0){//counting is a pretty expensive operation, don't do it too often. Alternative todo: store the count in global variable when doing inserts
		var countObj = { errorjobcount: 0, successjobcount: 0, cancelledjobcount: 0 };
		//inform the client about current count in DB
		console.log("Countjobs start")
		var count_success 			= await global.db.jobs.countDocuments({state:"Success"}		,{_id:1});
		countObj.successjobcount 	= count_success;
		var count_error 			= await global.db.jobs.countDocuments({state:"Error"}		,{_id:1});
		countObj.errorjobcount 		= count_error;
		var total_cancelled 		= await global.db.jobs.countDocuments({state:"Cancelled"}	,{_id:1});
		countObj.cancelledjobcount 	= total_cancelled;
		global.socketio.emit("historyjobcount", countObj);
	}
    //fetch running jobs from api
    if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
        return;
    }
    
    if (!Number.isInteger(parseInt(global.config.STATIC_API_TIMEOUT))){
        var txt = 'ERROR contact admin. Server setting STATIC_API_TIMEOUT is not a number: [' + global.config.STATIC_API_TIMEOUT + ']';
        console.error(txt)
        global.socketio.emit("error", txt);
    }else{
        global.config.STATIC_API_TIMEOUT = parseInt(global.config.STATIC_API_TIMEOUT)
    }
    
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: global.config.STATIC_API_TIMEOUT,agent: false,maxSockets: Infinity}, async function (error, response, body)  {
			if(error) {
				try{
					/* take care about alert email */
					if (!alert_sent){
						sendEmailAlert("ALERT! FFAStrans is down","Got an error fetching jobs from: <br/>" + global.config.STATIC_GET_RUNNING_JOBS_URL );
						alert_sent = true;
					}
				}catch(ex){
					console.error("Could not send email alert message: ", ex.stack)
				}
				global.socketio.emit("error", 'Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error('Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error(error);
                return;
			}
				
			if (alert_sent){
				//send all good email if needed
				alert_sent = false;
				try{
					sendEmailAlert("FFAStrans is up again","The system did successfully respond to " + global.config.STATIC_GET_RUNNING_JOBS_URL );
					
				}catch(ex){
					console.error("Could not send email alert message (good again): ", ex.stack);
				}
			}
			
			/* end of alert email */
			
            var jobArray;		
            try{
                jobArray = JSON.parse(body).jobs;
            }catch(exc){
				var msg = "FFAStrans sent out invalid active jobs data. Please contact developers. ";
				console.error(msg);
				global.socketio.emit("alert", msg );
            }
            
            for (i=0;i<jobArray.length;i++){
                jobArray[i]["guid"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
                var idx = jobArray[i]["guid"].split("~");
                //data for client display
                jobArray[i]["key"] = jobArray[i]["guid"];//for fancytree internal purpose
                //jobArray[i].guid = jobArray[i]["guid"]
                jobArray[i]._id = jobArray[i].guid;
                jobArray[i].state = "Active";
                jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
                //jobArray[i].source = jobArray[i]["source"]
                jobArray[i].outcome = jobArray[i]["status"]
                try{
                    jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
                }catch(exc){
                    console.log("Could not parse start time from API response jobarray entry:",jobArray[i],exc);
                }
                jobArray[i].wf_name = jobArray[i]["workflow"];
                
            }//for all jobs
                       
        //send the new jobs to connected clients, todo: only notify clients about new stuff
		try{
			global.socketio.emit("activejobs", JSON.stringify(jobArray));
			global.socketio.emit("activejobcount", jobArray.length);
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc + body)
		}
    });
    
    //fetch queued jobs from api
    Request.get("http://localhost:3003/tickets", {timeout: global.config.STATIC_API_TIMEOUT},(error, response, body) => {   
        
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
								if ("sources" in q_obj[i]){
									q_obj[i]["source"] = path.basename(q_obj[i]["sources"]["current_file"]);
								}else if ("source" in q_obj[i]){
									q_obj[i]["source"] = path.basename(q_obj[i]["source"]);
								}
								
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
							q_obj[i]["source"] = path.basename(q_obj[i]["sources"]["current_file"]);
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
    Request.get(buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL + "/?start=0&count=100"), {timeout: global.config.STATIC_API_TIMEOUT},async function(error, response, body) {
		try{
			console.log("Finished fetching history jobs from " + buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL));
			if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
				return;
			}
			if(error) {
				console.log("Error retrieving finished jobs",buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL),error)
				global.socketio.emit("error", 'Error retrieving finished jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + error   );
				return;
			}

			if (global.lasthistory == body){
				console.log("History Jobs did not change since last fetch...")			
				return;
			}
			global.lasthistory = body;
			
			var jobArray;
			try{
				jobArray = JSON.parse(body).history;
			}catch(exc){
				//the statement is not 100% correct because the issue could also be caused by the caching ffastrans does.
				var msg = "FFAStrans sent out invalid history data. Please locate Processors\\db\\cache\\monitor\\log.txt, send a Copy to the developers and then delete the file and restart FFAStrans service/application. ";
				console.error(msg);
				global.socketio.emit("alert", msg );
				return;
			}
			//store history jobs in database
			var newjobsfound = 0;
	//TRY GET CHILDS FOR TREEGRID        
			
			//restructure array from ffastrans,build famliy tree
			
			for (i = 0; i < jobArray.length; i++){
					//only jobguid plus split makes each job entry unique
					jobArray[i]["_id"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
					
					//data for client display

					jobArray[i].state = m_jobStates[jobArray[i]["state"]];
					//jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
					//jobArray[i].file = jobArray[i]["source"]
					jobArray[i].outcome = jobArray[i]["result"]
					jobArray[i] = objectWithoutKey("result",jobArray[i])
					//todo: don't store result (we store as outcome)

					jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
					jobArray[i].job_end = getDate(jobArray[i]["end_time"]);
					//todo: remvoe start_time and end_time
					jobArray[i].duration = (getDurationStringFromDates(jobArray[i].job_start, jobArray[i].job_end )+"");
					jobArray[i].wf_name = jobArray[i]["workflow"];
					
			}
			

			//get last 10k jobids from DB - child jobs need to finish within that period to be grouped correctly;-)
			var lastTenThousand 	= await global.db.jobs.find({},{projection:{job_id:1,"children._id":1}}).limit(1000);
			lastTenThousand 		= await lastTenThousand.toArray();
			//make list of all _id's / traverse children and main objects
			var existingInternalIds 		= [];
			for (const _job of lastTenThousand) {
				existingInternalIds.push(_job._id);
				for (const _child of _job.children) {
					existingInternalIds.push(_child._id);
				}
			}
			//make list of job_ids (those can be shared by multiple "jobs" )
			var existingJobIds = lastTenThousand.map((my) => my.job_id);

			for (i=0;i<jobArray.length;i++){
				//todo: check if this job_id exists in children OR mainjobs, need to aggregate children jobids above
				if (existingInternalIds.indexOf(jobArray[i]._id) != -1){
					//job already in db
					continue;
				}

				//this is a new job
				var existingIndex = existingJobIds.indexOf(jobArray[i].job_id);
				var insertedDoc;

				if (existingIndex == -1){
					//insert complete new job, need to modify _id here because it might be turned ito mainjob if other jobs with same job_id join later on
					jobArray[i].children = [];	
					jobArray[i]._id += "_main";
					insertedDoc = await global.db.jobs.insertOne(jobArray[i]);
					existingJobIds.push(jobArray[i].job_id); //supports multiple branches finished in single fetcher run
				}else{
					//the job_id already exists in DB, check if this very job is already there
					
					//job is not there, check if mainjob obj already exists
					var mainjob = await global.db.jobs.findOne({job_id:jobArray[i].job_id});
					//if existingDoc is not a container, transform it into container

					if (mainjob.children.length == 0){
						//transform existing job into mainjob, need to change _id for the copy
						var copyOfFirstJob = JSON.parse(JSON.stringify(mainjob));
						copyOfFirstJob._id = copyOfFirstJob._id.replace("_main","");
						mainjob.children = [copyOfFirstJob];
						mainjob.children.push(jobArray[i]);
						
					}else{
						//just pushes a new child into existing child
						var existingChildIds = mainjob.children.map((child) => child._id);
						if (existingChildIds.indexOf(jobArray[i]._id) != -1){
							mainjob.children.push(jobArray[i]);
						}
					}
					
					//update mainjob infos
					mainjob.result = "Children: " + mainjob.children.length;

					// var youngest_start = mainjob.children.reduce(function(prev, current) {
					// 	return (prev.start_time < current.start_time) ? prev : current
					// }).start_time;

					// //var oldest_end = Math.max(...mainjob.children.map(o => o.end_time));
					// var  oldest_end = mainjob.children.reduce(function(prev, current) {
					// 	return (prev.end_time > current.end_time) ? prev : current
					// }).end_time;

					insertedDoc = await global.db.jobs.updateOne({job_id:jobArray[i].job_id},{$set: mainjob},{upsert:true});
					existingJobIds.push(jobArray[i].job_id); //supports multiple branches finished in single fetcher run
				}

				if(insertedDoc){
					console.log("New History Job: " , jobArray[i]);
					global.socketio.emit("newhistoryjob", jobArray[i]);//inform clients about the current num of history job
				}
					
				continue;            
			}//for
		}
		catch(ex){
			console.log(ex);
		
		}
        
    });   
  }
};

/* HELPERS */

function objectWithoutKey(key,obj){
	var { [key]: val, ...rest } = obj;
	return rest;
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
	
	try{
    var re = new RegExp(".....$");
    var tz = str.match(/.(\d\d)$/);
	if (tz){
		tz = tz[1];
	}else{
		tz = "00";
		str = str.replace("Z","+00:00");//incoming jobs have wrong date format, this attempts to correct it
	}
	if (tz == "50") //translate between momentjs and ffastrans timezone
		tz = "30"
	var to_parse = str.replace(/...$/,":" + tz);
    var parsed = moment.parseZone(to_parse)
    return parsed.format("YYYY-MM-DD HH:mm:ss");
    }catch(ex){
		
		console.error("Error getDate: " +str);
		throw ex;
	}
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

//var about_url = ("http://" + _host + ":" + _hostport + "/api/json/v2/about");
async function renewInstallInfo(about_url){
    //refresh ffastrans install info infinitely
    while (true){
        await sleep(15000);
        var install_info;
        try{
            install_info = await doRequest(about_url);
            install_info = JSON.parse(install_info);
        }catch(ex){
            console.error("Error getting install info, is FFAStrans API online?", about_url)
        }
        
        if (global.api_config["s_SYS_DIR"] != install_info["about"]["general"]["install_dir"] + "/"){
            console.log("Detected move of FFAStrans installation, resetting paths");
            global.api_config["s_SYS_DIR"] = install_info["about"]["general"]["install_dir"] + "/";
            global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
            global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
            global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";
        }
    }
}

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}


async function sendEmailAlert(subject, body){
		try{
			var rcpt = global.config["email_alert_config"]["email_alert_rcpt"];
			
			console.log("Sending alert email to: ",rcpt)
			console.log("Email sending result:",await smptMail.send(rcpt,subject, body));
			
		}catch(ex){
			console.error(ex.stack);
			console.error("Error sending email: ",ex);
		}
}
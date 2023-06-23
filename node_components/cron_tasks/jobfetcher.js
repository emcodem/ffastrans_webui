const assert = require('assert');
const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
const path = require("path");
var smptMail = require("../common/send_smpt_email");
var helpers = require("../common/helpers")
// const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere

var alert_sent = false;
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

var executioncount = 0;
var count_running = false;
// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

module.exports = {

	tickets:async function(){
		//we want jobfetcher to be able to run as alternate-server, thus the getworkflowjobcount method asks ticket not directly from api but from jobfetcher
		//in alternate-server mode you have to rebuild and simulate tickets structure, where each ticket contains at least internal_wf_name datea field
		m_ticket_cache.last_update = new Date();
		var response = await axios.get(build_new_api_url("/tickets"), { timeout: 7000, agent: false, maxSockets: Infinity });
		return response.data.tickets;
	},

	importLegacyDatabase: async function(old_path){
            var all_lines = await fsPromises.readFile( old_path, "utf8" );
            all_lines.forEach(line =>{
				var jobArray = [];
				jobArray.push(JSON.parse(line));
				var i = 0;


				jobArray[i]["_id"] = jobArray[i]["job_id"] + "_main";
				delete jobArray[i]["title"];
				jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
				delete jobArray[i].job_start;
				jobArray[i].job_end = getDateStr(jobArray[i]["end_time"]);
				delete jobArray[i].job_end;
				jobArray[i].outcome = jobArray[i]["result"];
				delete jobArray[i].result;
				delete jobArray[i].key;
				
				
				//filter deleted jobs from new joblist
				if (deleted_ids.indexOf(jobArray[i]["job_id"]) == -1){
					non_deleted_jobs.push(jobArray[i]);
				}else{
					return;
				}
            })
        
	},

    fetchjobs: async function () {	

	//kick off global countjobs DEPRECATED; REPLACED BY POLLING getworkflowjobcount
	// if (!count_running){
	// 	countJobs();
	// }

    //fetch running jobs from api

    if (!Number.isInteger(parseInt(global.config.STATIC_API_TIMEOUT))){
        var txt = 'ERROR contact admin. Server setting STATIC_API_TIMEOUT is not a number: [' + global.config.STATIC_API_TIMEOUT + ']';
        console.error(txt);
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
			global.lastactive = body;
			
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
                    jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
                }catch(exc){
                    console.log("Could not parse start time from API response jobarray entry:",jobArray[i],exc);
                }
                jobArray[i].wf_name = jobArray[i]["workflow"];
                
            }//for all jobs
                       
        // //send the new jobs to connected clients, todo: only notify clients about new stuff
		try{
			global.socketio.emit("activejobs", JSON.stringify(jobArray));
			//global.socketio.emit("activejobcount", jobArray.length);
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc + body)
		}
    });
    
    //fetch queued jobs from new api

    Request.get(helpers.build_new_api_url("/tickets"), {timeout: global.config.STATIC_API_TIMEOUT},(error, response, body) => {   
        
        //TODO: merge Active and queued call
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            console.error("Fatal, lobal.config.STATIC_USE_PROXY_URL is true but should be false! ")
            return;
        }
        if(error) {
            console.log('Internal Error getting Queued Jobs,  ' + helpers.build_new_api_url("/tickets"), error)
            global.socketio.emit("error", 'Internal Error getting Queued Jobs,  ' + helpers.build_new_api_url("/tickets"));
            return;
        }
		try{
		//QUEUED JOBS (in ffastrans queued folder)
			
			var q_obj = JSON.parse(body)["tickets"]["queued"];
			if (q_obj !== undefined) {
				for (var i=0; i<q_obj.length;i++){
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
							q_obj[i]["job_start"] = getDateStr(q_obj[i]["submit"]["time"]);
                            }catch(ex){
                                console.log("getdate failed on:" ,q_obj[i])
                            }
							q_obj[i]["proc"] = "Queued";
				}
			}
			
			// //send the new jobs to connected clients, todo: only notify clients about new stuff
				if (JSON.parse(body)["tickets"]["queued"]){
                    
					global.socketio.emit("queuedjobs", JSON.stringify(q_obj));
					//global.socketio.emit("queuedjobcount", JSON.parse(body)["tickets"]["queued"].length);                
				}else{
                    console.log("Error, we should not come here, queued")
					global.socketio.emit("queuedjobs", "[]");
					//global.socketio.emit("queuedjobcount", 0);               
				}
		}catch(exc){
			console.error("Error occured while sending queuedjobs to clients: " + exc )
			console.error(exc.stack)
            console.error(q_obj)
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
							q_obj[i]["job_start"] = getDateStr(q_obj[i]["submit"]["time"]);
							q_obj[i]["proc"] = "Watchfolder";
				}
			}
			
			//send the new jobs to connected clients, todo: only notify clients about new stuff
			
			if (JSON.parse(body)["tickets"]["incoming"]){
				
				global.socketio.emit("incomingjobs", JSON.stringify(q_obj));
				//global.socketio.emit("incomingjobcount", JSON.parse(body)["tickets"]["incoming"].length);                
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
		if (!global.db.deleted_jobs){
			console.log("global.db.deleted_jobs not defined, is Database started yet?")
			return;
		}
		try{
			if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
				return;
			}
			if(error) {
				console.log("Error retrieving finished jobs",buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL),error)
				global.socketio.emit("error", 'Error retrieving finished jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + error   );
				return;
			}

			if (global.lasthistory == body){
				//console.log("History Jobs did not change since last fetch...")			
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
			//filter deleted
			var job_id_array = jobArray.map(job=> job.job_id)
			var deleted_ids = await global.db.deleted_jobs.find({ "job_id": { "$in": job_id_array}});
			deleted_ids = await deleted_ids.toArray();
			deleted_ids = deleted_ids.map(doc=>doc.job_id);//mongo docs to string array
			//restructure array from ffastrans,build famliy tree
			var non_deleted_jobs = []
			for (let i = 0; i < jobArray.length; i++){
					//only jobguid plus split makes each job entry unique
					jobArray[i]["_id"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
					
					//data for client display
					jobArray[i].state = m_jobStates[jobArray[i]["state"]];
					jobArray[i].outcome = jobArray[i]["result"];
					//don't store result (we store as outcome)
					jobArray[i] = objectWithoutKey("result",jobArray[i]);
					jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
					jobArray[i].job_end = getDateStr(jobArray[i]["end_time"]);
					//jobArray[i].o_job_start = getDateObj(jobArray[i]["start_time"]);
					//jobArray[i].o_job_end = getDateObj(jobArray[i]["end_time"]);
					
					//todo: remove start_time and end_time, we store as job_start and job_end
					jobArray[i].duration = (getDurationStringFromDates(jobArray[i].job_start, jobArray[i].job_end )+"");
					jobArray[i].wf_name = jobArray[i]["workflow"];

					//filter deleted jobs from new joblist
					if (deleted_ids.indexOf(jobArray[i]["job_id"]) == -1){
						non_deleted_jobs.push(jobArray[i]);
					}else{
						continue;
					}
					
			}
			jobArray = non_deleted_jobs;//go on only with non deleted jobs

			//get last 10k jobids from DB - child jobs need to finish within that period to be grouped correctly;-)
			var lastTenThousand 	= await global.db.jobs.find({},{sort:{job_start:-1},projection:{job_start:1,job_id:1,"children._id":1}}).limit(1000);
			lastTenThousand 		= await lastTenThousand.toArray();
			//make list of all existing _id's / traverse children and main objects
			var existingInternalIds 		= [];
			for (const _job of lastTenThousand) {
				existingInternalIds.push(_job._id);
				if (_job.children){
					for (const _child of _job.children) {
						existingInternalIds.push(_child._id);
					}
				}
			}
			//mainjob and children share the same job_id
			var existingMainJob_job_ids = lastTenThousand.map((my) => my.job_id);//this only gets job_id's of mainjobs (not _id's)

			for (let i=0;i<jobArray.length;i++){
				if (existingInternalIds.indexOf(jobArray[i]._id) != -1 && existingMainJob_job_ids.indexOf(jobArray[i].job_id) != -1){
					//job already in db
					continue;
				}

				//this is a new job
				var existingIndex = existingMainJob_job_ids.indexOf(jobArray[i].job_id) ;
				var insertedDoc;

				if (existingIndex == -1){
					//check if deleted

					//insert new mainjob if needed
					var newmainjob = JSON.stringify(jobArray[i]);//mainjob = copy of current job
					newmainjob = JSON.parse(newmainjob);
					newmainjob.children = [];	
					newmainjob._id = jobArray[i].job_id + "_main"; //internal database id for mainjob, just for the db, not for use in code!
					newmainjob.result = ""; //we delete result as only childs contain it.
					insertedDoc = await global.db.jobs.insertOne(newmainjob);
					existingMainJob_job_ids.push(newmainjob.job_id); //supports multiple branches finished in single fetcher run
					
				}
				
				//get mainjob from db and insert child
				var mainjob = await global.db.jobs.findOne({job_id:jobArray[i].job_id});

				if (mainjob.children.length == 0){
					//we inserted a new mainjob, add first child
					jobArray[i]._id = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
					mainjob.children.push(jobArray[i]);
				}else{
					//udpate existing mainjob
					var existingChildIds = mainjob.children.map((child) => child._id);
					if (existingChildIds.indexOf(jobArray[i]._id) == -1){
						mainjob.children.push(jobArray[i]);
						//get data start and end of mainjob
						mainjob.job_start = getYoungestJobStart(mainjob.children);
						mainjob.job_end = getOldestJobEnd(mainjob.children);
						mainjob.duration = (getDurationStringFromDates(mainjob.job_start, mainjob.job_end )+"");
						mainjob.state = getJobstate(mainjob.children);
						mainjob.outcome = getJobOutcome(mainjob.children);
					}
				}
				
				//update mainjob, inserts additional children
				
				insertedDoc = await global.db.jobs.updateOne({job_id:jobArray[i].job_id},{$set: mainjob},{upsert:true});

				if(insertedDoc){
					console.log("New History Job: " , jobArray[i]);
					global.socketio.emit("newhistoryjob", jobArray[i]);//inform clients about the current num of history job
				}
					
				continue;            
			}//for
		}
		catch(ex){
			console.log(ex.stack);
		
		}
        
    });   
  }
};

/* HELPERS */

function objectWithoutKey(key,obj){
	var { [key]: val, ...rest } = obj;
	return rest;
}

function getJobstate(a_children){
	var state = a_children[a_children.length-1].state;
	var preferState = global.config.JOBFETCHER_AGGREGATE_BRANCH_STATE || "Success";
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.state == preferState){
			state = preferState;
		}
		if (_job.state == "Cancelled"){
			state = "Cancelled";
		}
	}
	return state;
}

function getJobOutcome(a_children){
	/* returns outcome of the last child with specified state */
	var outcome = a_children[a_children.length-1].outcome;
	var preferState = global.config.JOBFETCHER_AGGREGATE_BRANCH_STATE || "Success";
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.state == preferState){
			outcome = _job.outcome;
		}
	}
	return outcome;
}


function getYoungestJobStart(a_children){
	var youngest_start = a_children[0].job_start;
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.job_start < youngest_start)
			youngest_start = _job.job_start;
	}
	return youngest_start;
}

function getOldestJobEnd(a_children){
	var oldest_end = a_children[0].job_end;
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.job_end > oldest_end)
			oldest_end = _job.job_end;
	}
	return oldest_end;
}

// async function countJobsAsync(countobj) {
//     let count = await new Promise((resolve, reject) => {
//         global.db.jobs.count(countobj, (err, count) => {
//             if (err) reject(err);
//             resolve(count);
//         });
//     });
//     return count ;
// }

function getDateObj(str){
    //ffastrans date:2019-10-14T21:22:35.046-01.00
	return moment(str).toDate();
}

function getDateStr(str){
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
	var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    return protocol + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT + "/tickets"
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
		if (!"email_alert_config" in global.config){
			return;
		}
		try{
			var rcpt = global.config["email_alert_config"]["email_alert_rcpt"];
			
			console.log("Sending alert email to: ",rcpt)
			console.log("Email sending result:",await smptMail.send(rcpt,subject, body));
			
		}catch(ex){
			console.error(ex.stack);
			console.error("Error sending email: ",ex);
		}
}
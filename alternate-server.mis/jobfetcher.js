/* Cambria cluster jobfetcher 
Changelog: 11.05.2021 jordanh
	Success jobs können in aktiver anzeige hängen wegen time delta zwischen jobid fetch und jobdetail fetch

*/

const assert = require('assert');

const date = require('date-and-time');
const moment = require('moment');
const path = require("path")
const asyncrequest = require('request-promise');
const util = require("util");
var parsexml = require('xml2js').parseStringPromise;
var I_AM_BUSY = false;
//const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere
//todo: implement queued jobs
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

var urlgetslurpjobs_template = "http://%s:%s/api/slurp_jobs";
var urlgetingestjobs_template = "http://%s:%s/api/ingest_jobs";

var urlgetslurpjobs;
var urlgetingestjobs;

var urlgetactivejoblist;
var urlgetpausedjoblist;
var urlgetqueuedjoblist;
var urlgetdonejoblist;
var urlgeterroredjoblist;
var urlgetcancelledjoblist;
var urlgetjobinfo;
var urlgetclusterstate;

var host_to_use;
var port; 

async function updateUrls(){
	/* check if we find a backup cluster */
	var hosts = global.config["STATIC_API_HOST"];
	port = 8080;//global.config["STATIC_API_PORT"];
	hosts = hosts.split(",");
	if(hosts.length == 0){
		console.log("ERROR; NO API HOST IS CONFIGURED, check out admin settings");
		return false;
	}
	
	urlgetslurpjobs = util.format(urlgetslurpjobs_template, hosts[0], port);
	
	urlgetingestjobs = util.format(urlgetingestjobs_template, hosts[0], port);
	
}

function misJobsToFancytree(a_jobids,o_jobs){
	//"INACTIVE", "ACTIVE", "COMPLETE", "FAILURE"
	
	var calculatedJobArray = [];			
	for (i=0;i<a_jobids.length;i++){
		
		var _misJob = o_jobs[a_jobids[i]];
		console.log("Resolving original job to fancytreegrid node, num tasks: ", _misJob["tasks"].length);
		//console.log(JSON.stringify(_misJob,null,4))
		
		var job_start 	= " unknown";
		var job_end 	= " unknown";
		var duration = "0";
		var state = "Active";
		//translate from mis status to webint status for row highlighting etc
		if (!_misJob["job_was_started"]){
			state = "Queued";
		}
		if (_misJob["job_is_finished"]){
			state = "Success";
		}
		if (_misJob["job_has_errors"]){
			state = "Active";
		}
		if (_misJob["job_has_errors"] && _misJob["job_is_finished"]){
			state = "Error";
		}
		console.log("state:",state,"job_was_started",_misJob["job_was_started"],"job_is_finished",_misJob["job_is_finished"],"job_has_errors",_misJob["job_has_errors"])
		//as strings
		//job_start = _misJob["tasks"][0]["_createdAt"];//first start
		//job_end = _misJob["tasks"][_misJob["tasks"].length-1]["_completedAt"]; //last end
		job_start = _misJob["_createdAt"];
		job_end = _misJob["_completedAt"];
		
		if ("_failedAt" in _misJob["tasks"][_misJob["tasks"].length-1]){
			job_end = _misJob["tasks"][_misJob["tasks"].length-1]["_failedAt"]; //last end
		}
		
		duration = getDurationStringFromDates(job_start,job_end);
		//as formatteds strings
		job_start = formatDate (new Date(job_start))
		job_end = formatDate (new Date(job_end))
		
		//build fancytree obj
		var fancytreeNode = {}
		fancytreeNode["job_start"] = job_start;
		

		fancytreeNode["job_end"] = job_end;
		fancytreeNode["guid"] 	= _misJob["job_id"];
		fancytreeNode["key"] 	= fancytreeNode["guid"];//for fancytree internal purpose
		fancytreeNode["_id"] 	= fancytreeNode["guid"];
		fancytreeNode["title"] 	= state; //for fancytree internal purpose
		fancytreeNode["state"] = fancytreeNode.title;
		fancytreeNode["steps"] = "";
		fancytreeNode["progress"] =  Math.round(_misJob["job_progress"]["transferred"] / _misJob["job_progress"]["length"] * 100 ); //todo: calc number of active vs done tasks
        _misJob["job_info"]["is_stitch"] = true;
		_misJob["job_info"]["target_duration_frames"] = 123;
		_misJob["job_info"]["progress"] = fancytreeNode["progress"];
		fancytreeNode["status"] = "<a href='"+_misJob["discover_cancel"]+"' target='_blank'> Cancel </a> &nbsp;" + JSON.stringify(_misJob["job_info"]);//_misJob["job_id"];
		fancytreeNode["workflow"] = _misJob["tasks"][0]["type"];
		fancytreeNode["outcome"] = fancytreeNode["guid"];
		fancytreeNode["proc"] = "";
		fancytreeNode["host"] = "";
		fancytreeNode["source"] = "TODO: INSERT SOURCE" ;//active
		
		fancytreeNode["file"] = "Files: " + _misJob["job_info"]["file_list"].length;  //history
		fancytreeNode["duration"] = duration;
	
		fancytreeNode["sort_family_index"] = 0;//indicates that there are no subjobs
		
		fancytreeNode["sort_family_index"] = 0;//indicates that there are no subjobs
		fancytreeNode["sort_generation"] = 0;//indicates that there are no subjobs
		fancytreeNode["sort_family_member_count"] = 0;//indicates that there are no subjobs
		calculatedJobArray.push(fancytreeNode);
		
		console.log("Job has got ",_misJob["tasks"].length,"Tasks");
		fancytreeNode["children"] = [];
		for (var t=0;t<_misJob["tasks"].length;t++){
			var task = _misJob["tasks"][t];
			
			//add each task as a child
			var task_start 	= task["_startedAt"];
			var task_end 	= task["_completedAt"];
			task_start = formatDate (new Date(task_start))
			task_end = formatDate (new Date(task_end))
			if ("_failedAt" in task){
				task_end 	= task["_failedAt"];
				task_end = formatDate (new Date(task_end))
			}
			var tduration = "0";
			tduration = getDurationStringFromDates(task_start,task_end);
			var state = task["_state"];
			
			var fancyChild = {}
			fancyChild["job_start"] = task_start;
			
			fancyChild["job_end"] = task_end;
			fancyChild["duration"] = tduration;
			fancyChild["oida"] 	= "vodda";
			fancyChild["guid"] 	= fancytreeNode["guid"] + "_" + t;
			fancyChild["key"] 	= fancyChild["guid"];//for fancytree internal purpose
			fancyChild["_id"] 	= fancyChild["guid"];
			fancyChild["title"] 	= state; //for fancytree internal purpose
			fancyChild["state"] = fancyChild.title;
			
			fancyChild["steps"] = "";
			fancyChild["outcome"] = "";
			fancyChild["status"] = ""
			try{
				var logs = JSON.stringify(task["_logs"]);
				if (typeof(logs) == "string"){
					fancyChild["outcome"] = logs;
				}
				fancyChild["status"] = logs;
			}catch(ex){
				console.error("Error setting task outcome",ex)
			}
			try{
				fancyChild["progress"] =  getTaskProgress(task["data"]["current_progress"]); //Math.round(fancyChild["data"]["current_progress"]["transferred"] / fancyChild["data"]["current_progress"]["length"] *100 ); //todo: calc number of active vs done tasks
			}catch(ex){
				console.log("Progress error",ex)
				fancyChild["progress"] =  JSON.stringify(ex)
			}
			fancyChild["status"] = fancyChild["progress"]; //must update status in order to cause job redraw on UI
			fancyChild["workflow"] = task["type"];
			
			fancyChild["proc"] = ""
			fancyChild["host"] = ""
			fancyChild["source"] = "TODO: insert source" //active
			fancyChild["file"] = JSON.stringify(task["data"]["source_full"]) //history
			
			fancyChild["sort_family_index"] = 0;//indicates that there are no subjobs
			
			fancyChild["sort_family_index"] = 0;//indicates that there are no subjobs
			fancyChild["sort_generation"] = 1;//indicates that there are no subjobs
			fancyChild["sort_family_member_count"] = _misJob["tasks"].length;//indicates that there are no subjobs
			fancytreeNode["children"].push(fancyChild);
		}
		
		
		
	}
	return calculatedJobArray;
}

function getTaskProgress(o_progress){
	
	var prog =  Math.round(o_progress["transferred"] / o_progress["length"] *100 );
	return prog;
}

module.exports = {
    fetchjobs: async function () {
		if (I_AM_BUSY){
			global.socketio.emit("error", "JOBFETCHER IS DISABLED, wait for 'Import Done message'");
			console.log("JOBFETCHER IS BUSY REIMPORTING ALL JOBS, Please WAIT");
			return;
		}
		await updateUrls();
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

		//get SLURP JOBS
		console.log("Request", urlgetslurpjobs);
		let [slurp_jobs,ingest_jobs] = await Promise.all([
														asyncrequest.get(urlgetslurpjobs, {timeout: 5000,agent: false, maxSockets: Infinity}),
														asyncrequest.get(urlgetingestjobs, {timeout: 5000,agent: false, maxSockets: Infinity}),
														]);
										
		slurp_jobs 	= JSON.parse(slurp_jobs);
		ingest_jobs = JSON.parse(ingest_jobs);
		
		//console.log("original slurp jobs: ", slurp_jobs);
		
		var latest_jobs = {};	
	    
		console.log("slurp_jobs",Object.keys(slurp_jobs["jobs"]));
		console.log("ingest_jobs",Object.keys(ingest_jobs["jobs"]));
		var active_jobs = {};
		var history_jobs = {};
		/* merge slurp and ingest jobs into active and history jobs */
		for (j=0;j<Object.keys(slurp_jobs["jobs"]).length;j++){
			var j_guid = Object.keys(slurp_jobs["jobs"])[j];
			var cur_job = slurp_jobs["jobs"][j_guid];
			if (cur_job["job_is_finished"]){
				history_jobs[j_guid] = cur_job;
			}else{
				active_jobs[j_guid] = cur_job;
			}
		}
		for (j=0;j<Object.keys(ingest_jobs["jobs"]).length;j++){
			var j_guid = Object.keys(ingest_jobs["jobs"])[j];
			var cur_job = ingest_jobs["jobs"][j_guid];
			if (cur_job["job_is_finished"]){
				history_jobs[j_guid] = cur_job;
			}else{
				active_jobs[j_guid] = cur_job;
			}
		}
		
		console.log("Count of active jobs in latest jobs: " ,Object.keys(active_jobs).length);
		console.log("Count of history jobs in latest jobs: " ,Object.keys(history_jobs).length);
		//build difference between database records and joblist from API

		var res = await asyncquery({"deleted": { $exists: false }},{ guid: 1,_id: 0 });
		var a_historyJobsInDb = [];
		res.forEach(function(_itm){//format list of objects to array
			a_historyJobsInDb.push(_itm["guid"]);
		});		
		
		let historyJobsInApiButNotInDb = Object.keys(history_jobs).filter(x => !a_historyJobsInDb.includes(x));
		console.log("New jobs: ",historyJobsInApiButNotInDb)
		
		var history_fancyTreeJobs = misJobsToFancytree(historyJobsInApiButNotInDb,history_jobs);
		
		for (i=0;i<history_fancyTreeJobs.length;i++){
            (function(job_to_insert){   //this syntax is used to pass current job to asnyc function so we can emit it
				//console.log("taking care about ",job_to_insert)
                //upsert history record (update if family_member_count changed, insert new if not exists)
                global.db.jobs.update({"_id":job_to_insert["guid"],"sort_family_member_count": { $lt: job_to_insert["sort_family_member_count"]}},job_to_insert,{upsert:true},function(err, docs){
                    if(docs > 0 ){
                            //TODO: either change to another db or find out why docs sometimes contains a non changed document ^^
                            console.log("inserted " + job_to_insert["source"])
                            global.socketio.emit("newhistoryjob", job_to_insert);//inform clients about the current num of history job
                    }else{
                        //console.log("no upsert for ",jobArray[i]["guid"])
                    }
                })//job update
            })(history_fancyTreeJobs[i]);//pass current job as job_to_insert param to store it in scope of update function
            continue;            
        }//for
		
		var running_fancyTreeJobs 	= misJobsToFancytree(Object.keys(active_jobs),active_jobs);
		var active_fancyTreeJobs 	= running_fancyTreeJobs.filter(job => job["title"] == "Active" || job["title"] == "Error" );
		var queued_fancyTreeJobs 	= running_fancyTreeJobs.filter(job => job["title"] == "Queued");
		
		//inform connected webinterface clients about active and queued jobs
		try{
			console.log("Emit activejobs jobcount: ", active_fancyTreeJobs.length)
			global.socketio.emit("activejobs", JSON.stringify(active_fancyTreeJobs));
			global.socketio.emit("activejobcount", active_fancyTreeJobs.length);
			console.log("Emit queued jobcount: ", queued_fancyTreeJobs.length)
			global.socketio.emit("queuedjobs", JSON.stringify(queued_fancyTreeJobs));
			global.socketio.emit("queuedjobcount", queued_fancyTreeJobs.length);
			
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc )
		}
		
		
   }
};

/* HELPERS */

function asyncquery(query,fieldstoreturn) {
	/* function wrapping nedb into async await compatible */
	return new Promise((resolve, reject)=> {
		global.db.jobs.find(query,fieldstoreturn).exec((error, result)=>{
			if (error !== null) reject(error);
			else resolve(result);
		});
	});
}

async function getAllHistoryJobs(){
	I_AM_BUSY = true;
	var currentcount = 0;
	var _historyJobsFromApi = [];
	while (1){
		console.log("Importing next 1000 History Jobs...");
		var url_done = util.format(urlgetdonejoblist_original, host_to_use, port,currentcount);
		var url_error = util.format(urlgeterroredjoblist_original, host_to_use, port,currentcount);
		var url_cancelled = util.format(urlgetcancelledjoblist_original, host_to_use, port,currentcount)
		
		let [done, errored, cancelled] = await Promise.all([
											asyncrequest.get(url_done		, {timeout: 5000,agent: false, maxSockets: Infinity}),
											asyncrequest.get(url_error  	, {timeout: 5000,agent: false, maxSockets: Infinity}),
											asyncrequest.get(url_cancelled	, {timeout: 5000,agent: false, maxSockets: Infinity})
											]);
											
		 _done = await joblistIdToArray(done);
		 _errored = await joblistIdToArray(errored);
		 _cancelled = await joblistIdToArray(cancelled);
		 
		_historyJobsFromApi = [..._historyJobsFromApi, ..._done, ..._errored, ..._cancelled];
		console.log("Done error and cancelled count: ",_historyJobsFromApi.length)
		if (_done.length < 1000 && _errored.length < 1000 && _cancelled.length < 1000){
			break;
		}
		currentcount += 1000;
	}
	console.log("Resolving History Jobs: ",_historyJobsFromApi.length);
	var a_newhistoryjobs = await resolveJobIdList(_historyJobsFromApi,"history");
	console.log("History Import complete",a_newhistoryjobs);
	var jobArray = a_newhistoryjobs;
	
	for (i=0;i<jobArray.length;i++){
		(function(job_to_insert){   //this syntax is used to pass current job to asnyc function so we can emit it
			//upsert history record (update if family_member_count changed, insert new if not exists)
			global.db.jobs.update({"_id":job_to_insert["guid"],"sort_family_member_count": { $lt: job_to_insert["sort_family_member_count"]}},job_to_insert,{upsert:true},function(err, docs){
				if(docs > 0 ){
						//TODO: either change to another db or find out why docs sometimes contains a non changed document ^^
						console.log("inserted " + job_to_insert["source"])
						//global.socketio.emit("newhistoryjob", job_to_insert);//inform clients about the current num of history job
				}else{
					//console.log("no upsert for ",jobArray[i]["guid"])
				}
			})//job update
		})(jobArray[i]);//pass current job as job_to_insert param to store it in scope of update function
		continue;            
	}//for
	while (1){
		global.socketio.emit("error", "Job Import done for " + jobArray.length + " Jobs, Please restart Webinterface Windows Service");
		console.log("Job Import done for " + jobArray.length + " Jobs, Please restart Webinterface Windows Service")
		await sleep(3000);
	}
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

        return pad(hours) + ":" + pad (minutes) + ":" + pad ((seconds+"").replace(/\.\d+/,"")); //TODO: seconds now contain ms... split this off
}

function pad(num) {
    var s = num+"";
    while (s.length < 2) s = "0" + s;
    return s;
}

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

function padTo2Digits(num) {
  if (isNaN(num)){
	  return "00";
  }
  return num.toString().padStart(2, '0');
}

function formatDate(date) {
  if (isNaN(date)){
	  return "0000-00-00 00:00:00"
  }
  var datestr =  (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('-') +
    ' ' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join(':')
  );
  
  
  return datestr;
}
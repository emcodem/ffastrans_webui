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

//const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere
//todo: implement queued jobs
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

var urlgetalljoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=All&Count=1000&Offset=0";
var urlgetactivejoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=Running&Count=1000&Offset=0"
var urlgetpausedjoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=Paused&Count=1000&Offset=0"
var urlgetqueuedjoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=Queued&Count=1000&Offset=0"
var urlgetdonejoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=Done&Count=1000&Offset=0&SortBy=SubmitTime&Orderby=Desc"
var urlgeterroredjoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=Error&Count=1000&Offset=0&SortBy=SubmitTime&Orderby=Desc"
var urlgetcancelledjoblist_original = "http://%s:%s/CambriaFC/v1/Jobs/?Status=Cancelled&Count=1000&Offset=0&SortBy=SubmitTime&Orderby=Desc"
var urlgetjobinfo_original = "http://%s:%s/CambriaFC/v1/Jobs/%s/?Content=Full"; //util.format(urlgetjobinfo, s_jobid);
var urlgetclusterstate_original = "http://%s:%s/CambriaFC/v1/Replication/Status"; //util.format(urlgetjobinfo, s_jobid);

var urlgetalljoblist;
var urlgetactivejoblist;
var urlgetpausedjoblist;
var urlgetqueuedjoblist;
var urlgetdonejoblist;
var urlgeterroredjoblist;
var urlgetcancelledjoblist;
var urlgetjobinfo;
var urlgetclusterstate;


async function updateUrls(){
	/* check if we find a backup cluster */
	var hosts = global.config["STATIC_API_HOST"];
	var port = global.config["STATIC_API_PORT"];
	hosts = hosts.split(",");
	if(hosts.length == 0){
		console.log("ERROR; NO API HOST IS CONFIGURED, check out admin settings");
		return false;
	}
	var clusterport = parseInt(port) + 100;
	
	
	var result1 = "" ;
	var result2 = "" ;
	
	try{
		var urlgetclusterstate = util.format(urlgetclusterstate_original, hosts[0], clusterport);
		result1 = await asyncrequest(urlgetclusterstate,{timeout: 2000, agent: false, maxSockets: Infinity});
	}catch(ex){
		result1 = "";
	}
	try{
		var urlgetclusterstate = util.format(urlgetclusterstate_original, hosts[1], clusterport);
		result2 = await asyncrequest(urlgetclusterstate,{timeout: 2000, agent: false, maxSockets: Infinity});
	}catch(ex){
		result2 = "";
	}
	//var result = await asyncrequest(_url,{timeout: 2000, agent: false, maxSockets: Infinity});
	
	var host_to_use = hosts[0];
	
	if (result1.match(/Role="primary"|Role="primarytriggered"/)){//we run preferred on backup host
		host_to_use = hosts[0];	//prefer backup host
	}
	if (result2.match(/Role="primary"|Role="primarytriggered"/)){//we run preferred on backup host
		host_to_use = hosts[1];	//prefer backup host
	}
	if (result1.match(/Role="backup"/)){//we run preferred on backup host
		host_to_use = hosts[0];	//prefer backup host
	}
	if (result2.match(/Role="backup"/)){//we run preferred on backup host
		host_to_use = hosts[1];	//prefer backup host
	}
	
	urlgetalljoblist = util.format(urlgetalljoblist_original, host_to_use, port);
	urlgetactivejoblist = util.format(urlgetactivejoblist_original, host_to_use, port);
	urlgetpausedjoblist = util.format(urlgetpausedjoblist_original, host_to_use, port);
	urlgetqueuedjoblist = util.format(urlgetqueuedjoblist_original, host_to_use, port);
	urlgetdonejoblist = util.format(urlgetdonejoblist_original, host_to_use, port);
	urlgeterroredjoblist = util.format(urlgeterroredjoblist_original, host_to_use, port);
	urlgetcancelledjoblist = util.format(urlgetcancelledjoblist_original, host_to_use, port);
	urlgetjobinfo = util.format(urlgetjobinfo_original, host_to_use, port);
	
	console.log("ClusterState check returned host to use",host_to_use)
}

async function joblistIdToArray(xml){
		/*takes cambria response xml with jobids and returns a plain array*/
		var retrieved_jobs = await parsexml(xml);
		if (!("Job" in retrieved_jobs["Content"]["Joblist"][0])){
			return [];//empty joblist
		}
		retrieved_jobs = retrieved_jobs["Content"]["Joblist"][0]["Job"];
		var arr = [];
		for  (i=0;i<retrieved_jobs.length;i++){
			arr.push(retrieved_jobs[i]["$"]["ID"])
		}
		return arr;
}

async function resolveJobIdList(a_jobids,active_or_history){
	/*resolves jobid to jobdetail obj*/
	//create array of promise functions
	var a_promises=[];
	var a_resultobj = [];
	try{
		//console.log("Resolving ",a_jobids.length," Jobs from API");
		a_jobids.forEach(function(j_id){
			var _url = util.format(urlgetjobinfo, j_id);
			a_promises.push(async function(){
												var _xml = await (asyncrequest.get(_url, {timeout: 5000,agent: false, maxSockets: Infinity}));
												var parsed = await parsexml(_xml);
												var treeNode = cambriaJobToFancytree(parsed,active_or_history);
												if (active_or_history == "active"){
													if (treeNode["title"] == "Success" || treeNode["title"] == "Error"){
														//workaround: sometimes a job has become finished between getting the list of jobid's and resolving the job status, we dont want to have a success job in active joblist
														console.log("Detected FTC Job that was in active JobidList but had state Error or Success. Suppressing this from being added to Running Joblist.",treeNode)
													}else{
														console.log("Active Jobs, status:",treeNode["title"],treeNode["source"])
														a_resultobj.push(treeNode);
													}
												}else{
													a_resultobj.push(treeNode);
												}
											})
			});
		/* Limits paralell execution to 5 */
		while (a_promises.length) {
		  await Promise.all( a_promises.splice(0, 5).map(f => f()));
		}
		
		return a_resultobj;
	}catch(ex){
			console.log("unexpected error in resolveJobIdList",ex,"array of jobs was:",a_jobids);
			return [];
	}
}

function cambriaJobToFancytree(o_job,active_or_history){
				
				/*transform ftc jobinfo api response into tree compatible object*/
				var jobArray = [];
				var fancytreeNode = {};
				var jobdesc = o_job["Content"]["JobDescInfo"][0]["$"];
				jobdesc["task"] = o_job["Content"]["JobDescInfo"][0]["Task"];
				
				fancytreeNode["guid"] = jobdesc["JobID"];
                //data for client display
                fancytreeNode["key"] = fancytreeNode["guid"];//for fancytree internal purpose
                fancytreeNode["_id"] = fancytreeNode["guid"];
				fancytreeNode["title"] = "UNKNOWN"; //for fancytree internal purpose
				if (jobdesc["Status"] == "queued"){fancytreeNode.title = "Queued"}
				if (jobdesc["Status"] == "paused"){fancytreeNode.title = "Paused"}
				if (jobdesc["Status"] == "running"){fancytreeNode.title = "Active"}
				if (jobdesc["Status"] == "starting"){fancytreeNode.title = "Active"}
				if (jobdesc["Status"] == "done"){fancytreeNode.title = "Success"}
				if (jobdesc["Status"] == "errored"){fancytreeNode.title = "Error"}
					fancytreeNode["state"] = fancytreeNode.title;
					fancytreeNode["status"] = fancytreeNode.title;
					fancytreeNode["steps"] = "";
				try{
					fancytreeNode["progress"] = jobdesc["task"][0]["$"]["Progress"] //todo: build sum of all tasks
				}catch(ex){
					fancytreeNode["progress"] = 0
				}
				fancytreeNode["workflow"] = jobdesc["Description"]
				if (jobdesc["WatchFolderName"] != ""){
					fancytreeNode["workflow"] += jobdesc["WatchFolderName"] + " " + jobdesc["WatchFolderDescription"]
				}
				fancytreeNode["proc"] = ""
				fancytreeNode["host"] = ""
				try{
					fancytreeNode.file = jobdesc["SourceFilename"]
					fancytreeNode["source"] = jobdesc["SourceFilename"]
				}catch(ex){
					console.log("Error, no SourceFilename in " + JSON.stringify(o_job))
					fancytreeNode.file = "Error, no SourceFilename in " + JSON.stringify(o_job)
				}
                fancytreeNode.outcome = "Target: [" + jobdesc["OutputFilename"] + "]";
				if ("LastError" in jobdesc){
					fancytreeNode.outcome += jobdesc ["LastError"]
				}
                fancytreeNode.job_start = jobdesc["StartTime"]//getDate(jobArray[i]["StartTime"]);
				if (fancytreeNode.job_start = "0000-00-00 00:00:00"){fancytreeNode.job_start = jobdesc["SubmissionTime"]}
				fancytreeNode.job_end = jobdesc["EndTime"]//getDate(jobArray[i]["StartTime"]);
				try{fancytreeNode["duration"] = getDurationStringFromDates(jobdesc["StartTime"], jobdesc["EndTime"] )}
				catch(ex){
					console.log("Duration calc failed")
				}
				
                fancytreeNode.wf_name = jobdesc["Description"];
				fancytreeNode["sort_family_index"] = 0;//indicates that there are no subjobs
				fancytreeNode["sort_generation"] = 0;//indicates that there are no subjobs
				fancytreeNode["sort_family_member_count"] = 0;//indicates that there are no subjobs
				return fancytreeNode;
				
}

module.exports = {
    fetchjobs: async function () {
		
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

		//get ACTIVE JOBS
		let [active, paused,queued] = await Promise.all([
														asyncrequest.get(urlgetactivejoblist, {timeout: 5000,agent: false, maxSockets: Infinity}),
														asyncrequest.get(urlgetpausedjoblist, {timeout: 5000,agent: false, maxSockets: Infinity}),
														asyncrequest.get(urlgetqueuedjoblist, {timeout: 5000,agent: false, maxSockets: Infinity})
														]);
														
		paused = await joblistIdToArray(paused);
		active = await joblistIdToArray(active);
		queued = await joblistIdToArray(queued);
		
		
		//var  allactive = [...active, ...queued, ...paused];
		//console.log("allactive",allactive);
		//now we have all running jobs with their infos in an object of objects like {{jobid:jobinfo,....}}
		var a_activejobs = await resolveJobIdList(active,"active");
		var a_queuedjobs = await resolveJobIdList(queued,"active");
		
		//transform ftc jobobjects
		
		//inform connected webinterface clients about active and queued jobs
		try{
			global.socketio.emit("activejobs", JSON.stringify(a_activejobs));
			console.log("Count of active Jobs",a_activejobs.length)
			global.socketio.emit("activejobcount", a_activejobs.length);
			global.socketio.emit("queuedjobs",  JSON.stringify(a_queuedjobs));
			global.socketio.emit("queuedjobcount", a_queuedjobs.length);
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc )
		}
		
		//HISTORY Jobs
		
		//get history jobs from API
		let [done, errored, cancelled] = await Promise.all([
														asyncrequest.get(urlgetdonejoblist		, {timeout: 5000,agent: false, maxSockets: Infinity}),
														asyncrequest.get(urlgeterroredjoblist  	, {timeout: 5000,agent: false, maxSockets: Infinity}),
														asyncrequest.get(urlgetcancelledjoblist	, {timeout: 5000,agent: false, maxSockets: Infinity})
														]);
														
		done = await joblistIdToArray(done);
		errored = await joblistIdToArray(errored);
		cancelled = await joblistIdToArray(cancelled);
		var  historyJobsFromApi = [...done, ...errored, ...cancelled];
		console.log("Count of history jobs:",joblistIdToArray.length);
		
		//build difference between database records and joblist from API
		function asyncquery(query,fieldstoreturn) {
			/* function wrapping nedb into async await compatible */
			return new Promise((resolve, reject)=> {
				global.db.jobs.find(query,fieldstoreturn).exec((error, result)=>{
					if (error !== null) reject(error);
					else resolve(result);
				});
			});
		}
		
		//fetch existing results from db
		var res = await asyncquery({"deleted": { $exists: false }},{ guid: 1,_id: 0 });
		var a_historyJobsInDb = [];
		res.forEach(function(_itm){//format list of objects to array
			a_historyJobsInDb.push(_itm["guid"]);
		});
		
		let historyJobsInApiButNotInDb = historyJobsFromApi.filter(x => !a_historyJobsInDb.includes(x));
		//console.log(historyJobsInApiButNotInDb);
		//todo: if it is more than 1000, we must re-fetch the next jobpage
		
		var a_newhistoryjobs = await resolveJobIdList(historyJobsInApiButNotInDb,"history");
		//console.log(a_newhistoryjobs);
		var jobArray = a_newhistoryjobs;
		
        for (i=0;i<jobArray.length;i++){
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
            })(jobArray[i]);//pass current job as job_to_insert param to store it in scope of update function
            continue;            
        }//for

		return;
		
  }
};

/* HELPERS */



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
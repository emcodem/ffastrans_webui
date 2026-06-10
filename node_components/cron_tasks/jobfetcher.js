const assert = require('assert');
const axios = require("axios");
//const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
const path = require("path");
var smptMail = require("../common/send_smpt_email");
var helpers = require("../common/helpers")
var logfactory = require("../../shared_modules/logger.js");
var backlog_logger = logfactory.getLogger("backlog_import");
// const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere

//NOTE the rest of the code uses global.lasthistory and global.lastactive to access the joblists.
//var last_active     = JSON.parse(global.lastactive);
//var last_history    = JSON.parse(global.lasthistory);

var alert_sent = false;
var error_count_running = 0;
var m_jobStates = ["Error", "Success", "Cancelled", "Unknown"];
var history_error_count = 0;
var executioncount = 0;
var deep_scan_next_run = true; // True by default for the first run!
var count_running = false;
var backlog_detection_run = false; // Prevent repeated deep scans on same backlog
var last_backlog_size = 0; // Track last detected backlog
var backlog_import_running = false; // Prevent concurrent backlog imports
var backlog_total_to_import = 0;   // Total jobs to import in current backlog run
var backlog_total_imported = 0;    // Jobs successfully imported so far
// blocked((time, stack) => {
// console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

module.exports = {
	//we want jobfetcher to be able to run as alternate-server, thus the getworkflowjobcount method asks ticket not directly from api but from jobfetcher
	//in alternate-server mode you have to rebuild and simulate the returned structure

	getWorkflowList: async function (nodetails) {
		var get_details = nodetails ? "nodetails=true" : "";
		return await axios.get(helpers.build_new_api_url("/workflows?" + get_details), { timeout: global.config.STATIC_API_TIMEOUT, agent: false, maxSockets: Infinity });
	},

	tickets: async function () {
		//ticket contains at least internal_wf_name data field
		//m_ticket_cache.last_update = new Date();
		var response = await axios.get(helpers.build_new_api_url("/tickets"), { timeout: global.config.STATIC_API_TIMEOUT, agent: false, maxSockets: Infinity });
		console.log("jobfetcher tickets response", response.data)
		return response.data.tickets;
	},

	fetchjobs: async function () {
		executioncount++;

		if (!Number.isInteger(parseInt(global.config.STATIC_API_TIMEOUT))) {
			var txt = 'ERROR contact admin. Server setting STATIC_API_TIMEOUT is not a number: [' + global.config.STATIC_API_TIMEOUT + ']';
			console.error(txt);
			global.socketio.emit("error", txt);
		} else {
			global.config.STATIC_API_TIMEOUT = parseInt(global.config.STATIC_API_TIMEOUT)
		}

		//fetch queued jobs from new api
		getQueuedJobs();

		//fetch history and api jobs from api
		await getJobs();

	}
};

/* JOB GETTERS */

async function getQueuedJobs() {
	//let response = await axios.get(_currentUrl)//await fetch(_currentUrl,{signal: AbortSignal.timeout( global.config.STATIC_API_TIMEOUT )});
	var URLS = [helpers.build_new_api_url("/tickets")]

	//note that we don't (yet) pull this kind of jobs from multiple hosts, we need support on the ui to display the "system" first, otherwise one can loose overview
	for (var _currentUrl of URLS) {
		try {
			axios.defaults.timeout = global.config.STATIC_API_TIMEOUT;
			let response = await axios.get(_currentUrl);
			parseQueuedJobs(response.data);
		} catch (ex) {
			if (ex.message) {
				console.error("getQueuedJobs", _currentUrl, ex.message);
			} else if (ex.errors) {
				console.error("getQueuedJobs", _currentUrl, ex.errors);
			} else {
				console.error("getQueuedJobs", _currentUrl, ex);
			}
		}
	}

}

async function getJobs() {

	//gets history and active jobs, decoupled into parallel fetches
	let all_history_jobs = [];
	let all_running_jobs = [];
	let failed_count = 0;

	let varcols = global.config.job_viewer?.variable_columns || [];
	let varsToFetch = new Set();
	varsToFetch.add("s_is_main_branch");
	varsToFetch.add("sys_parent_job_id");
	const rgx = /%(s_.*?|i_.*?|f_.*?|webui_.*?)%/gi;

	// Extract all unique variable names from the variable column templates
	varcols.forEach(col => {
		const matches = [...col.col_template.matchAll(rgx)];
		matches.forEach(match => {
			varsToFetch.add(match[1]);
		});
	});

	let hostnames = global.config.STATIC_API_HOSTS.split(",");
	for (let h of hostnames) {
		console.time("Jobfetcher duration for: " + h);
		try {
			axios.defaults.timeout = global.config.STATIC_API_TIMEOUT;
			let varsQuery = varsToFetch.size > 0 ? `&vars=${Array.from(varsToFetch).join('|')}` : "";

			// --- PARALLEL FETCH: active jobs + history IDs at the same time ---
			let jobCount = deep_scan_next_run ? 100000 : 10000;
			deep_scan_next_run = false; // Reset eagerly
			backlog_detection_run = false;


			let activeUrl = helpers.build_new_api_url(`/jobs/?status=active` + varsQuery, h, global.config["STATIC_API_NEW_PORT"]);
			let historyIdsUrl = helpers.build_new_api_url(`/jobs/?start=0&count=${jobCount}&status=history&return_id_only=true`, h, global.config["STATIC_API_NEW_PORT"]);

			let [responseActive, responseHistoryIds] = await Promise.all([
				axios.get(activeUrl, { timeout: global.config.STATIC_API_TIMEOUT }),
				axios.get(historyIdsUrl, { timeout: global.config.STATIC_API_TIMEOUT })
			]);

			all_running_jobs.push(...responseActive.data.active);
			let fetched_history_ids = responseHistoryIds.data.history.map(j => j.job_id);

			// --- DIFF: find which job IDs are missing from MongoDB ---
			let existing_docs = await global.db.jobs.find({ job_id: { $in: fetched_history_ids } }).project({ job_id: 1 }).toArray();
			let existing_ids = new Set(existing_docs.map(x => x.job_id));

			// Also exclude jobs that have been deleted
			let deleted_docs = await global.db.deleted_jobs.find({ job_id: { $in: fetched_history_ids } }).project({ job_id: 1 }).toArray();
			let deleted_ids = new Set(deleted_docs.map(x => x.job_id));

			let missing_ids = fetched_history_ids.filter(id => !existing_ids.has(id) && !deleted_ids.has(id));

			if (missing_ids.length > 0 && missing_ids.length === fetched_history_ids.length && !backlog_detection_run) {
				if (missing_ids.length > 500) {
					console.log(`Detected that all ${missing_ids.length} fetched jobs were unknown. Triggering deep scan for next run.`);
					deep_scan_next_run = true;
					backlog_detection_run = true;
					last_backlog_size = missing_ids.length;
				}
			}

			// --- DECOUPLED BACKLOG IMPORT ---
			// For small numbers of missing jobs (normal operation), fetch inline so they show up immediately
			// For large backlogs, kick off a background import that doesn't block active job updates
			if (missing_ids.length > 0 && missing_ids.length <= 300) {
				// Small batch: fetch inline, fast enough not to block
				let jobInfoUrl = helpers.build_new_api_url(`/job_info`, h, global.config["STATIC_API_NEW_PORT"]);
				try {
					let batchResponse = await axios.post(jobInfoUrl, { jobids: missing_ids, vars: Array.from(varsToFetch) }, { timeout: global.config.STATIC_API_TIMEOUT });
					if (batchResponse && batchResponse.data && batchResponse.data.history) {
						all_history_jobs.push(...batchResponse.data.history);
					}
				} catch (e) {
					console.error(`Error fetching batch of ${missing_ids.length} jobs:`, e.message);
				}
			} else if (missing_ids.length > 300) {
				// Large backlog: import in background so active jobs keep updating
				importBacklogJobs(missing_ids, Array.from(varsToFetch), h, existing_ids.size);
			}

		} catch (ex) {
			if (ex.message) {
				console.error("loadHistoryJobs", h, ex.message);
			} else if (ex.errors) {
				console.error("loadHistoryJobs", h, ex.errors);
			} else {
				console.error("loadHistoryJobs", h, ex);
			}
			failed_count++;
		} finally {
			console.timeEnd("Jobfetcher duration for: " + h);
		}
	}

	if (failed_count >= hostnames.length) {
		history_error_count++;
		if (history_error_count % 10 == 0)
			global.socketio.emit("error", 'Error retrieving finished jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ');
		history_error_count = 0;
	}

	// Run parse steps in parallel - they are independent of each other
	await Promise.all([
		parseHistoryJobs(all_history_jobs),
		parseRunningJobs(all_running_jobs)
	]);
}

/**
 * Background backlog import - runs independently from the main fetch cycle.
 * Fetches and parses large numbers of missing history jobs without blocking 
 * active job updates. Only one backlog import runs at a time.
 */
async function importBacklogJobs(missing_ids, varsArray, host, existingCount) {
	if (backlog_import_running) {
		backlog_logger.info(`Backlog import already running, skipping ${missing_ids.length} jobs for now`);
		return;
	}
	backlog_import_running = true;
	backlog_total_to_import = missing_ids.length;
	backlog_total_imported = 0;
	backlog_logger.info(`Starting background backlog import of ${missing_ids.length} jobs from host ${host}...`);
	try {
		global.socketio.emit("error", `Background process: ${existingCount} jobs already imported. Fetching ${missing_ids.length} missing jobs from backlog...`);
	} catch (e) { }

	try {
		let backlog_history_jobs = [];
		const MIN_BATCH_SIZE = 25;
		const INITIAL_BATCH_SIZE = 100;
		const BACKLOG_TIMEOUT = 60000; // 60s — generous timeout for bulk backlog fetches
		let imported = 0;
		let skipped = 0;

		// Build initial queue of batches
		let pending = [];
		for (let i = 0; i < missing_ids.length; i += INITIAL_BATCH_SIZE) {
			pending.push(missing_ids.slice(i, i + INITIAL_BATCH_SIZE));
		}
		backlog_logger.info(`Starting with batch size ${INITIAL_BATCH_SIZE}, ${pending.length} batches queued for ${missing_ids.length} jobs`);

		while (pending.length > 0) {
			let batch = pending.shift();
			let jobInfoUrl = helpers.build_new_api_url(`/job_info`, host, global.config["STATIC_API_NEW_PORT"]);
			try {
				let batchResponse = await axios.post(jobInfoUrl, { jobids: batch, vars: varsArray }, { timeout: BACKLOG_TIMEOUT });
				if (batchResponse && batchResponse.data && batchResponse.data.history) {
					backlog_history_jobs.push(...batchResponse.data.history);
				}
				imported += batch.length;
				backlog_total_imported += batch.length;
			} catch (e) {
				const isTimeout = e.code === 'ECONNABORTED' || (e.message && e.message.includes('timeout'));
				if (isTimeout && batch.length > MIN_BATCH_SIZE) {
					// Split in half and re-queue — adapt to whatever speed the API can handle
					let half = Math.floor(batch.length / 2);
					backlog_logger.warn(`Batch of ${batch.length} timed out, splitting into two batches of ${half} and ${batch.length - half}`);
					pending.unshift(batch.slice(half));
					pending.unshift(batch.slice(0, half));
				} else {
					// Too small to split further, or non-timeout error — skip this batch
					backlog_logger.error(`Skipping ${batch.length} jobs after unrecoverable error: ${e.message}`);
					skipped += batch.length;
				}
			}

			// Progress update every 1000 imported jobs
			if (imported > 0 && imported % 1000 === 0) {
				backlog_logger.info(`Progress: ${backlog_total_imported} imported, ${skipped} skipped of ${backlog_total_to_import} total (${pending.length} batches remaining)`);
				try { global.socketio.emit("error", `Background import: ${backlog_total_imported} of ${backlog_total_to_import} jobs imported...`); } catch (e) { }
			}

			// Parse incrementally every 2000 jobs to free memory and show progress sooner
			if (backlog_history_jobs.length >= 2000) {
				backlog_logger.info(`Parsing intermediate batch of ${backlog_history_jobs.length} jobs...`);
				await parseHistoryJobs(backlog_history_jobs);
				backlog_history_jobs = [];
			}
		}

		// Parse any remaining jobs
		if (backlog_history_jobs.length > 0) {
			backlog_logger.info(`Parsing final batch of ${backlog_history_jobs.length} jobs...`);
			await parseHistoryJobs(backlog_history_jobs);
		}

		backlog_logger.info(`Background backlog import finished: ${backlog_total_imported} imported, ${skipped} skipped of ${backlog_total_to_import} total.`);
		try { global.socketio.emit("error", `Background import: Completed. ${backlog_total_imported} of ${backlog_total_to_import} jobs imported${skipped > 0 ? `, ${skipped} skipped` : ''}.`); } catch (e) { }

	} catch (ex) {
		backlog_logger.error(`Background backlog import error: ${ex.message || ex}`);
		if (ex.stack) backlog_logger.error(ex.stack);
	} finally {
		backlog_import_running = false;
	}
}


async function parseRunningJobs(a_running) {

	// if(error) {
	// 	error_count_running++;
	// 	console.error('Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ');
	// 	console.error(error);

	// 	if (error_count_running > 3){
	// 		//global.socketio.emit("error", 'Error getting running jobs.');
	// 		try{
	// 			/* take care about alert email */
	// 			if (!alert_sent){
	// 				sendEmailAlert("ALERT! FFAStrans is down","Got an error fetching jobs from: <br/>" + global.config.STATIC_GET_RUNNING_JOBS_URL );
	// 				alert_sent = true;
	// 			}
	// 		}catch(ex){
	// 			console.error("Could not send email alert message: ", ex.stack)
	// 		}
	// 	}

	// 	return;
	// }

	// //no error, go on...
	// error_count_running = 0;
	// if (alert_sent){
	// 	//send all good email if needed
	// 	alert_sent = false;
	// 	try{
	// 		sendEmailAlert("FFAStrans is up again","The system did successfully respond to " + global.config.STATIC_GET_RUNNING_JOBS_URL );

	// 	}catch(ex){
	// 		console.error("Could not send email alert message (good again): ", ex.stack);
	// 	}
	// }

	// /* end of alert email */

	var jobArray = a_running;

	var all_jobs = []
	for (i = 0; i < jobArray.length; i++) {

		current_job = jobArray[i];
		try {
			//we translate start_time to job_start for internal webint db
			current_job.job_start = getDateStr(jobArray[i]["start_time"]);
		} catch (exc) {
			console.error("Could not parse start time from API response jobarray entry:", jobArray[i], exc);
		}
		current_job.wf_name = jobArray[i]["workflow"].toString();
		all_jobs.push(current_job);

	}//for all jobs

	/* 
		notify connected browsers 
		they will pull the list again from getactivejobsajax_treegrid in order to get a filtered list
	*/

	try {
		console.log("sending activejobs event with count: ", all_jobs.length)
		global.socketio.emit("activejobs", all_jobs.length);
	} catch (exc) {
		console.error("Error occured while sending activejobs to clients: " + exc + body)
	}

	global.lastactive = JSON.stringify(all_jobs);

}

function parseQueuedJobs(responseBody) {

	try {
		//QUEUED JOBS (in ffastrans queued folder)
		let q_obj = responseBody.tickets.queued;
		if (q_obj !== undefined) {
			for (let i = 0; i < q_obj.length; i++) {
				q_obj[i]["key"] = JSON.stringify(q_obj[i]).hashCode();
				q_obj[i]["split_id"] = ""
				q_obj[i]["state"] = "Queued";
				q_obj[i]["title"] = "Queued";
				q_obj[i]["steps"] = "";
				q_obj[i]["progress"] = "0";
				q_obj[i]["workflow"] = q_obj[i]["workflow"].toString();
				if ("sources" in q_obj[i]) {
					if ("sources" in q_obj[i] && Object.keys(q_obj[i].sources).length != 0) {
						q_obj[i]["source"] = path.basename(q_obj[i]["sources"]["current_file"]);
					} else if ("source" in q_obj[i]) {
						q_obj[i]["source"] = path.basename(q_obj[i]["source"]);
					}

				}
				q_obj[i]["host"] = "Queued";
				q_obj[i]["status"] = "Queued";
				try {
					q_obj[i]["job_start"] = getDateStr(q_obj[i]["submit"]["time"]);
				} catch (ex) {
					console.log("getdate failed on:", q_obj[i])
				}
				q_obj[i]["proc"] = "Queued";
			}
		}

		//send the new jobs to connected clients, todo: only notify clients about new stuff
		if (responseBody.tickets.queued) {
			global.lastqueued = JSON.stringify(q_obj);
			global.socketio.emit("queuedjobs");
		} else {
			console.log("Error, we should not come here, queued")
			global.socketio.emit("queuedjobs", "[]");
			//global.socketio.emit("queuedjobcount", 0);               
		}
	} catch (exc) {
		console.error("Error occured while sending queuedjobs to clients: " + exc)
		console.error(exc.stack)
		console.error(q_obj)

	}

}

async function parseHistoryJobs(all_jobs) {

	if (!global.db.deleted_jobs) {
		console.log("global.db.deleted_jobs not defined, is Database started yet?")
		return;
	}
	try {

		if (all_jobs.length === 0) {
			return;
		}

		var jobArray = all_jobs;

		//filter deleted, todo: is it really good/needed to filter deleted here or is a filter in gethistoryjobsajax_treegrid.js enough?
		var job_id_array = jobArray.map(job => job.job_id)
		var deleted_ids = await global.db.deleted_jobs.find({ "job_id": { "$in": job_id_array } });
		deleted_ids = await deleted_ids.toArray();
		deleted_ids = new Set(deleted_ids.map(doc => doc.job_id));//mongo docs to string array
		//restructure array from ffastrans,build famliy tree
		var non_deleted_jobs = []
		for (let i = 0; i < jobArray.length; i++) {
			//only jobguid plus split makes each job entry unique
			jobArray[i]["_id"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];

			//data for client display
			jobArray[i].state = m_jobStates[jobArray[i]["state"]];
			jobArray[i].outcome = jobArray[i]["result"];
			//don't store result field (we store as outcome)
			delete jobArray[i]["result"];
			jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
			jobArray[i].job_end = getDateStr(jobArray[i]["end_time"]);
			//remove start_time and end_time from the final object as we use unified job_start in the rest of webui
			delete jobArray[i]["start_time"];
			delete jobArray[i]["end_time"];

			jobArray[i].duration = (getDurationStringFromDates(jobArray[i].job_start, jobArray[i].job_end) + "");
			jobArray[i].wf_name = jobArray[i]["workflow"].toString();

			//filter deleted jobs from new joblist
			if (!deleted_ids.has(jobArray[i]["job_id"])) {
				non_deleted_jobs.push(jobArray[i]);
			} else {
				continue;
			}

		}
		jobArray = non_deleted_jobs;//go on only with non deleted jobs

		// Append to global.lasthistory up to 500 elements for other components (like getjobstate) to quickly peek recent history jobs
		let old_history = [];
		try {
			if (global.lasthistory) old_history = JSON.parse(global.lasthistory);
		} catch (e) { }
		let combined_history = [...jobArray, ...old_history];
		if (combined_history.length > 500) combined_history = combined_history.slice(0, 500);
		global.lasthistory = JSON.stringify(combined_history);

		//get last 10k jobids from DB - child jobs need to finish within that period to be grouped correctly;-)
		var lastTenThousand = await global.db.jobs.find({}, { sort: { job_start: -1 }, projection: { job_start: 1, job_id: 1, "children._id": 1 } }).limit(10000);
		lastTenThousand = await lastTenThousand.toArray();
		//make list of all existing _id's / traverse children and main objects
		var existingInternalIds = new Set();
		for (const _job of lastTenThousand) {
			existingInternalIds.add(_job._id);
			if (_job.children) {
				for (const _child of _job.children) {
					existingInternalIds.add(_child._id);
				}
			}
		}
		//mainjob and children share the same job_id
		var existingMainJob_job_ids = new Set(lastTenThousand.map((my) => my.job_id));

		for (let i = 0; i < jobArray.length; i++) {
			if (existingInternalIds.has(jobArray[i]._id) && existingMainJob_job_ids.has(jobArray[i].job_id)) {
				//job already in db
				continue;
			}

			//this is a new job
			var existingIndex = existingMainJob_job_ids.has(jobArray[i].job_id) ? 1 : -1;
			var insertedDoc;

			if (existingIndex == -1) {
				//check if deleted

				//insert new mainjob if needed
				var newmainjob = JSON.stringify(jobArray[i]);//mainjob = copy of current job
				newmainjob = JSON.parse(newmainjob);
				newmainjob.children = [];
				newmainjob._id = jobArray[i].job_id + "_main"; //internal database id for mainjob, just for the db, not for use in code!
				newmainjob.result = ""; //we delete result as only childs contain it.
				try {
					insertedDoc = await global.db.jobs.insertOne(newmainjob);
				} catch (exceptiopatronum) {
					console.error("Error inserting job into db. Job:", newmainjob);
					console.error(exceptiopatronum);

				}
				existingMainJob_job_ids.add(newmainjob.job_id); //supports multiple branches finished in single fetcher run

			}

			//get mainjob from db and insert child
			var mainjob = await global.db.jobs.findOne({ job_id: jobArray[i].job_id });

			if (mainjob.children.length == 0) {
				//we inserted a new mainjob, add first child
				jobArray[i]._id = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
				mainjob.children.push(jobArray[i]);
			} else {
				//udpate existing mainjob
				var existingChildIds = mainjob.children.map((child) => child._id);
				if (existingChildIds.indexOf(jobArray[i]._id) == -1) {
					mainjob.children.push(jobArray[i]);
					//get data start and end of mainjob
					mainjob.job_start = getYoungestJobStart(mainjob.children);
					mainjob.job_end = getOldestJobEnd(mainjob.children);
					mainjob.duration = (getDurationStringFromDates(mainjob.job_start, mainjob.job_end) + "");
					mainjob.state = getJobstate(mainjob.children);
					mainjob.outcome = getJobOutcome(mainjob.children);
				}
			}

			//update mainjob, inserts additional children

			insertedDoc = await global.db.jobs.updateOne({ job_id: jobArray[i].job_id }, { $set: mainjob }, { upsert: true });

			if (insertedDoc) {
				console.log("New History Job: ", jobArray[i]);
				global.socketio.emit("newhistoryjob");//inform clients about the current num of history job
			}

			continue;
		}//for
	}
	catch (ex) {
		console.log(ex.stack);

	}

}

/* HELPERS */

function objectWithoutKey(key, obj) {
	var { [key]: val, ...rest } = obj;
	return rest;
}

function getJobstate(a_children) {
	// JOBFETCHER_AGGREGATE_BRANCH_STATE can be Error, Success or main_branch
	// if success, then if any branch is success, the job is success
	// if error, then if any branch is error, the job is error
	// if main_branch, then the branch with split_id 1-0-0 defines the state
	var state = a_children[a_children.length - 1].state;
	var preferState = global.config.JOBFETCHER_AGGREGATE_BRANCH_STATE || "Success";

	// Handle main_branch option DISABLED because we only want main job outcome, not state
	if (preferState === "main_branch") {
		preferState = "Error";
	}

	for (let i = 0; i < a_children.length; i++) {
		var _job = a_children[i];

		if (_job.state == preferState) {
			state = preferState;
		}
		if (_job.state == "Cancelled") {
			state = "Cancelled";
		}
	}
	return state;
}

function getJobOutcome(a_children) {
	// JOBFETCHER_AGGREGATE_BRANCH_STATE can be Error, Success or main_branch
	// if success, then if any branch is success, the job is success
	// if error, then if any branch is error, the job is error
	// if main_branch, then the branch with split_id 1-0-0 defines the state
	var outcome = a_children[a_children.length - 1].outcome;
	var preferState = global.config.JOBFETCHER_AGGREGATE_BRANCH_STATE || "Success";

	// Handle main_branch option
	if (preferState === "main_branch") {

		var mainBranchJob = a_children.find(job => {
			var mainBranchVar = job.variables?.find(v => v.name === "s_is_main_branch");
			var _job = job;
			if (mainBranchVar) {
				return true;
			}
		});

		if (mainBranchJob) {
			outcome = mainBranchJob.outcome;
			return outcome;
		}
	}

	for (let i = 0; i < a_children.length; i++) {
		var _job = a_children[i];
		if (_job.state == preferState) {
			outcome = _job.outcome;
		}
	}
	return outcome;
}


function getYoungestJobStart(a_children) {
	var youngest_start = a_children[0].job_start;
	for (let i = 0; i < a_children.length; i++) {
		var _job = a_children[i];
		if (_job.job_start < youngest_start)
			youngest_start = _job.job_start;
	}
	return youngest_start;
}

function getOldestJobEnd(a_children) {
	var oldest_end = a_children[0].job_end;
	for (let i = 0; i < a_children.length; i++) {
		var _job = a_children[i];
		if (_job.job_end > oldest_end)
			oldest_end = _job.job_end;
	}
	return oldest_end;
}

function getDateObj(str) {
	//ffastrans date:2019-10-14T21:22:35.046-01.00
	return moment(str).toDate();
}

function getDateStr(str) {
	//ffastrans date:2019-10-14T21:22:35.046-01.00
	try {
		var re = new RegExp(".....$");
		var tz = str.match(/.(\d\d)$/);
		if (tz) {
			tz = tz[1];
		} else {
			tz = "00";
			str = str.replace("Z", "+00:00");//incoming jobs have wrong date format, this attempts to correct it
		}
		if (tz == "50") //translate between momentjs and ffastrans timezone
			tz = "30"
		var to_parse = str.replace(/...$/, ":" + tz);
		var parsed = moment.parseZone(to_parse)
		return parsed.format("YYYY-MM-DD HH:mm:ss");
	} catch (ex) {
		console.error("Error getDate: " + str);
		throw ex;
	}
}

function getDurationStringFromDates(start_date, end_date) {
	//sconsole.log(start_date,end_date)
	var delta = Math.abs(new Date(end_date) - new Date(start_date)) / 1000;// get total seconds between the times
	var days = Math.floor(delta / 86400);// calculate (and subtract) whole days
	delta -= days * 86400;// calculate (and subtract) whole hours
	var hours = Math.floor(delta / 3600) % 24;
	delta -= hours * 3600;// calculate (and subtract) whole minutes
	var minutes = Math.floor(delta / 60) % 60;
	delta -= minutes * 60;// what's left is seconds
	var seconds = delta % 60;  // in theory the modulus is not required

	return pad(hours) + ":" + pad(minutes) + ":" + pad((seconds + "").replace(/\.\d+/, "")); //TODO: seconds now contain ms... split this off
}

function pad(num) {
	var s = num + "";
	while (s.length < 2) s = "0" + s;
	return s;
}

function hashCode(string) {
	//this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
	var hash = 0, i, chr;
	if (string.length === 0) return hash;
	for (i = 0; i < string.length; i++) {
		chr = string.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

/* STRUCTS */
Object.defineProperty(String.prototype, 'hashCode', {
	value: function () {
		var hash = 0, i, chr;
		for (i = 0; i < this.length; i++) {
			chr = this.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	}
});

//MOVED TO REST 
// async function renewInstallInfo(about_url){
//     //refresh ffastrans install info infinitely
//     while (true){
//         await sleep(15000);
//         var install_info;
//         try{
//             install_info = await doRequest(about_url);
//             install_info = JSON.parse(install_info);
//         }catch(ex){
//             console.error("Error getting install info, is FFAStrans API online?", about_url)
//         }

//         if (global.api_config["s_SYS_DIR"] != install_info["about"]["general"]["install_dir"] + "/"){
//             console.log("Detected move of FFAStrans installation, resetting paths");
//             global.api_config["s_SYS_DIR"] = install_info["about"]["general"]["install_dir"] + "/";
//             global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
//             global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
//             global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";
//         }
//     }
// }

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


async function sendEmailAlert(subject, body) {
	if (!("email_alert_config" in global.config)) {
		return;
	}
	try {
		var rcpt = global.config["email_alert_config"]["email_alert_rcpt"];

		console.log("Sending alert email to: ", rcpt)
		console.log("Email sending result:", await smptMail.send(rcpt, subject, body));

	} catch (ex) {
		console.error(ex.stack);
		console.error("Error sending email: ", ex);
	}
}
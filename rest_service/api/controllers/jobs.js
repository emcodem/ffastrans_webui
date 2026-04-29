'use strict';
const os = require('os')
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");
const ffastrasHistoryHelper = require("./common/ffastrans_history_jobs.js");
const ffastrasActiveJobHelper = require("./common/ffastrans_active_jobs.js");

module.exports = {
    post_jobs: post,
    job_info_post: postJobInfo,
    get: get,
    put: put
};

var jobs_cache = { born: 0, data: false, _refreshPromise: null }
// Dedup map for bypass-cache requests: key → { born, data, _refreshPromise }
var jobs_bypass_dedup = new Map();
const BYPASS_DEDUP_MAX_AGE_MS = 3000; // reuse identical bypass results for 3s
// Housekeeping: prevent the dedup map from growing unbounded
setInterval(() => {
    const cutoff = Date.now() - BYPASS_DEDUP_MAX_AGE_MS * 2;
    for (const [key, entry] of jobs_bypass_dedup) {
        if (entry.born < cutoff && !entry._refreshPromise) jobs_bypass_dedup.delete(key);
    }
}, 10000);

async function get(req, res) {
    const benchmarkId = `getJobs ${Math.random()}`;
    console.time(benchmarkId);
    try {

        let start = Number(req.query.start);
        let end = Number(req.query.count);

        if (Number.isNaN(start) || Number.isNaN(end)) {
            start = 0;
            end = 100;
        }

        let variablesFilter = null
        if (req.query.vars) {
            try {
                variablesFilter = req.query.vars.split("|")
            } catch (ex) {
                console.error("Error parsing variables filter:", req.query.vars)
            }
        }

        let return_id_only = req.query.return_id_only ? true : false;
        let statusFilter = req.query.status;
        
        // Support both single jobid and multiple jobids (comma-separated)
        let jobids = [];
        if (req.query.jobids) {
            jobids = req.query.jobids.split(',').map(id => id.trim());
        } else if (req.query.jobid) {
            jobids = [req.query.jobid];
        }

        // Handle check_finished mode - lightweight job status polling
        let check_finished = req.query.check_finished ? true : false;
        if (check_finished) {
            if (jobids.length === 0) {
                console.timeEnd(benchmarkId);
                return res.status(400).json({ error: "check_finished requires either jobid or jobids parameter" });
            }

            const jobPath_dir = path.join(global.api_config["s_SYS_CACHE_DIR"], "jobs");
            const results = [];

            for (const jobid of jobids) {
                const jobPath = path.join(jobPath_dir, jobid);
                const fullLogPath = path.join(jobPath, "full_log.json");
                
                try {
                    // Check if job folder exists
                    let jobExists = false;
                    try {
                        await fsPromises.access(jobPath);
                        jobExists = true;
                    } catch {
                        jobExists = false;
                    }

                    // Check if job is finished (full_log.json exists)
                    let finished = false;
                    if (jobExists) {
                        try {
                            await fsPromises.access(fullLogPath);
                            finished = true;
                        } catch {
                            finished = false;
                        }
                    }
                    
                    results.push({
                        jobid: jobid,
                        finished: finished,
                        exists: jobExists
                    });
                } catch (ex) {
                    console.error(`Error checking job status for ${jobid}:`, ex);
                    results.push({
                        jobid: jobid,
                        finished: false,
                        exists: false
                    });
                }
            }

            // Return single object if single jobid, array if multiple
            const responseData = jobids.length === 1 ? results[0] : results;
            res.json(responseData);
            console.timeEnd(benchmarkId);
            return;
        }

        //if start and end was set or params bypass cache, we cannot use cache mode
        if (start != 0 || end != 100 || return_id_only || statusFilter || jobids.length > 0) {
            // Dedup identical bypass requests via serialized key
            const dedupKey = JSON.stringify([start, end, jobids, variablesFilter, return_id_only, statusFilter]);
            let entry = jobs_bypass_dedup.get(dedupKey);
            const now = Date.now();
            if (!entry || (entry.born < now - BYPASS_DEDUP_MAX_AGE_MS && !entry._refreshPromise)) {
                entry = { born: 0, data: null, _refreshPromise: null };
                jobs_bypass_dedup.set(dedupKey, entry);
            }
            if (entry.born < now - BYPASS_DEDUP_MAX_AGE_MS || !entry.data) {
                if (!entry._refreshPromise) {
                    entry._refreshPromise = (async () => {
                        try {
                            let a_jobs = (!statusFilter || statusFilter === 'history' || statusFilter === 'all')
                                ? await ffastrasHistoryHelper.getHistoryJobs(start, end, jobids, variablesFilter, return_id_only) : [];
                            let a_active = (!statusFilter || statusFilter === 'active' || statusFilter === 'all')
                                ? await ffastrasActiveJobHelper.getActiveJobs(start, end, jobids, return_id_only) : [];
                            entry.data = { history: a_jobs, active: a_active };
                            entry.born = Date.now();
                        } catch (ex) {
                            console.error("Error in jobs bypass dedup:", ex);
                        } finally {
                            entry._refreshPromise = null;
                        }
                    })();
                }
                await entry._refreshPromise;
            }
            res.json({ discovery: req.headers.referer, ...entry.data });
            console.timeEnd(benchmarkId);
            return;
        }
        /* ensure we only read the jobs from filesystem once every x seconds */
        const currentTime = new Date();
        let maxAge = new Date(currentTime.getTime() - 3 * 1000);
        if (jobs_cache.born < maxAge || !jobs_cache.data) {
            // If no refresh is in flight, start one; otherwise reuse the existing promise
            if (!jobs_cache._refreshPromise) {
                jobs_cache._refreshPromise = (async () => {
                    try {
                        let a_jobs = await ffastrasHistoryHelper.getHistoryJobs(start, end, [], variablesFilter);
                        let a_active = await ffastrasActiveJobHelper.getActiveJobs(start, end, []);
                        jobs_cache.data = { history: a_jobs, active: a_active };
                        jobs_cache.born = new Date();
                    } catch (ex) {
                        console.error("Error refreshing jobs:", ex);
                    } finally {
                        jobs_cache._refreshPromise = null;
                    }
                })();
            }
            await jobs_cache._refreshPromise;
        }
        res.json({ discovery: req.headers.referer, ...jobs_cache.data });
        console.timeEnd(benchmarkId);

    } catch (ex) {
        console.log("return error")
        console.log(ex)

        console.timeEnd(benchmarkId);
        return res.status(500).json({ message: ex, description: "" });
    }
}

async function put(req, res) {
    //Pause, resume and abort sub jobs
    //{"action": "<state>","identifier": "","split_id": ""}

    // var example_body = {
    //     "action": "Pause, resume and abort sub jobs",
    //     "job": "",
    //     "split_id": "",
    //     "user" : "username",
    //     "host" : "hostname",
    //     "extra" : {"duration":"millis"}
    // }
    var s_action = req.body.action;
    var job_id = req.body.job_id ? req.body.job_id : (req.query.jobid || req.query.jobids?.split(',')[0])
    var split_id = req.body.split_id;
    var s_extra = req.body.value ? req.body.value : '';
    if (!req.body.user) {
        req.body.user = common.getUserName()
    }
    if (!req.body.system) {
        req.body.system = os.hostname()
    }
    //var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
    var splitpart = split_id ? "~" + split_id : "";

    try {
        if (s_action == 'pause') {
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".pause~" + job_id + splitpart), req.body.user + '@' + req.body.system);
            s_extra = Number(s_extra);
            if (s_extra) {
                //auto resume
                console.log("Pause Job with enabled auto resume in " + s_extra + " Millis")
                setTimeout(async function () {
                    fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".pause~" + job_id + splitpart));
                })
            }
        }
        else if (s_action == 'abort') {
            let done = false;
            if (typeof s_extra === 'string') {
                if (s_extra.match(/mons/)) {
                    //abort incoming by move from mons/i one level up
                    const destinationPath = path.join(path.dirname(s_extra), '..', path.basename(s_extra));
                    await fsPromises.rename(s_extra, destinationPath);
                    done = true;
                }
            }
            //by default just write the status abort file
            if (!done)
                await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".abort~" + job_id + splitpart), s_extra.toString() + ':' + req.body.user + '@' + req.body.system);

        }
        else if (s_action == 'resume') {
            await fsPromises.unlink(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".pause~" + job_id + splitpart))
        }
        else if (s_action == 'priority') {
            s_extra = Number(s_extra);
            await fsPromises.writeFile(path.join(global.api_config["s_SYS_CACHE_DIR"], "status", ".priority~" + job_id + splitpart), s_extra.toString());
        }
        else {
            throw new Error("Action not supported: [" + s_action + "]")
        }
        res.json({ success: true });
        res.end();
        return;
    } catch (ex) {
        console.error("PUT Job error:", ex);
        return res.status(500).json({ message: ex.toString() });
    }
}

async function createSingleJob(jobData) {
    /* creates a single job ticket and writes to disk */
    var t = new common.JobTicket();
    await t.init_ticket(jobData.wf_id, jobData.start_proc);
    t.setSource(jobData.inputfile);
    t.variables = jobData.variables;
    t.submit.variables = jobData.variables;
    if (jobData.priority) {
        t.priority = jobData.priority;
    }

    var fname = await t.getFileName();
    var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"], "tickets", "temp", fname);
    var tick_pending_path = path.join(global.api_config["s_SYS_CACHE_DIR"], "tickets", "pending", fname);
    console.log("Creating new Job ticket: ", tick_temp_path);
    await fsPromises.writeFile(tick_temp_path, JSON.stringify(t));
    await fsPromises.rename(tick_temp_path, tick_pending_path);

    return {
        "uri": "/jobs/" + t.job_id,
        "job_id": t.job_id
    };
}

async function post(req, res) {
    const benchmarkId = `postJobs ${Math.random()}`;
    console.time(benchmarkId);
    try {
        /* writes a new jobticket to disk for ffastrans to process 
           Accepts a single job object or an array of job objects */
        
        // Handle array of jobs or single job
        var jobs = Array.isArray(req.body) ? req.body : [req.body];
        var results = [];

        for (var job of jobs) {
            try {
                var result = await createSingleJob(job);
                results.push(result);
            } catch (jobErr) {
                results.push({
                    "error": jobErr.toString(),
                    "inputfile": job.inputfile || "unknown"
                });
            }
        }

        // Return single object for single job, array for multiple
        if (!Array.isArray(req.body)) {
            if (results[0].error) {
                return res.status(500).json({ message: results[0].error, description: results[0].error });
            }
            res.json(results[0]);
        } else {
            res.json(results);
        }
        res.end();
        console.timeEnd(benchmarkId);
    } catch (err) {
        console.error("POST Job Error", err);
        console.timeEnd(benchmarkId);
        return res.status(500).json({ message: err.toString(), description: err });
    }
}

async function postJobInfo(req, res) {
    const benchmarkId = `postJobInfo ${Math.random()}`;
    console.time(benchmarkId);
    try {
        // Batch fetch request: fetch multiple job details efficiently
        // Body should contain: { jobids: [...], status: 'active|history|all', vars: [...] }
        if (!req.body.jobids || !Array.isArray(req.body.jobids)) {
            console.timeEnd(benchmarkId);
            return res.status(400).json({ message: "Missing or invalid jobids array in request body" });
        }
        
        let jobids = req.body.jobids;
        let variablesFilter = req.body.vars ? (Array.isArray(req.body.vars) ? req.body.vars : req.body.vars.split("|")) : null;
        let statusFilter = req.body.status || null;
        
        let a_jobs = (!statusFilter || statusFilter === 'history' || statusFilter === 'all')
            ? await ffastrasHistoryHelper.getHistoryJobs(0, jobids.length, jobids, variablesFilter, false) : [];
        let a_active = (!statusFilter || statusFilter === 'active' || statusFilter === 'all')
            ? await ffastrasActiveJobHelper.getActiveJobs(0, jobids.length, jobids, false) : [];
        
        let returnobj = { history: a_jobs, active: a_active };
        res.json(returnobj);
        console.timeEnd(benchmarkId);
    } catch (err) {
        console.error("POST Job Info Error", err);
        console.timeEnd(benchmarkId);
        return res.status(500).json({ message: err.toString(), description: err });
    }
}

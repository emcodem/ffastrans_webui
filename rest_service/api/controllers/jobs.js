'use strict';
const os = require('os')
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/helpers.js");
const ffastrasHistoryHelper = require("./common/ffastrans_history_jobs.js");
const ffastrasActiveJobHelper = require("./common/ffastrans_active_jobs.js");

module.exports = {
    post_jobs: post,
    get: get,
    put: put
};

var jobs_cache = { is_refreshing: false, born: 0, data: false }
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

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

        //if start and end was set, we cannot use cache mode
        if (start != 0 || end != 100) {
            let a_jobs = await ffastrasHistoryHelper.getHistoryJobs(start, end, req.query.jobid, variablesFilter);
            let a_active = await ffastrasActiveJobHelper.getActiveJobs(start, end, req.query.jobid);
            let returnobj = { discovery: req.headers.referer, history: a_jobs, active: a_active }
            res.json(returnobj)
            console.timeEnd(benchmarkId);
            return;
        }
        /* ensure we only read the jobs from filesystem once every x seconds */
        while (jobs_cache.is_refreshing) {
            await sleep(1);
        }

        const currentTime = new Date();
        let maxAge = new Date(currentTime.getTime() - 3 * 1000);
        if (jobs_cache.born < maxAge || !jobs_cache.data) {
            jobs_cache.is_refreshing = true;
            try {
                let a_jobs = await ffastrasHistoryHelper.getHistoryJobs(start, end, req.query.jobid, variablesFilter);
                let a_active = await ffastrasActiveJobHelper.getActiveJobs(start, end, req.query.jobid);
                jobs_cache.data = { discovery: req.headers.referer, history: a_jobs, active: a_active }

            } catch (ex) {
                console.error("Error refreshing jobs:", ex)
            } finally {
                jobs_cache.is_refreshing = false;
            }
        }
        res.json(jobs_cache.data)
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
    var job_id = req.body.job_id ? req.body.job_id : req.query.jobid
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
    /* writes a new jobticket to disk for ffastrans to process 
       Accepts a single job object or an array of job objects */
    var example_body = {
        "wf_id": "<workflow id>",
        "inputfile": "<full path to file>",
        "start_proc": "<processor node id>",
        "priority": 2,//optional, default is workflow prio
        "variables": [
            {
                "name": "<s_string>",
                "data": "<string>"
            },
            {
                "name": "<i_string>",
                "data": "<integer>"
            },
            {
                "name": "<f_string>",
                "data": "<number>"
            }
        ]
    }

    try {
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
    } catch (err) {
        console.error("POST Job Error", err);
        return res.status(500).json({ message: err.toString(), description: err });
    }
}

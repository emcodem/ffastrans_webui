const path = require("path");
const fs = require("fs-extra");
const { readFile } = require("./helpers");


module.exports = {
    getHistoryJobs: getHistoryJobs,
    _getCacheDiagnostics: _getCacheDiagnostics,
    _clearCaches: _clearCaches
};

let fileContentDatabase = {}; // currently unused — kept for diagnostics only
let jobCache = {};//{job_id:[task,task]},job_id:...}
let workaround_dispel_database = {}; //workaround missing dispel info in ffastrans job json, currently we parse job log to find out if dispel

function roughSizeOf(obj) {
    try { return Buffer.byteLength(JSON.stringify(obj), 'utf8'); } catch { return -1; }
}

function _getCacheDiagnostics() {
    return {
        jobCacheSize: Object.keys(jobCache).length,
        jobCacheBytes: roughSizeOf(jobCache),
        dispelDbSize: Object.keys(workaround_dispel_database).length,
        dispelDbBytes: roughSizeOf(workaround_dispel_database),
        fileContentDbSize: Object.keys(fileContentDatabase).length,
        fileContentDbBytes: roughSizeOf(fileContentDatabase)
    };
}

function _clearCaches() {
    jobCache = {};
    workaround_dispel_database = {};
    fileContentDatabase = {};
}

async function getHistoryJobs(start, end, jobids = [], variablesFilter = null, return_id_only = false) {
    /* returns "splits" instead of "jobs", this is problematic for caching because we want to cache jobs in order to prevent having to constantly list all split files */
    let taskArray = [];
    const cacheKeys = Object.keys(jobCache);
    if (cacheKeys.length > 1000) { //housekeeping
        jobCache = Object.fromEntries(Object.entries(jobCache).slice(-1000));
    }
    const dispelKeys = Object.keys(workaround_dispel_database);
    if (dispelKeys.length > 5000) { //housekeeping — was previously unbounded
        workaround_dispel_database = Object.fromEntries(Object.entries(workaround_dispel_database).slice(-5000));
    }
    
    let perf_start = Date.now();
    const getDirectories = async source =>
        (await fs.readdir(source, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

    let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"], "jobs");
    let subfolders = [];
    
    // Handle multiple jobids or single jobid
    if (Array.isArray(jobids) && jobids.length > 0) {
        subfolders = jobids;
    } else {
        subfolders = await getDirectories(jobDir);
        console.debug(`Performance Dirlist ${jobDir}: ${Date.now() - perf_start}ms`);
        subfolders = subfolders.sort().reverse();
    }
    perf_start = Date.now();
    if (subfolders.length > 10000)
        console.warn("Found more than 10.000 jobs in cache/jobs folder, consider automatic deletion.")

    if (return_id_only) {
        return subfolders.slice(start, start + end).map(id => ({ job_id: id }));
    }

    let startcount = 0;
    let jobCount = 0;
    for (let job_id of subfolders) {
        startcount++;
        if (startcount < start)
            continue
        if (jobCount >= end)
            break;
        if (jobCache[job_id]) {
            //push all splits from this job into taskArray
            taskArray.push(...jobCache[job_id]);
            jobCount++;
            continue;
        }

        //excludes unfinished jobs
        if (!(await fs.exists(path.join(jobDir, job_id, "full_log.json"))))
            continue

        //from here we are sure to have a finished job
        if (!jobCache[job_id]) {
            jobCache[job_id] = [];
        }
        let finisheddir = path.join(jobDir, job_id, "finished")
        let split_ids = (await fs.readdir(finisheddir, { withFileTypes: true })).map(dirent => dirent.name)
        console.debug(`Performance Dirlist ${finisheddir}: ${Date.now() - perf_start}ms`);
        perf_start = Date.now();

        let taskjsonpath = path.join(jobDir, job_id, ".json");
        let taskjson;
        try {
            let taskjsonStr = await fs.readFile(taskjsonpath, 'utf8');
            taskjsonStr = taskjsonStr.replace(/^\uFEFF/, ''); //BOM
            taskjson = JSON.parse(taskjsonStr);
        } catch (ex) {
            console.error(`Error reading job json ${taskjsonpath}:`, ex);
            continue; // skip this job if unable to read base json
        }
        console.debug(`Performance read job json ${taskjsonpath}: ${Date.now() - perf_start}ms`);

        for (let split_id of split_ids) {
            if (split_id.indexOf("log") != -1)
                continue
            try {
                let splitfilepath = path.join(finisheddir, split_id);
                if (true) {
                    //ffastrans 1.4 does not flag dispel in the job json \u2014 we detect it from the
                    //job log instead. A dispelling conditional logs a "conditional" trace entry
                    //carrying data.dispel:true, immediately followed by the "node end" entry, so
                    //the marker always lives in the last two array elements. Read those backward
                    //from EOF \u2014 log files can be hundreds of MB, so we never load the whole file.
                    let _logpath = path.join(finisheddir, path.parse(splitfilepath).name + "_log" + ".json");

                    if (!workaround_dispel_database.hasOwnProperty(_logpath)) {
                        try {
                            let lastObjs = await readLastJsonObjects(_logpath, 2);
                            console.debug(`Performance read last 2 log objects ${_logpath}: ${Date.now() - perf_start}ms`);
                            perf_start = Date.now();
                            let dispelled = lastObjs.some(o => o && o.data && o.data.dispel === true);
                            workaround_dispel_database[_logpath] = { dispel: dispelled };
                        } catch (ex) {
                            //i dont care about errors here, its just the dispel workaround
                            workaround_dispel_database[_logpath] = { dispel: false };
                        }
                    }
                    if (workaround_dispel_database[_logpath].dispel) {//if job ended due to dispel, hide job
                        continue;
                    }


                }
                if (!taskjson.hasOwnProperty(split_id)) {
                    let splitcontent = await fs.readFile(splitfilepath, 'utf8');//no need to cache the file, we cache the parsed job obj in jobCache
                    splitcontent = splitcontent.replace(/^\uFEFF/, ''); //BOM
                    splitcontent = JSON.parse(splitcontent);
                    //let splitcontent    = await readJsonFileCached(splitfilepath);
                    console.debug(`Performance read jobjson ${splitfilepath}: ${Date.now() - perf_start}ms`);
                    perf_start = Date.now();
                    taskjson[split_id] = splitcontent;
                }
                let current_split = buildSplitInfo(taskjson, split_id);

                //we return only variables that are used in variablecolumns
                if (variablesFilter && current_split.variables) {
                    current_split.variables = current_split.variables.filter(v => {
                        // Keep the variable if it matches any of the provided filters
                        return variablesFilter.some(f => {

                            return v.name == f;
                        });
                    });
                } else {
                    //by default return no variables
                    current_split.variables = [];
                }
                taskArray.push(current_split);
                jobCache[job_id].push(current_split);

            } catch (ex) {
                console.trace(ex);
            }
        }
        console.debug(`Performance job ${job_id}: ${Date.now() - perf_start}ms`);
        perf_start = Date.now();
        jobCount++;
    }
    return taskArray;
}

function buildSplitInfo(jobInfo, splitId) {
    //returns ffastra
    var result = jobInfo[splitId].result;
    var display_name = jobInfo[splitId].sources.pretty_name
    if (jobInfo[splitId].status !== 1) {
        try {
            result = jobInfo[splitId].error.msg
        } catch {
            result = jobInfo[splitId].result;
        }
        display_name = jobInfo[splitId].sources.original_file || jobInfo[splitId].sources.current_file
    }
    var to_return = {
        /* 
            we use start_time and end_time here instead of job_start for api backward compatibility reasons 
        */
        "start_time": jobInfo[splitId].submit.time,
        "end_time": jobInfo[splitId].end_time,
        "job_id": jobInfo.job_id,
        "result": result,
        "source": display_name,
        "split_id": splitId,
        "state": jobInfo[splitId].status, //TODO! OK, thanks emcodem of the past.. what exactly todo here?
        "workflow": jobInfo.workflow.name,
        "variables": jobInfo[splitId].variables || []
    }
    return to_return;
}

/**
 * Reads the last `count` top-level elements of a JSON-array file by scanning
 * backward from EOF in chunks — the file (a FFAStrans job log) can be hundreds
 * of MB, so we never load it whole. Returns the parsed objects (oldest first).
 *
 * We can't split on newlines/commas because string values may legitimately
 * contain either, so we track brace depth plus string/escape state while reading
 * right-to-left. The structural characters we test ({ } [ ] " \) are all ASCII,
 * so scanning raw UTF-8 bytes is safe even through multibyte sequences.
 */
async function readLastJsonObjects(filepath, count = 2) {
    const CHUNK = 16 * 1024;
    let _fh;
    try {
        _fh = await fs.promises.open(filepath, 'r');
        let read = 0;
        const { size } = await _fh.stat();
        let buf = Buffer.alloc(0);

        while (read < size) {
            const grow = Math.min(CHUNK, size - read);
            const chunk = Buffer.alloc(grow);
            await _fh.read({ buffer: chunk, offset: 0, length: grow, position: size - read - grow });
            buf = Buffer.concat([chunk, buf]);
            read += grow;

            const start = findStartOfLastElements(buf, count);
            if (start !== -1) {
                // buf[start..] is `{...},{...}]` — wrap in [ to parse as an array
                return JSON.parse('[' + buf.toString('utf8', start));
            }
        }
        // fewer than `count` elements in the whole file: parse the array as-is
        return JSON.parse(buf.toString('utf8').replace(/^﻿/, ''));
    } finally {
        _fh?.close();
    }
}

/**
 * Scans `buf` right-to-left and returns the byte index where the `count`-th
 * top-level array element (counting from the end) begins, or -1 if fewer than
 * `count` complete elements are present in the buffer. The outermost array is
 * depth 1; a `{` that drops depth from 2 to 1 starts a top-level object.
 */
function findStartOfLastElements(buf, count) {
    let depth = 0;
    let inString = false;
    let found = 0;
    for (let i = buf.length - 1; i >= 0; i--) {
        const c = buf[i];
        if (inString) {
            if (c === 0x22 /* " */) {
                let bs = 0, j = i - 1;
                while (j >= 0 && buf[j] === 0x5C /* \ */) { bs++; j--; }
                if (bs % 2 === 0) inString = false; // unescaped quote -> string opens
            }
            continue;
        }
        switch (c) {
            case 0x22: inString = true; break;     // "
            case 0x5D:                             // ]
            case 0x7D: depth++; break;             // }
            case 0x5B: depth--; break;             // [
            case 0x7B:                             // {
                depth--;
                if (depth === 1 && ++found === count) return i;
                break;
        }
    }
    return -1;
}

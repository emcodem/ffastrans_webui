const path = require("path");
const fs = require("fs-extra");
const { getBusyJobIds } = require("./ffastrans_active_jobs.js");

// A finished job is normally marked by a consolidated full_log.json. The engine
// occasionally finishes a job (all branches written to finished\) but never writes
// that file, leaving the job permanently invisible to history. When full_log.json
// is missing we treat the job as finished only if no branch is still active AND its
// root .json has been untouched for at least this long — this guards the brief
// fan-out window where a parent's monitor file is gone before its children's appear.
const ORPHAN_MIN_AGE_MS = 30000; // can be promoted to a config knob later


module.exports = {
    getHistoryJobs: getHistoryJobs,
    _getCacheDiagnostics: _getCacheDiagnostics,
    _clearCaches: _clearCaches
};

let fileContentDatabase = {}; // currently unused — kept for diagnostics only
let jobCache = {};//{job_id:{version,rows:[task,task]}}
let workaround_dispel_database = {}; //legacy log fallback for split JSONs without a boolean dispel flag

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

function filterSplitVariables(split, variablesFilter) {
    // Cached rows retain all variables; every request gets its own projection.
    const variables = Array.isArray(variablesFilter)
        ? split.variables.filter(variable => variablesFilter.includes(variable.name))
        : [];
    return { ...split, variables };
}

function getSplitState(split) {
    return typeof split.state === 'number' ? split.state
        : typeof split.status === 'number' ? split.status : undefined;
}

function clearJobDispelCache(jobDir, jobId) {
    const prefix = path.join(jobDir, jobId, 'finished') + path.sep;
    for (const logPath of Object.keys(workaround_dispel_database)) {
        if (logPath.startsWith(prefix)) delete workaround_dispel_database[logPath];
    }
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
    const busyJobIds = await getBusyJobIds();
    // An observed retry invalidates the previous completed result, even if
    // that job is outside this request's pagination window.
    for (const job_id of busyJobIds) {
        delete jobCache[job_id];
        clearJobDispelCache(jobDir, job_id);
    }
    for (let job_id of subfolders) {
        startcount++;
        if (startcount < start)
            continue
        if (jobCount >= end)
            break;
        if (busyJobIds.has(job_id))
            continue;
        let fullLogStat;
        let finishedStat;
        const finisheddir = path.join(jobDir, job_id, 'finished');
        try {
            fullLogStat = await fs.stat(path.join(jobDir, job_id, 'full_log.json'));
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
        if (fullLogStat) {
            try {
                finishedStat = await fs.stat(finisheddir);
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
            }
        }
        // The consolidated log changes on a retry; the finished directory
        // changes when a previously missing split or legacy branch log arrives.
        const fullLogVersion = fullLogStat
            ? `${fullLogStat.mtimeMs}:${fullLogStat.ctimeMs}:${fullLogStat.size}:${finishedStat?.mtimeMs}:${finishedStat?.ctimeMs}` : null;
        if (jobCache[job_id]?.version === fullLogVersion) {
            //push all splits from this job into taskArray
            taskArray.push(...jobCache[job_id].rows.map(split => filterSplitVariables(split, variablesFilter)));
            jobCount++;
            continue;
        }
        if (jobCache[job_id]) {
            delete jobCache[job_id];
            clearJobDispelCache(jobDir, job_id);
        }

        //excludes unfinished jobs. Normally a finished job has a consolidated
        //full_log.json. If it's missing the job may still be running, or the engine
        //finished it but never wrote full_log.json (orphaned finalization). Only
        //treat it as finished when no branch is active and it has settled.
        const hasFullLog = !!fullLogStat;
        if (!hasFullLog) {
            try {
                let rootStat = await fs.stat(path.join(jobDir, job_id, ".json"));
                if (Date.now() - rootStat.mtimeMs < ORPHAN_MIN_AGE_MS)
                    continue; //still settling / fan-out window -> re-evaluate on a later call
            } catch (ex) {
                continue; //no root .json -> nothing to import
            }
            //otherwise fall through: orphaned-but-finished, build from finished\ below
        }

        //from here we are sure to have a finished job
        let split_ids;
        try {
            split_ids = (await fs.readdir(finisheddir, { withFileTypes: true }))
                // Legacy abort/retry snapshots can use names such as
                // 1-10-10.<timestamp>_<host> without a .json extension.
                .filter(dirent => dirent.isFile() &&
                    (/\.json$/i.test(dirent.name) || /^\d+(?:-\d+)*\.\d+_.+$/.test(dirent.name)) &&
                    !/_log\.json$/i.test(dirent.name))
                .map(dirent => dirent.name);
        } catch (ex) {
            //no finished\ output (e.g. job crashed before any branch completed) -> skip
            //without seeding jobCache, so the job can be re-evaluated on a later call
            console.warn(`Skipping job ${job_id}: cannot read finished dir: ${ex.message}`);
            continue;
        }
        const jobRows = [];
        // Orphan detection is provisional. Never freeze a partially completed
        // job during a gap between monitor entries or while files are written.
        let cacheable = hasFullLog;
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
            try {
                let splitfilepath = path.join(finisheddir, split_id);
                if (!taskjson.hasOwnProperty(split_id)) {
                    let splitcontent = await fs.readFile(splitfilepath, 'utf8');//no need to cache the file, we cache the parsed job obj in jobCache
                    splitcontent = splitcontent.replace(/^\uFEFF/, ''); //BOM
                    splitcontent = JSON.parse(splitcontent);
                    //let splitcontent    = await readJsonFileCached(splitfilepath);
                    console.debug(`Performance read jobjson ${splitfilepath}: ${Date.now() - perf_start}ms`);
                    perf_start = Date.now();
                    taskjson[split_id] = splitcontent;
                }
                // Numeric outcomes are present on finished branches in both
                // legacy/1.5 status and experimental state formats.
                if (getSplitState(taskjson[split_id]) === undefined)
                    continue;
                //The split JSON's boolean flag is authoritative; no branch log is needed.
                let dispelled = taskjson[split_id].dispel;
                if (typeof dispelled !== "boolean") {
                    //Older split JSONs may omit dispel, so retain the legacy log fallback.
                    //A dispelling conditional logs a "conditional" trace entry
                    //carrying data.dispel:true, immediately followed by the "node end" entry, so
                    //the marker always lives in the last two array elements. Read those backward
                    //from EOF \u2014 log files can be hundreds of MB, so we never load the whole file.
                    let _logpath = path.join(finisheddir, path.parse(splitfilepath).name + "_log" + ".json");

                    if (!hasFullLog || workaround_dispel_database[_logpath]?.version !== fullLogVersion) {
                        try {
                            let lastObjs = await readLastJsonObjects(_logpath, 2);
                            console.debug(`Performance read last 2 log objects ${_logpath}: ${Date.now() - perf_start}ms`);
                            perf_start = Date.now();
                            let logDispelled = lastObjs.some(o => o && o.data && o.data.dispel === true);
                            workaround_dispel_database[_logpath] = { dispel: logDispelled, version: fullLogVersion };
                        } catch (ex) {
                            // Missing logs are legitimate in newer formats. The
                            // directory version invalidates cached rows if a log
                            // arrives later; other read failures must be retried.
                            delete workaround_dispel_database[_logpath];
                            if (ex.code !== 'ENOENT') cacheable = false;
                        }
                    }
                    dispelled = workaround_dispel_database[_logpath]?.dispel;
                }
                if (dispelled) //if the split ended due to dispel, hide it
                    continue;
                let current_split = buildSplitInfo(taskjson, split_id);
                taskArray.push(filterSplitVariables(current_split, variablesFilter));
                jobRows.push(current_split);

            } catch (ex) {
                cacheable = false;
                console.trace(ex);
            }
        }
        // Publish only complete reads, after the async work, so parallel calls
        // cannot see an empty or partially populated cache entry.
        if (cacheable && jobRows.length > 0) jobCache[job_id] = { version: fullLogVersion, rows: jobRows };
        console.debug(`Performance job ${job_id}: ${Date.now() - perf_start}ms`);
        perf_start = Date.now();
        jobCount++;
    }
    return taskArray;
}

function buildSplitInfo(jobInfo, splitId) {
    //returns ffastra
    //Numeric outcomes: 0=error, 1=success, 2=abort. 1.5 and legacy files use
    //status; experimental files may use state. Textual progress is not an outcome.
    var state = getSplitState(jobInfo[splitId]);
    var result = jobInfo[splitId].result;
    var display_name = jobInfo[splitId].sources.pretty_name
    if (state !== 1) {
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
        "start_time": jobInfo[splitId].start_time ?? jobInfo[splitId].submit?.time,
        "end_time": jobInfo[splitId].end_time,
        "job_id": jobInfo.job_id,
        "result": result,
        "source": display_name,
        "split_id": splitId,
        "state": state,
        "workflow": jobInfo[splitId].wf_name ?? jobInfo.workflow?.name,
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

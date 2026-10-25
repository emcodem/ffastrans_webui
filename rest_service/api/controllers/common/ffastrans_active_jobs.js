const path = require("path");
const fs = require("fs-extra");
const helpers = require("./helpers.js");

module.exports = {
    getActiveJobs: getActiveJobs,
    getBusyJobIds: getBusyJobIds
};

async function getBusyJobIds() {
    const busyIds = new Set((await getActiveJobs(0, Number.MAX_SAFE_INTEGER, [], true)).map(row => row.job_id));
    const ticketsDir = path.join(global.api_config["s_SYS_CACHE_DIR"], 'tickets');
    let subdirs;
    try {
        subdirs = await fs.readdir(ticketsDir, { withFileTypes: true });
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        return busyIds;
    }
    // Pending/queued/held tickets also keep a job alive before its next
    // monitor entry appears, including retries with an older full_log.json.
    for (const subdir of subdirs.filter(entry => entry.isDirectory())) {
        let files;
        try {
            files = await fs.readdir(path.join(ticketsDir, subdir.name));
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            continue;
        }
        for (const file of files) {
            const match = /^[^~]+~([^~]+)~.+\.json$/i.exec(file);
            if (match) busyIds.add(match[1]);
        }
    }
    return busyIds;
}

async function getActiveJobs(start=0,end=1000, jobids = [], return_id_only = false){
    /* scan db/monitor folder for .json files */
    let returnArray = [];
    let jobDir      = path.join(global.api_config["s_SYS_CACHE_DIR"],"monitor");
    let ticketDirRunning   = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","running");
    
    let listDir     = path.join(jobDir, ".list"); //ffastrans > 1.4.0.7 indexes running branches in .list
    let entries;
    try {
        entries = await fs.readdir(listDir, { withFileTypes: true });
    } catch (error) {
        // A listing failure must not look like an empty monitor: history uses
        // ID-only results to decide whether a job has stopped running.
        if (error.code !== 'ENOENT') throw error;
        try {
            entries = await fs.readdir(jobDir, { withFileTypes: true });
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            entries = [];
        }
    }

    //TODO: if .list folder and queue folder has the jobid_splitid file, its actually a queued job, we must exclude it in this case

    const requestedJobs = new Set(Array.isArray(jobids) ? jobids : []);
    const allFiles = entries.filter(entry => entry.isFile()).map(entry => entry.name);
    for (let file of allFiles){
        const match = /^(.+)~([^~]+)\.json$/i.exec(file);
        if (!match || (requestedJobs.size && !requestedJobs.has(match[1]))) {
            continue;
        }
        let fullPath = path.join(jobDir, file);
      
        try{
            if (return_id_only) {
                returnArray.push({
                    job_id: match[1],
                    split_id: match[2]
                });
                continue;
            }
            var contents        = await fs.readFile(fullPath,"utf-8");
            contents            = JSON.parse(contents.replace(/^\uFEFF/, ''));
            contents.job_id     = match[1];
            contents.split_id   = match[2];
            // FFAStrans 1.5 monitor rows contain their own priority and display fields.
            // The root job file is optional enrichment and may disappear during cleanup.
            try {
                let jobJson_Path = path.join(global.api_config["s_SYS_CACHE_DIR"],"jobs",contents.job_id,".json");
                let jobJson = await fs.readFile(jobJson_Path,"utf-8");
                jobJson = JSON.parse(jobJson.replace(/^\uFEFF/, ''));
                contents.priority = jobJson.priority ?? contents.priority;
            } catch (ex) {}
            
            if (contents.priority == null){
                //read prio from ticket if any
                try{
                    let tickets = await helpers._fileList(ticketDirRunning, "*~" + contents.job_id + "~*~" + contents.split_id +  '~*.json', 0, 0, 'files');
                    if (tickets.length == 1){
                        contents.priority = path.parse(tickets[0]).name.split("~")[0];
                    }
                }catch(ex){}
            }
            returnArray.push(contents);
        }catch(ex){
            console.error("Unexpected Error parsing active jobs job file. Message:",ex)
            console.error("File Name: " + fullPath);
            console.error("File Contents: " + contents);
        }
    }
    return returnArray;
}

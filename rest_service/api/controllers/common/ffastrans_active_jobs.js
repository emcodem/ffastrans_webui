const path = require("path");
const fs = require("fs-extra");
const helpers = require("./helpers.js");

module.exports = {
    getActiveJobs: getActiveJobs
};

async function getActiveJobs(start=0,end=1000, jobid = '*'){
    /* scan db/monitor folder for .json files */
    let returnArray = [];
    let jobDir      = path.join(global.api_config["s_SYS_CACHE_DIR"],"monitor");
    let ticketDir   = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","running");
    let listDir     = path.join(jobDir, ".list"); //ffastrans > 1.4.0.7 wants the jsons to be read from .list folder in order to mitigate locked files issue
    try {
        await fs.access(listDir);
    } catch (error) {
        listDir = jobDir
    }

    const allFiles = await helpers._fileList(listDir, jobid + '*.json', 0, 0, 'files');
    for (let file of allFiles){
        let fullPath = path.join(jobDir, file);
      
        try{
            var contents        = await fs.readFile(fullPath,"utf-8");
            contents            = JSON.parse(contents.replace(/^\uFEFF/, ''));
            contents.job_id     = file.split("~")[0];
            contents.split_id   = file.split("~")[1].replace(".json","");
            let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"],"jobs");
            let jobJson_Path = path.join(jobDir,contents.job_id,".json");
            let jobJson = await fs.readFile(jobJson_Path,"utf-8");
            jobJson = JSON.parse(jobJson.replace(/^\uFEFF/, ''));
            contents.priority = jobJson.priority;
            
            if (!contents.priority){
                //read prio from ticket if any
                try{
                    let tickets = await helpers._fileList(ticketDir, "*" + jobid + "*" + contents.split_id +  '*.json', 0, 0, 'files');
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

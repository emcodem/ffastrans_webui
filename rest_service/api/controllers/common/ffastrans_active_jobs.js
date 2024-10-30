const path = require("path");
const fs = require("fs-extra");

module.exports = {
    getActiveJobs: getActiveJobs
};

async function getActiveJobs(start=0,end=1000){
    /* scan db/monitor folder for .json files */
    let returnArray = [];
    let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"],"monitor");
    const allFiles = await fs.readdir(jobDir, { withFileTypes: true })

    for (let file of allFiles){
        if (!file.name.match(/json$/))
            continue

        let fullPath = path.join(jobDir,file.name);
      
        try{
            var contents        = await fs.readFile(fullPath,"utf-8");
            contents            = JSON.parse(contents.replace(/^\uFEFF/, ''));
            contents.job_id     = file.name.split("~")[0];
            contents.split_id   = file.name.split("~")[1].replace(".json","");
            let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"],"jobs");
            let jobJson_Path = path.join(jobDir,contents.job_id,".json");
            let jobJson = await fs.readFile(jobJson_Path,"utf-8");
            jobJson = JSON.parse(jobJson.replace(/^\uFEFF/, ''));
            contents.priority = jobJson.priority;
            returnArray.push(contents);
        }catch(ex){
            console.error("Unexpected Error parsing active jobs job file. Message:",ex)
            console.error("File Name: " + fullPath);
            console.error("File Contents: " + contents);
        }
    }
    return returnArray;
}

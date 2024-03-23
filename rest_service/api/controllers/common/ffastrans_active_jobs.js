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
            contents            = JSON.parse(contents.replace(/^\uFEFF/, ''))
            contents.job_id     = file.name.split("~")[0];
            contents.split_id   = file.name.split("~")[1];
            returnArray.push(contents);
        }catch(ex){
            console.trace("Unexpected Error parsing jobfile",ex)
        } 
    }
    return returnArray;
}

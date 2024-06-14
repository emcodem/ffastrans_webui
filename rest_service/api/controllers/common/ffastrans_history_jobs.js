const path = require("path");
const fs = require("fs-extra");

module.exports = {
    getHistoryJobs                 : getHistoryJobs
};

var fileContentDatabase = {};

async function getHistoryJobs(start,end){
    let returnArray = [];
    let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"],"jobs");
    const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

      var subfolders = await getDirectories(jobDir)
      subfolders= subfolders.sort().reverse()
      var startcount = 0;
      for (let jobid of subfolders){
        startcount++;
        if (startcount < start)
            continue
        if (returnArray.length >= end)
            continue
        if (! (await fs.exists(path.join(jobDir,jobid,"full_log.json"))))
            continue

        let finisheddir = path.join(jobDir,jobid,"finished")
        let splits = (await fs.readdir(finisheddir, { withFileTypes: true })).map(dirent => dirent.name)
        for (let split of splits){
            if (split.indexOf("log") != -1)
                continue

            try{
                let splitfilepath   = path.join(finisheddir,split);
                let jobjsonpath     = path.join(jobDir,jobid,".json");
                let jobjson         = await readJsonFileCached(jobjsonpath);
                if (!jobjson.hasOwnProperty(split)){
                    let splitcontent    = await readJsonFileCached(splitfilepath);
                    jobjson[split]      = splitcontent;
                }
                //todo: check if dispelled
                
                returnArray.push(buildSplitInfo(jobjson,split))
            }catch(ex){
                console.trace(ex)
            } 
        }
      }
      return returnArray;
}

function buildSplitInfo(jobInfo,splitId){
    //returns ffastra
    var result = jobInfo[splitId].result;
    if (jobInfo[splitId].status == 0){
        result = jobInfo[splitId].error.msg;
    }
    var to_return =  {
        "start_time": jobInfo[splitId].submit.time,
        "end_time": jobInfo[splitId].end_time,
        "job_id": jobInfo.job_id,
        "result": result,
        "source": jobInfo[splitId].sources.original_file || jobInfo[splitId].sources.current_file,
        "split_id": splitId,
        "state": jobInfo[splitId].status, //TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        "workflow": jobInfo.workflow.name
    }
    return to_return;
}

async function readJsonFileCached(fname){
    
    while(fileContentDatabase.length > 1000){ //housekeeping
        let popped = fileContentDatabase.pop();
    }

    if (fileContentDatabase.hasOwnProperty(fname)){
        return fileContentDatabase[fname]
    }
    let content = await fs.readFile(fname, 'utf8')
    content = content.replace(/^\uFEFF/, '');
    content     = JSON.parse(content)
    fileContentDatabase[fname] = content
    return content;
}
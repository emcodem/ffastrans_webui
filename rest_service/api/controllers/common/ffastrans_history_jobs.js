const path = require("path");
const fs = require("fs-extra");
const { readfile_cached } = require("./helpers");


module.exports = {
    getHistoryJobs                 : getHistoryJobs
};

let fileContentDatabase = {};
let workaround_dispel_database = {}; //workaround missing dispel info in ffastrans job json, currently we parse job log to find out if dispel

async function getHistoryJobs(start,end){
    let taskArray = [];
   
    let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"],"jobs");
    const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

      let subfolders = await getDirectories(jobDir)
      subfolders= subfolders.sort().reverse()
      if (subfolders.length > 10000)
        console.warn("Found more than 10.000 jobs in cache/jobs folder, consider automatic deletion.")
      
      let startcount = 0;
      let jobCount = 0;
      for (let jobid of subfolders){
        startcount++;
        if (startcount < start)
            continue
        if (jobCount >= end)
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
                if (path.parse(splitfilepath.name = "")){
                    //funky workaround: check last 2-3 log lines if conditional proc did dispel // ffastrans 1.4 does not contain info about dispel
                    let _logpath = path.join(finisheddir,path.parse(splitfilepath).name + "_log" + ".json")
                    workaround_dispel_database[_logpath] = {dispel:false}
                    if (!workaround_dispel_database.hasOwnProperty(_logpath)){
                        try{
                            let last2lines = await readfile_cached(_logpath,false,3,1,"job_log_last_2_lines_workaround_dispel");
                            //TODO: this cost lots of performance, check ffastrans version once we have some that supports indicating dispel in json
                            if (last2lines.indexOf("dispel\":true") != -1){//if job ended due to dispel, hide job
                                workaround_dispel_database[_logpath] = {dispel:true}
                            }
                        }catch(ex){
                            //i dont care about errors here, its just the dispel workaround
                        }
                    }
                    if (workaround_dispel_database[_logpath].dispel){//if job ended due to dispel, hide job
                        continue;
                    }


                }
                if (!jobjson.hasOwnProperty(split)){
                    let splitcontent    = await readJsonFileCached(splitfilepath);
                    jobjson[split]      = splitcontent;
                }

                
                taskArray.push(buildSplitInfo(jobjson,split))
            }catch(ex){
                console.trace(ex)
            } 
        }
        jobCount++;
      }
      return taskArray;
}

function buildSplitInfo(jobInfo,splitId){
    //returns ffastra
    var result = jobInfo[splitId].result;
    if (jobInfo[splitId].status == 0){
        result = jobInfo[splitId].error.msg;
    }
    var to_return =  {
        /* 
            we use start_time and end_time here instead of job_start for api backward compatibility reasons 
        */
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
const path = require("path");
const fs = require("fs-extra");
const { readfile_cached } = require("./helpers");


module.exports = {
    getHistoryJobs                 : getHistoryJobs
};

let fileContentDatabase = {};
let jobCache = {};//{job_id:[task,task]},job_id:...}
let workaround_dispel_database = {}; //workaround missing dispel info in ffastrans job json, currently we parse job log to find out if dispel

async function getHistoryJobs(start,end){
    /* returns "splits" instead of "jobs", this is problematic for caching because we want to cache jobs in order to prevent having to constantly list all split files */
    let taskArray = [];
    if (Object.keys(jobCache).length > 1000){ //housekeeping
        jobCache = Object.fromEntries(Object.entries(jobCache).slice(Object.keys(jobCache).length-1000,Object.keys(jobCache).length));
    }
    let jobDir = path.join(global.api_config["s_SYS_CACHE_DIR"],"jobs");
    let perf_start = Date.now();
    const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

      let subfolders = await getDirectories(jobDir);
      console.debug(`Performance Dirlist ${jobDir}: ${Date.now() - perf_start}ms`);
      perf_start = Date.now();
      subfolders= subfolders.sort().reverse()
      if (subfolders.length > 10000)
        console.warn("Found more than 10.000 jobs in cache/jobs folder, consider automatic deletion.")
      
      let startcount = 0;
      let jobCount = 0;
      for (let job_id of subfolders){
        startcount++;
        if (startcount < start)
            continue
        if (jobCount >= end)
            break;
        if (jobCache[job_id]){
            //push all splits from this job into taskArray
            taskArray.push(...jobCache[job_id]);
            jobCount++;
            continue;
        }
        
        //excludes unfinished jobs
        if (! (await fs.exists(path.join(jobDir,job_id,"full_log.json"))))
            continue 

        //from here we are sure to have a finished job
        if (!jobCache[job_id]){
            jobCache[job_id] = [];
        }
        let finisheddir = path.join(jobDir,job_id,"finished")
        let split_ids = (await fs.readdir(finisheddir, { withFileTypes: true })).map(dirent => dirent.name)
        console.debug(`Performance Dirlist ${finisheddir}: ${Date.now() - perf_start}ms`);
        perf_start = Date.now();
        for (let split_id of split_ids){
            if (split_id.indexOf("log") != -1)
                continue
            try{
                let splitfilepath   = path.join(finisheddir,split_id);
                let taskjsonpath    = path.join(jobDir,job_id,".json");
                let taskjson        = await fs.readFile(taskjsonpath, 'utf8');//no need to cache the file, we cache the parsed job obj in jobCache
                taskjson            = taskjson.replace(/^\uFEFF/, ''); //BOM
                taskjson             = JSON.parse(taskjson);
                console.debug(`Performance read job json ${taskjsonpath}: ${Date.now() - perf_start}ms`);
                if (true){
                    //funky workaround: check last 2-3 log lines if conditional proc did dispel // ffastrans 1.4 does not contain info about dispel
                    let _logpath = path.join(finisheddir,path.parse(splitfilepath).name + "_log" + ".json");
                    
                    if (!workaround_dispel_database.hasOwnProperty(_logpath)){
                        try{
                            // let last2lines = await readfile_cached(_logpath,false,false,1,"job_log_last_2_lines_workaround_dispel");
                            // let thelog        = await fs.readFile(_logpath, 'utf8');//no need to cache the file, we cache the parsed job obj in jobCache
                            // thelog            = thelog.replace(/^\uFEFF/, ''); //BOM
                            let last2lines = await readEndOfFile(_logpath);
                            console.debug(`Performance read last 2 lines ${_logpath}: ${Date.now() - perf_start}ms`);
                            perf_start = Date.now();
                            //TODO: this cost lots of performance, check ffastrans version once we have some that supports indicating dispel in json
                            if (last2lines.indexOf("dispel\":true") != -1){//if job ended due to dispel, hide job
                                workaround_dispel_database[_logpath] = {dispel:true};
                            }else{
                                workaround_dispel_database[_logpath] = {dispel:false};
                            }
                        }catch(ex){
                            //i dont care about errors here, its just the dispel workaround#
                            workaround_dispel_database[_logpath] = {dispel:false}
                        }
                    }
                    if (workaround_dispel_database[_logpath].dispel){//if job ended due to dispel, hide job
                        continue;
                    }


                }
                if (!taskjson.hasOwnProperty(split_id)){
                    let splitcontent        = await fs.readFile(splitfilepath, 'utf8');//no need to cache the file, we cache the parsed job obj in jobCache
                    splitcontent            = splitcontent.replace(/^\uFEFF/, ''); //BOM
                    splitcontent = JSON.parse(splitcontent);
                    //let splitcontent    = await readJsonFileCached(splitfilepath);
                    console.debug(`Performance read jobjson ${splitfilepath}: ${Date.now() - perf_start}ms`);
                    perf_start = Date.now();
                    taskjson[split_id]      = splitcontent;
                }
                let current_split = buildSplitInfo(taskjson,split_id);
                taskArray.push(current_split);
                jobCache[job_id].push(current_split);
                
            }catch(ex){
                console.trace(ex);
            } 
        }
        console.debug(`Performance job ${job_id}: ${Date.now() - perf_start}ms`);
        perf_start = Date.now();
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

async function readEndOfFile(filepath,how_much = 1000){
    //the node module to read last 2 lines was crap, slower than reading all file so we try this low level method
    var SIZE    = how_much; // 64 byte intervals
    let _fh;
    try{
        _fh         = await fs.promises.open(filepath, 'r');
        let _fstat  = await _fh.stat();        
        let maxlen = _fstat.size < how_much ? _fstat.size : how_much;
        let pos     = _fstat.size < how_much ? 0 : _fstat.size - how_much;
        let buffer  = new Buffer.alloc(maxlen);
        let res     = await _fh.read({buffer:buffer,offset:0,length:maxlen,position:pos});
        return (buffer.toString());
    }catch(ex){
        console.error("Error reading end of file",filepath,ex)
    }finally{
        _fh?.close();
    }
}

async function readJsonFileCached(fname){
    if(Object.keys(fileContentDatabase).length > 1000){ //housekeeping
        fileContentDatabase = Object.fromEntries(Object.entries(fileContentDatabase).slice(Object.keys(fileContentDatabase).length-1000,Object.keys(fileContentDatabase).length));
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
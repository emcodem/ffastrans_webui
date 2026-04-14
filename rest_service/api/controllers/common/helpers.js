const fsPromises = require('fs').promises;
const { PromisePool } = require('@supercharge/promise-pool');
const path = require("path")
const os = require('os')
const { uuid } = require('uuidv4');
const moment = require('moment-timezone');
var md2 = require('js-md2');
var md5 = require('js-md5');
var fs = require('fs');
const { spawn } = require('child_process');

function _GetNow(){
    return moment().format('Y-MM-DDTHH:mm:ss.SSSZ');
}

class JobTicket {
    constructor() {
 
    }

    split_id        = 		""
    job_id          = 		""
    workflow        = 		{}
    nodes           = 		[]
    submit          =		{}
    finished        = 		""
    sources         = 		{}
    retries         = 		""
    variables       = 	    []

    async init_ticket(wf_id,start_proc_id){
        
        var $o_workflow = await readJsonFile(locateWorkflowFile(wf_id));
        var prio = 2;
        try{
            prio = $o_workflow.general.priority.charAt(0)
        }catch(ex){}

        var $i_index = $o_workflow.nodes.findIndex(node => node.id == start_proc_id);
        if ($i_index < 0)
            $i_index = 0
        if (!$i_index)
            $i_index = 0
        
        this.split_id        = 		"1-"+$i_index+"-0"
        this.job_id          = 		_MyGuid()
        this.workflow.id     = 		wf_id
        this.nodes           = 		{}
        this.nodes.next      = 	    {}
        this.nodes.next.id   =       $o_workflow.nodes[$i_index].id
        this.nodes.next.slots = 		$o_workflow.nodes[$i_index].slots || 1
		this.nodes.next.hosts_group =	$o_workflow.nodes[$i_index].hosts_group ||  0
        this.nodes.next.type = 		$o_workflow.nodes[$i_index].type
        this.nodes.start     = 	    {}
        this.nodes.last      = 	    {}
        this.submit.method   =       'api'
		this.submit.system   =       'webui'
		this.submit.user     =       "WebUI_RestService"
		this.submit.client   =       "WebUI_RestService"
		this.submit.time     =       _GetNow()
        this.finished        = 		{}
        this.sources         = 		{}
        this.sources.sets    = 	    []
        this.retries         = 		{}
        
        this.sources.current_file    = 	""
		this.sources.original_file   = 	""
		this.sources.localized_file  = 	""
        this.sources.pretty_name     = 	""

        this.variables               = 	[]

        this.priority        =      prio
    }

    async getFileName(){
        //need to add md5 hash to filename
        
        let s = path.join (global.api_config["s_SYS_CONFIGS_DIR"],"ffastrans.json");
        s = await fsPromises.readFile(s, 'utf8') //read file
        let ffastrans = s.replace(/^\uFEFF/, '');
        ffastrans = JSON.parse(ffastrans);
        var jstring = JSON.stringify(this);
        let hash;
        try{
            //old ffastrans versions use md2 for ticket hash, newer md5
            hash = md5(jstring).toUpperCase();
            if (ffastrans && ffastrans.general && ffastrans.general.versions) {
                if (ffastrans.general.versions.queuer.match(/1\.([0-3]\.\d+|4\.0)/)) { //ffastrans queuer 1.4.0.101 is the last version using md2
                    hash = md2(jstring).toUpperCase();
                }
            }    
        }catch(ex){
            console.error("Could not deduce ffastrans.general.versions.queuer version in ffastrans json, assuming we need md2 ticket hash",ex);
            hash = md2(jstring).toUpperCase();
        }
        hash = hash.substring(hash.length-6)
        //5~
        //20230225-2232-1582-4f2e-70ff6e3b8456~
        //1fe36b100~
        //1-0-0
        //~20221103-0745-1336-907a-125b662fa639100
        //~TWI1ANALYSE~7236CB.json
        
        var slots_and_hostgroup = 100;

        //10 is for 1 slot and 0 hostgroup
        var filename_parts = [this.priority.toString().substring(0,1) , this.job_id, uuid().substring(0,6) + slots_and_hostgroup,this.split_id,this.workflow.id,"api_submit",hash];
        return filename_parts.join("~") + ".json";
        
    }

    /* convenience method to set all source vars at once */
    setSource(sourcefile){
        this.sources.current_file    = 	sourcefile
		this.sources.original_file   = 	sourcefile
		this.sources.localized_file  = 	sourcefile
        this.sources.pretty_name     = 	path.basename(sourcefile);
    }
    

}

function _MyGuid(){
    //guid starting with date 20241028-1409-1302-8239-644cd0861a71
    let datepart = moment().format('YYYYMMDD-HHmm-ssSS-');
    return datepart + uuid().toString().substring(datepart.length);
}

function locateWorkflowFile(wf_id){
    var $s_SYS_CONFIGS_DIR = global.api_config["s_SYS_CONFIGS_DIR"];
    var _p = path.join($s_SYS_CONFIGS_DIR,'workflows', wf_id + '.json');
    return _p;
}

async function get_wf_name(wf_id){
	/* do not catch errors here, the caller must do */
            var workflow_folder =  path.join(global.api_config["s_SYS_CACHE_DIR"], "../configs/workflows/");
            var wf_path = path.join(workflow_folder,wf_id) + ".json";
            var wf_obj = await readJsonFile(wf_path);
            
            return wf_obj["wf_name"];
}

async function json_files_to_array(dir) {
    if (!dir){return []}
    var a_results = [];
    var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        
    const pool = await PromisePool
    .for(allfiles)
    .withConcurrency(50) //too big concurrency blocks cpu
    .process(async (cur_file, index, pool) => {
        var fullpath = path.join(dir,cur_file);
        try{
            var newitem = await readJsonFile(fullpath);
            a_results.push(newitem);
        }catch(ex){
            console.error("Error reading file ",JSON.stringify(cur_file),ex);
        }
    })
    return a_results;
}

//all ffastrans tickets in all directories to array
async function ticket_files_to_array(dir, limit = 100) {
		if (!dir){return []}
		var returnarray=[];
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        if (limit > 0) {
            // Get file stats and sort by oldest first
            var filesWithStats = await Promise.all(allfiles.map(async (file) => {
                var fullpath = path.join(dir, file);
                var stat = await fsPromises.stat(fullpath);
                return { file, birthtime: stat.birthtime };
            }));
            filesWithStats.sort((a, b) => a.birthtime - b.birthtime);
            allfiles = filesWithStats.slice(0, limit).map(f => f.file);
        }
        
        for (var _idx in allfiles){
            try{
                var fullpath = path.join(dir,allfiles[_idx]);
                var newitem = await readJsonFile(fullpath);
                
                var wf_id =  allfiles[_idx].split("~")[4]; //ffastrans >1.3
                if (!wf_id.match(/........-/)){
                    //ffastrans 1.3 changed ticket token structure
                    wf_id =  allfiles[_idx].split("~")[3];
                }
                newitem["fullpath"] = fullpath;
                newitem["internal_wf_id"] = wf_id;
                if (!("internal_wf_name" in newitem)){
                    newitem["internal_wf_name"] = await get_wf_name(wf_id);
                }

                if (!("internal_file_date" in newitem)){ //stat only if needed
                    var _stat = await fsPromises.stat(fullpath);
                    newitem["internal_file_date"] = _stat["birthtime"];
                }
                returnarray.push(newitem)
            }catch(ex){
                console.error("Could not parse Json from file:",path.join(dir,allfiles[_idx]),ex)
            }
        }
		return returnarray;
}


async function readFile(fullpath){
    var contents = await fsPromises.readFile(fullpath, 'utf8');
    contents = contents.replace(/^\uFEFF/, ''); //remove BOM
    return contents;
}

async function readJsonFile(fullpath){
    var contents = await readFile(fullpath);
    return JSON.parse(contents);
}

async function _fileList(dir, pattern = '*', recurse = false, sort = false, reply = 'path') {
    let res = []
    try {
        pattern = pattern.replaceAll('.', '\.');
        pattern = pattern.replaceAll('?', '.');
        pattern = pattern.replaceAll('*', '.*?');
        pattern = pattern.replaceAll('\\', '\\\\');
        let split =  pattern.split('|')
        split.length = 3
        split[0] = split[0].replaceAll(';', '\|');
        split[0] = new RegExp('^' + split[0] + '$', 'ig');
        if (!split[1]) {
            split[1] = '/'
        }
        split[1] = split[1].replaceAll(';', '\|');
        split[1] = new RegExp('^' + split[1] + '$', 'ig');
        if (!split[2]) {
            split[2] = '/'
        }
        split[2] = new RegExp(split[2], 'ig');
        let list = await fsPromises.readdir(dir, { recursive: recurse });
        let file
        let dirr
        for (k of list) {
            file = path.basename(k);
            dirr = path.dirname(k)
            dirr = '\\' + dirr + '\\'
            if (file.match(split[0]) && !file.match(split[1]) && !dirr.match(split[2])) {
                switch (reply) {
                    case 'path':
                        res.push(k);
                        break
                    case 'files':
                        res.push(file);
                        break
                    case 'all':
                        res.push(dir + k);
                }
            }
        }
        if (sort) {
            res.sort()
        }
        return res;
    } catch(err) {
        return res;
    }
}

async function exeCmd(cmd, args = { shell: true }) {
    return new Promise(function (resolve, reject) {
       const child = spawn(cmd, args);
       child.on('exit', function (code, signal) {
          resolve(code);
       });
       child.on('error', function (code, signal) {
          reject(code);
       });
       child.stdout.on('data', (data) => {
          // console.log(`${data}`) 
       });
  
       child.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
       });
    });
  } 

function getUserName() {
    const userInfo = os.userInfo();
    return userInfo.username;
}

module.exports = {
    readFile                    : readFile,
    readJsonFile                : readJsonFile,
    get_wf_name                 : get_wf_name,
    ticket_files_to_array       : ticket_files_to_array,
    json_files_to_array         : json_files_to_array,
    _fileList                   : _fileList,
    getUserName                 : getUserName,
    JobTicket                   : JobTicket,
    exeCmd                      : exeCmd
};

const fsPromises = require('fs').promises;
const path = require("path")
const { uuid } = require('uuidv4');
const moment = require('moment-timezone');
var md2 = require('js-md2');
var md5 = require('js-md5');
var fs = require('fs');
const readlastline =  require('read-last-line');

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
        
        var $o_workflow = await readfile_cached(locateWorkflowFile(wf_id),true);
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
            var wf_obj = await readfile_cached(wf_path,true);
            
            return wf_obj["wf_name"];
}

async function json_files_to_array_cached(dir) {
    if (!dir){return}

    var returnarray=[];
    console.time("readdir")
    var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
    
    for (var _idx in allfiles){
        try{
            var fullpath = path.join(dir,allfiles[_idx]);
            var newitem = await readfile_cached(fullpath,true)//removes BOM;
            returnarray.push(newitem)
        }catch(ex){
            console.log("Could not parse Json from file:",path.join(dir,allfiles[_idx]),ex)
        }
    }
    console.timeEnd("readdir")
    return returnarray;
}

//all ffastrans tickets in all directories to array
async function ticket_files_to_array(dir,cache_name = "unsorted") {
		if (!dir){return}
		var returnarray=[];
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var newitem = await readfile_cached(path.join(dir,allfiles[_idx]),true)//removes BOM	;
                
                var wf_id =  allfiles[_idx].split("~")[3]; //ffastrans <1.3
                if (!wf_id.match(/........-/)){
                    //ffastrans 1.3 changed ticket token structure
                    wf_id =  allfiles[_idx].split("~")[4];
                }
                newitem["fullpath"] = path.join(dir,allfiles[_idx]);
                newitem["internal_wf_id"] = wf_id;
                if (! ("internal_wf_name" in newitem)){
                    newitem["internal_wf_name"] = await get_wf_name(wf_id);
                }

                if (! "internal_file_date" in newitem){ //stat only if needed
                    var _stat = await fsPromises.stat(path.join(dir,allfiles[_idx]));
                    newitem["internal_file_date"] = _stat["birthtime"];
                }
                //push to cache
                var fullpath = path.join(dir,allfiles[_idx]);
                global.filecache[cache_name][fullpath] = {};
                global.filecache[cache_name][fullpath]["birth"] = new Date();
                global.filecache[cache_name][fullpath]["content"] = JSON.stringify(newitem);
                returnarray.push(newitem)
            }catch(ex){
                console.error("Could not parse Json from file:",path.join(dir,allfiles[_idx]),ex,await readfile_cached(path.join(dir,allfiles[_idx])))
            }
        }
        //console.timeEnd("jsonfiles_to_array " + dir);
		return returnarray;
}


async function readfile_cached(fullpath, jsonparse = false, lastlines = false, invalidate_cache_after = 10000, cache_name = "unsorted"){ 
    /* int lastlines reads n lines from end of file */
    /* invalidatecache defines how long to keep the stuff in memory */
    var prevent_delete = fullpath.indexOf("\\configs\\workflows" != -1);//this does nothing because we re-use this function for other stuff than workflows 
    var content_or_json = jsonparse ? "jsoncontent" : "content";
    if (! ("filecache" in global)){
		global.filecache = {};
	}
	if (! (cache_name in global.filecache)){
		global.filecache[cache_name] = {};
	}
    
    for (key in global.filecache[cache_name]){
        //delete from cache older files than 10 seconds
        var now = new Date( );
        var birth = new Date(global.filecache[cache_name][key]["birth"]);
        var birth_plus_maxlifetime = new Date(birth.getTime() + invalidate_cache_after);
        if( birth_plus_maxlifetime < now && !prevent_delete){
            delete global.filecache[cache_name][key]
        }
        
    }
        
    if (Object.keys(global.filecache[cache_name]).length > 5000){
        cache_cleaner(cache_name); //todo: check size instead of blindly deleting 5000
    }

    var stats;
    stats = await fsPromises.stat(fullpath);

	if (fullpath in global.filecache[cache_name]){
		//serve cached file    
		if (!global.filecache[cache_name][fullpath]["content"]){
            console.error("File is in cache but content emtpy, ",global.filecache[cache_name][fullpath])
            console.trace("") //just for debugging
        }
        if (stats.mtimeMs != global.filecache[cache_name][fullpath].mtimeMs) 
            delete global.filecache[cache_name][fullpath] //file changed, needs re-read from disk
        else {    

            return global.filecache[cache_name][fullpath][content_or_json]; //File is served from cache
        }
            
	}

    //File is not in cache, read from disk.
    var contents;
    if (!lastlines){
        contents = await fsPromises.readFile(fullpath, 'utf8');
    }else{
        contents = await readlastline.read(fullpath, lastlines);
    }
    contents = contents.replace(/^\uFEFF/, '');
    global.filecache[cache_name][fullpath] = {};
    global.filecache[cache_name][fullpath]["mtimeMs"] = stats.mtimeMs;
    global.filecache[cache_name][fullpath]["birth"] = new Date();
    global.filecache[cache_name][fullpath]["content"] = contents;
    try{
        global.filecache[cache_name][fullpath]["jsoncontent"] = JSON.parse(contents);
    }catch(ex){
        if (jsonparse){
            throw ex;
        }
    }
    return global.filecache[cache_name][fullpath][content_or_json] ;
	
}


async function cache_cleaner(cache_name){
	for (const key in global.filecache[cache_name]) {
		try{
            await fsPromises.access(key, fs.constants.R_OK | fs.constants.W_OK)
		}catch(ex){
            //file does not exist, delete from cache
            delete global.filecache[cache_name][key];
        }
	}
}

async function _fileList(dir, pattern = '*', recurse = false, sort = false, reply = 'path') {
    var res = []
    pattern = pattern.replaceAll('.', '\.')
    pattern = pattern.replaceAll('?', '.')
    pattern = pattern.replaceAll('*', '.*?')
    pattern = new RegExp('^' + pattern + '$', 'ig');
    var list = await fsPromises.readdir(dir, { recursive: recurse })
    var file
    for (k of list) {
        file = k.replace(/.*\\/, '')
        if (file.match(pattern)) {
            switch (reply) {
                case 'path':
                    res.push(k)
                    break
                case 'files':
                    res.push(file)
                    break
                case 'all':
                    res.push(dir + k)
            }
        }
    }
    if (sort) {
        res.sort()
    }
    return res;
}

module.exports = {
    readfile_cached             : readfile_cached,
    get_wf_name                 : get_wf_name,
    ticket_files_to_array       : ticket_files_to_array,
    json_files_to_array_cached  : json_files_to_array_cached,
    _fileList                   : _fileList,
    JobTicket                   : JobTicket
};

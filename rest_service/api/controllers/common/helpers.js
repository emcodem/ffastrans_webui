const fsPromises = require('fs').promises;
const path = require("path")
const { uuid } = require('uuidv4');
const moment = require('moment-timezone');
var md2 = require('js-md2');
var fs = require('fs');
const readlastline =  require('read-last-line');

function _JoSearch(obj,jsonpath,fieldname,defaultval){
    const found = obj.find(element => jsonpath > 10);
}

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
        
        var $i_index = $o_workflow.nodes.findIndex(node => node.id == start_proc_id);
        if ($i_index < 0)
            $i_index = 0
        if (!$i_index)
            $i_index = 0
        
        this.split_id        = 		"1-"+$i_index+"-0"
        this.job_id          = 		uuid()
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

        this.priority        =      "4 (very high)" //$o_workflow.general.priority || 5
    }

    getFileName(){
        //need to add md2 hash to filename
        var jstring = JSON.stringify(this);
        var _md2 = md2(jstring).toUpperCase();
        _md2 = _md2.substring(_md2.length-6)
        //5~
        //20230225-2232-1582-4f2e-70ff6e3b8456~
        //1fe36b100~
        //1-0-0
        //~20221103-0745-1336-907a-125b662fa639100
        //~TWI1ANALYSE~7236CB.json
        
        var slots_and_hostgroup = 100;

        //10 is for 1 slot and 0 hostgroup
        var filename_parts = [this.priority.toString().substring(0,1) , this.job_id, uuid().substring(0,6) + slots_and_hostgroup,this.split_id,this.workflow.id,"api_submit",_md2];
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


//all files in all directories to array
var m_cached_directories = {} //{directoryname:[...files],[...stats_enrichedby_filenames] }





// async function dirContentChanged(dir){
//     //check if anything changed in the specified directory
//     if (! dir in m_cached_directories){
//         return true;
//     }
//     var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
//     if (allfiles.length != m_cached_directories[dir].files.length)
//         return true

//     //check if stats of all files still match existing stats
//     for (var _idx in allfiles){
//         var _stat = await fsPromises.stat(path.join(dir,allfiles[_idx]));
//         var checkstat = _stat.birthtimeMs + _stat.ctimeMs + _stat.mtimeMs + _stat.size;

//     }

//     return true;

// }

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
async function ticket_files_to_array(dir) {
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
                global.filecache.tickets[fullpath] = {};
                global.filecache.tickets[fullpath]["birth"] = new Date();
                
//                global.filecache.tickets[fullpath]["mt"] = ;
                global.filecache.tickets[fullpath]["content"] = JSON.stringify(newitem);
                returnarray.push(newitem)
            }catch(ex){
                console.error("Could not parse Json from file:",path.join(dir,allfiles[_idx]),ex,await readfile_cached(path.join(dir,allfiles[_idx])))
            }
        }
        //console.timeEnd("jsonfiles_to_array " + dir);
		return returnarray;
}


async function readfile_cached(fullpath, jsonparse = false, lastlines = false, invalidate_cache_after = 10000){ 
    /* int lastlines reads n lines from end of file */
    /* invalidatecache defines how long to keep the stuff in memory */
    var prevent_delete = fullpath.indexOf("\\configs\\workflows" != -1);//this does nothing because we re-use this function for other stuff than workflows 

    if (! ("filecache" in global)){
		global.filecache = {};
	}
	if (! ("tickets" in global.filecache)){
		global.filecache.tickets = {};
	}
    
    for (key in global.filecache.tickets){
        //delete from cache older files than 10 seconds
        var now = new Date( );
        var birth = new Date(global.filecache.tickets[key]["birth"]);
        var birth_plus_maxlifetime = new Date(birth.getTime() + invalidate_cache_after);
        if( birth_plus_maxlifetime < now && !prevent_delete){
            delete global.filecache.tickets[key]
        }
        
    }
        
    if (Object.keys(global.filecache.tickets).length > 5000){
        cache_cleaner(); //todo: check size instead of blindly deleting 5000
    }

    var stats;
    stats = await fsPromises.stat(fullpath);

	if (fullpath in global.filecache.tickets){
		//serve cached file    
		if (!global.filecache.tickets[fullpath]["content"]){
            console.error("File is in cache but content emtpy, ",global.filecache.tickets[fullpath])
            console.trace("") //just for debugging
        }
        if (stats.mtimeMs != global.filecache.tickets[fullpath].mtimeMs) 
            delete global.filecache.tickets[fullpath] //file changed, needs re-read from disk
        else 
            return global.filecache.tickets[fullpath]["content"]; //File is served from cache
	}

    //File is not in cache, read from disk.
    var contents;
    if (!lastlines){
        contents = await fsPromises.readFile(fullpath, 'utf8');
    }else{
        contents = await readlastline.read(fullpath, lastlines);
    }
    contents = contents.replace(/^\uFEFF/, '');
    global.filecache.tickets[fullpath] = {};
    global.filecache.tickets[fullpath]["mtimeMs"] = stats.mtimeMs;
    global.filecache.tickets[fullpath]["birth"] = new Date();
    global.filecache.tickets[fullpath]["content"] = jsonparse ? JSON.parse(contents) : contents;
    
    return global.filecache.tickets[fullpath]["content"] ;
	
}


async function cache_cleaner(){
	for (const key in global.filecache.tickets) {
		try{
            await fsPromises.access(key, fs.constants.R_OK | fs.constants.W_OK)
		}catch(ex){
            //file does not exist, delete from cache
            delete global.filecache.tickets[key];
        }
	}
}

module.exports = {
    readfile_cached             : readfile_cached,
    get_wf_name                 : get_wf_name,
    ticket_files_to_array       : ticket_files_to_array,
    json_files_to_array_cached  : json_files_to_array_cached,
    JobTicket                   : JobTicket
};

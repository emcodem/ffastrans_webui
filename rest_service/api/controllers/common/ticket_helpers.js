const fsPromises = require('fs').promises;
const path = require("path")

module.exports = {
    readfile_cached: readfile_cached,
    get_wf_name: get_wf_name,
    jsonfiles_to_array: jsonfiles_to_array
};



async function get_wf_name(wf_id){
	/* do not catch errors here, the caller must do */
            var workflow_folder =  path.join(global.api_config["s_SYS_CACHE_DIR"], "../configs/workflows/");
            var wf_path = path.join(workflow_folder,wf_id) + ".json";
            var wf_obj = await readfile_cached(wf_path);
            wf_obj = JSON.parse(wf_obj);
            return wf_obj["wf_name"];
}

//all files in all directories to array
async function jsonfiles_to_array(dir) {
		if (!dir){return}
		var returnarray=[];
        var allfiles = await fsPromises.readdir(dir, { withFileTypes: false });
        
        for (var _idx in allfiles){
            try{
                var newitem = (JSON.parse(await readfile_cached(path.join(dir,allfiles[_idx]), 'utf8')))//removes BOM	;
                
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
                global.filecache.tickets[fullpath]["birth"] = new Date()
                global.filecache.tickets[fullpath]["content"] = JSON.stringify(newitem);
                returnarray.push(newitem)
            }catch(ex){
                console.log("Could not parse Json from file:",path.join(dir,allfiles[_idx]),ex,await readfile_cached(path.join(dir,allfiles[_idx]), 'utf8'))
            }
        }
        //console.timeEnd("jsonfiles_to_array " + dir);
		return returnarray;
}

async function readfile_cached(fullpath){
    
    if (! ("filecache" in global)){
		global.filecache = {};
	}
	if (! ("tickets" in global.filecache)){
		global.filecache.tickets = {};
	}
    
    for (key in global.filecache.tickets){
        //delete older files than 10 seconds
        var now = new Date( );
        var birth = new Date(global.filecache.tickets[key]["birth"]);
        var birth_plus_ten = new Date(birth.getTime() + 10000);
        if( birth_plus_ten < now){
            console.log("Removed key from global cache ",key)
            delete global.filecache.tickets[key]
        }
    }
        
    if (Object.keys(global.filecache.tickets).length > 500){
        cache_cleaner();
    }
	//delete non existing files in global cache

	if (fullpath in global.filecache.tickets){
		//serve cached file
		if (!global.filecache.tickets[fullpath]["content"]){
            console.log("Returning cached file, ",global.filecache.tickets[fullpath])
            console.trace("")
        }
        return global.filecache.tickets[fullpath]["content"];
	}else{
		//read file, store globally and return content
		
            var contents = await fsPromises.readFile(fullpath, 'utf8');
            contents = contents.replace(/^\uFEFF/, '');
            global.filecache.tickets[fullpath] = {};
            global.filecache.tickets[fullpath]["birth"] = new Date()
			global.filecache.tickets[fullpath]["content"] = contents;
            
			return global.filecache.tickets[fullpath]["content"] ;
			
		
	}
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
const fsPromises = require('fs/promises');
const path = require("path")

module.exports = {
    readfile_cached: readfile_cached,
    get_wf_name: get_wf_name,
};


async function get_wf_name(wf_id){
        try{
            var workflow_folder =  path.join(global.api_config["s_SYS_CACHE_DIR"], "../configs/workflows/");
            var wf_path = path.join(workflow_folder,wf_id) + ".json";
            var wf_obj = await readfile_cached(wf_path);
            wf_obj = JSON.parse(wf_obj);
            return wf_obj["wf_name"];
        }catch(ex){
            console.error("Error reading workflow for incoming ticket: ", (wf_path ),ex);
            
        }
}

async function readfile_cached(fullpath){
	if (! ("filecache" in global)){
		global.filecache = {};
	}
	if (! ("tickets" in global.filecache)){
		global.filecache.tickets = {};
	}
    if (Object.keys(global.filecache.tickets).length > 500){
        cache_cleaner();
    }
	//delete non existing files in global cache

	if (fullpath in global.filecache.tickets){
		//serve cached file
		return global.filecache.tickets[fullpath];
	}else{
		//read file, store globally and return content
		try{
            var contents = await fsPromises.readFile(fullpath, 'utf8');
            contents = contents.replace(/^\uFEFF/, '');
			global.filecache.tickets[fullpath] = contents;
			return global.filecache.tickets[fullpath];
			
		}catch(ex){
			console.error("Unexpected error while reading ticket file",fullpath,ex);
			throw ex;
		}
	}
}
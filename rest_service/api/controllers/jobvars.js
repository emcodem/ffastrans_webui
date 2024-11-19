'use strict';
const path = require("path");
const common = require("./common/helpers.js");

module.exports = {
    get: jobvars
};

var jobs_cache = {is_refreshing:false,born:0,data:false}
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   


async function jobvars(req, res) {
    try {
        let o_return = []
        let fullpath
        let regex
        let file
        let item
        let job_fdr = path.join(global.api_config["s_SYS_CACHE_DIR"], 'jobs')
        job_fdr = path.join(job_fdr, req.query.jobid, 'finished') + '\\'
        let flist = await common._fileList(job_fdr, '*-*-*.json|*_log.json', 0, 0, 'all')
        for (fullpath of flist) {
            file = path.basename(fullpath);
            file = file.split('.')
            let hit = {split_id: file[0], variables: []}
            item = await common.readfile_cached(fullpath, true)//removes BOM;
            if (req.query.vars) {
                regex = new RegExp(req.query.vars, 'g')
            } else {
                regex = new RegExp('.+', 'g')
            }
            hit.variables = item.variables.filter(o => o.name.match(regex));
            o_return.push(hit)
        }
        res.json(o_return);
        res.end();
    }catch(ex){
        console.error("Jobvars error:",ex);
		return res.status(500).json({message:ex.toString()});
    }
}

'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const helpers = require("./common/helpers.js");

module.exports = {
    get: getWorkflowsStatus
};

async function getWorkflowsStatus(req, res) {
    try {
        let ret_list = [], wf
        let status_root = path.join(global.api_config["s_SYS_CACHE_DIR"],"status");
        let s_wf_path = path.join(global.api_config["s_SYS_CONFIGS_DIR"],"workflows");
        let wf_list = await helpers._fileList(s_wf_path, '*.json')
        for (wf of wf_list) {
            wf = wf.replace('.json', '')
            let ret = {wf_id: wf, status: 'enabled'}
            let stat_files = await helpers._fileList(status_root, '.*~' + wf)
            if (stat_files.length) {
                if (stat_files.includes('.start~')) {
                    ret.status = 'running'
                } else if (stat_files.includes('.disabled~')) {
                    ret.status = 'disabled'
                } 
            }
            ret_list.push(ret)
        }
        res.json(ret_list);
        res.end();
	} catch(err) {
        console.timeEnd("getWorkflowsStatus")
		console.debug(err);
        return res.status(500).send(err.stack.toString());
	}
}

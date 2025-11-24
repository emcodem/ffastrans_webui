'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const helpers = require("./common/helpers.js");


module.exports = {
    get: getWorkflows,
    post: postWorfklows,
    put: putWorkflows
};

async function putWorkflows(req, res) {
    //updates part of workflow
    try{

        if (!req.body.hasOwnProperty('wf_id') || !req.body.hasOwnProperty('update')){
            throw new Error("You must supply wf_id and udpate fields");
        }

        if (typeof(req.body.update) != "object"){
            throw new Error("update field must contain object");
        }
        await updateWorkflowField(req.body.wf_id,req.body.update);

    }catch(ex){
        res.status(500).send(ex.stack.toString());
        return;
    }
    res.json({});
    res.end();
}

async function postWorfklows(req, res) {
    var o_req = req.body;
    
    if (!Array.isArray(o_req)){
        o_req = [o_req];
    }
    try{
        for (var _wf of o_req){
            _wf = formatWorkflow(_wf);
            if (!("workflow" in _wf))
                throw new Error("Did not find workflow key in submitted (list of) object ");
            
            await updateWorkflow(_wf.workflow);
            await updateUserVars(_wf.user_variables);
        }
    }catch(ex){
        res.status(500).send(ex.stack.toString());
    }
    res.json({});
    res.end();
}

function formatWorkflow(_wf){
    //if there are user_variables in workflow obj, move them to root
    var constructed = {workflow:{},user_variables:{}}
    if (!_wf.workflow)
        constructed.workflow = _wf;
    else
        constructed = _wf
    if (!_wf.user_variables)
        constructed.user_variables = workflow.user_variables;
    
    delete _wf._status;
    delete _wf.user_variables;
    return constructed;
}

function updateUserVars(){

    if (true){
	// If $sType = '' Or $sType = 'user_variables' Then
	// 	$b_valid = false
	// 	$a = _JoGet($o_import, 'user_variables.variables')
	// 	If IsArray($a) Then
	// 		For $i = 0 To UBound($a) - 1
	// 			$s_name = _JoGet($a[$i], 'name')
	// 			$i_x = _ArraySearch($a_USER_VARIABLES, $s_name, 0, 0, 1)
	// 			If $i_x > -1 And $bExistsFail Then Return SetError(409)
	// 			If $s_name <> '' And StringRegExp($s_name, '^s_success$|^s_error$|^s_source$') = 0 And $i_x = -1 Then
	// 				$bExistsFail = False
	// 				_JoAAdd($o_USER_VARIABLES, 'variables', '', $a[$i], -1)
	// 				_ArrayAdd($a_USER_VARIABLES, $s_name)
	// 				$b_valid = True
	// 			EndIf
	// 		Next
	// 	EndIf
	// 	$a = _JoGet($o_import, 'user_variables.statics')
	// 	If IsArray($a) Then
	// 		For $i = 0 To UBound($a) - 1
	// 			$s_name = _JoGet($a[$i], 'name')
	// 			$i_x = _ArraySearch($a_USER_VARIABLES, $s_name, 0, 0, 1)
	// 			If $i_x > -1 And $bExistsFail Then Return SetError(409)
	// 			If $s_name <> '' And $i_x = -1 Then
	// 				$bExistsFail = False
	// 				_JoAAdd($o_USER_VARIABLES, 'statics', '', $a[$i], -1)
	// 				_ArrayAdd($a_USER_VARIABLES, $s_name)
	// 				$b_valid = True
	// 			EndIf
	// 		Next
	// 	EndIf
	// 	If $sType = 'user_variables' And $b_valid = False Then
	// 		Return -1
	// 	EndIf
	// EndIf
    }

}

  
async function backupWorkflow(wf_id,original_file,archive_dir){

    var target_path = path.join(archive_dir,path.parse(original_file).name);
    var now = new Date();     
    var target_fname =  now.getFullYear() + '-' 
                            + zeropad((now.getMonth()+1)) + '-'  // getMonth()(0-11)
                            + zeropad(now.getDate())   + ' ' 
                            + zeropad(now.getHours()) + '_' 
                            + zeropad(now.getMinutes()) + '_' 
                            + zeropad(now.getSeconds()) + '.json';

    await fs.ensureDir(target_path);
    await fs.copyFile(original_file,path.join(target_path,target_fname));
}

async function updateWorkflowField(wf_id,new_data){

    var wf_path = path.join(path.join(global.api_config["s_SYS_CONFIGS_DIR"],"workflows"),"");
    var wf_file = path.join(wf_path,wf_id + ".json");
    var archive_path = path.join(global.api_config["s_SYS_CONFIGS_DIR"],
                                "archive",
                                "workflows");

    if (fs.existsSync(wf_file)){
        await backupWorkflow(wf_id,wf_file,archive_path);
        var s_wf_path = path.join(path.join(global.api_config["s_SYS_CONFIGS_DIR"],"workflows"),"");
        var wf_contents = await  helpers.readfile_cached(wf_file);
        wf_contents = JSON.parse(wf_contents);
        deepMerge(wf_contents, new_data);
        await fs.writeFile(wf_file,JSON.stringify(wf_contents,null,3));
    }else{
        throw new Error("Workflow file does not exist, " + wf_file);
    }
       
}

async function updateWorkflow(wf){

    var wf_path = path.join(path.join(global.api_config["s_SYS_CONFIGS_DIR"],"workflows"),"");
    var archive_path = path.join(global.api_config["s_SYS_CONFIGS_DIR"],
                                "archive",
                                "workflows")

    if (wf.wf_id && wf.wf_name && wf.wf_id != "" && wf.wf_name!= ""){
        var wf_file = path.join(wf_path,wf.wf_id + ".json");
        if (fs.existsSync(wf_file)){
            await backupWorkflow(wf.wf_id,wf_file,archive_path);
            await fs.writeFile(wf_file,JSON.stringify(wf,null,3));
        }
    }else{
        throw new Exception ("wf_id or wf_name was empty or not existent");
    }

}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function getWorkflows(req, res) {
    let callId = Math.random().toString(36);
    console.time("getWorkflows full api call, nodetails " + req.query.nodetails + " " + callId);

    if (!global.workflowFileSystemWatcher){
        //this filesystemwatcher runs forever in the background, syncing the wf directory with memory cache
        //should we initialize this in the main app.js?

    }
    if (!global.workflowFileSystemWatcher.lastPollingDuration){
        console.log("Waiting for workflowFileSystemWatcher first run to complete");
        return res.status(503).send("Waiting for workflowFileSystemWatcher first run to complete");
    }
	try {
        var o_return = {discovery:req.headers.referer,workflows:[]};
        o_return.workflows = global.workflowFileSystemWatcher.getCachedContentAsArray();
         
        if (!req.query.nodetails){
            await add_user_vars (o_return);
            await add_status    (o_return.workflows);
        }
        
        if (req.query.id){
            o_return.workflows = o_return.workflows.filter(wf=>{
                return wf.wf_id == req.query.id;
            })
        }
        o_return.workflows.sort((a, b) => {
            // Handle wf_folder: prioritize non-empty values
            if (a.wf_folder === '' && b.wf_folder !== '') return 1;
            if (a.wf_folder !== '' && b.wf_folder === '') return -1;
          
            // Sort wf_folder in ascending order (case-insensitive)
            const folderA = a.wf_folder.toLowerCase();
            const folderB = b.wf_folder.toLowerCase();
            if (folderA < folderB) return -1;
            if (folderA > folderB) return 1;
          
            // If wf_folder is the same, sort wf_name in ascending order (case-insensitive)
            const nameA = a.wf_name.toLowerCase();
            const nameB = b.wf_name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
          
            return 0; // They are equal
          });
          
          
        console.timeEnd("getWorkflows full api call, nodetails "  + req.query.nodetails + " " + callId);
        res.json(o_return);
        res.    end();
	} catch(err) {
        console.timeEnd("getWorkflows full api call, nodetails "  + req.query.nodetails + " " + callId);
		console.debug(err);
        return res.status(500).send(err.stack.toString());
	}

}

async function getWorkflows_Ex(req, res) {
    let callId = Math.random().toString(36);
    console.time("getWorkflows full api call " + callId)
    var o_req = req.body;
	try {
        var o_return = {discovery:req.headers.referer,workflows:[]};
        //read all workflows 
        var s_wf_path = path.join(path.join(global.api_config["s_SYS_CONFIGS_DIR"],"workflows"),"");
        o_return.workflows = await helpers.json_files_to_array_cached(s_wf_path,s_wf_path);
        console.timeEnd("getWorkflows full api call " + callId);
        if (!req.query.nodetails){
            await add_user_vars (o_return);
            await add_status    (o_return.workflows);
        }
        
        if (req.query.id){
            o_return.workflows = o_return.workflows.filter(wf=>{
                return wf.wf_id == req.query.id;
            })
        }
        
        res.json(o_return);
        res.    end();
	} catch(err) {
        console.timeEnd("getWorkflows full api call " + callId);
		console.debug(err);
        return res.status(500).send(err.stack.toString());
	}
    
}

async function add_status(a_workflows){
    var status_root = path.join(global.api_config["s_SYS_CACHE_DIR"],"status");
    for (var i=0;i<a_workflows.length;i++){
        var _wf = a_workflows[i];
        var start_file = path.join(status_root,".start~" + _wf.wf_id);
        var disabled_file = path.join(status_root,".disabled~" + _wf.wf_id);
        if ( fs.existsSync(start_file)){
            _wf._status = "started";
            continue;
        }
        if ( fs.existsSync(disabled_file)){
            _wf._status = "disabled";
            continue;
        }
        _wf._status = "";
        continue;
    }
}

async function add_user_vars(o_return){
    // enrich all_user_vars by use count 
    // enrich workflow by the user_vars that it uses
    let callId = Math.random().toString(36);
    console.time("add_user_vars "+callId)
    var s_user_vars_file = path.join(global.api_config["s_SYS_CONFIGS_DIR"],"user_variables.json");
     
    var all_vars_readout = await helpers.readfile_cached(s_user_vars_file);//fsPromises.readFile(s_user_vars_file, 'utf8');//uncached!
    all_vars_readout = all_vars_readout.replace(/^\uFEFF/, '');
    var all_vars = JSON.parse(all_vars_readout);
    all_vars = [...all_vars.variables,...all_vars.statics];

    var all_vars_report = JSON.parse(all_vars_readout); //collect usage statistics, add to response on top level
    all_vars_report.statics.map(o=>{o.is_static = true;});
    all_vars_report = [...all_vars_report.variables,...all_vars_report.statics];//merge statics and vars into one list
    all_vars_report.map(o=>{o.used_in = [];});

    o_return.user_variables = all_vars_report;

    //loop through workflow nodes, count usage, attach used variables to workflow...
    
    for (var _wfidx=0; _wfidx<o_return.workflows.length;_wfidx++){
        try{
            var _wf = o_return.workflows[_wfidx];
            _wf.user_variables = {"variables":[],"statics":[]};

            var vars_in_this_wf = []; //filters duplicates
            for (var _nodeidx=0;_nodeidx<_wf.nodes.length;_nodeidx++){

                var _node = _wf.nodes[_nodeidx];
                var s_node_readout = JSON.stringify(_node);
                var vars_in_this_node = s_node_readout.match(/(%[ifs]_.+?%)/gmi);
                //found a node in a workflow using some variable, process it
                
                if (vars_in_this_node != null){
                    //vars_in_this_node = new Set(vars_in_this_node); //filters duplicates
                    for (var _vname of vars_in_this_node){
                        var used_var = all_vars.find(o => o.name ===  _vname.replaceAll("%",""));
                        var report_var = all_vars_report.find(o => o.name ===  _vname.replaceAll("%",""));
                        if (used_var == null)
                            continue; //most likely an inbuilt var like s_source
                        vars_in_this_wf.push(used_var); //we filter dups later
                        //add/increment use_count in the original user_vars list
                        report_var.used_in.push ({wf_id:_wf.wf_id,wf_name:_wf.wf_name,node_id:_node.id,node_name:_node.name});
                    }
                }
            }
            var vars_in_this_wf = new Set(vars_in_this_wf); //filters duplicates
            //split into staics vs variables
            if (! v)
                var stop = 1
            for (var v of vars_in_this_wf){
                if (v.name.match(/A-Z/)){
                    _wf.user_variables.statics.push(v);
                }else{
                    _wf.user_variables.variables.push(v);
                }
            }
        }catch(ex){
            console.error("Fatal error parsing workflow index:", _wfidx);
        }
    }
    //original obj has been inline modified
    console.timeEnd("add_user_vars "+callId)
}


/* Generic helpers */

function zeropad(number, amount = 2) {
    if (number >= Math.pow(10, amount)) {
      return number;
    }
    return (Array(amount).join(0) + number).slice(-amount);
}

function deepMerge(target, source) {
    for (let key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}




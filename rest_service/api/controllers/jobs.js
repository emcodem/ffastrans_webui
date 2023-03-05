'use strict';
const fs = require('fs-extra');
const fsPromises = require('fs').promises;
const path = require("path");
const common = require("./common/ticket_helpers.js");

module.exports = {
    get: start
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
  async function start(req, res) {
    /* writes a new jobticket to disk for ffastrans to process */
    var example_body = {
        "wf_id":"<workflow id>",
        "inputfile":"<full path to file>",
        "start_proc":"<processor node id>",
        "variables": [
           {
              "name":"<s_string>",
              "data":"<string>"
           },
           {
              "name":"<i_string>",
              "data":"<integer>"
           },
           {
              "name":"<f_string>",
              "data":"<number>"
           }
        ]
     }

    var o_req = req.body;
	try {
        var o_return = {};
        //retrieve new ticket class
        var t = new common.JobTicket();
        //initialize with values from request
        await t.init_ticket(req.body.wf_id,req.body.start_proc);
        //set source and variables in ticket
        t.setSource(req.body.inputfile);
        t.variables = req.body.variables;

        //write to disk
        var final_tick = t;
        var fname = t.getFileName();
        var tick_temp_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","temp",fname);
        var tick_pending_path = path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets","pending",fname);
        final_tick.ticket_path = tick_pending_path;
        fs.writeFileSync(tick_temp_path,JSON.stringify(final_tick));
        fs.moveSync(tick_temp_path,tick_pending_path);
        //write file to temp, then move to q

        global;
        var returnobj = {
            "uri": global["ffastrans-about"].discovery +"/jobs/" + t.job_id,
            "job_id": t.job_id
        }
        res.json(returnobj);
        res.end();
	} catch(err) {
		console.debug(err);
		return res.status(500).json({message:err.toString(),description: err});
	}
}

// //HELPERS
// Func _CreateJob($sBodyPost)
// 	Local $s_x, $a_x, $a_x_2, $i_x, $i_cnt, $s, $i
// 	Local $o_json = _JoCode($sBodyPost)
// 	Local $s_api_workflow = _JoGet($o_json, 'wf_id')
// 	Local $s_api_proc = _JoGet($o_json, 'start_proc')
// 	If @error Then $s_api_proc = ''
// 	Local $o_workflow = _FileToJson($s_SYS_CONFIGS_DIR & '\workflows\' & $s_api_workflow & '.json')
// 	If @error Then Return SetError(3, 0, $s_api_workflow)
// 	Local $i_index = _JoSearch($o_workflow, 'nodes', 'id', $s_api_proc)
// 	If $s_api_proc = '' Or $i_index > -1 Then
// 		Local $o_new_ticket = _init_ticket($s_api_workflow)

// 		If $o_json.priority < 0 Then $o_json.priority = 0
// 		If $o_json.priority > 5 Then $o_json.priority = 5

// 		If $s_api_proc = '' Then
// 			$i_index = _JoSearch($o_workflow, 'nodes', 'start_proc', True)
// 		EndIf
// 		$o_new_ticket.split_id = 				'1-' & $i_index & '-' & $i_index
// 		$o_new_ticket.nodes.next.id = 			_JoGet($o_workflow, 'nodes[' & $i_index & '].id')
// 		$o_new_ticket.nodes.next.slots = 		_JoGet($o_workflow, 'nodes[' & $i_index & '].slots', 1)
// 		$o_new_ticket.nodes.next.hosts_group =	_JoGet($o_workflow, 'nodes[' & $i_index & '].hosts_group', 0)
// 		$o_new_ticket.submit.method = 			'api'
// 		$o_new_ticket.submit.system = 			_JoGet($o_json, 'system', 'api')
// 		$o_new_ticket.submit.user = 			_JoGet($o_json, 'user', @UserName)
// 		$o_new_ticket.submit.client = 			_JoGet($o_json, 'client', @ComputerName)
// 		$o_new_ticket.submit.time = 			_GetNow()
// 		$o_new_ticket.nodes.next.type = 		_JoGet($o_workflow, 'nodes[' & $i_index & '].type')
// 		$s = _JoGet($o_json, 'inputfile')
// 		$o_new_ticket.sources.current_file = 	_long($s)
// 		$o_new_ticket.sources.original_file = 	_long($s)
// 		$o_new_ticket.sources.localized_file = 	_long($s)
// 		$o_new_ticket.sources.pretty_name = 	_FileProper($s, 2)
// 		$o_new_ticket.work_dir = 				_JoGet($o_json, 'work_dir')
// 		$o_new_ticket.variables = 				_JoGet($o_json, 'variables')
// 		$i = _JoGet($o_new_ticket, 'priority', _JoGet($o_workflow, 'general.priority', 2))
// 		$i = Number(StringLeft($i, 1))
// 		$s_x = Json_Encode($o_new_ticket)
// 		Local $s_hash = StringRight(_Crypt_HashData(StringToBinary($s_x, 4), $CALG_MD2), 6)
// 		$s = Hex($o_new_ticket.nodes.next.slots, 1)
// 		$s &= Hex($o_new_ticket.nodes.next.hosts_group, 2)
// 		$s = StringLower($s)
// 		$s = $i & '~' & $o_new_ticket.job_id & '~' & _MyGuid($h_OLE32_DLL, false, true, 6) & $s & '~' & $o_new_ticket.split_id & '~' & $s_api_workflow & '~api_submit~' & $s_hash & '.json'
// 		_MyFileCreate($s_SYS_CACHE_DIR & '\tickets\temp\' & $s, $s_x, 138)
// 		FileMove($s_SYS_CACHE_DIR & '\tickets\temp\' & $s, $s_SYS_CACHE_DIR & '\tickets\pending\' & $s, 8)
// 		Return $o_new_ticket.job_id
// 	Else
// 		Return SetError(2, 0, $s_api_proc)
// 	EndIf
// EndFunc   ;==>_CreateJob

async function get_running(){
	var s_tick_path = path.join(path.join(global.api_config["s_SYS_CACHE_DIR"],"tickets"),"");
    var a_running = await common.jsonfiles_to_array(path.join(s_tick_path,"running"));
   
    //as we dont want to show both at the same time, we ignore the running tickets from mon_folder to prevent showing the same file twice
    var keys_to_ignore = []; 
    for (var key in a_running){
        try{
            var _cur = a_running[key];
            if (! "internal_wf_name" in a_running[key]){//todo: the IF does not work, internal_wf_name is a guid in this case
                a_running[key]["workflow"] = common.get_wf_name(a_running[key]["internal_wf_id"]);
                
            }else{
                a_running[key]["workflow"] = a_running[key]["internal_wf_name"];
            }
            try{
                a_running[key]["sources"] = {"current_file": a_running[key]["sources"]["original_file"]};
            }catch(ex){
                //omit this ticket as it does not carry source file info
                console.error("Running ticket did not contain source file info",a_running[key])
                keys_to_ignore.push(key)
            }

        }catch(ex){
            console.error("Problem parsing running entry: ", a_running[key],ex);
        }
    }
    for (var key in keys_to_ignore){
        delete a_running[key];
    }
    //after deleting we happen to have a weird empty object
    var filtered = a_running.filter(function (el) {
      return el != null;
    });
	return filtered;
	
}








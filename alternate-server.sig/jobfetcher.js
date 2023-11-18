const assert = require('assert');
const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
const path = require("path");
var smptMail = require("../node_components/common/send_smpt_email");
var helpers = require("../node_components/common/helpers");
// const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere

var alert_sent = false;
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

var executioncount = 0;
var count_running = false;
// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

module.exports = {
	
	getWorkflowList: async function(){
		// console.log("----------------------- WORKFLOWLIST ------------------------")
		// return {data:
		// 	{
		// 		"workflows": [
		// 			{
		// 				"webui_submit_url": "/",
		// 				"wf_id": "20221010-1218-2808-4241-2d7e0ae1100c",
		// 				"wf_name": "Baton_Landesstudio",
		// 				"wf_folder": "",
		// 				"description": "Hier kann eine Info stehen",
		// 				"updated": "2023-06-21T10:14:39.482+02:00",
		// 				"updated_by": "zjordanh@TWI1ANALYSEDB",
		// 				"created": "2022-10-10T12:18:28.084+02:00",
		// 				"general": {
		// 					"sleep": 30,
		// 					"priority": "4 (very high)",
		// 					"timeout_level": 3
		// 				},
		// 				"maintainance": {
		// 					"keep_all_workdir": false,
		// 					"keep_failed_workdir": true,
		// 					"cleanup_time": "04:00",
		// 					"records_age": 5,
		// 					"work_age": 5,
		// 					"run_on_days": 1234567
		// 				},
		// 				"special": {
		// 					"log_level": "1 (Basic)",
		// 					"force_32bit": false,
		// 					"read_timecode": false,
		// 					"protected": false,
		// 					"password": ""
		// 				},
		// 				"nodes": [
		// 					{
		// 						"id": "20230620-1728-4664-61c1-255d3eb23ca0",
		// 						"type": "plugin_htmlgui",
		// 						"custom_proc_guid": "513dacee-78e2-45a1-916d-9a8f52734701",
		// 						"name": "HTTP communicate+",
		// 						"slots": 1,
		// 						"hosts_group": 0,
		// 						"bypass": false,
		// 						"start_proc": true,
		// 						"pos_x": 75,
		// 						"pos_y": 75,
		// 						"execute_on": "success",
		// 						"preset": {
		// 							"name": "(custom)",
		// 							"id": null
		// 						},
		// 						"properties": {
		// 							"custom_variables": {
		// 								"inputs": [
		// 									{
		// 										"id": "parameter_value_list_innerHTML",
		// 										"value": "\n        <div><span style=\"width: 120px; display: inline-block;\">Parameter 1</span><select name=\"input\" title=\"'Parameter Value' will be escaped for the chosen format\" id=\"input_parameter_escaping_1\"><option></option><option>xml</option><option>json</option><option>url</option></select><input name=\"input\" title=\"Param Name, this exact value will be replaced by the value (right side) in the Request Body and URL\" id=\"input_parameter_name_1\" placeholder=\"Param Name\"><input name=\"input\" title=\"Prefixes: 'escapeurl:', 'escapejson:' , 'escapexml:'\" id=\"input_parameter_value_1\" oninput=\"\" placeholder=\"Value, Variable...\" value=\"\"><input name=\"open_vars\" width=\"2\" type=\"submit\" value=\"<\" data-parent=\"input_parameter_value_1\" data-user_vars_only=\"true\"><br></div>\n    ",
		// 										"data": ""
		// 									},
		// 									{
		// 										"id": "url",
		// 										"value": "https://swi13sigmxt/signiant/spring/admin/v1.0/jobs"
		// 									},
		// 									{
		// 										"id": "http_method",
		// 										"value": "POST"
		// 									},
		// 									{
		// 										"id": "body_highlighting",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "request_body",
		// 										"value": "[\n  {\n    \"job\": {\n      \"jobName\": \"Test_Harald_%i_sec%_%i_msec%\",\n      \"fields\": {\n        \"jobGroupName\": \"Default\",\n        \"jobTemplateLibraryName\": \"TEST_harald\",\n        \"jobTemplateName\": \"Baton\",\n        \"jobArgs\": {\n          \"MediaDropBox.Source.DropBoxAgent\": \"your.source.agent\",\n          \"MediaDropBox.Source.DropBoxDirectory\": \"/tmp/watchfolder\",\n          \"MediaDropBox.Target.TargetAgents\": \"your.target.agent\",\n          \"MediaDropBox.Target.TargetDirectory\": \"/tmp/dropfolder\",\n          \"MediaDropBox.Schedule._sp_frequency\": \"5\"\n        }\n      }\n    }\n  }\n]"
		// 									},
		// 									{
		// 										"id": "input_parameter_escaping_1",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "input_parameter_name_1",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "input_parameter_value_1",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "enable_retry",
		// 										"value": false
		// 									},
		// 									{
		// 										"id": "retry_condition",
		// 										"value": "200,201"
		// 									},
		// 									{
		// 										"id": "retry_count",
		// 										"value": "15"
		// 									},
		// 									{
		// 										"id": "retry_delay",
		// 										"value": "15"
		// 									},
		// 									{
		// 										"id": "enable_polling",
		// 										"value": false
		// 									},
		// 									{
		// 										"id": "polling_frequency",
		// 										"value": "15"
		// 									},
		// 									{
		// 										"id": "polling_condition_text",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "http_headers",
		// 										"value": "username:admin,password:Siropa@0rfwiwi"
		// 									}
		// 								],
		// 								"outputs": [
		// 									{
		// 										"id": "output_last_value",
		// 										"value": "%s_analyse%",
		// 										"data": ""
		// 									},
		// 									{
		// 										"id": "output_last_code",
		// 										"value": "",
		// 										"data": ""
		// 									}
		// 								]
		// 							}
		// 						},
		// 						"outbounds": [
		// 							{
		// 								"type": "op_populate",
		// 								"id": "20230620-1731-0048-3245-cd80457aa5d0"
		// 							}
		// 						]
		// 					},
		// 					{
		// 						"id": "20230620-1731-0048-3245-cd80457aa5d0",
		// 						"type": "op_populate",
		// 						"custom_proc_guid": "",
		// 						"name": "Populate variables",
		// 						"slots": 1,
		// 						"hosts_group": 0,
		// 						"bypass": false,
		// 						"start_proc": false,
		// 						"pos_x": 247,
		// 						"pos_y": 75,
		// 						"execute_on": "success",
		// 						"preset": {
		// 							"name": "(custom)",
		// 							"id": null
		// 						},
		// 						"properties": {
		// 							"variables": [
		// 								{
		// 									"name": "s_analyse",
		// 									"data": "$jsonget(\"%s_analyse%\",\"jobs[0].id\")",
		// 									"type": "string"
		// 								},
		// 								{
		// 									"name": "s_success",
		// 									"data": "%s_webui_baton_testplan%",
		// 									"type": "string"
		// 								}
		// 							]
		// 						},
		// 						"outbounds": [
		// 							{
		// 								"type": "op_hold",
		// 								"id": "20230621-1001-1808-8f35-0f32c11f911d"
		// 							}
		// 						]
		// 					},
		// 					{
		// 						"id": "20230621-0918-5550-5a2a-ef75f55d9335",
		// 						"type": "plugin_htmlgui",
		// 						"custom_proc_guid": "513dacee-78e2-45a1-916d-9a8f52734701",
		// 						"name": "HTTP communicate+",
		// 						"slots": 1,
		// 						"hosts_group": 0,
		// 						"bypass": false,
		// 						"start_proc": false,
		// 						"pos_x": 420,
		// 						"pos_y": 75,
		// 						"execute_on": "success",
		// 						"preset": {
		// 							"name": "(custom)",
		// 							"id": null
		// 						},
		// 						"properties": {
		// 							"custom_variables": {
		// 								"inputs": [
		// 									{
		// 										"id": "parameter_value_list_innerHTML",
		// 										"value": "\n        <div><span style=\"width: 120px; display: inline-block;\">Parameter 1</span><select name=\"input\" title=\"'Parameter Value' will be escaped for the chosen format\" id=\"input_parameter_escaping_1\"><option></option><option>xml</option><option>json</option><option>url</option></select><input name=\"input\" title=\"Param Name, this exact value will be replaced by the value (right side) in the Request Body and URL\" id=\"input_parameter_name_1\" placeholder=\"Param Name\"><input name=\"input\" title=\"Prefixes: 'escapeurl:', 'escapejson:' , 'escapexml:'\" id=\"input_parameter_value_1\" oninput=\"\" placeholder=\"Value, Variable...\" value=\"\"><input name=\"open_vars\" width=\"2\" type=\"submit\" value=\"<\" data-parent=\"input_parameter_value_1\" data-user_vars_only=\"true\"><br></div>\n    ",
		// 										"data": ""
		// 									},
		// 									{
		// 										"id": "url",
		// 										"value": "https://swi13sigmxt/signiant/spring/admin/v1.0/jobs/%s_analyse%"
		// 									},
		// 									{
		// 										"id": "http_method",
		// 										"value": "GET"
		// 									},
		// 									{
		// 										"id": "body_highlighting",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "request_body",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "input_parameter_escaping_1",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "input_parameter_name_1",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "input_parameter_value_1",
		// 										"value": ""
		// 									},
		// 									{
		// 										"id": "enable_retry",
		// 										"value": false
		// 									},
		// 									{
		// 										"id": "retry_condition",
		// 										"value": "200,201"
		// 									},
		// 									{
		// 										"id": "retry_count",
		// 										"value": "15"
		// 									},
		// 									{
		// 										"id": "retry_delay",
		// 										"value": "15"
		// 									},
		// 									{
		// 										"id": "enable_polling",
		// 										"value": true
		// 									},
		// 									{
		// 										"id": "polling_frequency",
		// 										"value": "3"
		// 									},
		// 									{
		// 										"id": "polling_condition_text",
		// 										"value": "\"IDLE\""
		// 									},
		// 									{
		// 										"id": "http_headers",
		// 										"value": "username:admin,password:Siropa@0rfwiwi"
		// 									}
		// 								],
		// 								"outputs": [
		// 									{
		// 										"id": "output_last_value",
		// 										"value": "",
		// 										"data": ""
		// 									},
		// 									{
		// 										"id": "output_last_code",
		// 										"value": "",
		// 										"data": ""
		// 									}
		// 								]
		// 							}
		// 						},
		// 						"outbounds": [
		// 							{
		// 								"type": "op_populate",
		// 								"id": "20230621-0941-5498-3d48-10892f0be66f"
		// 							}
		// 						]
		// 					},
		// 					{
		// 						"id": "20230621-0941-5498-3d48-10892f0be66f",
		// 						"type": "op_populate",
		// 						"custom_proc_guid": "",
		// 						"name": "Populate variables",
		// 						"slots": 1,
		// 						"hosts_group": 0,
		// 						"bypass": false,
		// 						"start_proc": false,
		// 						"pos_x": 592,
		// 						"pos_y": 75,
		// 						"execute_on": "success",
		// 						"preset": {
		// 							"name": "(custom)",
		// 							"id": null
		// 						},
		// 						"properties": {
		// 							"variables": [
		// 								{
		// 									"name": "s_success",
		// 									"data": "<a target=\"_blank\" href=\"/webinterface/downloads/test_MXF.pdf\">Download pdf</a>",
		// 									"type": "string"
		// 								}
		// 							]
		// 						}
		// 					},
		// 					{
		// 						"id": "20230621-1001-1808-8f35-0f32c11f911d",
		// 						"type": "op_hold",
		// 						"custom_proc_guid": "",
		// 						"name": "Hold",
		// 						"slots": 1,
		// 						"hosts_group": 0,
		// 						"bypass": false,
		// 						"start_proc": false,
		// 						"pos_x": 329,
		// 						"pos_y": 168,
		// 						"execute_on": "success",
		// 						"preset": {
		// 							"name": "(custom)",
		// 							"id": null
		// 						},
		// 						"properties": {
		// 							"syncronize": false,
		// 							"sync_time": 3600,
		// 							"sleep": true,
		// 							"sleep_time": 5,
		// 							"file_wait": false,
		// 							"files_list": "",
		// 							"files_count": 0
		// 						},
		// 						"outbounds": [
		// 							{
		// 								"type": "plugin_htmlgui",
		// 								"id": "20230621-0918-5550-5a2a-ef75f55d9335"
		// 							}
		// 						]
		// 					}
		// 				],
		// 				"version": "1.3.1.13",
		// 				"variable": {
		// 					"wf_size": 115
		// 				},
		// 				"farming": {
		// 					"hosts": [],
		// 					"include": false
		// 				},
		// 				"user_variables": {
		// 					"variables": [
		// 						{
		// 							"name": "s_analyse",
		// 							"type": "string",
		// 							"data": ""
		// 						},
		// 						{
		// 							"name": "s_webui_baton_testplan",
		// 							"data": "{\n   \"type\": \"select\",\n   \"merit\": 1,\n   \"label\": \"Testplan\",\n   \"labelPosition\": \"left\",\n   \"labelWidth\": \"140\",\n   \"width\": \"450\",\n   \"required\": true,\n   \"preMessage\": \"Ich bin auch eine Information \",\n   \"options\": [\n      {\n         \"content\": \"XDCAM Compliance\",\n         \"value\": \"xdcam testplan name\"\n      },\n      {\n         \"content\": \"XAVC Compliance\",\n         \"value\": \"xavc testplan name\"\n      }\n   ]\n}",
		// 							"type": "string"
		// 						}
		// 					],
		// 					"statics": []
		// 				},
		// 				"_status": ""
		// 			}
		// 		]
		// 	}
		// };
		return await axios.get(helpers.build_new_api_url("/workflows"), { timeout: 7000, agent: false, maxSockets: Infinity });
	},
	
	tickets:async function(){
		//we want jobfetcher to be able to run as alternate-server, thus the getworkflowjobcount method asks ticket not directly from api but from jobfetcher
		//in alternate-server mode you have to rebuild and simulate tickets structure, where each ticket contains at least internal_wf_name data field
		//console.log("------------------- TICK COUNT -------------------")
		//return {incoming:[],queued:[],running:[]}
		m_ticket_cache.last_update = new Date();
		var response = await axios.get(helpers.build_new_api_url("/tickets"), { timeout: 7000, agent: false, maxSockets: Infinity });
		return response.data.tickets;
	},
	
	importLegacyDatabase: async function(old_path){
            var all_lines = await fsPromises.readFile( old_path, "utf8" );
            all_lines.forEach(line =>{
				var jobArray = [];
				jobArray.push(JSON.parse(line));
				var i = 0;


				jobArray[i]["_id"] = jobArray[i]["job_id"] + "_main";
				delete jobArray[i]["title"];
				jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
				delete jobArray[i].job_start;
				jobArray[i].job_end = getDateStr(jobArray[i]["end_time"]);
				delete jobArray[i].job_end;
				jobArray[i].outcome = jobArray[i]["result"];
				delete jobArray[i].result;
				delete jobArray[i].key;
				
				
				//filter deleted jobs from new joblist
				if (deleted_ids.indexOf(jobArray[i]["job_id"]) == -1){
					non_deleted_jobs.push(jobArray[i]);
				}else{
					return;
				}
            })
        
	},

    fetchjobs: async function () {

	//kick off global countjobs DEPRECATED; REPLACED BY POLLING getworkflowjobcount
	// if (!count_running){
	// 	countJobs();
	// }

    //fetch running jobs from api

    if (!Number.isInteger(parseInt(global.config.STATIC_API_TIMEOUT))){
        var txt = 'ERROR contact admin. Server setting STATIC_API_TIMEOUT is not a number: [' + global.config.STATIC_API_TIMEOUT + ']';
        console.error(txt);
        global.socketio.emit("error", txt);
    }else{
        global.config.STATIC_API_TIMEOUT = parseInt(global.config.STATIC_API_TIMEOUT)
    }
    
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: global.config.STATIC_API_TIMEOUT,agent: false,maxSockets: Infinity}, async function (error, response, body)  {
			console.log("------------------------------ RUNNING ------------------------------")
			return;
			if(error) {
				try{
					/* take care about alert email */
					if (!alert_sent){
						sendEmailAlert("ALERT! FFAStrans is down","Got an error fetching jobs from: <br/>" + global.config.STATIC_GET_RUNNING_JOBS_URL );
						alert_sent = true;
					}
				}catch(ex){
					console.error("Could not send email alert message: ", ex.stack)
				}
				global.socketio.emit("error", 'Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error('Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error(error);
                return;
			}
				
			if (alert_sent){
				//send all good email if needed
				alert_sent = false;
				try{
					sendEmailAlert("FFAStrans is up again","The system did successfully respond to " + global.config.STATIC_GET_RUNNING_JOBS_URL );
					
				}catch(ex){
					console.error("Could not send email alert message (good again): ", ex.stack);
				}
			}
			
			/* end of alert email */
			global.lastactive = body;
			
            var jobArray;	
            try{
                jobArray = JSON.parse(body).jobs;
            }catch(exc){
				var msg = "FFAStrans sent out invalid active jobs data. Please contact developers. ";
				console.error(msg);
				global.socketio.emit("alert", msg );
            }
            
            for (i=0;i<jobArray.length;i++){
                jobArray[i]["guid"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
                var idx = jobArray[i]["guid"].split("~");
                //data for client display
                jobArray[i]["key"] = jobArray[i]["guid"];//for fancytree internal purpose
                //jobArray[i].guid = jobArray[i]["guid"]
                jobArray[i]._id = jobArray[i].guid;
                jobArray[i].state = "Active";
                jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
                //jobArray[i].source = jobArray[i]["source"]
                jobArray[i].outcome = jobArray[i]["status"]
                try{
                    jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
                }catch(exc){
                    console.log("Could not parse start time from API response jobarray entry:",jobArray[i],exc);
                }
                jobArray[i].wf_name = jobArray[i]["workflow"];
                
            }//for all jobs
                       
        // //send the new jobs to connected clients, todo: only notify clients about new stuff
		try{
			global.socketio.emit("activejobs", JSON.stringify(jobArray));
			//global.socketio.emit("activejobcount", jobArray.length);
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc + body)
		}
    });
    
    //fetch queued jobs from new api

    Request.get(helpers.build_new_api_url("/tickets"), {timeout: global.config.STATIC_API_TIMEOUT},(error, response, body) => {   
        return [];
        //TODO: merge Active and queued call
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            console.error("Fatal, lobal.config.STATIC_USE_PROXY_URL is true but should be false! ")
            return;
        }
        if(error) {
            console.log('Internal Error getting Queued Jobsssss,  ' + helpers.build_new_api_url("/tickets"), error)
            global.socketio.emit("error", 'Internal Error getting Queued Jobs,  ' + helpers.build_new_api_url("/tickets"));
            return;
        }
		try{
		//QUEUED JOBS (in ffastrans queued folder)
			
			var q_obj = JSON.parse(body)["tickets"]["queued"];
			if (q_obj !== undefined) {
				for (var i=0; i<q_obj.length;i++){
							q_obj[i]["key"] = hashCode(JSON.stringify(q_obj[i]));
							q_obj[i]["split_id"] = ""
							q_obj[i]["state"] = "Queued";
							q_obj[i]["title"] = "Queued";
							q_obj[i]["steps"] = "";
							q_obj[i]["progress"] = "0";
							q_obj[i]["workflow"] = q_obj[i]["workflow"]; //todo: implement workflow in ffastrans tickets api for pending jobs
							if ("sources" in q_obj[i]){
								if ("sources" in q_obj[i]){
									q_obj[i]["source"] = path.basename(q_obj[i]["sources"]["current_file"]);
								}else if ("source" in q_obj[i]){
									q_obj[i]["source"] = path.basename(q_obj[i]["source"]);
								}
								
							}
							q_obj[i]["host"] = "Queued";
							q_obj[i]["status"] = "Queued";
                            try{
							q_obj[i]["job_start"] = getDateStr(q_obj[i]["submit"]["time"]);
                            }catch(ex){
                                console.log("getdate failed on:" ,q_obj[i])
                            }
							q_obj[i]["proc"] = "Queued";
				}
			}
			
			// //send the new jobs to connected clients, todo: only notify clients about new stuff
				if (JSON.parse(body)["tickets"]["queued"]){
                    
					global.socketio.emit("queuedjobs", JSON.stringify(q_obj));
					//global.socketio.emit("queuedjobcount", JSON.parse(body)["tickets"]["queued"].length);                
				}else{
                    console.log("Error, we should not come here, queued")
					global.socketio.emit("queuedjobs", "[]");
					//global.socketio.emit("queuedjobcount", 0);               
				}
		}catch(exc){
			console.error("Error occured while sending queuedjobs to clients: " + exc )
			console.error(exc.stack)
            console.error(q_obj)
		}
		//WATCHFOLDER Incoming
        try{
		//transform to match activejobs structure
			
			var q_obj = JSON.parse(body)["tickets"]["incoming"];
			if (q_obj !== undefined) {
				for (i=0; i<q_obj.length;i++){
							q_obj[i]["key"] = hashCode(JSON.stringify(q_obj[i]));

							q_obj[i]["split_id"] = ""
							q_obj[i]["state"] = "Incoming";
							q_obj[i]["title"] = "Incoming";
							q_obj[i]["steps"] = "";
							q_obj[i]["progress"] = "0";
							q_obj[i]["workflow"] = q_obj[i]["internal_wf_name"]; 
							q_obj[i]["source"] = path.basename(q_obj[i]["sources"]["current_file"]);
							q_obj[i]["status"] = "Incoming";
							q_obj[i]["job_start"] = getDateStr(q_obj[i]["submit"]["time"]);
							q_obj[i]["proc"] = "Watchfolder";
				}
			}
			
			//send the new jobs to connected clients, todo: only notify clients about new stuff
			
			if (JSON.parse(body)["tickets"]["incoming"]){
				
				global.socketio.emit("incomingjobs", JSON.stringify(q_obj));
				//global.socketio.emit("incomingjobcount", JSON.parse(body)["tickets"]["incoming"].length);                
			}else{
				console.log("Error, we should not come here, keyword: incoming")
				global.socketio.emit("incomingjobs", "[]");
				global.socketio.emit("incomingjobcount", 0);               
			}
		}catch(exc){
			console.error("Error occured while sending incoming to clients: " + exc )
			console.error(exc.stack)
            console.error(q_obj[i])
		}
		return;
        //store in database

    });
    
	//fetch HISTORY jobs from api
	getHistoryJobs();
	
    async function getHistoryJobs(error) {
		console.log("------ HISTORY ------")
		
		if (!global.db.deleted_jobs){
			console.log("global.db.deleted_jobs not defined, is Database started yet?")
			return;
		}
		try{
			if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
				return;
			}
			if(error) {
				console.log("Error retrieving finished jobs",buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL),error)
				global.socketio.emit("error", 'Error retrieving finished jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + error   );
				return;
			}

			var body = await getSigniantJobList("Testsystem_FTC_Test_Loopa");
			body = JSON.stringify(body)
			console.log("got signiant history")
			if (global.lasthistory == body){
				//console.log("History Jobs did not change since last fetch...")			
				return;
			}
			global.lasthistory = body;
			
			var jobArray;
			try{
				jobArray = JSON.parse(body).history;
			}catch(exc){
				//the statement is not 100% correct because the issue could also be caused by the caching ffastrans does.
				var msg = "FFAStrans sent out invalid history data. Please locate Processors\\db\\cache\\monitor\\log.txt, send a Copy to the developers and then delete the file and restart FFAStrans service/application. ";
				console.error(msg);
				global.socketio.emit("alert", msg );
				return;
			}
			//store history jobs in database
			var newjobsfound = 0;
			
			//TRY GET CHILDS FOR TREEGRID        
			//filter deleted
			var job_id_array = jobArray.map(job=> job.job_id)
			var deleted_ids = await global.db.deleted_jobs.find({ "job_id": { "$in": job_id_array}});
			deleted_ids = await deleted_ids.toArray();
			deleted_ids = deleted_ids.map(doc=>doc.job_id);//mongo docs to string array
			//restructure array from ffastrans,build famliy tree
			var non_deleted_jobs = []
			for (let i = 0; i < jobArray.length; i++){
					//only jobguid plus split makes each job entry unique
					jobArray[i]["_id"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
					
					//data for client display
					jobArray[i].state = m_jobStates[jobArray[i]["state"]];
					jobArray[i].outcome = jobArray[i]["result"];
					//don't store result (we store as outcome)
					jobArray[i] = objectWithoutKey("result",jobArray[i]);
					jobArray[i].job_start = getDateStr(jobArray[i]["start_time"]);
					jobArray[i].job_end = getDateStr(jobArray[i]["end_time"]);
					//jobArray[i].o_job_start = getDateObj(jobArray[i]["start_time"]);
					//jobArray[i].o_job_end = getDateObj(jobArray[i]["end_time"]);
					
					//todo: remove start_time and end_time, we store as job_start and job_end
					jobArray[i].duration = (getDurationStringFromDates(jobArray[i].job_start, jobArray[i].job_end )+"");
					jobArray[i].wf_name = jobArray[i]["workflow"];

					//filter deleted jobs from new joblist
					if (deleted_ids.indexOf(jobArray[i]["job_id"]) == -1){
						non_deleted_jobs.push(jobArray[i]);
					}else{
						continue;
					}
					
			}
			jobArray = non_deleted_jobs;//go on only with non deleted jobs

			//get last 10k jobids from DB - child jobs need to finish within that period to be grouped correctly;-)
			var lastTenThousand 	= await global.db.jobs.find({},{sort:{job_start:-1},projection:{job_start:1,job_id:1,"children._id":1}}).limit(10000);
			lastTenThousand 		= await lastTenThousand.toArray();
			//make list of all existing _id's / traverse children and main objects
			var existingInternalIds 		= [];
			for (const _job of lastTenThousand) {
				existingInternalIds.push(_job._id);
				if (_job.children){
					for (const _child of _job.children) {
						existingInternalIds.push(_child._id);
					}
				}
			}
			//mainjob and children share the same job_id
			var existingMainJob_job_ids = lastTenThousand.map((my) => my.job_id);//this only gets job_id's of mainjobs (not _id's)

			for (let i=0;i<jobArray.length;i++){
				if (existingInternalIds.indexOf(jobArray[i]._id) != -1 && existingMainJob_job_ids.indexOf(jobArray[i].job_id) != -1){
					//job already in db
					continue;
				}

				//this is a new job
				var existingIndex = existingMainJob_job_ids.indexOf(jobArray[i].job_id) ;
				var insertedDoc;

				if (existingIndex == -1){
					//check if deleted

					//insert new mainjob if needed
					var newmainjob = JSON.stringify(jobArray[i]);//mainjob = copy of current job
					newmainjob = JSON.parse(newmainjob);
					newmainjob.children = [];	
					newmainjob._id = jobArray[i].job_id + "_main"; //internal database id for mainjob, just for the db, not for use in code!
					newmainjob.result = ""; //we delete result as only childs contain it.
					insertedDoc = await global.db.jobs.insertOne(newmainjob);
					existingMainJob_job_ids.push(newmainjob.job_id); //supports multiple branches finished in single fetcher run
					
				}
				
				//get mainjob from db and insert child
				var mainjob = await global.db.jobs.findOne({job_id:jobArray[i].job_id});

				if (mainjob.children.length == 0){
					//we inserted a new mainjob, add first child
					jobArray[i]._id = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
					mainjob.children.push(jobArray[i]);
				}else{
					//udpate existing mainjob
					var existingChildIds = mainjob.children.map((child) => child._id);
					if (existingChildIds.indexOf(jobArray[i]._id) == -1){
						mainjob.children.push(jobArray[i]);
						//get data start and end of mainjob
						mainjob.job_start = getYoungestJobStart(mainjob.children);
						mainjob.job_end = getOldestJobEnd(mainjob.children);
						mainjob.duration = (getDurationStringFromDates(mainjob.job_start, mainjob.job_end )+"");
						mainjob.state = getJobstate(mainjob.children);
						mainjob.outcome = getJobOutcome(mainjob.children);
					}
				}
				
				//update mainjob, inserts additional children
				
				insertedDoc = await global.db.jobs.updateOne({job_id:jobArray[i].job_id},{$set: mainjob},{upsert:true});

				if(insertedDoc){
					console.log("New History Job: " , jobArray[i]);
					global.socketio.emit("newhistoryjob", jobArray[i]);//inform clients about the current num of history job
				}
					
				continue;            
			}//for
		}
		catch(ex){
			console.log(ex.stack);
		
		}
        
    }  
  }
};

/* HELPERS */

function objectWithoutKey(key,obj){
	var { [key]: val, ...rest } = obj;
	return rest;
}

function getJobstate(a_children){
	var state = a_children[a_children.length-1].state;
	var preferState = global.config.JOBFETCHER_AGGREGATE_BRANCH_STATE || "Success";
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.state == preferState){
			state = preferState;
		}
		if (_job.state == "Cancelled"){
			state = "Cancelled";
		}
	}
	return state;
}

function getJobOutcome(a_children){
	/* returns outcome of the last child with specified state */
	var outcome = a_children[a_children.length-1].outcome;
	var preferState = global.config.JOBFETCHER_AGGREGATE_BRANCH_STATE || "Success";
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.state == preferState){
			outcome = _job.outcome;
		}
	}
	return outcome;
}


function getYoungestJobStart(a_children){
	var youngest_start = a_children[0].job_start;
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.job_start < youngest_start)
			youngest_start = _job.job_start;
	}
	return youngest_start;
}

function getOldestJobEnd(a_children){
	var oldest_end = a_children[0].job_end;
	for (let i=0;i<a_children.length;i++){
		var _job = a_children[i];
		if (_job.job_end > oldest_end)
			oldest_end = _job.job_end;
	}
	return oldest_end;
}


function getDateObj(str){
    //ffastrans date:2019-10-14T21:22:35.046-01.00
	return moment(str).toDate();
}

function getDateStr(str){
    //ffastrans date:2019-10-14T21:22:35.046-01.00
	try{
		var re = new RegExp(".....$");
		var tz = str.match(/.(\d\d)$/);
		if (tz){
			tz = tz[1];
		}else{
			tz = "00";
			str = str.replace("Z","+00:00");//incoming jobs have wrong date format, this attempts to correct it
		}
		if (tz == "50") //translate between momentjs and ffastrans timezone
			tz = "30"
		var to_parse = str.replace(/...$/,":" + tz);
		var parsed = moment.parseZone(to_parse)
		return parsed.format("YYYY-MM-DD HH:mm:ss");
    }catch(ex){
		console.error("Error getDate: " +str);
		throw ex;
	}
}

function getDurationStringFromDates(start_date,end_date){
        //sconsole.log(start_date,end_date)
        var delta = Math.abs(new Date(end_date) - new Date(start_date)) / 1000;// get total seconds between the times
        var days = Math.floor(delta / 86400);// calculate (and subtract) whole days
        delta -= days * 86400;// calculate (and subtract) whole hours
        var hours = Math.floor(delta / 3600) % 24;
        delta -= hours * 3600;// calculate (and subtract) whole minutes
        var minutes = Math.floor(delta / 60) % 60;
        delta -= minutes * 60;// what's left is seconds
        var seconds = delta % 60;  // in theory the modulus is not required

        return pad(hours) + ":" + pad (minutes) + ":" + pad ((seconds+"").replace(/\.\d+/,"")); //TODO: seconds now contain ms... split this off
}

function pad(num) {
    var s = num+"";
    while (s.length < 2) s = "0" + s;
    return s;
}

function hashCode (string) {
//this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
  var hash = 0, i, chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}

function buildNewApiUrl(){
	var protocol = global.config.STATIC_WEBSERVER_ENABLE_HTTPS == "true" ? "https://" : "http://";
    return protocol + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT + "/tickets"
}

//var about_url = ("http://" + _host + ":" + _hostport + "/api/json/v2/about");
async function renewInstallInfo(about_url){
    //refresh ffastrans install info infinitely
    while (true){
        await sleep(15000);
        var install_info;
        try{
            install_info = await doRequest(about_url);
            install_info = JSON.parse(install_info);
        }catch(ex){
            console.error("Error getting install info, is FFAStrans API online?", about_url)
        }
        
        if (global.api_config["s_SYS_DIR"] != install_info["about"]["general"]["install_dir"] + "/"){
            console.log("Detected move of FFAStrans installation, resetting paths");
            global.api_config["s_SYS_DIR"] = install_info["about"]["general"]["install_dir"] + "/";
            global.api_config["s_SYS_CACHE_DIR"]    = global.api_config["s_SYS_DIR"] + "Processors/db/cache/";
            global.api_config["s_SYS_JOB_DIR"]      = global.api_config["s_SYS_DIR"] + "Processors/db/cache/jobs/";
            global.api_config["s_SYS_WORKFLOW_DIR"] = global.api_config["s_SYS_DIR"] + "Processors/db/configs/workflows/";
        }
    }
}

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}


async function sendEmailAlert(subject, body){
		if (!"email_alert_config" in global.config){
			return;
		}
		try{
			var rcpt = global.config["email_alert_config"]["email_alert_rcpt"];
			
			console.log("Sending alert email to: ",rcpt)
			console.log("Email sending result:",await smptMail.send(rcpt,subject, body));
			
		}catch(ex){
			console.error(ex.stack);
			console.error("Error sending email: ",ex);
		}
}



/* SIGNIANT STUFF */
var axios = require("axios")
var https = require("https")
var xml2js = require("xml2js")
var xparser = new xml2js.Parser(/* options */);

var sig_host = "swi13sigmxt";
var sig_user = "admin";
var sig_pass = "Siropa@0rfwiwi";
axios.defaults.headers.common['username'] = sig_user;
axios.defaults.headers.common['password'] = sig_pass;

const axiosinstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
});

var knownSigJobs = []

var psql_job_query = "SELECT a.id, to_json(a) as scheduled_job ,to_json(b) as scheduled_job_run, to_json(c) as scheduled_job_args FROM scheduled_job a    LEFT JOIN  (SELECT scheduled_job_id,started_at,ended_at FROM scheduled_job_run b   ) b ON a.id = b.scheduled_job_id LEFT JOIN  (SELECT scheduled_job_id,json_agg(json_build_object('name',argument_name,'value',argument_value))  FROM scheduled_job_arg c  GROUP BY scheduled_job_id ) c ON a.id = c.scheduled_job_id WHERE  a.contract_id = (select contract_id from contract where contract_name = '___JOBGROUP___')   ORDER BY a.id desc LIMIT 1000;"

async function getSigniantJobList(jobGroup){
	
	var query_copy = psql_job_query;
	query_copy = query_copy.replace("___JOBGROUP___",jobGroup)
	var url = "https://"+sig_host+"/signiant/3rdparty/search/jsps/getDhtmlxGridXml.jsp?query=" + encodeURIComponent(query_copy)
	var sigjobres = await axiosinstance.get(url);
	var parsedData = (await(xparser.parseStringPromise(sigjobres.data)));
	
	var all_jobs = []
	for (row of parsedData.rows.row){
		try{
			//the parsing is in sync with whats returned by job_query
			var this_job = {id:row.cell[0],scheduled_job:JSON.parse(row.cell[1]),run:JSON.parse(row.cell[2]),args:JSON.parse(row.cell[3]).json_agg};
			if (this_job.run == null)
				throw new Error("Run is null, "+ this_job.id)
			all_jobs.push(translateSigJob(this_job,jobGroup))
			
		}catch(ex){
			console.log("Error parsing jobjson: ",row.cell[0],ex)
		}
	}
	
	console.log(all_jobs)
	return {history:all_jobs};//simulate ffastrans response
}

function translateSigJob(sigJob,jobGroupName){
   return {
		"workflow": jobGroupName,
		"start_time": sigJob.run.started_at,
		"end_time": sigJob.run.ended_at,
		"source": "sourcefile",
		"result": sigJob.scheduled_job.last_active_status_msg,
		"state": 1,
		"job_id": sigJob.id,
		"split_id": "1-0-0"
	}
}
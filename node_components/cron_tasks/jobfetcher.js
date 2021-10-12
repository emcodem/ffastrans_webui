const assert = require('assert');
const Request = require("request");
const date = require('date-and-time');
const moment = require('moment');
const path = require("path")
// const blocked = require("blocked-at") //use this cool module to find out if your code is blocking anywhere
//todo: implement queued jobs
var m_jobStates = ["Error","Success","Cancelled","Unknown"];
process.env.UV_THREADPOOL_SIZE = 128;

// blocked((time, stack) => {
  // console.log(`Blocked for ${time}ms, operation started here:`, stack)
// })

module.exports = {
    fetchjobs: function () {

    //inform clients about current job count
    var countObj = { errorjobcount: 0, successjobcount: 0, cancelledjobcount: 0 };
    //inform the client about current count in DB
    global.db.jobs.count({ "state": "Success", "deleted": { $exists: false } }, function (err, success_count) {
        //console.log("successcount", success_count)
        countObj.successjobcount = success_count;
        global.db.jobs.count({ "state": "Error", "deleted": { $exists: false } }, function (err, error_count) {
            countObj.errorjobcount = error_count;
            global.db.jobs.count({ "state": "Cancelled", "deleted": { $exists: false } }, function (err, cancelled_count) {
                countObj.cancelledjobcount = cancelled_count;
                //push data to client
                global.socketio.emit("historyjobcount", countObj);
            })
        })
    })//end of counting

    //fetch running jobs from api
    if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
        return;
    }
    Request.get(buildApiUrl(global.config.STATIC_GET_RUNNING_JOBS_URL), {timeout: 5000,agent: false,maxSockets: Infinity}, function (error, response, body)  {
            if(error) {
                global.socketio.emit("error", 'Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error('Error getting running jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                console.error(error);
                return;
            }
                
            var jobArray;		
            try{
                jobArray = JSON.parse(body).jobs;
            }catch(exc){
                console.error("Error occured while parsing active jobs to json: " + exc + body)
            }
            
            for (i=0;i<jobArray.length;i++){
                jobArray[i]["guid"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
                var idx = jobArray[i]["guid"].split("~");
                //data for client display
                jobArray[i]["key"] = jobArray[i]["guid"];//for fancytree internal purpose
                jobArray[i].guid = jobArray[i]["guid"]
                jobArray[i]._id = jobArray[i].guid;
                jobArray[i].state = "Active";
                jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
                jobArray[i].file = jobArray[i]["source"]
                jobArray[i].outcome = jobArray[i]["status"]
                jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
                jobArray[i].wf_name = jobArray[i]["workflow"];
                
            }//for all jobs
                       
           //todo: store last active jobs array in DB for immediate client initialisation?
           
        //send the new jobs to connected clients, todo: only notify clients about new stuff
		try{
			global.socketio.emit("activejobs", JSON.stringify(jobArray));
			global.socketio.emit("activejobcount", jobArray.length);
		}catch(exc){
			console.error("Error occured while sending activejobs to clients: " + exc + body)
		}
    });
    
    //fetch queued jobs from api
    Request.get("http://localhost:3003/tickets", {timeout: 5000},(error, response, body) => {   
        
        //TODO: merge Active and queued call
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            console.error("Fatal, lobal.config.STATIC_USE_PROXY_URL is true but should be false! ")
            return;
        }
        if(error) {
            console.log('Internal Error getting Queued Jobs,  ' + "http://localhost:3003/tickets", error)
            global.socketio.emit("error", 'Internal Error getting Queued Jobs,  ' + "http://localhost:3003/tickets");
            return;
        }
		try{
		//QUEUED JOBS (in ffastrans queued folder)
			
			var q_obj = JSON.parse(body)["tickets"]["queued"];
			if (q_obj !== undefined) {
				for (i=0; i<q_obj.length;i++){
							q_obj[i]["key"] = JSON.stringify(q_obj[i]).hashCode();
							q_obj[i]["split_id"] = ""
							q_obj[i]["state"] = "Queued";
							q_obj[i]["title"] = "Queued";
							q_obj[i]["steps"] = "";
							q_obj[i]["progress"] = "0";
							q_obj[i]["workflow"] = q_obj[i]["workflow"]; //todo: implement workflow in ffastrans tickets api for pending jobs
							if ("sources" in q_obj[i]){
								q_obj[i]["file"] = path.basename(q_obj[i]["sources"]["current_file"]);
							}
							q_obj[i]["host"] = "Queued";
							q_obj[i]["status"] = "Queued";
                            try{
							q_obj[i]["job_start"] = getDate(q_obj[i]["submit"]["time"]);
                            }catch(ex){
                                console.log("getdate failed on:" ,q_obj[i])
                            }
							q_obj[i]["proc"] = "Queued";
				}
			}
			
			//send the new jobs to connected clients, todo: only notify clients about new stuff
				if (JSON.parse(body)["tickets"]["queued"]){
                    
					global.socketio.emit("queuedjobs", JSON.stringify(q_obj));
					global.socketio.emit("queuedjobcount", JSON.parse(body)["tickets"]["queued"].length);                
				}else{
                    console.log("Error, we should not come here, queued")
					global.socketio.emit("queuedjobs", "[]");
					global.socketio.emit("queuedjobcount", 0);               
				}
		}catch(exc){
			console.error("Error occured while sending queuedjobs to clients: " + exc )
			console.error(exc.stack)
            console.error(q_obj[i])
		}
		//WATCHFOLDER Incoming
        try{
		//transform to match activejobs structure
			
			var q_obj = JSON.parse(body)["tickets"]["incoming"];
			if (q_obj !== undefined) {
				for (i=0; i<q_obj.length;i++){
							q_obj[i]["key"] = JSON.stringify(q_obj[i]).hashCode();
                            
							q_obj[i]["split_id"] = ""
							q_obj[i]["state"] = "Incoming";
							q_obj[i]["title"] = "Incoming";
							q_obj[i]["steps"] = "";
							q_obj[i]["progress"] = "0";
							q_obj[i]["workflow"] = q_obj[i]["internal_wf_name"]; 
							q_obj[i]["file"] = path.basename(q_obj[i]["sources"]["current_file"]);
							q_obj[i]["status"] = "Incoming";
							q_obj[i]["job_start"] = getDate(q_obj[i]["submit"]["time"]);
							q_obj[i]["proc"] = "Watchfolder";
				}
			}
			
			//send the new jobs to connected clients, todo: only notify clients about new stuff
			
				if (JSON.parse(body)["tickets"]["incoming"]){
                    
					global.socketio.emit("incomingjobs", JSON.stringify(q_obj));
					global.socketio.emit("incomingjobcount", JSON.parse(body)["tickets"]["incoming"].length);                
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
    Request.get(buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL), {timeout: 5000},async function(error, response, body) {
        if (!JSON.parse(global.config.STATIC_USE_PROXY_URL)){
            return;
        }
        if(error) {
            console.log("Error retrieving finished jobs",buildApiUrl(global.config.STATIC_GET_FINISHED_JOBS_URL),error)
            global.socketio.emit("error", 'Error retrieving finished jobs, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + error   );
            return;
        }

        if (global.lasthistory == body){          
            return;
        }
        global.lasthistory = body;
        
        var jobArray;		
		try{
			//jobArray = JSON.parse(body).history;
			var mrazik = '{"discovery":"http://dnvideoingest:65445/api/v2","history":[{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:33:23.516+05.50","end_time":"2021-10-12T16:47:25.926+05.50","source":"211012_RAN_22","result":"Success","state":1,"job_id":"20211012-1600-4434-37f4-3e1c2c4436ac","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:26:35.412+05.50","end_time":"2021-10-12T16:44:57.772+05.50","source":"211011_RAN_16","result":"Success","state":1,"job_id":"20211012-1600-3928-9eda-46cf8b861bdf","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:25:47.967+05.50","end_time":"2021-10-12T16:42:33.315+05.50","source":"211011_RAN_17","result":"Success","state":1,"job_id":"20211012-1600-3502-0a97-06a3f43d7d3d","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:25:42.928+05.50","end_time":"2021-10-12T16:40:46.281+05.50","source":"211011_RAN_25","result":"Success","state":1,"job_id":"20211012-1600-2961-63a9-cd574a354830","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:25:28.506+05.50","end_time":"2021-10-12T16:33:22.236+05.50","source":"211011_RAN_26","result":"Success","state":1,"job_id":"20211012-1600-2639-6d90-74784528548a","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:13.870+05.50","end_time":"2021-10-12T16:26:34.170+05.50","source":"211006_PRG_CITY_LIGHT_GHY_SAGA_Ep3_pt1","result":"Success","state":1,"job_id":"20211012-1551-2626-30a0-45565f8f6198","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:25:17.283+05.50","end_time":"2021-10-12T16:25:46.913+05.50","source":"211012_NWS_SONAPUR_HEALTH_MINISTER_SOT","result":"Success","state":1,"job_id":"20211012-1555-3192-569a-c4461bf207bc","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:25:09.123+05.50","end_time":"2021-10-12T16:25:41.786+05.50","source":"211012_NWS_SONAPUR_HEALTH_MINISTER_SOT","result":"Success","state":1,"job_id":"20211012-1555-3068-32d9-c5f9a752791b","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:25:08.096+05.50","end_time":"2021-10-12T16:25:27.236+05.50","source":"211012_NWS_SONAPUR_HEALTH_MINISTER_VOT","result":"Success","state":1,"job_id":"20211012-1554-5086-5ba4-00d370c8ac5a","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:59.422+05.50","end_time":"2021-10-12T16:25:16.022+05.50","source":"211012_NWS_SONAPUR_HEALTH_MINISTER_VOT","result":"Success","state":1,"job_id":"20211012-1554-5071-75ba-0b585c269002","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:15.665+05.50","end_time":"2021-10-12T16:25:07.792+05.50","source":"211012_NWS_JORHAT_FLAG_MASS_TL","result":"Success","state":1,"job_id":"20211012-1551-4085-6294-f4a077cb0047","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:15.370+05.50","end_time":"2021-10-12T16:25:06.955+05.50","source":"211012_NWS_JORHAT_FLAG_MASS_TL","result":"Success","state":1,"job_id":"20211012-1551-4068-73e0-0800ecad650e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:45.192+05.50","end_time":"2021-10-12T16:24:58.165+05.50","source":"211012_NWS_JORHAT_FLAG_MASS_VOT","result":"Success","state":1,"job_id":"20211012-1551-4586-6334-8dbeccb7a168","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:30.779+05.50","end_time":"2021-10-12T16:24:43.703+05.50","source":"211012_NWS_JORHAT_FLAG_MASS_VOT","result":"Success","state":1,"job_id":"20211012-1551-4568-29e3-b5e36e891217","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:21:39.546+05.50","end_time":"2021-10-12T16:24:29.464+05.50","source":"211010_PRG_6PM_NK_PRIME_P4","result":"Success","state":1,"job_id":"20211012-1551-2585-8f9c-4826e85da134","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:06.841+05.50","end_time":"2021-10-12T16:24:14.527+05.50","source":"\/\/192.168.5.100\/aveco\/211008_PRG_CITY_LIGHT_GHY_SAGA_Ep5_pt3","result":"Lowres@DNVIDEOINGEST: Validate: 2021_10_08__04_51_30___211008_PRG_CITY_LIGHT_GHY_SAGA_Ep5_pt3.mxf: Invalid argument.","state":0,"job_id":"20211012-1551-2594-9813-01a5519e9a46","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:21:20.093+05.50","end_time":"2021-10-12T16:24:14.155+05.50","source":"211006_PRG_TINSUKIA_MALINI_THAN_PART_2","result":"Success","state":1,"job_id":"20211012-1551-2576-78a0-520e7fe08b02","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:24:07.404+05.50","end_time":"2021-10-12T16:24:12.761+05.50","source":"\/\/192.168.5.100\/aveco\/210930_RBP_LAKSHYA_G_DHEMAJI_CABINET_PC_1","result":"Lowres@DNVIDEOINGEST: Validate: 210930_RBP_LAKSHYA_G_DHEMAJI_CABINET_PC_1.mxf: Invalid argument.","state":0,"job_id":"20211012-1551-2617-4b0e-99128e940c8d","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:21:02.215+05.50","end_time":"2021-10-12T16:24:06.260+05.50","source":"211011_NWS_6PM_NEWS_RPT_P3","result":"Success","state":1,"job_id":"20211012-1551-2566-3581-edba8c333a34","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:20:59.622+05.50","end_time":"2021-10-12T16:24:05.785+05.50","source":"211006_PRG_OBAK_PRITHVI_PT2","result":"Success","state":1,"job_id":"20211012-1551-2557-4b79-e45b71403302","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:17:06.584+05.50","end_time":"2021-10-12T16:21:38.305+05.50","source":"211011_NWS_6PM_NEWS_RPT_P2","result":"Success","state":1,"job_id":"20211012-1551-2280-3c98-67ab4266dd6b","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:17:10.570+05.50","end_time":"2021-10-12T16:21:18.965+05.50","source":"211006_PRG_Mahalaya_Pt2","result":"Success","state":1,"job_id":"20211012-1551-2302-60c3-45556a424948","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:17:10.690+05.50","end_time":"2021-10-12T16:21:01.057+05.50","source":"211007_PRG_DESH_DUNIA_RPT_PT2","result":"Success","state":1,"job_id":"20211012-1551-2547-77c4-ca71765d037e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:14:01.490+05.50","end_time":"2021-10-12T16:20:58.362+05.50","source":"2021_10_08__04_58_14___150921_PUAR PRASHANGA_Part_2","result":"Success","state":1,"job_id":"20211012-1551-1476-8d6e-163b8d202281","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:16:54.010+05.50","end_time":"2021-10-12T16:17:05.457+05.50","source":"\/\/192.168.5.100\/aveco\/211008_PRG_ETIBASAK_LUNA_PT3","result":"Lowres@DNVIDEOINGEST: Validate: 211008_PRG_ETIBASAK_LUNA_PT3.mxf: Invalid argument.","state":0,"job_id":"20211012-1551-1739-595d-c2a756511e5a","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:12:22.393+05.50","end_time":"2021-10-12T16:16:52.935+05.50","source":"211010_FILM_KANYADAN_PT8","result":"Success","state":1,"job_id":"20211012-1551-1459-3d3f-6c722487653f","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:13:53.131+05.50","end_time":"2021-10-12T16:14:00.386+05.50","source":"\/\/192.168.5.100\/aveco\/150921_PUAR PRASHANGA_Part_2","result":"Lowres@DNVIDEOINGEST: Validate: 150921_PUAR PRASHANGA_Part_2.mxf: Invalid argument.","state":0,"job_id":"20211012-1551-1468-0f58-504e42557005","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:09:28.256+05.50","end_time":"2021-10-12T16:13:52.049+05.50","source":"211006_PRG_Mahalaya_Pt4","result":"Success","state":1,"job_id":"20211012-1551-1450-4666-e01482d60bb5","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:08:07.402+05.50","end_time":"2021-10-12T16:12:21.397+05.50","source":"211006_PRG_Mahalaya_Pt1","result":"Success","state":1,"job_id":"20211012-1551-1441-8439-5089370fd409","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:04:51.516+05.50","end_time":"2021-10-12T16:09:27.460+05.50","source":"211006_PRG_RPT_5PM_3","result":"Success","state":1,"job_id":"20211012-1551-1432-7423-328f018ffab7","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:03:10.094+05.50","end_time":"2021-10-12T16:08:06.398+05.50","source":"211011_NWS_6PM_NEWS_RPT_P4","result":"Success","state":1,"job_id":"20211012-1551-1300-9809-5ab7adb39625","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T16:04:45.123+05.50","end_time":"2021-10-12T16:04:50.777+05.50","source":"\/\/192.168.5.100\/aveco\/211008_PRG_ETIBASAK_LUNA_PT1","result":"Lowres@DNVIDEOINGEST: Validate: 211008_PRG_ETIBASAK_LUNA_PT1.mxf: Invalid argument.","state":0,"job_id":"20211012-1551-1322-8af5-c5b9c63821b9","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:58:06.626+05.50","end_time":"2021-10-12T16:04:43.931+05.50","source":"211011_NWS_5PM_NEWS_RPT_P1","result":"Success","state":1,"job_id":"20211012-1551-0039-0428-88568d833659","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:56:00.846+05.50","end_time":"2021-10-12T16:03:08.991+05.50","source":"211011_NWS_6PM_NEWS_RPT_P1","result":"Success","state":1,"job_id":"20211012-1550-5995-6aab-e421e69d4a4f","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:57:59.345+05.50","end_time":"2021-10-12T15:58:05.437+05.50","source":"\/\/192.168.5.100\/aveco\/210928_RBP_DIBRUGARH_RAJIB _GOGOI_STORY","result":"Lowres@DNVIDEOINGEST: Validate: Untitled1-210928_RBP_DIBRUGARH_RAJIB _GOGOI_STORY.mxf: Invalid argument.","state":0,"job_id":"20211012-1551-0005-2557-4d7cfb97918a","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:50:59.019+05.50","end_time":"2021-10-12T15:57:57.766+05.50","source":"211011_NWS_5PM_NEWS_RPT_P1","result":"Success","state":1,"job_id":"20211012-1550-5611-7ed8-7f53842e74ec","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:49:58.642+05.50","end_time":"2021-10-12T15:55:58.674+05.50","source":"211010_PRG_BORNIL_RPT_P2","result":"Success","state":1,"job_id":"20211012-1549-5767-3c9f-60c750422a9c","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:50:53.679+05.50","end_time":"2021-10-12T15:50:57.836+05.50","source":"\/\/192.168.5.100\/aveco\/211008_PRG_ETIBASAK_LUNA_PT1","result":"Lowres@DNVIDEOINGEST: Validate: 211008_PRG_ETIBASAK_LUNA_PT1.mxf: Invalid argument.","state":0,"job_id":"20211012-1550-5270-4fbb-67b000c11b27","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:50:07.400+05.50","end_time":"2021-10-12T15:50:13.091+05.50","source":"\/\/192.168.5.100\/aveco\/211008_PRG_ETIBASAK_LUNA_PT1","result":"Lowres@DNVIDEOINGEST: Validate: 211008_PRG_ETIBASAK_LUNA_PT1.mxf: Invalid argument.","state":0,"job_id":"20211012-1550-0635-30a0-8397c6a12995","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:49:07.690+05.50","end_time":"2021-10-12T15:50:01.976+05.50","source":"211012_NWS_Gautam_roy_Pkg","result":"Success","state":1,"job_id":"20211012-1549-0697-1b01-e7a761fc7a05","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:49:37.647+05.50","end_time":"2021-10-12T15:49:42.119+05.50","source":"\/\/192.168.5.100\/aveco\/210928_RBP_DIBRUGARH_RAJIB _GOGOI_STORY","result":"Lowres@DNVIDEOINGEST: Validate: Untitled1-210928_RBP_DIBRUGARH_RAJIB _GOGOI_STORY.mxf: Invalid argument.","state":0,"job_id":"20211012-1549-3695-8891-5dcbfd3cee36","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:43:41.440+05.50","end_time":"2021-10-12T15:44:02.746+05.50","source":"211012_NWS_DERGAON_50_YRS_PUJA_SOT","result":"Success","state":1,"job_id":"20211012-1543-4086-2438-0590c158e066","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:43:47.712+05.50","end_time":"2021-10-12T15:43:58.023+05.50","source":"211012_NWS_DERGAON_50_YRS_PUJA_VOT","result":"Success","state":1,"job_id":"20211012-1543-4677-3568-20c2823c852e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:41:23.612+05.50","end_time":"2021-10-12T15:41:36.853+05.50","source":"211012_NWS_NALBARI_MURDER_VOT","result":"Success","state":1,"job_id":"20211012-1541-2278-8e3a-86b9384830aa","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:41:03.232+05.50","end_time":"2021-10-12T15:41:17.888+05.50","source":"211012_NWS_NALBARI_MURDER_SOT","result":"Success","state":1,"job_id":"20211012-1541-0240-8af6-459ee0c60a3c","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:40:34.732+05.50","end_time":"2021-10-12T15:40:49.643+05.50","source":"211012_NWS_RAJKANNYA_ARREST_VOT","result":"Success","state":1,"job_id":"20211012-1537-5387-74a2-4be2190bcd15","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:40:27.432+05.50","end_time":"2021-10-12T15:40:38.164+05.50","source":"211012_NWS_DURGA_PUJA_MONTAGE","result":"Success","state":1,"job_id":"20211012-1535-3585-1c2b-22bb43f77ac4","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:38:43.785+05.50","end_time":"2021-10-12T15:40:33.815+05.50","source":"211012_PRG_TINSUKIA_MALINI_THAN_PT_3","result":"Success","state":1,"job_id":"20211012-1533-4190-8f5c-7a71eb067d12","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:39:42.480+05.50","end_time":"2021-10-12T15:40:26.465+05.50","source":"211012_NWS_IPL_JUWARI_IN_COURT_SOT","result":"Success","state":1,"job_id":"20211012-1534-5085-4250-6383fcbd6883","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:39:23.453+05.50","end_time":"2021-10-12T15:39:41.261+05.50","source":"211012_NWS_IPL_JUWARI_IN_COURT_VOT","result":"Success","state":1,"job_id":"20211012-1534-3587-41b2-25dd4b621036","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:36:51.859+05.50","end_time":"2021-10-12T15:39:22.530+05.50","source":"211012_PRG_TINSUKIA_MALINI_THAN_PT_2","result":"Success","state":1,"job_id":"20211012-1533-1587-834d-22d50050985d","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:36:45.619+05.50","end_time":"2021-10-12T15:38:42.724+05.50","source":"211012_PRG_TINSUKIA_MALINI_THAN_PT_1","result":"Success","state":1,"job_id":"20211012-1532-0083-0e2e-44392ab9ada3","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:36:12.753+05.50","end_time":"2021-10-12T15:36:50.782+05.50","source":"211012_NWS_BASISTHA_VISHAL_CLOSED_SOT","result":"Success","state":1,"job_id":"20211012-1521-1093-4754-9c6feafeabcc","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:34:56.213+05.50","end_time":"2021-10-12T15:36:44.521+05.50","source":"211006_PRG_TINSUKIA_MALINI_THAN_PART_3","result":"Success","state":1,"job_id":"20211012-1515-3930-6866-f0a72c76cf44","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:35:39.942+05.50","end_time":"2021-10-12T15:36:11.669+05.50","source":"211012_NWS_BASISTHA_VISHAL_CLOSED_VOT","result":"Success","state":1,"job_id":"20211012-1520-5589-0312-a930b9eb1a97","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:32:54.698+05.50","end_time":"2021-10-12T15:35:38.839+05.50","source":"211006_PRG_TINSUKIA_MALINI_THAN_PART_2","result":"Success","state":1,"job_id":"20211012-1515-3665-9380-4ceb9b0250e0","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:32:40.090+05.50","end_time":"2021-10-12T15:34:55.234+05.50","source":"211006_PRG_TINSUKIA_MALINI_THAN_PART_1","result":"Success","state":1,"job_id":"20211012-1514-0583-0c42-9fb3709f54f2","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:24:09.276+05.50","end_time":"2021-10-12T15:32:53.637+05.50","source":"211010_PRG_6PM_NK_PRIME_P1","result":"Success","state":1,"job_id":"20211012-1509-5278-4a4a-245b89b0d091","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:09:25.436+05.50","end_time":"2021-10-12T15:32:39.150+05.50","source":"211012_RAN_22","result":"Success","state":1,"job_id":"20211012-1509-1793-422f-f798562b4b9c","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:23:54.890+05.50","end_time":"2021-10-12T15:24:07.960+05.50","source":"211007_NWS_HL_5PM_1","result":"Success","state":1,"job_id":"20211012-1509-2931-7dff-d349df77d720","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:04:15.160+05.50","end_time":"2021-10-12T15:23:53.873+05.50","source":"211012_RAN_23","result":"Success","state":1,"job_id":"20211012-1504-1450-6e81-c9d5ee0c5cf7","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:09:12.237+05.50","end_time":"2021-10-12T15:09:24.351+05.50","source":"211008_NWS_HL_NK_PRIME_1","result":"Success","state":1,"job_id":"20211012-1509-0101-8a71-81b14f06bd3e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:08:56.004+05.50","end_time":"2021-10-12T15:09:11.562+05.50","source":"211010_NWS_Health_tips_vot","result":"Success","state":1,"job_id":"20211012-1508-5503-90f2-ded7e5fc11c9","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:08:24.705+05.50","end_time":"2021-10-12T15:08:34.740+05.50","source":"211011_MNT_MONTAGE_7_30PM","result":"Success","state":1,"job_id":"20211012-1508-2378-5158-46697cac274e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T15:01:02.859+05.50","end_time":"2021-10-12T15:03:27.437+05.50","source":"211014_PRG_PUAR_PRASHANGA_PT_2","result":"Success","state":1,"job_id":"20211012-1500-0784-9faf-7db46f629b14","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:59:37.653+05.50","end_time":"2021-10-12T15:02:15.988+05.50","source":"211014_PRG_PUAR_PRASHANGA_PT_1.","result":"Success","state":1,"job_id":"20211012-1459-3660-7306-9539b2bada00","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:58:53.755+05.50","end_time":"2021-10-12T15:01:01.627+05.50","source":"211014_PRG_PUAR_PRASHANGA_PT_3","result":"Success","state":1,"job_id":"20211012-1458-5257-1b12-508280154a4f","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:57:52.839+05.50","end_time":"2021-10-12T14:58:13.814+05.50","source":"211012_NWS_BISWANATH_WILD_ELEPHANT_SOT","result":"Success","state":1,"job_id":"20211012-1457-4721-8ab3-f097bf13d386","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:57:38.988+05.50","end_time":"2021-10-12T14:57:55.644+05.50","source":"211012_NWS_BISWANATH_WILD_ELEPHANT_VOT","result":"Success","state":1,"job_id":"20211012-1457-3786-363f-e2ce7939c473","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:57:31.578+05.50","end_time":"2021-10-12T14:57:51.732+05.50","source":"211012_PRO_PUJA_SELFIE","result":"Success","state":1,"job_id":"20211012-1457-3054-12a0-b550ee603b33","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:48:01.176+05.50","end_time":"2021-10-12T14:51:19.361+05.50","source":"211011_CITY_LIGHTS_LD_PT6_NEW","result":"Success","state":1,"job_id":"20211012-1448-0022-40b1-5ab316072fa3","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:41:43.147+05.50","end_time":"2021-10-12T14:42:01.939+05.50","source":"211010_PRO_PUJA_SELFIE","result":"Success","state":1,"job_id":"20211012-1441-4202-92f5-b7d88b396d0d","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:39:46.751+05.50","end_time":"2021-10-12T14:40:02.107+05.50","source":"211010_PRO_PUJA_MANDAP","result":"Success","state":1,"job_id":"20211012-1439-4580-24a7-66b319280af1","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:37:15.327+05.50","end_time":"2021-10-12T14:38:34.320+05.50","source":"211012_RBP_3","result":"Success","state":1,"job_id":"20211012-1437-1436-5eff-c51bfcab154e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:35:50.159+05.50","end_time":"2021-10-12T14:36:07.711+05.50","source":"211010_PRO_DURGA_PUJA_REGULAR2","result":"Success","state":1,"job_id":"20211012-1435-4951-65be-bd88354ac082","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:32:58.068+05.50","end_time":"2021-10-12T14:35:23.158+05.50","source":"211012_ADV_1183_LATEST","result":"Success","state":1,"job_id":"20211012-1432-5692-5cb2-e2298fa2eb0a","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:34:35.640+05.50","end_time":"2021-10-12T14:34:48.766+05.50","source":"211006_NWS_Rajkanya_Order_Vot_New","result":"Success","state":1,"job_id":"20211012-1434-3483-2439-b1b6cd778009","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:33:55.989+05.50","end_time":"2021-10-12T14:34:10.303+05.50","source":"211006_NWS_RAJKONYA_ICU_VOT","result":"Success","state":1,"job_id":"20211012-1433-3657-405d-62a488ec1df0","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:33:40.222+05.50","end_time":"2021-10-12T14:33:54.950+05.50","source":"211006_NWS_FAST_8_GOLAGHAT_SCRAP_MEDICINE_VOT","result":"Success","state":1,"job_id":"20211012-1433-0670-9a87-8571a8544605","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:33:24.707+05.50","end_time":"2021-10-12T14:33:39.282+05.50","source":"211006_NWS_FAST_4_CHIRANG_HANDICAP_PERSON_BUSINESS_VOT","result":"Success","state":1,"job_id":"20211012-1433-0650-4b95-d844f88bf9ce","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:33:07.025+05.50","end_time":"2021-10-12T14:33:23.614+05.50","source":"211006_NWS_DIBRUGARH_FIRING_NEW_VOT","result":"Success","state":1,"job_id":"20211012-1433-0628-671b-90e5ff834b27","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:32:06.607+05.50","end_time":"2021-10-12T14:32:21.929+05.50","source":"211012_ADV_NK1227","result":"Success","state":1,"job_id":"20211012-1432-0557-321d-c980bc9bc920","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:28:38.004+05.50","end_time":"2021-10-12T14:28:55.567+05.50","source":"211006_NWS_FAST_7_DULIAJAN VILLAGE_VOT","result":"Success","state":1,"job_id":"20211012-1428-0845-77b8-7ea09846184b","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:28:34.206+05.50","end_time":"2021-10-12T14:28:48.266+05.50","source":"211006_NWS_FAST_5_DHING_CORRUPTION_VOT","result":"Success","state":1,"job_id":"20211012-1428-0532-8f1c-8458f9a72fdd","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:28:21.007+05.50","end_time":"2021-10-12T14:28:36.828+05.50","source":"211006_NWS_FAST_3_BOKAJAN_DEATH_VOT","result":"Success","state":1,"job_id":"20211012-1427-3569-1d7a-f1ad218cb0fc","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:28:15.829+05.50","end_time":"2021-10-12T14:28:33.528+05.50","source":"211006_NWS_FAST_1_BAIHATA_BJP_JOINING_VOT","result":"Success","state":1,"job_id":"20211012-1427-3425-1ff0-fc150a1b6418","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:27:50.421+05.50","end_time":"2021-10-12T14:28:20.169+05.50","source":"211006_NWS_CP_ON_RAJKOINYA_SOT","result":"Success","state":1,"job_id":"20211012-1427-1379-567a-c96ffd3c3a8c","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:13:15.433+05.50","end_time":"2021-10-12T14:28:15.005+05.50","source":"211012_RAN_20","result":"Success","state":1,"job_id":"20211012-1413-1429-9f48-a76d7c976515","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:27:14.681+05.50","end_time":"2021-10-12T14:27:49.353+05.50","source":"211006_NWS_DHEMAJI_MORUBHUMI_VOT","result":"Success","state":1,"job_id":"20211012-1426-5895-0c6f-7994fd2474d2","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:26:40.766+05.50","end_time":"2021-10-12T14:27:13.925+05.50","source":"211006_NWS_DIBRUGARH_SP_SOT","result":"Success","state":1,"job_id":"20211012-1426-3976-7548-898011350b14","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:25:46.633+05.50","end_time":"2021-10-12T14:26:11.340+05.50","source":"211006_NWS_ATASHIL_PS_SOT","result":"Success","state":1,"job_id":"20211012-1425-4588-54f7-f1edc7344eb7","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:23:21.540+05.50","end_time":"2021-10-12T14:23:36.800+05.50","source":"211006_NWS_DIBRUGARH_FIRING_UPDATE_VOT","result":"Success","state":1,"job_id":"20211012-1423-2038-6b0b-1cefe9a2019f","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:22:19.985+05.50","end_time":"2021-10-12T14:22:30.736+05.50","source":"211010_ NWS_NK_GENIUS_Q_9","result":"Success","state":1,"job_id":"20211012-1422-1887-6de2-9ee6e2ef27c9","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:21:56.925+05.50","end_time":"2021-10-12T14:22:06.392+05.50","source":"211010_ NWS_NK_GENIUS_Q_2","result":"Success","state":1,"job_id":"20211012-1421-4993-0ca1-5eba9f1c692b","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:21:44.956+05.50","end_time":"2021-10-12T14:21:55.821+05.50","source":"211010_ NWS_NK_GENIUS_Q_2","result":"Success","state":1,"job_id":"20211012-1421-4417-9f15-a83f6748f59a","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:21:24.734+05.50","end_time":"2021-10-12T14:21:34.468+05.50","source":"211010_ NWS_NK_GENIUS_A_1","result":"Success","state":1,"job_id":"20211012-1421-2377-9f22-2c942285301e","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:20:51.336+05.50","end_time":"2021-10-12T14:21:06.820+05.50","source":"211010_ NWS_NK_GENIUS_A_6","result":"Success","state":1,"job_id":"20211012-1420-0342-45c2-6195964d37d3","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:20:37.270+05.50","end_time":"2021-10-12T14:20:50.246+05.50","source":"211010_ NWS_NK_GENIUS_Q_3","result":"Success","state":1,"job_id":"20211012-1419-5561-90e2-94a446d61ff9","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:20:21.006+05.50","end_time":"2021-10-12T14:20:36.179+05.50","source":"211010_ NWS_NK_GENIUS_A_6","result":"Success","state":1,"job_id":"20211012-1419-5540-4376-cc3d5c8c76eb","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:20:10.744+05.50","end_time":"2021-10-12T14:20:20.009+05.50","source":"211010_ NWS_NK_GENIUS_A_10","result":"Success","state":1,"job_id":"20211012-1419-5526-5a44-463f670b778f","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:19:56.250+05.50","end_time":"2021-10-12T14:20:09.762+05.50","source":"211009_NWS_NK_Express_37","result":"Success","state":1,"job_id":"20211012-1419-5445-6a1d-2a418e402e22","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:17:16.659+05.50","end_time":"2021-10-12T14:19:55.287+05.50","source":"211012_ADV_1183_LATEST","result":"Success","state":1,"job_id":"20211012-1417-1556-1528-4c562909ce1c","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:15:38.347+05.50","end_time":"2021-10-12T14:15:50.177+05.50","source":"211010_NWS_HL_NK_PRIME_3","result":"Success","state":1,"job_id":"20211012-1415-3754-93f0-6da51fb594eb","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:15:09.696+05.50","end_time":"2021-10-12T14:15:22.603+05.50","source":"211010_NWS_HL_5PM_3","result":"Success","state":1,"job_id":"20211012-1415-0880-6855-e2bff69b974f","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:10:17.870+05.50","end_time":"2021-10-12T14:10:21.168+05.50","source":"\/\/192.168.5.100\/aveco\/ 210902_NWS_BAJALI_ROAD_EROSION_VOT","result":"Lowres@DNVIDEOINGEST: Validate: Unknown error occured.","state":0,"job_id":"20211012-1410-1648-89c6-50e9f637520d","split_id":"1-4-4"},{"workflow":"CREATE EXTRAS","start_time":"2021-10-12T14:03:40.787+05.50","end_time":"2021-10-12T14:09:39.273+05.50","source":"211012_RAW_31","result":"Success","state":1,"job_id":"20211012-1403-3953-9c4c-46a610a95920","split_id":"1-4-4"}]}'
			jobArray = JSON.parse(mrazik).history;
		}catch(exc){
			console.error("Error occured while parsing history jobs to json: " + exc + body)
		}
		//store history jobs in database
        var newjobsfound = 0;
//TRY GET CHILDS FOR TREEGRID        
        
        //restructure array from ffastrans,build famliy tree
        
        for (i = 0; i < jobArray.length; i++){
                //only jobguid plus split makes each job entry unique
                jobArray[i]["guid"] = jobArray[i]["job_id"] + "~" + jobArray[i]["split_id"];
                
                //data for client display
                jobArray[i]["key"] = jobArray[i]["guid"];//for fancytree internal purpose
                jobArray[i].guid = jobArray[i]["guid"]
                jobArray[i]._id = jobArray[i].guid;
                jobArray[i].state = m_jobStates[jobArray[i]["state"]];
                jobArray[i].title = jobArray[i].state; //for fancytree internal purpose
                jobArray[i].file = jobArray[i]["source"]
                jobArray[i].outcome = jobArray[i]["result"]
                jobArray[i].job_start = getDate(jobArray[i]["start_time"]);
                jobArray[i].job_end = getDate(jobArray[i]["end_time"]);
                jobArray[i].duration = (getDurationStringFromDates(jobArray[i].job_start, jobArray[i].job_end )+"");
                jobArray[i].wf_name = jobArray[i]["workflow"];
                
                //internal data for sorting
                jobArray[i]["sort_family_name"] = jobArray[i]["job_id"];
                                        
                //workaround splitid does not allow us to parse family tree
                //get out if the lowest splitid of all jobs in array with this jobids
                var a_family = jobArray.filter(function (el) {
                    return el["job_id"] === jobArray[i]["job_id"];
                });

                var oldest_job = jobArray[i];
                
                for (x=0;x<a_family.length;x++){
                    if (getDate(a_family[x]["end_time"]) < getDate(oldest_job["end_time"]) ){
                        oldest_job = a_family[x];
                    }
                }
                //mark oldest job a grandfather job
                if (jobArray[i] == oldest_job){
                    jobArray[i]["sort_family_index"] = 0;//its a grandfather
                    jobArray[i]["sort_generation"] = 0;//
                }else{
                    jobArray[i]["sort_family_index"] = 1;//
                    jobArray[i]["sort_generation"] = 1;//its a childjob
                }
        }
        
//END OF Family sorting
        jobArray = await getFancyTreeArray(jobArray);

        for (i=0;i<jobArray.length;i++){
            (function(job_to_insert){   //this syntax is used to pass current job to asnyc function so we can emit it
                //upsert history record (update if family_member_count changed, insert new if not exists)
                global.db.jobs.update({"_id":jobArray[i]["guid"],"sort_family_member_count": { $lt: jobArray[i]["sort_family_member_count"]}},jobArray[i],{upsert:true},function(err, docs){
                    if(docs > 0 ){
                            //TODO: either change to another db or find out why docs sometimes contains a non changed document ^^
                            console.log("inserted " + job_to_insert["source"])
                            global.socketio.emit("newhistoryjob", job_to_insert);//inform clients about the current num of history job
                    }else{
                        
                    }
                })//job update
            })(jobArray[i]);//pass current job as job_to_insert param to store it in scope of update function
            continue;            
        }//for

        
    });   
  }
};

/* HELPERS */

async function getFancyTreeArray(jobArray){
    
        //find out all parents
        var godfathers = jobArray.filter(function (el) {
            return el["sort_generation"] === 0;
        });
        console.log("New History data, Number of Jobs ", godfathers.length, "Number of splits", jobArray.length);
        //find out all subjobs of same id
        for (var i in godfathers){
            var godfather = godfathers[i]; 
            var current_family_name = godfather["sort_family_name"]; //family_name is actually jobguid
            var family = jobArray.filter(function (el) {
                return el["sort_family_name"] === current_family_name;
             });
            
             godfather["sort_family_member_count"] = family.length;
              //array of families now contains all family members but flat only
             
             //build family tree             
             var generation_count = 1;
             if (family.length > 1){
                //it is family with childs, get out how many generations we have
                generation_count = Math.max.apply(Math, family.map(function(o) { return o["sort_generation"]; }))  
             }

            //foreach generation
            var generations = []
            //for (genidx=0;genidx<generation_count;genidx++){
                //foreach parent in this generation
                _parents = family.filter(function (el) {return el["sort_generation"] == 1})
                
                //find children of current parent in current generation
                godfather["children"] = family.filter(function (el) {
                    if (el["state"] == "Error"){
                        godfather["state"] = "Error";
                        godfather["outcome"] += ", Branch [" + el["split_id"]+"]: " + el["outcome"];
                        //todo: change error state also in DB
                    }
                    if (el["state"] != "Error"){
                        //change godfather state to success if any subsequent node succeeded
                        godfather["state"] = "Success";
                        godfather["title"] = "Success";
                    }
                    return (el["sort_generation"] == 1) ;
                });
                //}                
            }
            //godfather now contains full family tree

        return godfathers;

    
}

async function countJobsAsync(countobj) {
    let count = await new Promise((resolve, reject) => {
        global.db.jobs.count(countobj, (err, count) => {
            if (err) reject(err);
            resolve(count);
        });
    });
    return count ;
}

function getDate(str){
    //ffastrans date:2019-10-14T21:22:35.046-01.00
    var re = new RegExp("-.....");
	var tz = str.match(/.(\d\d)$/);
	tz = tz[1];
	console.log("TZ: ",tz[1])
	if (tz == "50")
		tz = "30"
	var to_parse = str.replace(/...$/,":" + tz);
	console.log("parsing time: ",to_parse)
    var parsed = moment.parseZone(to_parse)
    return parsed.format("YYYY-MM-DD HH:mm:ss");
    
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
        //if (!hours) {
        //    console.log("----------------------  hours is null");
        //    console.log(Math.floor(delta / 3600) % 24)
        //}

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
    return "http://" + global.config.STATIC_API_HOST + ":" + global.config.STATIC_API_NEW_PORT + "/tickets"
}

/* STRUCTS */
Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
	var hash = 0, i, chr;
	for (i = 0; i < this.length; i++) {
	  chr   = this.charCodeAt(i);
	  hash  = ((hash << 5) - hash) + chr;
	  hash |= 0; // Convert to 32bit integer
	}
	return hash;
  }
});
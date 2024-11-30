var moment = require('moment-timezone');
const { uuid } = require('uuidv4');
var axios = require("axios");
const { build_new_api_url } = require('./common/helpers');

module.exports = function(app, express){

	app.get('/deleteoldrecords', (req, res) => {
        
        return;
        //deletes records up to m_maximimjobcount (20k is fast enough in nedb for our application)
            console.log("Delete old records initiated, count:",global.config.STATIC_MAX_HISTORY_JOB_COUNT)
            if (!Number.isInteger(parseInt(global.config.STATIC_MAX_HISTORY_JOB_COUNT))){
                var txt = 'ERROR contact admin. Server setting STATIC_MAX_HISTORY_JOB_COUNT is not a number: [' + global.config.STATIC_MAX_HISTORY_JOB_COUNT + ']';
                console.error(txt);
                global.socketio.emit("error", txt);
            }else{
                global.config.STATIC_MAX_HISTORY_JOB_COUNT = parseInt(global.config.STATIC_MAX_HISTORY_JOB_COUNT)
            }
            
            global.db.jobs.count({}, function(err, count) {
                console.log("DB maintenance found " + count + " Jobs in database");
                if(count > defaultConfig.STATIC_MAX_HISTORY_JOB_COUNT){
                    console.log("DB maintenance initiating deletion of jobs");
                    var sorting = {};
                    sorting["job_end"] = -1;
                    //sort by date_end and skip maximum jobcount
                    global.db.jobs.find({}).sort(sorting).skip(defaultConfig.STATIC_MAX_HISTORY_JOB_COUNT).exec( function(err,cursor){
                        if (err){
                            console.error("DB maintenance error selecting oldest job");
                                res.writeHead(500,{"Content-Type" : "application/JSON"});
                                res.write("DB maintenance error, consult logs");//output json array to client
                                res.end();    
                        }
                        var idsToDelete = [];
                        for (doc in cursor){
                            idsToDelete.push(cursor[doc]._id);  //collect all ids
                        }
                        
                        //delete all collected id's in one shot
                        global.db.jobs.remove({ _id: { $in: idsToDelete } }, { multi: true },function(err,numRemoved){
                            if (err){
                                console.log("Error deleting job from DB: " + err);
                                res.writeHead(500,{"Content-Type" : "application/JSON"});
                                res.write("DB maintenance error, consult logs");//output json array to client
                                res.end();
                            }
                            console.log("Deleted " +numRemoved + " from DB")
                        })
                        global.db.jobs.persistence.compactDatafile(); //compress database
                        console.log("DB maintenanceattempts to delete deleting "+ cursor.length + " jobs") 
                    })
                }
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify({}));//output json array to client
                res.end();                
            })
            
    });
    
    var template =
    {
        "workflow": "Sleep",
        //"start_time": "2022-11-17T17:11:25.833+01:00", //not used, ffastrans only
        //"end_time": "2022-11-17T17:11:28.061+01:00", //not used, ffastrans only
        "source": "17:11:22:819",
        "result": "Success",
        "state": "Success",
        "job_id": "20221117-1711-2491-0beb-72d16b3db644",
        "split_id": "1-0-0",
        //"guid": "20221117-1711-2491-0beb-72d16b3db644~1-0-0",
        "key": "20221117-1711-2491-0beb-72d16b3db644~1-0-0",
        "_id": "20221117-1711-2491-0beb-72d16b3db644~1-0-0",
        "title": "Success",
        //"file": "17:11:22:819",
        "outcome": "Success",
        "job_start": "2022-11-17 17:11:25",
        "job_end": "2022-11-17 17:11:28",
        "duration": "00:00:03",
        "wf_name": "Sleep",
        //"sort_family_name": "20221117-1711-2491-0beb-72d16b3db644", 
        "sort_family_index": 0,
        "sort_generation": 0,
        "sort_family_member_count": 1,
        "children": []
    }


	function buildApiUrl(what){
        
		return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
	}
	//insert test records into job DB   
	app.get('/generatetestjobs', async (req, res) => {
            try{
            console.log("generatetestjobs inserter called, inserting 10000 test jobs");
            var m_jobStates = ["Error","Success","Cancelled","Unknown"];
			var workflowResponse = await axios.get(build_new_api_url("/workflows"), {timeout: global.config.STATIC_API_TIMEOUT,agent: false, maxSockets: Infinity});
            var a_workflows = workflowResponse.data.workflows;//wf_name
			var date_start = new Date();
			date_start.setFullYear(date_start.getFullYear() - 4);
            //2022-02-20T23:44:56.317+01:00
            for (i=0;i<10;i++){
                var jobArray =[];
                for (x=0;x<100000;x++){ 
                    date_start.setSeconds(date_start.getSeconds() + 10);
                    var dts = moment.tz(date_start, "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss");//2022-06-28T08:42:30.780+02:00
                    date_start.setSeconds(date_start.getSeconds() + 10);
                    var dte = moment.tz(date_start, "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss");
                    var duration = "00:00:0" + Math.floor(Math.random() * 10); //0-9
                    var jobname= '255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=';
                    var outcome = jobname + jobname + jobname + jobname + jobname + jobname + jobname  + jobname;
                    var wf_name = a_workflows[Math.floor(Math.random()*a_workflows.length)].wf_name;
                    let jobid = uuid();
					let jobobj = {
						"_id": jobid + "~1-0-0_main",
						"state": m_jobStates[getRandomInt()],
						"workflow": wf_name,
						"start_time": dts,
						"end_time": dte,
						"job_start": dts,
						"job_end": dte,
						"source": jobname + i + x,
						"outcome": outcome,
						"duration": duration,
                        children:[]
					}
                    let copyobj = JSON.parse(JSON.stringify(jobobj))
                    copyobj._id = jobid + "~1-0-0";
                    delete copyobj.children 
                    jobobj.children.push(copyobj); //must put the first job into children, its currently a copy of the outer job obj
                    
                    copyobj = JSON.parse(JSON.stringify(jobobj))
                    delete copyobj.children 
                    //create one split
                    copyobj._id = jobid + "~1-1-1";
                    copyobj.source = jobid + "anotherfile " + date_start;
                    copyobj.outcome = "second outcome " + date_start;
                    jobobj.children.push(copyobj);


                    jobArray.push(jobobj);
                }
                console.log("Inserting 1000 jobs")
                await global.db.jobs.insert(jobArray);
            }
            
            res.writeHead(200,{"Content-Type" : "text/html"});
            res.write("generated 1.000.000 jobs");//output json array to client
            res.end();
        }catch(ex){
            res.writeHead(500,{"Content-Type" : "application/json"});
            res.json(ex);
            res.end();
        }
    });
}

/* HELPERS */
function getRandomInt() {
  //1 or 2
  return Math.floor(Math.random() * 2) + 1  
}

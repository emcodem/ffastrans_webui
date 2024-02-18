const Request = require("request");
var userpermissions = require("../userpermissions");

module.exports = async function(app, passport){
    app.get('/getjobstate', (req, res) => {
        /* checks most recent job history from jobfetcher and filters all branches by jobid*/
        try{
            var search_for_id = req.query.id;
            var last_active     = JSON.parse(global.lastactive);
            var last_history    = JSON.parse(global.lasthistory);
            var hjobs = last_history;
            var ajobs = last_active;

            var all = [...hjobs, ...ajobs];

            var found =  [];
            var failed_count = 0; 
            var finished_count = 0;
            var good_messages = "";
            var bad_messages = "";
            var all_messages = "";

            for (j of all){
                //if j has progress its active, if it has result it is finished. state 1 is success
                //status or result is the "message"
                if (j.job_id == search_for_id){
                    found.push(j);
                    //running jobs have a status field, finished jobs result instead
                    if (j.result && j.state != 1 && j.state != -1){//only finished jobs have result
                        failed_count ++;
                        bad_messages += "result" in j ?  " " + j.result : " " + j.status; 
                    }else{
                        good_messages += "result" in j ?  " " + j.result : " " + j.status; 
                    }

                    all_messages += "result" in j ?  " " + j.result : " " + j.status; 

                    "result" in j ? finished_count++ : false;
                    
                }
            }
            if (found.length == 0)
                throw new Error("Job not found");
            res.json({  
                        jobs:found,
                        all_failed: found.length == failed_count,
                        good_messages: good_messages,
                        bad_messages:bad_messages,
                        all_messages:all_messages,
                        all_finished:found.length == finished_count,
                    });
            
        }catch(ex){
            res.json({});
        }

    })

}
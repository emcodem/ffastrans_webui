//const Request = require("request");
//var userpermissions = require("../userpermissions");

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
                //if j has progress its active, if it has outcome it is finished. state 1 is success
                //status or outcome is the "message"
                if (j.job_id == search_for_id){
                    found.push(j);
                    //running jobs have a status field, finished jobs outcome instead
                    if (j.outcome && j.state != "Success" && j.state != "Cancelled"){//only finished jobs have outcome
                        failed_count ++;
                        bad_messages += "outcome" in j ?  " " + j.outcome : ", " + j.status; 
                    }else{
                        if (good_messages == " Success" && j.outcome == "Success"){ //try showing success only once if all succeed, very dirty hack
                            finished_count++;
                            continue;
                        }
                        good_messages += "outcome" in j ?  " " + j.outcome : " " + j.status; 
                    }

                    all_messages += "outcome" in j ?  " " + j.outcome : " " + j.status; 

                    "outcome" in j ? finished_count++ : false; //only finished jobs have outcome field
                    
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
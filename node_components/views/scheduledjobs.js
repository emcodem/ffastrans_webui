
module.exports = function(app, express){

    //list all 
	app.get('/scheduledjobs', (req, res) => {
		try{
			global.db.config.find({ "scheduled_jobs": { $exists: true } }, function (err, data) {//get all groups from user
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify(data));//output json array to client
                res.end();
            })
		}catch (ex){
				console.log("ERROR: unxepected error in adminconfig: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
    
    
    //SAVE back to database
    app.post('/scheduledjobs', (req, res) => {
            var job = {};
            try{
                job = JSON.parse(req.body['job']);
                console.log(job['id'])
            }catch(ex){
                console.error("Error parsing POST request for scheduledjobs: ",ex);
            }
            console.log("Saving scheduled job:");
            console.log(job);
           global.db.config.update({ "scheduled_jobs.id": job['id'] },{$set:  {"scheduled_jobs": job}},{upsert:true,multi:false} ,function (err, count) {
                if (err) {
                    console.error("FATAL ERROR; could not save job to database, " + err);
                    console.log(job);   				
                    res.status(500);//Send error response here
                    res.end();
                    return;
                }
                global.db.config.persistence.compactDatafile(); //deletes unused stuff from DB file
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify("{'success':'true'}"));//output json array to client
                res.end();
            })
    })
    
    //start job NOW
	app.post('/immediateexecute', (req, res) => {
		try{
            console.log("start: " + req.body.jobid + " from client: " + req.body.socketid)
            global.jobScheduler.executeImmediate(req.body.jobid,req.body.socketid,function(pid){
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify({'pid':pid}));//output json array to client
                res.end();
                return;                
            });
		}catch (ex){
				console.log("ERROR: unxepected error in schedulejobs.js: " + ex);
                res.status(500);//Send error response here
                res.end();
                return;
		}
	});
    
    //delete
    app.delete('/deletescheduledjob', (req, res) => {
        
        console.log("Deleting scheduled job " + req.body.jobid + " from DB");
        global.db.config.remove({ "scheduled_jobs.id": req.body.jobid }, { multi: false },function(err,numRemoved){
            if (err || numRemoved == 0){
                console.log("Error deleting user from DB: " + err);
                res.writeHead(500,{"Content-Type" : "application/JSON"});
                res.write("Delete scheduled job error error. Num removed: "+numRemoved+ ", Message: "+ err);//output json array to client
                res.end();
                return;
            }
            //TODO: do we need to check if numRemoved == 1?
            console.log("Deleted " +numRemoved + " jobs user from DB")
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        })
        
    })
}
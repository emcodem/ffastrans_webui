var m_maximimjobcount = 20000; //we only support this amount of jobs, no user configuration needed.

module.exports = function(app, express){

	app.get('/deleteoldrecords', (req, res) => {
        //deletes records up to m_maximimjobcount (20k is fast enough in nedb for our application)
            global.db.jobs.count({}, function(err, count) {
                console.log("DB maintenance found " + count + " Jobs in database");
                if(count > m_maximimjobcount){
                    console.log("DB maintenance initiating deletion of jobs");
                    var sorting = {};
                    sorting["job_end"] = -1;
                    //sort by date_end and skip maximum jobcount
                    global.db.jobs.find({}).sort(sorting).skip(m_maximimjobcount).exec( function(err,cursor){
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
    
//insert test records into job DB   
	app.get('/generatetestjobs', (req, res) => {
            console.log("generatetestjobs inserter called, inserting 10000 test jobs");
            var m_jobStates = ["Error","Success","Cancelled","Unknown"];

            var date_start = new Date("2020/12/31 16:32:15");
            for (i=0;i<10;i++){
                var jobArray =[];
                for (x=0;x<1000;x++){ 
                    date_start.setSeconds(date_start.getSeconds() + 10);
                    var jobname= '255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=255Charactersöäü!"§$%&/()=';
                    jobArray.push({"wf_name":"Generated_Test_Data","job_start":date_start+"","job_end":date_start+"","file":jobname + i + x,"outcome":"Success","state":m_jobStates[getRandomInt()],"guid":(""+i)+(""+x),"duration":"00:00:06"});
                }
                console.log("Inserting 1000 jobs")
                global.db.jobs.insert(jobArray, function (err, newDoc) {
                    if (err){
                        console.log("error inserting data " + err)
                    }
                    console.log("inserted 1000 jobs")
                });
            }
            
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({"OK":"true"}));//output json array to client
            res.end();
    });
}

/* HELPERS */
function getRandomInt() {
  return Math.floor(Math.random() * 2) + 1  
}

module.exports = {
  getAllJobs: function () {    
    //client polls array of history jobs using socket.io
        global.db.jobs.find({"deleted":{ $exists: false }}).sort({'job_end': 1}).exec(function(err, cursor) {//'global':'config'
            if (err){            
                console.error("Error serving history jobs..." + err)
                throw err;
            }
            if ((cursor)){
                var numResults = 0;
                var jobArray =[];
                for (i=0;i<jobArray.length;i++){
                    jobArray.push(cursor[i])
                }
                cursor.forEach(function(data){
                });
                //console.log("serving " + jobArray.length + " history jobs from job db")
                global.socketio.emit("historyjobs", JSON.stringify(jobArray));
            }else{
                console.error("Error with database getAllJobs, did not get a cursor")
            }
        });
    
  },
  
  getJobPageWithFilter: function (start,count,fitler_col,direction) {    
    //client polls array of history jobs using socket.io
        global.db.jobs.find({"deleted":{ $exists: false }}).sort({fitler_col: direction}).skip(start).limit(count).exec( function(err, cursor) {//'global':'config'
            //console.log(cursor.length)
            if (err){            
                console.error("Error serving history jobs..." + err)
                throw err;
            }
            if ((cursor)){
                var numResults = 0;
                var jobArray =[];

                for (i=start;i<cursor.length;i++){
                    jobArray.push(cursor[i])
                }
                //console.log("serving " + jobArray.length + " history jobs from job db")
                global.socketio.emit("historyjobs", JSON.stringify(jobArray));
            }else{
                
            }
        });
    
  },  
  
  
  
  
  
  
};


module.exports = {
	deleteOldRecords: deleteOldRecords
}

function deleteOldRecords(){
	global.db.jobs.count({}, function(err, count) {
                
                if(count > global.config.STATIC_MAX_HISTORY_JOB_COUNT){
                    console.log("DB maintenance found " + count + " Jobs in database.", "STATIC_MAX_HISTORY_JOB_COUNT:",global.config.STATIC_MAX_HISTORY_JOB_COUNT);
                    var sorting = {};
                    sorting["job_end"] = -1;
                    //sort by date_end and skip maximum jobcount
                    global.db.jobs.find({}).sort(sorting).skip(global.config.STATIC_MAX_HISTORY_JOB_COUNT).exec( function(err,cursor){
                        if (err){
                            throw new Error(err);
                                 
                        }
                        var idsToDelete = [];
                        for (doc in cursor){
                            idsToDelete.push(cursor[doc]._id);  //collect all ids
                        }
                        
                        //delete all collected id's in one shot
                        global.db.jobs.remove({ _id: { $in: idsToDelete } }, { multi: true },function(err,numRemoved){
                            if (err){
                                throw new Error(err);
                            }
                            console.log("Deleted " +numRemoved + " from DB")
                        })
                        global.db.jobs.persistence.compactDatafile(); //compress database
                        console.log("DB maintenanceattempts to delete deleting "+ cursor.length + " jobs") 
                    })
                }
				//end
            })
}
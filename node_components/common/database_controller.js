
module.exports = {
	deleteOldRecords: deleteOldRecords,
    deleteRecords:deleteRecords
}

async function deleteRecords(id_array){
    
    var cursor = await global.db.jobs.find({ "job_id": { $in: id_array }});
    cursor = await cursor.toArray();
    console.log("Found Job to delete:" + cursor.length )
    // Set an existing field's value
    var del_array = id_array.map(id=>{ return{"job_id":id}})
    //insert deleted job_ids into deleted_jobs datbase to prevent resync by jobfetcher
    var insertedDoc = await global.db.deleted_jobs.insertMany(del_array);
    var deleteresult = await global.db.jobs.deleteMany({ "job_id": { $in: id_array } });
    console.log("Number of deleted records:",deleteresult);   
    return;
}

async function deleteOldRecords(){
    var idsToDelete = [];
    var sorting = {};
    sorting["job_end"] = -1;
    return;
    try{
        var allcount = await global.db.jobs.asyncCount({});
        console.log("DB maintenance found " + allcount + " Jobs (including deleted) in database.", "STATIC_MAX_HISTORY_JOB_COUNT:",global.config.STATIC_MAX_HISTORY_JOB_COUNT);
        var cursor = await global.db.jobs.asyncFind({},{deleted: 1 },[['sort', sorting], ['skip', global.config.STATIC_MAX_HISTORY_JOB_COUNT]]);
        for (doc in cursor){
            //idsToDelete.push(cursor[doc]._id);  //collect all ids
            await global.db.jobs.asyncRemove({ _id: cursor[doc]._id });
        }
        await global.db.jobs.asyncRemove({},{ multi: true });
            
        console.log("DB maintenance removed " + cursor.length + " jobs")
    }catch(ex){
        console.error("Fatal error removing old jobs:", ex)
    }

	// global.db.jobs.count({}, function(err, count) {
                
    //             if(count > global.config.STATIC_MAX_HISTORY_JOB_COUNT){
                    

    //                 //sort by date_end and skip maximum jobcount
                    

    //                 global.db.jobs.find({}).sort(sorting).skip(global.config.STATIC_MAX_HISTORY_JOB_COUNT).exec( function(err,cursor){
    //                     if (err){
    //                         throw new Error(err);     
    //                     }
                        
    //                     for (doc in cursor){
    //                         idsToDelete.push(cursor[doc]._id);  //collect all ids
    //                         //await global.db.jobs.remove({ _id: cursor[doc]._id })
    //                     }
                        
    //                     //delete all collected id's in one shot
    //                     global.db.jobs.remove({ _id: { $in: idsToDelete } }, { multi: true },function(err,numRemoved){
    //                         if (err){
    //                             throw new Error(err);
    //                         }
    //                         console.log("Deleted " +numRemoved + " from DB")
    //                         global.db.jobs.persistence.compactDatafile(); //compress database
    //                     })
                        
    //                     console.log("DB maintenanceattempts to delete deleting "+ cursor.length + " jobs") 
    //                 })
    //             }
	// 			//end
    //         })
}
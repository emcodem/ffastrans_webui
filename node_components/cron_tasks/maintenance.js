/* currently only database maintenance */
var assert = require('assert');

module.exports = {
	
	exec_all: async function(){
		database_maintenance()

	},

}

async function database_maintenance(){
    try{
        console.log("Automatic Database Maintenance Initiated");
        assert(global.config.database_maintenance_autodelete);
        let today = new Date();
        let old_date = new Date(today);
        old_date.setDate(today.getDate() - global.config.database_maintenance_autodelete);
        let year = old_date.getFullYear();
        let month = (old_date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        let day = old_date.getDate().toString().padStart(2, '0');

        let formattedDate = `${year}-${month}-${day}`;
        let num_to_delete = await global.db.jobs.count({job_start:{$lte:formattedDate}});
        console.log("Database Maintenance found " + num_to_delete,"Jobs older than",formattedDate,"- initiating deletion");
        let  numRemoved   = await global.db.jobs.deleteMany({job_start:{$lte:formattedDate}});
        console.log("Database Maintenance deletion done. Removed:",numRemoved);
        var stop = 1;
    }catch(ex){
        console.error("Database Maintenance error",ex)
    }
}
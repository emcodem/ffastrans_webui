var userpermissions = require("../userpermissions");

module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 


	app.get('/gethistoryjobsajax_treegrid', async (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                
				var allowedWorkflows = [];
				var allWorkflows = await global.db.jobs.distinct("workflow");
				if (req.user){
					var permissions = await userpermissions.getpermissionlistAsync (req.user.local.username);
					//serve only workflows the user has rights for
					
					for (let _wf of allWorkflows){
						if (await userpermissions.checkworkflowpermission(req.user.local.username,_wf)){
							allowedWorkflows.push(_wf);
						}
					}
				}else{
					allowedWorkflows = allWorkflows;
				}


				//start count
				var start = req.query.start||0;
                start = JSON.parse(start);
                var count = req.query.count||1000;
                count = JSON.parse(count)
                count = count + 0;
				var filterobj = req.query.filterobj||"{}";
                filterobj = JSON.parse(filterobj);

                console.log("New search in job history, filterobj:")
                console.log(filterobj)
                if (Object.keys(filterobj).length  != 0){
                    newfilter = {};
                    for (key in filterobj){
                        newfilter[key] = {$regex: new RegExp(escapeRegExp(filterobj[key]),"i")}
                    }
                    filterobj = newfilter;
                }
                filterobj["deleted"] =  { $exists: false } ; //always only show non deleted jobs
                var sortcol = req.query.sortcol;
				if (sortcol == "wf_name"){
					sortcol = "workflow";
				}
                if (typeof sortcol == 'undefined' || sortcol == null){
                    sortcol = 'job_end'
                }
                var direction = req.query.direction;
                if (direction == "asc"){
                    direction = 1;
                }else{
                    direction = -1;
                }
                //basic fieldset, parent of all inputs
                // params: start,count,filtercol,direction
                var total_count = 0;
                
                if (req.query.getcount){
                    console.log("Found " +  total_count + " Jobs in Db, filter: " , filterobj)
                    var total_count = await global.db.jobs.countDocuments(filterobj,{_id:1});
                    res.writeHead(200,{"Content-Type" : "application/json"});
                    res.write(JSON.stringify({"total_count":total_count}));//output json object
                    res.end();
                    return;
                }
                
                var sorting = {};
                sorting[sortcol] = direction;
                console.log(sorting)

				//add workflow permission stuff to filterobj

				var final_filterobj = {"$and":[
												{workflow:{"$in":allowedWorkflows}},
												filterobj
											]}

				// let res = await global.db.jobs.aggregate([
				// 	{"$match":final_filterobj},
				// 	{
				// 		$facet: {
				// 		paginatedResults: [{ $skip: start }, { $limit: count }],
				// 		totalCount: [
				// 			{
				// 			$count: 'count'
				// 			}
				// 		]
				// 		}
				// 	}
				// 	]);
				// let resArr = await res.toArray();

                var cursor = await global.db.jobs.find(final_filterobj).sort(sorting).skip(start).limit(count);
                var overallcount = await cursor.count();
                cursor = await cursor.toArray()
					
					if ((cursor)){
						var numResults = 0;
						var jobArray =[];

						for (i=0;i<cursor.length;i++){
							//cursor[i].id = hashCode(JSON.stringify(cursor[i]))
							//convert from db format to tree format
							jobArray.push(cursor[i])
							//console.log(cursor[i]["job_end"])
						}
						
						res.writeHead(200,{"Content-Type" : "application/JSON"});
						res.write(JSON.stringify({"actual_count":jobArray.length , "pos":start,data:jobArray}));//output json array to client
						res.end();
					}else{
						res.writeHead(500,{"Content-Type" : "text/html"});
						res.write("error, did not get cursor from db");//output json array to client
						res.end();
					}

				}
            }
		catch (ex){
				console.log("ERROR: unxepected error in gethistoryjobs: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()[\]\\]/g, '\\$&'); // $& means the whole matched string -- | is not escaped in order to support multiple conditions
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
  
  
  
  

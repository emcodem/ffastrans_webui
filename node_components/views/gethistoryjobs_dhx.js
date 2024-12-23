const userpermissions = require("../userpermissions");

module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 

	app.get('/gethistoryjobs_dhx', async (req, res) => {
		try{
			if (req.method != 'GET' && req.method != 'POST') {
				console.log("ERROR: gethistoryjobsajax_treegrid method not allowed: " + req.method);
				res.writeHead(405,{"Content-Type" : "application/JSON"});
				res.write(returnobj);//output json array to client
				res.end();
				return;
			}
			let allowedWorkflows = [];
			let allWorkflows = await global.db.jobs.distinct("workflow");
			allWorkflows = allWorkflows.map(wf=>{return wf.toString()}); //ensure its a string not a number or else
			if (req.user){
				//var permissions = await userpermissions.getpermissionlistAsync (req.user.local.username);
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
			let start = req.query.start||0;
			start = JSON.parse(start);
			let count = req.query.count||100;
			count = JSON.parse(count)
			count = count + 0;
			let filterobj = req.query.filterobj||"{}";
			filterobj = JSON.parse(filterobj);

			//since change to mongodb, we search only children
			if (filterobj.outcome){
				filterobj["children.outcome"] = filterobj.outcome;
				filterobj = objectWithoutKey("outcome",filterobj);
			}
			if (filterobj.file){
				filterobj["children.source"] = filterobj.file;
				filterobj = objectWithoutKey("file",filterobj);
			}
			
			console.log("New search in job history, ","sortcol",req.query.sortcol,"filterobj:",filterobj)

			//make regex for text fields
			if (Object.keys(filterobj).length  != 0){
				newfilter = {};
				for (const [key, value] of Object.entries(filterobj)){
					if (key == "workflow"){
						newfilter.workflow = value;
						continue;
					}else if(key.match(/job_start|job_end/)){
						//job start can have from<:>to notation
						if (filterobj[key].match("<:>")){
							let [from, to] = filterobj[key].split("<:>");
							newfilter[key] = { };
							if (from && from != "")
								newfilter[key]["$gt"] = from
							if (to && to != "")
								newfilter[key]["$lt"] = to
							
							continue;
						}else{
							//no date filter? use regex.
							newfilter[key] = {$regex: new RegExp(escapeRegExp(value),"i")};
							continue;
						}
					}
					else if (key == "variablecols"){
						/**
						 * Setup search obj for variablecol. Varcols can contain multiple ffastrans user_vars
						 * Mongodb contains job.children[].variables[], each variable has data and name. We want to search only in variables that are used in the variablecolumn template
						 */
						
						if (!Array.isArray(value)){
							console.error("variablecols filter is not array",value);
							continue;
						}
						let a_filter_variable_cols = value;

						a_filter_variable_cols.forEach(current_filter => {
							let foundVariableColConf = global.config.job_viewer.variable_columns.filter(colconf=>{
								return colconf.col_header_name == current_filter.col_header_name;
							});
							if (foundVariableColConf.length == 0)
								return;
	
							let rgx = /%(s_.*?|i_.*?|f_.*?|webui_.*?)%/gi;
							let ffasvars = foundVariableColConf[0].col_template.matchAll(rgx);//creates an array of regex matches, [1] will contain the group capture
							ffasvars = Array.from(ffasvars);
							let andCondition = []; //array of data, name pairs for search in job.children[].variables[]
							ffasvars.forEach(regexmatch=>{
								let mongoFilterForVar = {
										"data": {$regex: new RegExp(escapeRegExp(current_filter.filter),"i")}, //the search filter from Userinterface search input
										"name": regexmatch[1] //the ffas varname as seen in the variablecol template butwithout %%
									}
									andCondition.push(mongoFilterForVar);
							})
							//locate all variable names in the search template
							newfilter["children.variables"] = {
								$elemMatch: {
									$and: andCondition
								  }
							}
						})



						continue;
					}
					else{
						//normal filter column
						newfilter[key] = {$regex: new RegExp(escapeRegExp(value),"i")}
					}

				}
				filterobj = newfilter;
			}

			//workflow search special attention
			let workflowFilter = await getFilteredWorkflows(allWorkflows,filterobj)
		
			filterobj = objectWithoutKey("workflow",filterobj);
			
			//filterobj["deleted"] =  { $exists: false } ; //always only show non deleted jobs
			let sortcol = req.query.sortcol;
			if (sortcol == "wf_name"){
				sortcol = "workflow";
			}
			if (typeof sortcol == 'undefined' || sortcol == null || sortcol == ""){
				sortcol = 'job_end'
			}
			let direction = req.query.direction;
			if (direction == "asc"){
				direction = 1;
			}else{
				direction = -1;
			}
			//since mongo we sort on children 
				if (sortcol == "file"){
				sortcol = "source";
				}
			
			// basic fieldset, parent of all inputs
			// params: start,count,filtercol,direction
			
			let sorting = {};
			sorting[sortcol] = direction;

			//add workflow permission stuff to filterobj

			let final_filterobj = {"$and":[
											{workflow:{"$in":allowedWorkflows}},
											{workflow:{"$in":workflowFilter}},
											filterobj
										]}

			
			if (req.query.getcount){
				let total_count = await global.db.jobs.countDocuments(final_filterobj,{_id:1});
				console.log("Found " +  total_count + " Jobs in Db, filter: " , final_filterobj)
				res.writeHead(200,{"Content-Type" : "application/json"});
				res.write(JSON.stringify({"total_count":total_count}));//output json object
				res.end();
				return;
			}

			//sort children

			//  var sort = {"$sort":{}};
			//  sort["$sort"][sortcol] = direction;
			//  var cursor = await global.db.jobs.aggregate(

			// 	[
			// 		{
			// 			"$match": final_filterobj
			// 		},
			// 		{
			// 			"$unwind": "$children"
			// 		},
			// 		sort
			// 	] 
				
				
			// )

			let cursor = await global.db.jobs.find(final_filterobj,{sort:sorting}).skip(start).limit(count);
			//var overallcount = await cursor.count();
			cursor = await cursor.toArray();
			
			let with_children = cursor.filter(j=>{return j.children.length != 0});
			if (cursor.length != with_children.length){
				//attempt workaround where children is not yet set by jobfetcher.
				console.error("reloading history jobs from db because at least one job had children length zero");
				await sleep(50);
				cursor = await global.db.jobs.find(final_filterobj,{sort:sorting}).skip(start).limit(count);
				//var overallcount = await cursor.count();
				cursor = await cursor.toArray();
				with_children = cursor.filter(j=>{return j.children.length != 0});
				let without_children = cursor.filter(j=>{return j.children.length == 0});
				if (with_children.length != cursor.length)
					console.error("Found Job without children, is there some broken record in the database?",without_children);
				
				//cursor = with_children; //only return jobs with children
			}
			
			//sort children
			if ((cursor)){}


			//
			if ((cursor)){
				let numResults = 0;
				let jobArray =[];
				for (i=0;i<cursor.length;i++){
					processVariableColumns(cursor[i]);
					jobArray.push(cursor[i]);
				}
				res.writeHead(200,{"Content-Type" : "application/JSON"});
				res.write(JSON.stringify({"actual_count":jobArray.length , "pos":start,data:jobArray}));//output json array to client
				res.end();
			}else{
				
				res.write("error, did not get cursor from db");//output json array to client
				res.writeHead(500,{"Content-Type" : "text/html"});
				res.end();
			}

		}catch (ex){
			console.log("ERROR: unxepected error in gethistoryjobs: ", ex);
			res.status(500);//Send error response here
			res.end();
		}
	});
}


function sortChildren(jobArray,sortobj){
	jobArray.map(job=>{
		if (!job.children || job.children.length != 0)
			return

			job.children = job.children.sort((a, b) => {
            const valueA = a[sortobj.sortField] ? new Date(a[sortobj.sortField]) : null;
            const valueB = b[sortobj.sortField] ? new Date(b[sortobj.sortField]) : null;

            if (sortDirection === "asc") {
                return valueA - valueB;
            } else {
                return valueB - valueA;
            }
        });
	})
}

/**
 * Inline modifies job and applies variable templates from variablecolumns if any
 * for top level job container, we take the value of first child
 * @param {*} job a job as seen in mongodb
 */
function processVariableColumns(job)
{
	let all_vc = global.config.job_viewer?.variable_columns || [];
	all_vc.forEach((_vc) => {
		job.children.forEach((_child,_idx) => {
			_child[_vc.col_header_name] = replaceVars(_child,_vc.col_template);
			if (_idx == 0){
				//first child, apply the values from it to job container. 
				//TODO: we could also aggregate all results or choose the first valid one?
				try{
					job[_vc.col_header_name] = replaceVars(_child,_vc.col_template);
				}catch(ex){
					console.error("Unexpected error processing variablecolumn: ",ex)
				}
			}
		});
	});
	function replaceVars(_child,col_template){
		//replace all variables that we have in db
		if (Array.isArray(_child.variables)){
			_child.variables.forEach(v=>{
				col_template = col_template.replaceAll(`%${v.name}%`,v.data);
			});
		}
		//if the variables have not been set by the job, just remove them
		col_template = col_template.replaceAll(/%s_.*?%|%f_.*?%|%i_.*?%|%webui.*?%/gi,"");
		return col_template;
	}
}

async function getFilteredWorkflows(allWorkflows,filterObj){
	//manually apply regex on workflow names because mongo cant use text index
	let search_for = allWorkflows;
	if (filterObj.workflow){
		search_for = [];
		allWorkflows.forEach(function(_wf){
			let rgx = new RegExp(escapeRegExp(filterObj.workflow),"i");
			if (_wf.match(rgx)){
				search_for.push(_wf)
			}
		})
	}else{
		return allWorkflows;
	}

	return search_for;
}

function objectWithoutKey(key,obj){
	let { [key]: val, ...rest } = obj;
	return rest;
}

function escapeRegExp(string) {

	let escaped = string.replace(/[.+?^${}()[\]\\]/g, '\\$&'); // $& means the whole matched string -- | is not escaped in order to support multiple conditions
	escaped = escaped.replace("*",".*?");
	escaped = escaped.replace(" ",".*?");
  	return escaped;
}

function hashCode (string) {
//this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
	let hash = 0, i, chr;
	if (string.length === 0) return hash;
	for (i = 0; i < string.length; i++) {
		chr   = string.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};
  

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}
  
  

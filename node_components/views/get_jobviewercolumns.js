const userpermissions = require("../userpermissions");


module.exports = function(app, express){

    /* returns the columns configured and ready to use in dhx8 grid
    * filtered by userpermissions if needed
    * we store this here instead of on the client side because we need this on multiple places(jobviewer and options)
    * also, how else could we apply userpermissions 
    */
	app.get('/get_jobviewercolumns', async (req, res) => {
		try{
			let searchboxhtml = `<input class="searchbox" placeholder="" onclick="event.stopPropagation()"></input>`;
            const columns = [
                {
                    id: "state",
                    maxWidth: 100,
                    header: ["<span>State</span>" + searchboxhtml],
                    sortable: true, 
                    template:function(val,row,column){
                        if (row.children && row.children.length > 1){
							let jobid = row.job_id
                            let expander = '<div id="'+jobid+'_expander" class="expander dhx_grid-expand-cell-icon dxi dxi-chevron-right'+ 
                                             'role="button" aria-label="Collapse group" style="padding: 0px 0px 0px 0px;"></div>'
                            return expander + val;
                        }
                        return val;
                    },
                    htmlEnable:true
                },	    
                {
                    id: "workflow",
                    width:300,
                    header: ["<span>Workflow</span>"+ searchboxhtml],   sortable: true,htmlEnable: true,
                    template:function(val,row,column){
                        return val
                    }
    
                },
                {id: "job_start",   header: ["<span>Start</span>"+ searchboxhtml],      sortable: true,htmlEnable: true,  maxWidth: 152},
                {id: "duration",    header: ["<span>Duration</span>"+ searchboxhtml],   sortable: true,htmlEnable: true,  maxWidth: 80},
                {id: "job_end",     header: ["<span>End</span>"+ searchboxhtml],        sortable: true,htmlEnable: true,  maxWidth: 152},
                {id: "source",      header: ["<span>File</span>"+ searchboxhtml],       sortable: true,htmlEnable: true },
                {id: "outcome",     header: ["<span>Outcome</span>"+ searchboxhtml],    sortable: true,htmlEnable: true }
            ];

            let variablecolumns = global.config.job_viewer?.variable_columns;
            if (variablecolumns){
                for (let i=0;i<variablecolumns.length;i++){
                    let varcolname = variablecolumns[i].col_header_name;
                    let searchboxhtml = `<input class="searchbox" data-variablecol="true" placeholder="" onclick="event.stopPropagation()"></input>`;
                    columns.push(
                        {id: varcolname, header: ["<span>"+varcolname+"</span>"+ searchboxhtml], sortable: false, htmlEnable: true }
                    )
                }
            }
    

			/* ACTIVE */
            
			const active_columns = [
                {
                    id: "status",maxWidth: 100,header: ["<span>State</span>" + searchboxhtml],sortable: true, 
                    template:function(val,row,column){
                        if (row.children && row.children.length > 1){
                            let expander = `<div id="${row.job_id}_expander" class="expander dhx_grid-expand-cell-icon dxi dxi-chevron-right" 
                                             role="button" aria-label="Collapse group" style="padding: 0px 0px 0px 0px;"></div>`
                            return expander + val;
                        }
                        return val;
                    },
                    htmlEnable:true
                },	    
                {
                    id: "workflow",
                    width:300,
                    header: ["<span>Workflow</span>"+ searchboxhtml],   sortable: true,htmlEnable: true,
                    template:function(val,row,column){
                        return val
                    }
    
                },
                {id: "job_start",   header: ["<span>Start</span>"+ searchboxhtml],      sortable: true,htmlEnable: true,  maxWidth: 152},
                {id: "source",      header: ["<span>File</span>"+ searchboxhtml],       sortable: true,htmlEnable: true },
				{id: "proc",     	header: ["<span>Step</span>"+ searchboxhtml],    sortable: true,htmlEnable: true, 
					template: function(val,row,column){
						return row.prio + "|" + row.proc + "|" + row.host
				} },
				//Prio " +  (node.data.priority || 1) + " @ " + node.data.proc + " @ " + node.data.host 
                {id: "outcome",     header: ["<span>Outcome</span>"+ searchboxhtml],    sortable: true,htmlEnable: true },
				{id: "progress",     header: ["<span>Progress</span>"+ searchboxhtml],    sortable: true,htmlEnable: true },
				
            ];

			// if (req.user){
			// 	//var permissions = await userpermissions.getpermissionlistAsync (req.user.local.username);
			// 	//serve only workflows the user has rights for
			// 	for (let _wf of allWorkflows){
			// 		if (await userpermissions.checkworkflowpermission(req.user.local.username,_wf)){
			// 			allowedWorkflows.push(_wf);
			// 		}
			// 	}
			// }else{
			// 	allowedWorkflows = allWorkflows;
			// }


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

            //res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.json({history:columns, active:active_columns});//output json array to client
            res.end();
			

		}catch (ex){
			console.log("ERROR: unxepected error in gethistoryjobs: ", ex);
			res.status(500);//Send error response here
			res.end();
		}
	});
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
  
  

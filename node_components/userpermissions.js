//this also keep the list of all possible user rights, need to be modified when a new right is added
var ffastransapi = require("./ffastransapi")


module.exports = {
    checkworkflowpermission: checkworkflowpermission, 
    getAllowedBrowseLocations : getAllowedBrowseLocations,
    checkFolderPermissions : checkFolderPermissions,
    getpermissionlistAsync:getpermissionlistAsync,

    /* this is old style, we should not use inline functions in exports */
    //set object to config obj
    getuser: (username,callback) => {
        //callback with userobject
        global.db.config.findOne({"local.username":username}, function(err, data) {
            if (err){
                throw err;
            }
            if ((data)){
                console.log("Serving user config from database");
                //console.log(data.local);
                callback(data.local);
            }else{
                console.warn("No did not find userpermissions for user: " + username);
                //callback (defaultConfig);
            }
        });
    },

    getuserAsync: async (username) => {
        //callback with userobject
        var data = await global.db.config.findOne({"local.username":username});    
        if ((data)){
            return data.local;
        }
       return [];
    },

	

    //collects all permissions of all groups the username is memberof in array
     getpermissionlist:  (username,callback) => {
		
        global.db.config.findOne({"local.username":username}, function(err, data) {//get all groups from user
            if (err){
                throw err;
            }
            if (data){
                //{ "local.usergroup.name": { data.local.groups }}
                global.db.config.find({ "local.usergroup.name": {$in: data.local.groups }}, function(err, cursor) {//get all permissions of all groups
                    var allpermissions = [];
                    for (i in cursor){
					if (typeof(cursor[i]) == "function"){
						continue;
					}
                        //concat all permission arrays from all groups
						console.log(cursor[i])
                        allpermissions = allpermissions.concat(cursor[i].local.usergroup.permissions)
                    }
                    callback(allpermissions);
                })
                
            }else{
                console.warn("No did not find userpermissions for user: " + username);
                //callback (defaultConfig);
            }
        });
    },
    
    //return true if any group of the user includes specified permission key
    haspermission:(username,permissionkey,callback) => {
        module.exports.getpermissionlist(username,function(permarray){//mmodule.exports is like this.
            for (i in permarray){
                if (permarray[i].key == permissionkey){
                    callback(true);
                    return;
                }  
            }
        });
        callback(false);
    },
    
    //return a list of all permissions that exist
    getallpossiblepermissions:() => {
            var rights = [
                {key:"GROUPRIGHT_MENU_VIEW_JOB_STATUS",value:{'description':'Job Monitor'}},//the value can be an object, e.g. filter for workflownames
                {key:"GROUPRIGHT_MENU_VIEW_SUBMIT_JOBS",value:{'description':'Create new jobs on ffastrans'}},
                {key:"GROUPRIGHT_MENU_VIEW_REVIEW_QUEUE",value:{'description':'Review Queue'}},
                /*{key:"GROUPRIGHT_MENU_VIEW_ADMIN_USERS",value:{'description':'Usermanagement'}},*/
                {key:"GROUPRIGHT_MENU_VIEW_SCHEDULER",value:{'description':'Scheduler menu item'}},
                {key:"GROUPRIGHT_MENU_VIEW_ADMIN",value:{'description':'Server admin menu item'}},
				{key:"GROUPRIGHT_MENU_VIEW_FARM_ADMIN",value:{'description':'Farm administration'}},
                {key:"FILTER_WORKFLOW_GROUP",value:{'description':'Filters workflows are presented to the user',filter:".*?"}},
                {key:"FILTER_WORKFLOW_NAME",value:{'description':'Filters workflows are presented to the user',filter:".*?"}},
                {key:"FILTER_WORKFLOW_VARIABLES",value:{'description':'Filters user_variables presented to the user',filter:".*?"}},
                {key:"FILTER_JOBSTATUS_BUTTONS",value:{'description':'Filters Buttons are available on Jobstatus page',filter:".*?"}},
                {key:"FILTER_BROWSE_LOCATIONS",value:{'description':'Filters Browse locations by folder name',filter:".*?"}}
            ];
            return rights;
    },
    //return a list of menu item permissions (all items must be in above all permissions as well
    getallallpossiblemenupermissions:() => {
            var rights = [
                {key:"GROUPRIGHT_MENU_VIEW_JOB_STATUS",value:{'description':'Job Monitor'}},//the value can be an object, e.g. filter for workflownames
                {key:"GROUPRIGHT_MENU_VIEW_SUBMIT_JOBS",value:{'description':'Create new jobs on ffastrans'}},
                {key:"GROUPRIGHT_MENU_VIEW_REVIEW_QUEUE",value:{'description':'Review Queue'}},
                /*{key:"GROUPRIGHT_MENU_VIEW_ADMIN_USERS",value:{'description':'Usermanagement'}},*/
                {key:"GROUPRIGHT_MENU_VIEW_SCHEDULER",value:{'description':'Scheduler menu item'}},
                {key:"GROUPRIGHT_MENU_VIEW_ADMIN",value:{'description':'Server admin menu'}},
                {key:"GROUPRIGHT_MENU_VIEW_FARM_ADMIN",value:{'description':'Farm administration'}},
            ];
            return rights;
    }
};


async function getpermissionlistAsync(username) {
    try{
        if (username == "")
            return []
        var data = await global.db.config.findOne({"local.username":username});
        //{ "local.usergroup.name": { data.local.groups }}
        var cursor = await global.db.config.find({ "local.usergroup.name": {$in: data.local.groups }});
        var allpermissions = [];
        for (let i in cursor){
            if (typeof(cursor[i]) == "function"){
                continue;
            }
            //concat all permission arrays from all groups
            //console.log(cursor[i])
            allpermissions = allpermissions.concat(cursor[i].local.usergroup.permissions)
        }
        return (allpermissions);
    }catch(ex){
        console.error("Fatal error getting userpermissions for username: ",username);
        return [];
    }
}

let workflowCache = {expires_on:new Date(),all_workflows:null};//example structure of course invalid data

async function checkworkflowpermission(username,wf_name){
    if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false"){
        return true;
    }
    
    if (workflowCache.expires_on < new Date()){
        let currentTime = new Date();
        workflowCache.expires_on = new Date(currentTime.getTime() + 2000);
        workflowCache.workflows = null;
    }

    if (!workflowCache.workflows){
        if (global.config["alternate-server"] == true){ //must check if true because can be string 'false'
            let all_workflows = await global.jobfetcher.getWorkflowList();
            workflowCache.workflows = all_workflows.data.workflows;
        }else{
            workflowCache.workflows = await ffastransapi.getWorkflows();//even tough jobfetcher.getWorkflowlist can be used, this one is with caching. todo: build caching into jobfetcher getworkflolist?
        }    
    }else{
        //console.log("Workflowcache hit");
    }
    //find wf_obj by name in order to find wf group. reason is because e.g. in history jobs db we dont store wf_group
    var wf_obj = workflowCache.workflows.filter(wf => wf.wf_name == wf_name);
    var parsed_wf_group = "";
    if (wf_obj.length>0){
        parsed_wf_group = wf_obj[0].wf_folder;
    }
    let allpermissions = [];

    let userprops = await global.db.config.findOneAsync({"local.username":username});
    let cursor = await global.db.config.findAsync({ "local.usergroup.name": {$in: userprops.local.groups }})
    for (let i in cursor){
        allpermissions = allpermissions.concat(cursor[i].local.usergroup.permissions)
    }
    var have_filter = false;
    for (x in allpermissions){

        //get list of allowed workflows//TODO: fetch workflow group from somewhere
        
            if (allpermissions[x]["key"] == "FILTER_WORKFLOW_GROUP"){
                have_filter = true;
                var filter = allpermissions[x]["value"]["filter"];
                if (parsed_wf_group.toLowerCase().match(filter.toLowerCase())){
                    return true;
                }
            }
            if (allpermissions[x]["key"] == "FILTER_WORKFLOW_NAME"){
                have_filter = true;
                var filter = allpermissions[x]["value"]["filter"];
                if (wf_name.toString().toLowerCase().match(filter.toLowerCase())){
                    //console.log("Worfkflow folder  " + wf["general"]["wf_name"] + " matches filter "+ filter);
                    return true;
                }
            }
    }//for allpermissions
    //if there is no filter, all workflows are allowed
    if (!have_filter)
        return true;
    return false;

}

async function checkFolderPermissions(username,path){
    let got_permission = false;
    try{
        let allowedLocs = await getAllowedBrowseLocations(username);
        allowedLocs.forEach(loc => {
            if (path.toLowerCase().indexOf(loc.path.toLowerCase()) != -1){
                got_permission = true;
            }
        });
    }catch(ex){
        console.log("Error checkFolderPermissions " + ex)
        return false;
    }
    return got_permission;

}

async function getAllowedBrowseLocations(username){
	var all_locations = global.config.allowed_browselocations;
	var filtered_locations = [];
	
	//loop through all permissions and collect allowed locations
	let has_location_filter = false; 
	if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "true"){
		let perms = await getpermissionlistAsync(username);
		for (perm of perms){
			if (perm.key == "FILTER_BROWSE_LOCATIONS"){
				has_location_filter = true;
				all_locations.map(function(loc){
					var filter = perm["value"]["filter"];
					if (loc.displayname.toLowerCase().match(filter.toLowerCase())){
						filtered_locations.push(loc);
					}
				});
				
			}
		}
	}else{
		filtered_locations = all_locations;
	}
	if (!has_location_filter)
		filtered_locations = all_locations;
	//above filter logic can potentially produce duplicate entries, filter unique array objects
	filtered_locations = filtered_locations.filter((obj1, i, arr) => 
		arr.findIndex(obj2 => 
		  JSON.stringify(obj2) === JSON.stringify(obj1)
		) === i
	)

	if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false" ){//removed check for no locations || Object.keys(allowed_locations).length == 0
		return global.config.allowed_browselocations;
	}
	//return all locations
	return filtered_locations;
}
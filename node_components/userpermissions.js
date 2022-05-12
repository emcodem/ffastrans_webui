//Here we also keep the list of possible user rights

module.exports = {
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
    //collects all permissions of all groups the username is memberof in array
    getpermissionlist:(username,callback) => {
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
                {key:"GROUPRIGHT_MENU_VIEW_ADMIN_USERS",value:{'description':'Usermanagement'}},
                {key:"GROUPRIGHT_MENU_VIEW_ADMIN",value:{'description':'Server admin menu item'}},
                {key:"GROUPRIGHT_MENU_VIEW_SCHEDULER",value:{'description':'Scheduler menu item'}},
				{key:"GROUPRIGHT_MENU_VIEW_FARM_ADMIN",value:{'description':'Farm administration'}},
                {key:"FILTER_WORKFLOW_GROUP",value:{'description':'Filters what workflows are presented to the user',filter:".*?"}},
                {key:"FILTER_WORKFLOW_NAME",value:{'description':'Filters what workflows are presented to the user',filter:".*?"}},
                {key:"FILTER_WORKFLOW_VARIABLES",value:{'description':'Filters user_variables presented to the user',filter:".*?"}},
                {key:"FILTER_JOBSTATUS_BUTTONS",value:{'description':'Filters what Buttons are available on Jobstatus page',filter:".*?"}}
            ];
            return rights;
    },
    //return a list of menu item permissions (all items must be in above all permissions as well
    getallallpossiblemenupermissions:() => {
            var rights = [
                {key:"GROUPRIGHT_MENU_VIEW_JOB_STATUS",value:{'description':'Job Monitor'}},//the value can be an object, e.g. filter for workflownames
                {key:"GROUPRIGHT_MENU_VIEW_SUBMIT_JOBS",value:{'description':'Create new jobs on ffastrans'}},
                {key:"GROUPRIGHT_MENU_VIEW_ADMIN_USERS",value:{'description':'Usermanagement'}},
                {key:"GROUPRIGHT_MENU_VIEW_ADMIN",value:{'description':'Server admin menu'}},
                {key:"GROUPRIGHT_MENU_VIEW_SCHEDULER",value:{'description':'Scheduler menu item'}},
                {key:"GROUPRIGHT_MENU_VIEW_FARM_ADMIN",value:{'description':'Farm administration'}},
            ];
            return rights;
    }
};

const userpermissions = require("../userpermissions");
const configServer = require('../server_config');

//as many clients can poll this parallel, we cache some stuff that is heavy

module.exports = async function(app, passport){
    /* gets allowed browselocations */
	app.get('/browselocations', async (req, res) => {
		//passport.authenticate('local-login'); //fills req.user with infos from cookie
		// var all_locations = {
		// 	STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES: global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES,
		// 	STATIC_ALLOWED_BROWSE_LOCATIONS : global.config.STATIC_ALLOWED_BROWSE_LOCATIONS
		// };
		
		//migrate from old style, todo: delete 2026
		if (global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES){
			//migrate possible old config to new config

			try{
				console.log("migrating old browse locations")
				global.config.allowed_browselocations = [];
				for (var b=0;b<global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES.length;b++){
					global.config.allowed_browselocations.push({
						displayname : global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES[b],
						path : global.config.STATIC_ALLOWED_BROWSE_LOCATIONS[b],
						filters : {include:"",exclude:""}
					})	
				}	
			}catch(ex){
				global.config.allowed_browselocations = [
					{
						displayname: "Error migrating browse locations from old webinterface version",
						path:"Error migrating browse locations from old webinterface version",
						filters: {include:"",exclude:""}
					}
				];
			}finally{
				delete global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES;
				delete global.config.STATIC_ALLOWED_BROWSE_LOCATIONS;
				configServer.save(global.config)
			}

		}

		var all_locations = global.config.allowed_browselocations;
		var filtered_locations = [];
		
		//loop through all permissions and collect allowed locations
		let has_location_filter = false; 
		if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "true"){
			let perms = await userpermissions.getpermissionlistAsync(req.user.local.username);
			
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
			//just add all locations to list if no auth or no filter
			// easylist.map(function(kv){
			// 	allowed_locations[kv.key] = kv.value;
			// })
			res.json(global.config.allowed_browselocations);
			return;
		}

		res.json(filtered_locations);
	});

    /* saves new browselocations */
    app.post('/browselocations', (req, res) => {
        try{
            console.log("Saving browselocations in database",req.body);
            //parse path and displayname into old style STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES and STATIC_ALLOWED_BROWSE_LOCATIONS
            var newDisplaynames = [];
            var newPaths = [];
            var data = req.body;
            data.map(entry => {
                newDisplaynames.push( entry.displayname);
                newPaths.push(entry.path);
            })

            //global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES = newDisplaynames;
            //global.config.STATIC_ALLOWED_BROWSE_LOCATIONS = newPaths;
			global.config.allowed_browselocations = data;
			
            configServer.save(global.config,function(){
                //success
                sendSuccess(res);
            },function(){
                //error (which may never really happen)
                sendErrror(res);
            })
    
        }catch (ex){
            sendError(res,"Unexpected Error: " + ex);
        }  

    })
}

function sendSuccess(res){
    res.json({success:true});
}

function sendError(res,msg){
    console.log("ERROR: unxepected error in index.js: " + msg);
    res.status(500);//Send error response here
    res.end();
}
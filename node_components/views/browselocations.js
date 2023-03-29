const userpermissions = require("../userpermissions");
const configServer = require(global.approot  + '/node_components/server_config');

//as many clients can poll this parallel, we cache some stuff that is heavy

module.exports = async function(app, passport){
    /* gets allowed browselocations */
	app.get('/browselocations', async (req, res) => {
		//passport.authenticate('local-login'); //fills req.user with infos from cookie
		var all_locations = {
			STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES: global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES,
			STATIC_ALLOWED_BROWSE_LOCATIONS : global.config.STATIC_ALLOWED_BROWSE_LOCATIONS
		};

		var allowed_locations = {};

		//build kv list for easy filtering, we never should have separated display names and locations..
		var easylist = [];
		for (var i=0;i<all_locations.STATIC_ALLOWED_BROWSE_LOCATIONS.length;i++){
			easylist.push ({
							key:all_locations.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES[i],
							value: all_locations.STATIC_ALLOWED_BROWSE_LOCATIONS[i]
							});
		}

		if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false"){
			//just add all locations to list
			easylist.map(function(kv){
				allowed_locations[kv.key] = kv.value;
			})
			res.json(allowed_locations);
			return;
		}
		//loop through all permissions and collect allowed locations
		var perms = await userpermissions.getpermissionlistAsync(req.user.local.username);
		for (perm of perms){
			if (perm.key == "FILTER_BROWSE_LOCATIONS"){
				var matched = easylist.map(function(kv){
					var filter = perm["value"]["filter"];
					if (kv.key.toLowerCase().match(filter.toLowerCase())){
						allowed_locations[kv.key] = kv.value;
						return true;
					}
				});

			}
		}
		res.json(allowed_locations);
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
            global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES = newDisplaynames;
            global.config.STATIC_ALLOWED_BROWSE_LOCATIONS = newPaths;
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
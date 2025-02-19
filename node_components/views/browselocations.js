const userpermissions = require("../userpermissions");
const configServer = require('../server_config');

//as many clients can poll this parallel, we cache some stuff that is heavy

module.exports = async function(app, passport){
    /* gets allowed browselocations */
	app.get('/browselocations', async (req, res) => {

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
		let allowed = await userpermissions.getAllowedBrowseLocations(req.user?.local?.username);
		if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false" ){//removed check for no locations || Object.keys(allowed_locations).length == 0
			res.json(allowed);
			return;
		}
		//return all locations
		res.json(allowed);
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
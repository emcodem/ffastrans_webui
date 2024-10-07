const defaultConfig = require("./serverconfig_defaults")

//this line is mandatory, do not remove it!
//module.exports = config;
//require('console-stamp')(console, '[HH:MM:ss.l]');  //adds HHMMss to every console log
module.exports = {
    //set object to config obj
    getAsync: async() => {
        var current_config = await global.db.config.findOne({"global.config":{$exists:true}});
        return current_config.global.config;
    },
    saveAsync: async() => {
        /* new strategy is that the rest of code just changes global config so no parameter here */
        await global.db.config.update({"global.config":{$exists:true}},{global:{config:global.config}});
        return global.config;
    },
    get: (callback) => {
        //check if we have a config in db, otherwise serve defaultConfig
		/* this is called at server startup and also some modules use it to get the latest valid config */
        global.db.config.findOne({"global.config":{$exists:true}}, function(err, data) {//'global':'config'
            if (err){
                throw err;
            }
            if ((data)){

				//merges possible new items from default config after server update
				data.global.config = {...defaultConfig, ...data.global.config}; //right one will overwrite values from left one
				console.log("Serving Server config from database");
                callback(data.global.config);
            }else{
                console.warn("No config in database, defaulting to default config");
                console.log("Default config:",defaultConfig)
				try{global.socketio.emit("admin", "Warning, you see default config.");}catch(ex){}
				callback (defaultConfig);
            }
        });
            //console.log("after findone")
    },
    getdefault: () => {
        //get the object from database
        console.log("Serving Server default config");
        //console.log(defaultConfig);
        return defaultConfig;
    },
    save: (configobj,callbacksuccess=false,callbackerror=false) => {
        //updates config in database
		/* modules should call this whenever they change global.config. TODO: implement setter */

        //restore values that are set in sub-windows
        if (!"STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES" in configobj){
            configobj.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES = global.config.STATIC_ALLOWED_BROWSE_LOCATIONS_DISPLAY_NAMES;
            configobj.STATIC_ALLOWED_BROWSE_LOCATIONS = global.config.STATIC_ALLOWED_BROWSE_LOCATIONS;
        }

        global.db.config.update({"global.config":{$exists:true}},{global:{config:configobj}},{upsert: true}, function (err, newDoc) {
            if (err){
				if (callbackerror){
					callbackerror(err);
				}
            }
			console.log("global config after saving",configobj)
            global.config = configobj;
            console.log("Success saving Server Config, config updated")
			if (callbacksuccess){
				callbacksuccess();
			}
        });
    },
	
	save_extra: (configname,configobj,callbacksuccess,callbackerror) => {
        //updates config in database
			//TODO: this overwrites the whole global db config?!
			global.db.config.update({configname:{$exists:true}},configobj,{upsert: true}, function (err, newDoc) {
				if (err){
					console.log("Error saving config",configname,configobj)
					callbackerror(err);
				}
				global.config = configobj;
				console.log("Success saving Server Config, config updated",configname,configobj)
				callbacksuccess();
				global.db.config.findOne({"global.config":{$exists:true}}, function(err, data) {
					console.log("Current global config: ",data)
				})
        });
    }
};


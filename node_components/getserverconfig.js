var configServer = require('./server_config');

module.exports = function(app, express){
//just output json array of array whole server config configured in server_config.js
//TODO: should be renamed to client config, exclude admin config stuff, move to views folder
	app.get('/getserverconfig', (req, res) => {
        
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify(global.config));//output json array to client
				res.end();
			}
		}catch (ex){
				console.log("ERROR: unxepected error in serveconfig: " + ex)            ;
                res.status(500);//Send error response here
                res.end();
		}
	});

	app.get('/serverconfig_confidential', async (req, res) =>  {
        
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                
				try{
					let conf = await configServer.getConfidentialAsync();
					conf = conf || {};
					res.json(conf);
				}catch(ex){
					res.json({})
				}
			}
		}catch (ex){
				console.log("ERROR: unxepected error in serveconfig: " + ex)            ;
                res.status(500);//Send error response here
                res.end();
		}
	});

	app.post('/serverconfig_confidential', async (req, res) => {
        //var current_config = await configServer.getAsync();
        try{
            var new_fields = req.body;
            //update global config with the keys to store
			if (! global.confidential_config){
				global.confidential_config = {};
			}
            Object.keys(new_fields).forEach(function(key) {
                global.confidential_config[key] = new_fields[key];
            });
            await configServer.saveConfidentialAsync(); //saves the whole global config
            res.status(200);
            res.end();
        }catch(ex){
            console.error("Error, could not save global config, ", ex);
            res.write("Error, could not save database, " + ex);
            res.status(500);
            res.end();
        }   
     })
}
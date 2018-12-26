module.exports = function(app, express){
//just output json array of array whole server config configured in server_config.js
//TODO: should be renamed to client config, exclude admin config stuff
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
	
}
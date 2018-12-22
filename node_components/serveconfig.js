module.exports = function(app, express){
//just output json array of array allowed_browse_locations configured in server_config.js
	app.get('/serveconfig', (req, res) => {
        
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
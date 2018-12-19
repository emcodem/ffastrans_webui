module.exports = function(app, express){
//just output json array of array allowed_browse_locations configured in server_config.js
	app.get('/getbrowselocations', (req, res) => {
        
        if (!global.config.allowed_browse_locations){
            res.status(500);//Send error response here
            res.write("ERROR: No browse locations configured in server_config.js");
            console.log("ERROR: No browse locations configured in server_config.js")
            res.end();
            return;
        }
        if (global.config.allowed_browse_locations.length != global.config.allowed_browse_locations_display_names.length){
            res.status(500);//Send error response here
            res.write("ERROR: Display names do not match browse locations in global config");
            console.log("ERROR: Display names do not match browse locations in global config")
            res.end();
            return;
            
        }
		try{
			if (req.method === 'GET' || req.method === 'POST') {
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                var locations = {};
                locations.display_names = [];
                locations.values = [];
                for (var a=0;a<global.config.allowed_browse_locations.length;a++){
                    locations.values.push(global.config.allowed_browse_locations[a]);   
                    locations.display_names.push(global.config.allowed_browse_locations_display_names[a]);
				}
                res.write(JSON.stringify(locations));//output json array to client
				res.end();
			}
		}catch (ex){
				console.log("ERROR: unxepected error in getbrowselocation: " + ex)            ;
                res.status(500);//Send error response here
                res.end();
		}
	});
	
}
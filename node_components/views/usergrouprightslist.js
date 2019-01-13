var userpermissions = require("../userpermissions");

module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 
var configServer = require(global.approot  + '/node_components/server_config');

	app.get('/usergrouprightslist', (req, res) => {
		try{
			//todo: get permission list from userpermission.js.getallpossiblepermissions
            var allperms = userpermissions.getallpossiblepermissions();
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify(allperms));//output json array to client
            res.end();
            
		}catch (ex){
				console.log("ERROR: unxepected error in user group rights list: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
}
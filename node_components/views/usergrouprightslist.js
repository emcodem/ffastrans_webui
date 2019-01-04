module.exports = function(app, express){
//serve and store admin config as dhtmlx form json config 
var configServer = require(global.approot  + '/node_components/server_config');

	app.get('/usergrouprightslist', (req, res) => {
		try{
			
            var rights = [
                {key:"GROUPRIGHT_MENU_ADMIN",value:{'description':'Admin Menu visible'}},//the value can be an object, e.g. filter for workflownames
                {key:"GROUPRIGHT_MENU_BROWSE_SERVER",value:{'description':'Server Browser visible'}},
                {key:"GROUPRIGHT_MENU_UPLOAD_FILES",value:{'description':'Upload Files visible'}},
                {key:"GROUPRIGHT_MENU_SUBMIT_JOBS",value:{'description':'Submit Jobs Menu visible'}},
                //{key:"GROUPRIGHT_FILTER_WORKFLOWS",value:""},
                //{key:"GROUPRIGHT_CUSTOM_UPLOAD_DIRECTORY",value:""}
            ];
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify(rights));//output json array to client
            res.end();
            
		}catch (ex){
				console.log("ERROR: unxepected error in user group rights list: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
}
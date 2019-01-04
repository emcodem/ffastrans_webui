module.exports = function(app, express){
//serve data as dhtmlx json config 

	app.get('/usergrouplist', (req, res) => {
		try{
			global.db.config.find({ "local.usergroup.name": { $exists: true } }).sort({'local.usergroup.name': 1}).exec(function(err, cursor) {//'global':'config'
                var groups = [];
                for (usergroup in cursor){
                    groups.push (cursor[usergroup].local.usergroup);
                }
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify(groups));//output json array to client
                res.end();
            })
		}catch (ex){
				console.log("ERROR: unxepected error in adminconfig: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
    
    //SAVE back to database
    app.post('/usergrouplist', (req, res) => {
        //var grouprights = [{key:"GROUPRIGHT_MENU_ADMIN",value:""},{key:"GROUPRIGHT_MENU_BROWSE_SERVER",value:{filter:"webui"}}];
        
        if (!req.body.name){
            console.log("Error, cannot save usergroup without name")
            throw("empty usergroup name not allowed");
        }
        if (!req.body.permissions){
            req.body.permissions = [];
        }
        var groupobj = {name:req.body.name,permissions:req.body.permissions};//todo: get value from post body
        console.log("Saving usergroupobject:")
        console.log(groupobj)
        global.db.config.update({"local.usergroup.name":groupobj.name},{_id:groupobj.name,local:{usergroup:groupobj}},{upsert: true}, function (err, newDoc) {
            if (err){
                console.log("ERROR: unxepected error in save usergrouplist: " + err);
                res.status(500);//Send error response here
                res.end();
                return;
            }
            console.log("Success saving usergroup")
            global.db.config.persistence.compactDatafile(); //compress database
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        });
    })
    
    //delete
    app.delete('/usergrouplist', (req, res) => {
        var groupobj = {name:req.body.name};
        console.log(req.body)
        console.log("Deleting usergroup " + groupobj.name + " from DB");
        //todo: remove group from all users as well
        global.db.config.remove({"local.usergroup.name":groupobj.name}, { multi: false },function(err,numRemoved){
            if (err){
                console.log("Error deleting usergroup from DB: " + err);
                res.writeHead(500,{"Content-Type" : "application/JSON"});
                res.write("Delete usergroup error, " + err);//output json array to client
                res.end();
            }
            //TODO: do we need to check if numRemoved == 1?
            console.log("Deleted " +numRemoved + " usergroup from DB")
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        })
        
    })
}
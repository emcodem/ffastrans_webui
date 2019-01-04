var User = require('../passport/models/user');

module.exports = function(app, express){

    //list all users
	app.get('/userlist', (req, res) => {
		try{
			global.db.config.find({ "local.username": { $exists: true }}).sort({'local.username': 1}).exec(function(err, cursor) {//'global':'config'
                var allusers = [];
                for (user in cursor){
                    allusers.push (cursor[user].local);
                }
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write(JSON.stringify(allusers));//output json array to client
                res.end();
            })
		}catch (ex){
				console.log("ERROR: unxepected error in adminconfig: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
    
    //SAVE back to database
    app.post('/userlistnew', (req, res) => {
        if (!req.body.name){
            console.log("Error, cannot save user without name")
            throw("empty user name not allowed");
        }
        if (!req.body.groups){
            req.body.groups = [];
        }
        var newUser        = new User();
        var hashedPassword = newUser.generateHash(req.body.password);
        var user = {};
        user.username = req.body.name;
        user.password = hashedPassword;
        user.groups = req.body.groups;
        global.db.config.update({"local.username":user.username},{local:user},{upsert: true}, function (err, newDoc) {
            if (err){
                console.log("ERROR: unxepected error in create user: " + err);
                res.status(500);//Send error response here
                res.end();
                return;
            }
            console.log("Success creating user " + req.body.username);
            global.db.config.persistence.compactDatafile(); //compress database
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        });
    })
    
    //SAVE back to database
    app.post('/userlistupdateexisting', (req, res) => {
        var newUser        = new User();
        var hashedPassword = req.body.password;
        var user = {};
        user.username = req.body.name;
        user.password = hashedPassword;
        user.groups = req.body.groups;
        global.db.config.update({"local.username":user.username},{local:user},{upsert: true}, function (err, newDoc) {
            if (err){
                console.log("ERROR: unxepected error in save user: " + err);
                res.status(500);//Send error response here
                res.end();
                return;
            }
            console.log("Success saving user " + req.body.username);
            global.db.config.persistence.compactDatafile(); //compress database
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        });
    })
    /*
    app.post('/userlistsetpassword', (req, res) => {
        var newUser        = new User();
        var hashedPassword = req.body.password;
        var user = {};
        user.username = req.body.name;
        user.password = hashedPassword;
        user.groups = req.body.groups;
        global.db.config.update({"local.username":user.username},{local:user},{upsert: true}, function (err, newDoc) {
            if (err){
                console.log("ERROR: unxepected error in save user: " + err);
                res.status(500);//Send error response here
                res.end();
                return;
            }
            console.log("Success setting password for user " + req.body.username);
            global.db.config.persistence.compactDatafile(); //compress database
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        });
    })*/
    
    
    //delete
    app.delete('/userlist', (req, res) => {
        console.log("Deleting user " + req.body.name + " from DB");
        global.db.config.remove({ "local.username": req.body.name }, { multi: false },function(err,numRemoved){
            if (err){
                console.log("Error deleting user from DB: " + err);
                res.writeHead(500,{"Content-Type" : "application/JSON"});
                res.write("Delete user error, " + err);//output json array to client
                res.end();
            }
            //TODO: do we need to check if numRemoved == 1?
            console.log("Deleted " +numRemoved + " user from DB")
            res.writeHead(200,{"Content-Type" : "application/JSON"});
            res.write(JSON.stringify({success:true}));//output json array to client
            res.end();
        })
        
    })
}
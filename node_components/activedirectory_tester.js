var ActiveDirectory = require('activedirectory2')

module.exports = function(app, passport){
//create navigation menu based on user permissions
	var configServer = require(global.approot  + '/node_components/server_config');

	app.post('/activedirectory_tester', function(req, res) { 
			//test AD config
			var adopts;
			try{
				var data = req.body;
				var dcparts = data["ad_config"]["ad_fqdn"].split(".");
				console.log(dcparts)
				
				var base_dn = "";
				for (i=0;i<dcparts.length;i++) {
					base_dn += "DC=" + dcparts[i];
					if (i<(dcparts.length-1)){
						base_dn += ",";
					}
				}
                
                //password is base64
				console.log("decrypted pw",data["ad_password"])
				var decrypted = Buffer.from(data["ad_password"], 'base64').toString();
				decrypted = ("decrypted ad_pw",decrypted);
				
				var uname = data["ad_user"] +'@' + data["ad_config"]["ad_fqdn"];
				//if username contains already @, do not add it automatically
				if (data["ad_user"].indexOf("@")!= -1)
					uname = data["ad_user"];
					
				//prepare AD connection
				var adopts = {
				  url: 'ldap://' + data["ad_config"]["ad_fqdn"] + ":" + data["ad_config"]["ad_port"],
				  baseDN: base_dn,
				  username: data["ad_user"] +'@' + data["ad_config"]["ad_fqdn"],
				  password: decrypted
				}
				console.log("Testing AD with options:",adopts,data);
				var ad = new ActiveDirectory(adopts);
				var usernameToCheck = data["ad_user"];
				if (data["ad_alternate_user"]){
					usernameToCheck = data["ad_alternate_user"];
					
				}
				
				ad.getGroupMembershipForUser(usernameToCheck, function(err, groups) {
					if (err) {
						var msg = "Didn't work. \n\nError: "+JSON.stringify(err)+"\n\nADCONFIG:\n\n"+ JSON.stringify(adopts);
						console.log(msg)
						res.status(500);//Send error response heres
						res.write(msg)
						res.end(); 
						return;
					}
					console.log("Groups for user", usernameToCheck, ":", groups)
					var groups_cn_only = [];
					groups.forEach(function(_obj){
						try{
							console.log(_obj["cn"])
						   groups_cn_only.push(_obj["cn"]);
						   
						}catch(ex){
							console.error("Unexpected error parsing groups from ad user ", ex)
						}
					});
					groups_cn_only.push("Domain Users"); //Domain Users is not returned by AD so we add it to every user here
					res.write("AD Groups for user" + usernameToCheck + "\n" + JSON.stringify(groups_cn_only,null, 4))
					res.status(200);//Send error response here
					res.end();
					return;
				});//getGroupMembership
				 

			}catch(ex){
				res.status(500);//Send error response here
				res.write("Didn't work. \n\nError: "+ex.stack+"\n\nADCONFIG:\n\n"+ JSON.stringify(adopts))
				res.end(); 
			}
	});
	
	//SAVE back to database
    app.post('/activedirectory_config_set', (req, res) => {
       console.log("Saving activedirectory config in database");
       var data = req.body;
       data["ad_config"]["ad_basedn"] = getBaseDn(data);   
       console.log("ServerConfig with AD to save: ", data);
	   global.config["ad_config"] = data["ad_config"];
       configServer.save(global.config,function(){
		   console.log("Saved activedirectory admin config");
			res.write("{}")
            res.status(200);//Send error response here
            res.end(); 
	   }),function(err){
		   console.log("Error saving admin config",err);
			res.write(err)
            res.status(500);//Send error response here
            res.end(); 
	   };
       
	});
	
}

function getBaseDn(data){
    var dcparts = data["ad_config"]["ad_fqdn"].split(".");
    var base_dn = "";
    for (i=0;i<dcparts.length;i++) {
        base_dn += "DC=" + dcparts[i];
        if (i<(dcparts.length-1)){
            base_dn += ",";
        }
    }
    return base_dn;
}
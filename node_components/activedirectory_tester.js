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
				decrypted = ("decrypted ad_pw",decrypted)
				
				
				//prepare AD connection
				var adopts = {
				  url: 'ldap://' + data["ad_config"]["ad_fqdn"] + ":" + data["ad_config"]["ad_port"],
				  baseDN: base_dn,
				  username: data["ad_user"] +'@' + data["ad_config"]["ad_fqdn"],
				  password: decrypted
				}
				console.log("Testing AD with options:",adopts);
				var ad = new ActiveDirectory(adopts);
				ad.getGroupMembershipForUser(data["ad_config"]["ad_user"], function(err, groups) {
					if (err) {
						var msg = "Didn't work. \n\nError: "+JSON.stringify(err)+"\n\nADCONFIG:\n\n"+ JSON.stringify(adopts);
						console.log(msg)
						res.status(500);//Send error response heres
						res.write(msg)
						res.end(); 
						return;
					}
					console.log("ADTest OK:", groups)
					res.write(JSON.stringify(groups))
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
       console.log("ServerConfig with AD to save: ", data)
       configServer.save(data,function(){
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
// passport.js - user authentification

// load all the things we need
var AzureLogin   = require('./azurelogin');
var LocalStrategy   = require('passport-local').Strategy;
var ActiveDirectory = require('activedirectory2').promiseWrapper;
// load up the user model
var User            = require('./models/user');

module.exports = function(passport) {
	

// =========================================================================
// passport session setup ==================================================
// =========================================================================
// required for persistent login sessions
// passport needs ability to serialize and unserialize users out of session
passport.serializeUser(function(user, done) {

  done(null, user);
});

passport.deserializeUser(function(user, done) {

  done(null, user);
});




// =========================================================================
// LOCAL SIGNUP ============================================================
// =========================================================================

passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true, // passes original request the callback
    },
    async function(req, username, password, done) { // callback with uname and password from our form

        console.log("login username",username);
        // find a user whose username is the same as the forms username
        // we are checking to see if the user trying to login already exists
        var existing = await asyncqueryOne(global.db.config,{ 'local.username' :  username });
        if (!existing){
			console.log("Username "+username+" not found, trying AD login")
			ActiveDirectoryLogin(req, username, password, done);
		}
        if (existing["local"]["password"] == "aduser"){
			console.log(username+" is known AD user, trying AD auth.");
            ActiveDirectoryLogin(req, username, password, done);
        }else{
            //LOCAL LOGIN
			console.log("Local user exists", existing);
                var doc;
                try{
                    doc = await global.db.config.findOne({ 'local.username' :  username });
                }catch(ex){
                    console.log(ex);
                }
                // if there are any errors, return the error before anything else
                if (!doc){
                    console.log("Local Login attempt for user "+username+" failed " );
                    return done("Local Login attempt for user "+username+" failed ");
                }

                // if no user is found, return the message
                if (!doc){
                    console.log("Local Login attempt for user "+username+" failed, username not found ");
                    return done("Wrong username"); // req.flash is the way to set flashdata using connect-flash
                }
                //todo: get rid of the mongoose user wrapper, it is not at all needed
                var newUser            = new User();
                // set the user's local credentials
                newUser.local.username    = doc.local.username;
                newUser.local.password    = doc.local.password;
                newUser.id    = doc._id;
                // if the user is found but the password is wrong
                if (!newUser.validPassword(password)){
                    console.log("Local Login attempt for user "+username+" failed, wrong password ");
                        return done('Wrong password.'); // create the loginMessage and save it to session as flashdata
                    }
                // all is well, return successful user
                console.log("local-login User "+ newUser.local.username + " login success");
                return done(null, newUser);
           // });
        }

    }));//local-login
};

async function ActiveDirectoryLogin(req,username,passwd,done){
    
		console.log("AD login procedure");
		var configServer = require(global.approot  + '/node_components/server_config');

		var currentConfig = configServer.get(async function(config){
				console.log("Config from DB:",config)
				try{	
					if (!("ad_config" in global.config)){
						console.log("AD is not set up in global config: ",global.config);
						return done("Username " + username + " is not known");
					}
                    
                    var uname = username + "@" + global.config["ad_config"]["ad_fqdn"];
                    //if username contains already @, do not add it automatically
                    if (username.indexOf("@")!= -1)
                        uname = username;

                    let protocol = global.config["ad_config"]["ad_protocol"] == "ldaps" ? "ldaps" : "ldap";
					var adopts = {
							url: protocol + '://'+global.config["ad_config"]["ad_fqdn"]+':'+global.config["ad_config"]["ad_port"],
							baseDN: global.config["ad_config"]["ad_basedn"],
							username: uname,
							password: passwd
					}
					
					//login to ad using the users credentials
					console.log("Trying AD Login for user:",username);
					var ad = new ActiveDirectory(adopts);
					
					var groups = await ad.getGroupMembershipForUser(username);//getGroupMembership
					console.log(groups)
					var groups_cn_only = [];
					groups.forEach(function(_obj){
						try{
						    console.log(_obj["cn"]);
						    groups_cn_only.push(_obj["cn"]);
						}catch(ex){
							console.error("Unexpected error parsing groups from ad user ", ex)
						}
					});
                    groups_cn_only.push("Domain Users"); //Domain Users is not returned by AD so we add it to every user here

					console.log("Parsed AD groups for user",username,groups_cn_only)
					var group_exists = false;
                    var intersection_groups = [] //groups that exist locally and user has in ad are stored to users group list
					for (_gid in groups_cn_only){
						_gid = groups_cn_only[_gid]
						var _exist = await asyncqueryOne(global.db.config,{"local.usergroup.name":_gid});
						if (_exist){
                            group_exists = true;
                            intersection_groups.push(_gid);
                        }
						console.log(_gid,"exists in db?",group_exists);
					}
					//check if any of the users groups exists in db
					if (!group_exists){
						console.error("AD username and pw is correct\nbut user has no group in AD\nthat exists also locally");
						return done("AD username and pw is correct\nbut user has no group in AD\nthat exists also locally")
					}
					
					//merge ad groups and existing groups to update user
					var existing = await asyncqueryOne(global.db.config,{ 'local.username' :  username });
					var newGroups = groups_cn_only;
					
						if (existing){
							console.log("merging existing user groups with ad groups", existing,intersection_groups )
							
							newGroups = [...existing.local.groups, ...intersection_groups];
							newGroups = array_unique(newGroups);
							console.log("combined local and ad groups of user:",newGroups)
						}
					
					//we always recreate the ad user in order to have updated groups       
					await asyncDeleteOne(global.db.config,{ 'local.username' :  username});
					var newUser            = {};
					newUser["local"]       = {};
					newUser.local.username    = username;
					newUser.local.password    = "aduser";
					newUser.local.is_ad_user        = true;
					newUser.local.id                = Math.random(1000000000000);
					newUser.local.groups            = intersection_groups;
					console.log("Storing user in db: ",newUser)
					await asyncInsertOne(global.db.config,newUser);
					return done(null, newUser);
				}catch(ex){
					console.log("Unexpected Exception while ad login ", ex)
					return done("User does not exist locally,\ntried AD login but failed.\nBad username/password?\n" + ex)
				}
		});
}

/* DB Async Wrappers*/

function asyncqueryOne(db,query) {
    /* function wrapping nedb into async await compatible */
    return new Promise((resolve, reject)=> {
        db.findOne(query).exec((error, result)=>{
            if (error !== null) reject(error);
            else resolve(result);
        });
    });
}

function asyncDeleteOne(db,query) {
    /* function wrapping nedb into async await compatible */
    return new Promise((resolve, reject)=> {
        db.remove(query,{},(error, result)=>{
            if (error !== null) reject(error);
            else resolve(result);
        });
    });
}

function asyncInsertOne(db,query) {
    /* function wrapping nedb into async await compatible */
    return new Promise((resolve, reject)=> {
        db.insert(query,(error, result)=>{
            if (error !== null) reject(error);
            else resolve(result);
        });
    });
}

//HELPES
function array_unique(_arr) {
    var a = _arr.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};
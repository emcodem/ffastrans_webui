// passport.js - user authentification

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var ActiveDirectoryStrategy = require('passport-activedirectory');

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
// we are using named strategies since we have one for login and one for signup
// by default, if there was no name, it would just be called 'local'

	passport.use('local-login',new ActiveDirectoryStrategy({
		  integrated: false,
			  ldap: {
				url: 'ldap://orfnet.at:389',
				baseDN: 'DC=orfnet,DC=at',
				username: "zjordanh@orfnet.at",
				password: 'ITWin2K!'
				
			  }
			}, async function (profile, ad, done) {
				
					console.log("Calling Memberof",profile)
					var groups =  await ad.getGroupMembershipForUser({},"zjordanh")//TODO: make async or at least get it working
					console.log(groups);
					//ad.isUserMemberOf(profile._json.dn, 'Domain Users', function (err, isMember) {
					//if (err) {
					//	console.log("AD AUTH ERROR", err)
					//}
					console.log("Authenticated",profile)
					var newUser            = new User();
					// set the user's local credentials
					newUser.local.username    = "admin"
					newUser.local.password    = "admin";
					newUser.id    = 1;
					return done(null,newUser);
					//})
	}))
	

	// passport.use('local-login',new LdapStrategy(OPTS),function(req, username, password, done) { 
		// console.log("LDAP login was tried.")
			// var newUser            = new User();
            // // set the user's local credentials
            // newUser.local.username    = "admin"
            // newUser.local.password    = "admin";
            // newUser.id    = 1;
		// return done(null,newUser);
	// });
	
   passport.use('ldap-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { // callback with email and password from our form

        // find a user whose username is the same as the forms username
        // we are checking to see if the user trying to login already exists
        global.db.config.findOne({ 'local.username' :  username }, function(err, doc) {
            // if there are any errors, return the error before anything else
            if (err){
                console.log("Local Login attempt for user "+username+" failed " + err);
                return done(err);
            }

            // if no user is found, return the message
            if (!doc){
                console.log("Local Login attempt for user "+username+" failed, username not found ");
                return done("Wrong username"); // req.flash is the way to set flashdata using connect-flash
            }
            
            var newUser            = new User();
            // set the user's local credentials
            newUser.local.username    = doc.local.username;
            newUser.local.password    = (doc.local.password);
            newUser.id    = doc._id;
            // if the user is found but the password is wrong
            if (!newUser.validPassword(password)){
                console.log("Local Login attempt for user "+username+" failed, wrong password ");
                    return done(null, false, req.flash('loginMessage', 'Wrong password.')); // create the loginMessage and save it to session as flashdata
                }
            // all is well, return successful user
            console.log("User "+ newUser.local.username + " login success");
            return done(null, newUser);
        });

    }));//local-login




};
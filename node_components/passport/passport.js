// passport.js - user authentification

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
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

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'username',    // define the parameter in req.body that passport can use as username and password
            passwordField: 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done){
            console.log("New user signup: " + username);
            // asynchronous
            process.nextTick(function() {
            // find a user whose username is the same as the forms username
            // we are checking to see if the user trying to login already exists
            global.db.config.findOne({ 'local.username' :  username }, function(err, user) {
                // if there are any errors, return the error
                if (err){
                    console.log(err)
                    return done(err);
                }
                // check to see if theres already a user with that username
                if (user) {
                    console.log("user "+user+" already exists")
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {
                    console.log("creating new user in db " + username)
                    //create user in db
                    var newUser            = new User();
                    // set the user's local credentials
                    newUser.local.username    = username;
                    newUser.local.password = newUser.generateHash(password);
                    //save user to db
                    global.db.config.insert({local:{"username":newUser.local.username,"password":newUser.local.password}}, function (err, newDoc) {
                        if (err){
                            throw err;
                        }
                        return done(null, newUser);
                    });
                    
                }

            });    

        });

    }));//local-signup
    
   passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { // callback with email and password from our form
        console.log("Login attempt, user: " + username)
        // find a user whose username is the same as the forms username
        // we are checking to see if the user trying to login already exists
        global.db.config.findOne({ 'local.username' :  username }, function(err, doc) {
            // if there are any errors, return the error before anything else
            if (err){
                console.log("Login attempt for user "+username+" failed " + err);
                return done(err);
            }

            // if no user is found, return the message
            if (!doc){
                console.log("Login attempt for user "+username+" failed, username not found ");
                return done(null, false, req.flash('loginMessage', 'Username not found')); // req.flash is the way to set flashdata using connect-flash
            }
            
            var newUser            = new User();
            // set the user's local credentials
            newUser.local.username    = doc.local.username;
            newUser.local.password    = (doc.local.password);
            newUser.id    = doc._id;
            // if the user is found but the password is wrong
            if (!newUser.validPassword(password)){
                console.log("Login attempt for user "+username+" failed, wrong password ");
                    return done(null, false, req.flash('loginMessage', 'Wrong password.')); // create the loginMessage and save it to session as flashdata
                }
            // all is well, return successful user
            console.log("User "+ newUser.local.username + " login success");
            return done(null, newUser);
        });

    }));//local-login


};
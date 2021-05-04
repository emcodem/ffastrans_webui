/*routes takes care about authentification for all urls*/
const express = require('express');
module.exports = function(app, passport) {

    // =====================================
    // LOGIN Must be frist, otherwise we end up in an indefinite loop for login redir
    // =====================================
    // show the login form

    //allow unauthorized access to login and dependencies
    app.get('/webinterface/components/login.html', function(req, res) {
        console.log("Login page called")
        // render the page and pass in any flash data if it exists
         //res.redirect('/webinterface/components/login.html');
         res.sendFile(global.approot + '/webinterface/components/login.html');
    });
    app.get('/webinterface/dependencies/*', function(req, res) {
         res.sendFile(global.approot + req.originalUrl);
    });

    //redirect /login
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
         res.redirect('/webinterface/components/login.html');
    });
		
	app.post('/login', function(req, res, next) {
      console.log("issue local and ldap login");
      //Todo: update s
	  passport.authenticate(['local-login'], function(err, user, info) {
		if (err) { console.log("auth error",err, user, info);return next(err); }
		if (!user) { console.log("auth error2",err, user, info);return res.redirect('/login'); }
		req.logIn(user, function(err) {
		  if (err) { console.log("auth error3",err, user, info);return next(err); }
		  return res.redirect('/');
		});
	  })(req, res, next);
	});


	//protect all other urls
    app.use('/*', isLoggedIn);//ensure user is logged in
    
    //redirect request from /
    app.get('/', function(req, res, next) {
        console.log("Request to root, deleteme")
        if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false")){
            res.redirect('/webinterface');          
        }else{
            console.log(req.originalUrl)
            res.redirect('/login');         
        }
    });

    //redirect /admin
    app.get('/admin', function(req, res, next) {
        if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false")){
            res.redirect('/webinterface/admin');          
        }else{
            console.log(req.originalUrl)
            res.redirect('/login');         
        }
    });
    
    app.use(express.static('./'));
    
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" =="false")){
        return next();
    }
    // if they aren't redirect them to the home page
    console.log("NOT AUTHENTICATED Web auth is " +global.config.STATIC_USE_WEB_AUTHENTIFICATION)
    console.log(req.originalUrl + " redirected to login");
    res.redirect('/login'); 
}

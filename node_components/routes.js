/*routes takes care about authentification for all urls*/
const path = require("path");
const express = require('express');
module.exports = function(app, passport) {

    // =====================================
    // LOGIN Must be frist, otherwise we end up in an indefinite loop for login redir
    // =====================================
    // show the login form

    //allow unauthorized access to login and dependencies
    app.get('/webinterface/components/login.html', function(req, res) {
        console.log("Login page called")
         //res.redirect('/webinterface/components/login.html');
         res.sendFile(global.approot + '/webinterface/components/login.html'); //need to use sendfile to keep referer at client OK
    });
    //allow unauthorized access 
    app.get('/webinterface/dependencies/*', async function(req, res) {
         res.sendFile(global.approot + req.originalUrl);
    });
    app.get('/alternate-server/css/*', async function(req, res) {
        res.sendFile(global.approot + req.originalUrl);
   });
    app.get('/favicon.ico', async function(req, res) {
        res.sendFile(global.approot + "/webinterface/favicon.ico");
    });

    //redirect /login to login.html
    app.get('/login', async function(req, res) {
        //res.sendFile(global.approot + '/webinterface/components/login.html');
         res.redirect('/webinterface/components/login.html');
    });
	
    //allow unauthorized access 
	app.post('/login', async function(req, res, next) {
      console.log("issue local and ldap login");
      //Todo: update s
	  passport.authenticate(['local-login'], function(err, user, info) {
		if (err) { console.log("auth error",err, user, info);return next(err); }
		if (!user) { console.log("auth error2",err, user, info);return res.redirect('/login'); }
		req.logIn(user, function(err) {
		  if (err) { console.log("auth error3",err, user, info);return next(err); }
         
          //if (req.query.referer)
            //return res.redirect(req.query.referer);
		  return res.send('OK');//the login.html page takes care about redirect to original url
		});
	  })(req, res, next);
	});


	//protect / require auth for all other pages
    app.use('/*', isLoggedIn);//ensure user is logged in
    
    //redirect request from /
    app.get('/', async function(req, res, next) {
        console.log("Request to root, deleteme")
        if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false")){
            res.redirect('/webinterface');          
        }else{
            console.log(req.originalUrl)
            res.redirect('/webinterface/components/login.html');         
        }
    });

    //redirect /admin - TODO: check if we actually need this
    app.get('/admin', async function(req, res, next) {
        if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false")){
            res.redirect('/webinterface/admin');          
        }else{
            console.log(req.originalUrl)
            res.redirect('/webinterface/components/login.html');         
        }
    });

    //needed to serve html/js/images 
    app.use("/alternate-server", express.static('./alternate-server'));
    app.use("/webinterface",express.static('./webinterface'));

    //logout
    app.get('/logout', async function(req, res) {
        req.logout(function(){});
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
    console.log("NOT AUTHENTICATED Web auth is " +global.config.STATIC_USE_WEB_AUTHENTIFICATION);
    console.log(req.originalUrl + " redirected to login");
    res.status(401);
    res.set("originalurl", req.originalUrl);
    //this crazy stuff is needed to keep the "referer" correctly set on client side
    res.send('<html>    <head>       <title>Redirecting...</title>    </head>    <body>     <form method="GET" action="/webinterface/components/login.html">     </form>      <script>        window.onload = function(){{           document.forms[0].submit()        }}     </script>   </body> </html>');
    //res.redirect('/webinterface/components/login.html'); 
}

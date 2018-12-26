// app/routes.js
const express = require('express');
module.exports = function(app, passport) {

    // =====================================
    // WEBINTERFACE ===============================
    // =====================================

    //serve static website
    app.use('/webinterface', isLoggedIn);//ensure user is logged in
    app.use(express.static('./'));
    //app.use(express.static(__dirname + '/webinterface'));
    //app.use('/admin', express.static(global.approot+'/webinterface/admin/'));
    
    app.get('/', function(req, res, next) {
        if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false")){
            res.redirect('/webinterface');          
        }else{
            console.log(req.originalUrl)
            res.redirect('/login');         
        }
    });

    app.get('/admin', function(req, res, next) {
        if (req.isAuthenticated() || (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false")){
            res.redirect('/webinterface/admin');          
        }else{
            console.log(req.originalUrl)
            res.redirect('/login');         
        }
    });
    
    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
         res.render('login.ejs', { message: req.flash('loginMessage') });
    });
    
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/', // login success, show website
        failureRedirect : '/login', 
        failureFlash : true // allow flash messages
    }));
    
    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });
    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/login', // redirect to the login page
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

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
    if (req.originalUrl.indexOf(".css") != -1){//allow css files (for login page ;-))
        return next();
    }
    // if they aren't redirect them to the home page
    console.log("NOT AUTHENTICATED Web auth is " +global.config.STATIC_USE_WEB_AUTHENTIFICATION)
    console.log(req.originalUrl + " redirected to login");
    res.redirect('/login'); 
}

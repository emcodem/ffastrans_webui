/*routes takes care about authentification for all urls*/
const path = require("path");
const express = require('express');
const fs = require("fs");
const proxy = require('express-http-proxy');
const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app, passport) {

    // =====================================
    // LOGIN Must be frist, otherwise we end up in an indefinite loop for login redir
    // =====================================
    // show the login form

    //allow unauthorized access to login and dependencies
    // app.get('/webinterface/components/login.html', function(req, res) {
    //     console.log("Login page called")
    //      //res.redirect('/webinterface/components/login.html');
    //      res.sendFile(global.approot + '/webinterface/components/login.html'); //need to use sendfile to keep referer at client OK
    // });
    //allow unauthorized access 

    app.get('/webinterface/dependencies/*', async function(req, res) {
         res.sendFile(global.approot + req.originalUrl);
    });

    //override.css is used on every page but usually does not exist, this prevents 404 errors
    app.get ('/alternate-server/css/override.css', async function(req,res){
        if (await fs.promises.exists(path.join(global.approot,"/alternate-server/css/override.css"))){
            res.sendFile(path.join(global.approot,"/alternate-server/css/override.css")); 
        }else{
            res.set('Content-Type', 'text/css'); // Set the content type to CSS
            res.send(''); // Send an empty string
        }
    })
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


    //anything in alternate-server is served
    app.use("/alternate-server", express.static('./alternate-server'));
    
    //can we hook mustache everywhere?
    app.get ('/webinterface/', function(req,res){
        //calls to /webinterface, we serve index.html with mustache
        console.log("Redirecting to /webinterface/index.html")
        res.redirect('/webinterface/index.html');
        // let realpath = path.join(global.approot,"/webinterface/index.html");
        // res.render(realpath,
        //     {
        //         googleTagManager: global.config.STATIC_GOOGLE_ANALYTICS_ENABLE == "enabled" ? 'https://www.googletagmanager.com/gtag/js?id=G-4FCDW4WBMR' : "",
              
        //     }
        //   );
    });
    app.get ('/webinterface/images/*', function(req,res){
        let realpath = path.join(global.approot,req.url);
        res.sendFile(realpath); 
    });
    app.get ('/webinterface/version.txt', function(req,res){
        res.sendFile(path.join(global.approot,"/webinterface/version.txt")); 
    })


    

    async function renderHTMLByMustache(req,res){
        /* check if html, if yes, use mustache rendering */
        console.log("renderHTMLByMustache",req.path)
        let realpath = path.join(global.approot,req.path);

        console.log("realpath",realpath)
        if (fs.existsSync(realpath)){//when we use fs.promises.exists, in compiled mode the file does not exist.
            //we use mustache for rendering html files, so we can insert global stuff
            if (realpath.match(/html$/i)){
                console.log("mustache rendering",realpath)
                res.render(realpath,
                    {
                        googleTagManager: global.config.STATIC_GOOGLE_ANALYTICS_ENABLE == "enabled" ? 'https://www.googletagmanager.com/gtag/js?id=G-4FCDW4WBMR' : "",
                      
                    }
                  )
            }else{
                //non html files
                res.sendFile(realpath);
            }

            return;
        }else{
            console.error("Mustache did not find requested file",realpath)
        }
    }
    app.get ('/webinterface/components/*', renderHTMLByMustache);
    app.get ('/webinterface/index.html', renderHTMLByMustache);
    //todo:move typescript_client to components?
    app.use("/webinterface/typescript_client/clientdist/dist/",express.static('./webinterface/typescript_client/clientdist/dist/'));

    
    // function selectGrafanaProxy(req){
    //     /* this "calculates" target url for proxy request. A parameter named url has to be in get parameters*/
    //     return global.config.grafana_base;
    // }

    // // Proxy configuration
    // const proxyOptions = {
    //     target: selectGrafanaProxy(), // Replace with the actual target server
    //     changeOrigin: true, 
    //     // pathRewrite: (path,req) => {
    //     //     return req.url;
    //     // },
    //     // on: {
    //     //     proxyReq: (proxyReq, req, res) => {
    //     //       let stop = 1;
    //     //     },
    //     //     proxyRes: (proxyRes, req, res) => {
    //     //         let stop = 1;
    //     //     },
    //     //     error: (err, req, res) => {
    //     //         let stop = 1;
    //     //     },
    //     //   },
    //     // hostRewrite:true,
    //      autoRewrite:true,
    //     // selfHandleResponse: false,  // Let the target server handle the response
    //     // followRedirects: true
    // };
    // app.use('/grafana_proxy', createProxyMiddleware(proxyOptions));

    // app.use('/grafana_proxy', proxy(selectGrafanaProxy, {
    //     /* use like: /grafana_proxy?url=http://grafanaserver/pad... */
    //     logLevel: "info", // TODO : configure grafana serve_from_sub_path 
    //     proxyTimeout: 2000,
    //     onProxyReq: function (proxyReq, req, res) {
    //                                 console.log(proxyReq) 
    //                             },
    //     parseReqBody: true,
    //     reqBodyEncoding: null,
    //     reqAsBuffer: true,
    //     proxyReqBodyDecorator: function (bodyContent, srcReq) {
    //         //the "" is important here, it works around that node adds strange bytes to the request body, looks like BOM but isn't
    //         //we actually want the body to be forwarded unmodified
    //         console.log("Proxying Grafana call: " , srcReq.url)
    //         bodyContent = ("" + srcReq.body)
    //         return bodyContent;
    //     }
    // }));

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
    if (req.originalUrl.match("tusd_callback")){
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

fs.promises.exists = async function(f) {
  try {
    await fs.promises.stat(f);
    return true;
  } catch {
    return false;
  }
}
const { ConfidentialClientApplication } = require('@azure/msal-node');
const axios = require('axios');

module.exports = {
    doLogin:doLogin
}

global.expressapp.get('/azurelogin', async (req, res) => {
    doLogin(req,res);
});

function doLogin(req,res){
    try{
        var conf = get_msal_config();
        console.log("azure dologin");
        let msalClient = new ConfidentialClientApplication(conf);
        let authUrl = msalClient.getAuthCodeUrl({
            scopes: ['openid', 'profile', 'email', 'User.Read'], // Request User.Read scope
            redirectUri: get_msal_config().auth.redirectUri,
        });
        //registerCallback(done);//todo: can we register one unique callback url per client?
        authUrl.then(url => {
            res.redirect(url);
        }).catch(err => {
            //todo: show login error on UI
            console.error(err);
            res.send(err);
        });
    }catch(ex){
        console.error("Azure login error",ex);
        return res.status(500).send(ex.stack);
    }

}

global.expressapp.get('/azurecallback', async (req, res) => {
    //this method is called by the client, initiated from azure redirect once the login was successful
    let msalClient = new ConfidentialClientApplication(get_msal_config());

    const tokenRequest = {
        code: req.query.code,
        scopes: ['openid', 'profile', 'email', 'User.Read'], // Include User.Read scope
        redirectUri: get_msal_config().auth.redirectUri,
    };

    try {
        const parsed_azure_token = await msalClient.acquireTokenByCode(tokenRequest);
        console.log("Successful azure logon",parsed_azure_token);
        await loginSuccess(req,res,parsed_azure_token);
    } catch (err) {
        console.error(err);
        res.send(err);
    }
});

function get_msal_config(){
    return {auth:{
		clientId: global.config.azure_config.clientId,
		authority: global.config.azure_config.authority,
		clientSecret: global.config.azure_config.clientSecret, 
		redirectUri: global.config.azure_config.redirectUri,
	}}
}

async function loginSuccess(req,res,parsed_azure_token){
    //to update user groups, we delete and recreate the user in internal db
    let username = parsed_azure_token.account.username;
    let groups = parsed_azure_token.idTokenClaims.roles || ["Default"];
    await global.db.config.remove({ 'local.username' :  username});

    var newUser            = {};
    newUser.local          = {};//just legacy, never mind
    newUser.local.username    = username;
    newUser.local.password    = "azureuser";
    newUser.local.is_ad_user        = true;
    newUser.local.id                = Math.random(1000000000000);
    newUser.local.groups            = groups;
    await global.db.config.insert(newUser);
    
     req.logIn(newUser, function(err){
         if(err) console.error(err)
        return res.redirect("/");
         //res.redirect('/');
     });
    //todo: how do we get/pass the done thingie from passport here?
}
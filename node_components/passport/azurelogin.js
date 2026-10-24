const { ConfidentialClientApplication } = require('@azure/msal-node');
var {HttpsProxyAgent} = require('https-proxy-agent');
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

    try {
        let msalClient = new ConfidentialClientApplication(get_msal_config());

        const tokenRequest = {
            code: req.query.code,
            scopes: ['openid', 'profile', 'email', 'User.Read'], // Include User.Read scope
            redirectUri: get_msal_config().auth.redirectUri,
        };
    
        const parsed_azure_token = await msalClient.acquireTokenByCode(tokenRequest);
        console.log("Successful azure logon",parsed_azure_token);
        await loginSuccess(req,res,parsed_azure_token);
    } catch (err) {
        console.error(err);
        res.send(err);
    }
});

function proxyNetworkClient(proxy){
    /*
        msal network module (INetworkModule) that sends all requests to microsoft via HttpsProxyAgent.
        Returns the same as msal's builtin fetch client: headers, parsed json body and status.
    */
    let agent = new HttpsProxyAgent(proxy);
    async function send(method, url, options, timeout){
        let response;
        try {
            response = await axios.request({
                method: method,
                url: url,
                headers: options && options.headers,
                data: method == "POST" ? ((options && options.body) || "") : undefined,
                httpsAgent: agent,
                proxy: false,                       //axios must not apply its own proxy settings
                timeout: timeout || 0,
                responseType: "text",
                transformResponse: [(data) => data],
                validateStatus: () => true          //msal evaluates error status codes itself
            });
        } catch (ex) {
            //never log the proxy url itself, it may contain the password
            throw logProxyError("Request via proxy failed for " + url + ": " + (ex.code || "") + " " + ex.message);
        }
        //proxy errors come back as html pages, msal would only report a generic network_error
        if (response.status == 407)
            throw logProxyError("Proxy authentication failed (HTTP 407) for " + url + ", check user and password in the proxy url");
        let body;
        try {
            body = JSON.parse(response.data);
        } catch (ex) {
            throw logProxyError("Unexpected response via proxy for " + url + ": HTTP " + response.status + " " + String(response.data).substring(0, 200));
        }
        //plain object with string values, like msal's fetch client (axios headers have no prototype)
        let headers = {};
        for (let [key, value] of Object.entries(response.headers.toJSON()))
            headers[key] = Array.isArray(value) ? value.join(", ") : String(value);
        return {
            headers: headers,
            body: body,
            status: response.status
        };
    }
    function logProxyError(message){
        console.error("Azure login:", message);
        return new Error(message);
    }
    return {
        sendGetRequestAsync: (url, options, timeout) => send("GET", url, options, timeout),
        sendPostRequestAsync: (url, options) => send("POST", url, options)
    };
}

function get_msal_config(){
    let conf= {
        auth:{
		clientId: global.confidential_config.azure_config.clientId,
		authority: global.confidential_config.azure_config.authority,
		clientSecret: global.confidential_config.azure_config.clientSecret, 
		redirectUri: global.confidential_config.azure_config.redirectUri,
	    }
    }
    if (global.confidential_config.azure_config.proxy ){
        conf.system = {
            networkClient: proxyNetworkClient(global.confidential_config.azure_config.proxy)
        }
    }
    return conf;
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
const Request = require("request");
const fs = require("fs");
const axios = require('axios');
var child_process = require('child_process');

module.exports =  function(app, passport){
//serve and store admin config as dhtmlx form json config 
    passport.authenticate('local-login');//fills req.user with infos from cookie
	app.get('/metrics_control', async(req, res) => {
		try{
            
            var prom_url = "http://" + global.config["STATIC_METRICS_METRICS_HOST"] + ":9090/api/v1/targets";
            console.log("Asking prometheus for active targets " + prom_url);
            var targets = await (axios.get(prom_url));

            console.log("Response from prometheus:",targets["data"]);
            res.send(targets["data"]);
            res.status(200);//Send error response here
            res.end();  

            // var yml = global.approot + "/tools/prometheus/ffastrans_targets.json";
                // if (fs.existsSync(yml)){
                    // var contents = fs.readFileSync(yml);
                    // res.send(contents);
                    // res.status(200);//Send error response here
                    // res.end();  
                // }else{
                    // res.write(yml+" not found")
                    // res.status(404);//Send error response here
                    // res.end();  
                // }
        }
		catch (ex){
				console.log("ERROR: unxepected error in metrics_control: " + ex);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + ex)
                res.end();
                return;
		}
	});
    
    app.post('/metrics_control', async (req, res) => {
		try{
            var data = req.body;
            var yml = global.approot + "/tools/prometheus/ffastrans_targets.json";
            
            
        }
		catch (ex){
				console.log("ERROR: unxepected error in metrics_control: " + ex);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + ex)
                
                res.end();
                return;
		}
	});
    
    app.put('/metrics_control', async (req, res) => {
        //install service
		try{
            var data = req.body;
            
            if(global.approot.match(/^\\\\/)){
                throw "Sorry, you cannot install Prometeus Database on a UNC share. Please copy and install the webinterface locally on the server."
            }
            var inst = global.approot + "/tools/install_metrics_server.bat";
            
            const util = require('util');
            const exec = util.promisify(require('child_process').exec);
            console.log("Executing " + inst)
            
            result = exec('cmd /C "' + inst + '"');
            console.log("Metrics install result:" + result)
            if (result["code"] != 0){
                throw "Installation failed, does the webinterface server.exe run with administrative privileges?"
            }
            
            res.send("OK");
            res.status(200);//Send error response here
            res.end();  
            
        }
		catch (ex){
				console.log("ERROR: " + ex);
                res.status(500);//Send error response here
                res.write("ERROR: " + ex)
                res.end();
                return;
		}
	});
    
    
}


function systemSync(cmd) {
  try {
    return child_process.execSync(cmd).toString();
  } 
  catch (error) {
    error.status;  // Might be 127 in your example.
    error.message; // Holds the message you typically want.
    error.stderr;  // Holds the stderr output. Use `.toString()`.
    error.stdout;  // Holds the stdout output. Use `.toString()`.
    return error;
  }
};

function buildApiUrl(what){
    return "http://" + global.config.STATIC_API_HOST + ":" +  global.config.STATIC_API_PORT + what;  
}

function hashCode (string) {
//this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
  var hash = 0, i, chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
  
  
  
  

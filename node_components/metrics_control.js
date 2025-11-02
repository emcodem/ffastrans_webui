const axios = require('axios');
var configmgr = require( './server_config');
var path = require("path");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
 
var os = require("os");

/*
    Strategy: prometheus uses a http service discovery and asks service_discovery method periodically (1min)
    
*/

module.exports =  function(app, passport){
	
    //passport.authenticate('local-login');//fills req.user with infos from cookie -- we cannot do this as unauthentificated ajax requests it

	
	app.get('/metrics_control', async(req, res) => {
		var currentDays = 15;
		
		try{
			//try finding current retention days from service
				var prom_url = "http://" + global.config["STATIC_METRICS_METRICS_HOST"] + ":9090/api/v1/targets";
				//console.log("Asking prometheus for active targets " + prom_url);
				var targets = await (axios.get(prom_url));
				var responsejson = targets["data"];
				
				try{
				var nssmPath = path.join(global.approot + "/tools/nssm.exe");
				var getCmd =  '"' +nssmPath + '" get "FFAStrans Metrics Collector" AppParameters';
				var getCmdResult = "15"; //Default 15 d
				console.log("Executing commandline: " + getCmd);
				try{
					getCmdResult = await exec(getCmd);
					getCmdResult = getCmdResult.stdout.toString() //TODO: why does below regex still match on a buffer or unicode bytes instead of string
					//getCmdResult = "--storage.tsdb.retention.time 100d"
					console.log("Result from getcmd: ", getCmdResult)
				}catch(ex){
					console.log("Unexpected error getting prometheus appparameters, ", ex)
				}
				
				
				var re = new RegExp(/(\d+)/);
				var matches = re.exec(getCmdResult);
				
				console.log(matches)
				console.log("parsed current retention days from prometheus appparameters: ",matches);
				if (matches){
					currentDays = matches[0];
				}
			}catch(ex){
				console.error(ex)
			}
			
			responsejson["prometheus_data_retention"] = currentDays;
				
            //console.log("Response from prometheus:",targets["data"]);
            res.send(responsejson);
            res.status(200);//Send error response here
            res.end();  

        }
		catch (ex){
				console.log("ERROR: unxepected error in metrics_control: " + ex);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + ex)
                res.end();
                return;
		}
	});
    


    app.get('/metrics_control/service_discovery', async(req, res) => {
        //used to configure prometheus dynamically, if configured in prometeus.yml, this will be called recurring
            var hostname = os.hostname();
            var _default = [
              {
                "targets": [ hostname+":3003",hostname+":9182" ],
              },
            ];
            
            if(!"prometheus_targets" in global.config || !global.config["prometheus_targets"]){
                console.log("No prometheus_targets stored, serving default")
                global.config["prometheus_targets"] = _default;
                configmgr.save(global.config);
            }
        
           // res.writeHead(200,{"Content-Type":"application/json"});
            res.json(global.config["prometheus_targets"]);
            
            //res.end(); 
    
    })
    
	
    app.post('/metrics_control', async (req, res) => {
		try{
            
            var data = req.body;
            console.log("metrics_control Current hosts:",global.config["prometheus_targets"]);
			console.log("metrics_control New hosts:",data)
            
            if (!global.config["prometheus_targets"]){
                global.config["prometheus_targets"] = [
                    {
                      "targets": [ ],
                    },
                  ];
            }
            
            console.log("Savinc prometheus_targets config",data);
            global.config["prometheus_targets"][0]["targets"] = data;
            configmgr.save(global.config,function(){
                res.status(200);//Send error response here
                res.end(); 
            },function(err){
                console.log("ERROR: unxepected error in metrics_control: " + err);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + err)
            });

        }
		catch (ex){
				console.log("ERROR: unxepected error in metrics_control: " + ex);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + ex)
                
                res.end();
                return;
		}
	});
    
    app.delete('/metrics_control', async (req, res) => {
		try{
            
            var data = req.body;
            console.log("Removing from monitoring",req.body);

            const A = global.config["prometheus_targets"][0]["targets"]
            const B = req.body
            var subtract_result = (A.filter(n => !B.includes(n)))
            global.config["prometheus_targets"][0]["targets"] = subtract_result;
            configmgr.save(global.config,function(){
                res.status(200);//Send error response here
                res.end();
            },function(err){
                console.log("ERROR: unxepected error in metrics_control: " + err);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + err)
            });

        }
		catch (ex){
				console.log("ERROR: unxepected error in metrics_control: " + ex);
                res.status(500);//Send error response here
                res.write("ERROR: unxepected error in metrics_control: " + ex)
                
                res.end();
                return;
		}
	});
}
//     app.put('/metrics_control', async (req, res) => {

//         //install service
// 		try{
//             var data = req.body;

// 			if (data["prometheus_data_retention"]){
// 				console.log("Saving new prometheus_data_retention",data)
// 				var nssmPath = path.join(global.approot + "/tools/nssm.exe");
// 				var editCmd =  '"' +nssmPath + '" set "FFAStrans Metrics Collector" AppParameters "--storage.tsdb.retention.time '+ data["prometheus_data_retention"] + 'd"';
// 				console.log("Executing cmd: ", editCmd);
				
// 				try{
// 					//edit service params
// 					var editChild = await exec(editCmd);
// 					console.log("Edit prom Service success.")
// 				}catch(ex){
// 					console.log("Error editing prometheus service:",ex)
// 					res.status(500);
// 					res.write('Error editing prometheus service: <br/>Please try to manually edit the service startup parameters e.g. --storage.tsdb.retention.time 1d using nssm.exe edit "FFAStrans Metrics Collector"');
// 					res.end();
// 					return;
// 				}
// 				try{
// 					//restart service
// 					var restartCmd = 'net stop "FFAStrans Metrics Collector" && net start "FFAStrans Metrics Collector"';
// 					console.log("Executing restart cmd: ", restartCmd);
// 					var restartService = await exec(restartCmd);
// 					console.log("Restart prom Service success.");
// 					res.send("OK");
// 					res.status(200);//Send error response here
// 					res.end(); 
// 				}catch(ex){
// 					res.status(500);
// 					res.write('Error restarting prometheus service: <br/>Please try to manually edit the service startup parameters e.g. --storage.tsdb.retention.time 1d using nssm.exe edit "FFAStrans Metrics Collector"' + " Message, " + JSON.stringify(ex) );
// 					res.end();
// 					return;
// 				}
				 
				 
// 				return;
// 			}
			
// 			//default: install prom service
//             if(global.approot.match(/^\\\\/)){
//                 throw "Sorry, you cannot install Prometeus Database on a UNC share. Please copy and install the webinterface locally on the server."
//             }
			
//             var inst = global.approot + "/tools/install_metrics_server.bat";
            
            
           
//             console.log("Executing " + inst)
            
//             result = await exec('cmd /C "' + inst + '"');
//             console.log("Metrics install result:" + result)
//             if (result["code"] != 0){
//                 throw "Installation failed, does the webinterface server.exe run with administrative privileges?"
//             }
            
//             res.send("OK");
//             res.status(200);//Send error response here
//             res.end();  
            
//         }
// 		catch (ex){
// 				console.log("ERROR in PUT metrics_control: " + ex);
//                 res.status(500);//Send error response here
//                 res.write("ERROR in PUT metrics_control: " + ex)
//                 res.end();
//                 return;
// 		}
// 	});
    
// }


// function systemSync(cmd) {
//   try {
//     return child_process.execSync(cmd).toString();
//   } 
//   catch (error) {
//     error.status;  // Might be 127 in your example.
//     error.message; // Holds the message you typically want.
//     error.stderr;  // Holds the stderr output. Use `.toString()`.
//     error.stdout;  // Holds the stdout output. Use `.toString()`.
//     return error;
//   }
// };

// function hashCode (string) {
// //this creates a hash from a stringified object, it is used to workaround and create missing jobids from ffastrans version 0.9.3
//   var hash = 0, i, chr;
//   if (string.length === 0) return hash;
//   for (i = 0; i < string.length; i++) {
//     chr   = string.charCodeAt(i);
//     hash  = ((hash << 5) - hash) + chr;
//     hash |= 0; // Convert to 32bit integer
//   }
//   return hash;
// };
  
  
  
  

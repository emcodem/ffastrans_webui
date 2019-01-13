const Request = require("request");
var userpermissions = require("../userpermissions");

module.exports = function(app, passport){
//serve and store admin config as dhtmlx form json config 

	app.get('/getworkflowlist', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
               passport.authenticate('local-login');//fills req.user with infos from cookie

               //download workflowlist from ffastrans server
                Request.get(buildApiUrl(global.config.STATIC_GET_WORKFLOW_DETAILS_URL), {timeout: 7000},(error, workflowResponse, body) => {
                    if(error) {
                        global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                        return;
                    }
                    
                    //disabled web security, show all worfklows
                    if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false"){
                        res.writeHead(200,{"Content-Type" : "application/JSON"});
                        res.write(workflowResponse.body);//output json array to client
                        res.end();
                        return;
                    }
                   
                   //apply filter if any
                   var workflowlist = JSON.parse(workflowResponse.body);
                   var filteredWorkflowList = [];
                   var alreadyAdded = {};
                   console.log(req.user);
                   userpermissions.getpermissionlist(req.user["local"]["username"],function(allpermissions){
                       try{
                           for (x in allpermissions){
                               if (allpermissions[x]["key"] == "FILTER_WORKFLOW_GROUP"){
                                   var filter = allpermissions[x]["value"]["filter"];
                                   for (var i in workflowlist["workflows/details"]){
                                        var wf = workflowlist["workflows/details"][i];
                                       if (wf["general"]["wf_folder"].toLowerCase().match(filter.toLowerCase())){
                                           if (!alreadyAdded[wf["general"]["wf_name"]]){
                                               console.log("Worfkflow folder  " + wf["general"]["wf_folder"] + " matches filter "+ filter);
                                               alreadyAdded[wf["general"]["wf_name"]] = 1;
                                               filteredWorkflowList.push(wf);//allow workflow
                                           }
                                       }else{
                                          //console.log("Worfkflow folder  " + wf["general"]["wf_folder"] + " NOT MATCHES filter "+ filter); 
                                       }
                                   };
                               }
                               if (allpermissions[x]["key"] == "FILTER_WORKFLOW_NAME"){
                                   var filter = allpermissions[x]["value"]["filter"];
                                   for (var i in workflowlist["workflows/details"]){
                                       var wf = workflowlist["workflows/details"][i];
                                       if (wf["general"]["wf_name"].toLowerCase().match(filter.toLowerCase())){
                                           //console.log("Worfkflow folder  " + wf["general"]["wf_name"] + " matches filter "+ filter);
                                           if (!alreadyAdded[wf["general"]["wf_name"]]){
                                               console.log("Worfkflow folder  " + wf["general"]["wf_folder"] + " matches filter "+ filter);
                                               alreadyAdded[wf["general"]["wf_name"]] = 1;
                                               filteredWorkflowList.push(wf);//allow workflow
                                           }
                                       }
                                   };
                               }
                           }//for allpermissions
                       }catch(ex){
                            console.log("ERROR: error in getworkflowlist: " + ex);
                            res.status(500);//Send error response here
                            res.end();
                            return;
                       }

                       //output all worfklows if something is wrong
                       if (filteredWorkflowList.length == 0){
                           //output all workflows
                            console.warn("Workflow Filter for user " + req.user["local"]["username"] + " returned 0 workflows, serving all workflows");
                            console.warn(filteredWorkflowList)
                            res.writeHead(200,{"Content-Type" : "application/JSON"});
                            res.write(workflowResponse.body);//output json array to client
                            res.end();
                            return;
                       }
                       
                       //finally output filtered list 
                        console.log("serving filtered workflow list")
                        workflowlist["workflows/details"] = filteredWorkflowList;
                        res.writeHead(200,{"Content-Type" : "application/JSON"});
                        res.write(JSON.stringify(workflowlist));//output json array to client
                        res.end();
                          
                   });//getpermissionlist callback

            });
          }
        }
		catch (ex){
				console.log("ERROR: unxepected error in getworkflowlist: " + ex);
                res.status(500);//Send error response here
                res.end();
		}
	});
}

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
  
  
  
  

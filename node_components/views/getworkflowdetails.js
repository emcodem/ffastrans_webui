const Request = require("request");
var userpermissions = require("../userpermissions");

module.exports = function(app, passport){
//serve and store admin config as dhtmlx form json config 

	app.get('/getworkflowdetails', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
               passport.authenticate('local-login');//fills req.user with infos from cookie
               wf_id = req.body.name || req.query.name;
               if (!wf_id){
                   throw("Error, need workflowid parameter")
               }
               //TODO: make this work
               
               //download workflowlist from ffastrans server
                Request.get(buildApiUrl(global.config.STATIC_GET_WORKFLOWS_URL + "/" + wf_id), {timeout: 7000},(error, workflowResponse, body) => {
                    if(error) {
                        global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_QUEUED_JOBS_URL));
                        res.writeHead(200,{"Content-Type" : "text/text"});
                        res.write("");//output json array to client
                        res.end();
                        return;
                    }
                    
                    //disabled web security, show all worfklows
                    if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false"){
                        res.writeHead(200,{"Content-Type" : "application/JSON"});
                        res.write(workflowResponse.body);//output json array to client
                        res.end();
                        return;
                    }
                   
                   var workflowlist
                   var filteredWorkflowList
                   var alreadyAdded
                   
                   try{
                       //apply filter if any
                       workflowlist = JSON.parse(workflowResponse.body);
                       filteredWorkflowList = [];
                       alreadyAdded = {};
                       console.log(req.user);
                    }catch(exc){
                       global.socketio.emit("error", 'Error getting workflow details, see logs ' + exc );
                        
                   }
                   userpermissions.getpermissionlist(req.user["local"]["username"],function(allpermissions){
                  
                       
                       try{
                           for (x in allpermissions){
                               
                       //FILTER VARIABLES - this needs to be done in a to be generated getworkflow.js file and webui needs to use this url instead of proxy
                                // try{
                                       // if (allpermissions[x]["key"] == "FILTER_WORKFLOW_VARIABLES"){
                                           // var filter = allpermissions[x]["value"]["filter"];
                                           // console.log("VARIABLE FILTER ACTIVE: " + filter)
                                           // for (var i in workflowlist["workflows/details"]){
                                               // console.log(workflowlist["workflows/details"][i]["user_variables"]);
                                               // for (var user_var_index in (workflowlist["workflows/details"][i]["user_variables"])){
                                                   
                                                   // var user_var = (workflowlist["workflows/details"][i]["user_variables"][user_var_index])
                                                        // if (user_var["name"].toLowerCase().match(filter.toLowerCase())){
                                                             // //allow
                                                             // console.log("Matched allowed User variable: " + user_var["name"])
                                                        // }else{
                                                            // console.log("Hiding User variable due to filter settings: " + user_var["name"])
                                                            // workflowlist["workflows/details"][i]["user_variables"] = [];
                                                            // console.log(workflowlist["workflows/details"][i]["user_variables"])
                                                            
                                                        // }
                                                   // }
                                               // }
                                           // }
                                   // }
                                   // catch(exec){
                                       // console.error("Error parsing user variables from workflows (contact developer): " + exec);
                                   // }
                               
                       
                       
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
                            res.write(JSON.stringify(workflowlist));//output json array to client
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
  
  
  
  

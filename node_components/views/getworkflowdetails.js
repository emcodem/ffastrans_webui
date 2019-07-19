const Request = require("request");
var userpermissions = require("../userpermissions");

module.exports = function(app, passport){
//serve and store admin config as dhtmlx form json config 

	app.get('/getworkflowdetails', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
               passport.authenticate('local-login');//fills req.user with infos from cookie
               wf_id = req.body.workflowid || req.query.workflowid;
               if (!wf_id){
                   throw("Error, need workflowid parameter")
               }
               //TODO: make this work
               
               //download workflowlist from ffastrans server
                Request.get(buildApiUrl(global.config.STATIC_GET_WORKFLOWS_URL + "/" + wf_id), {timeout: 7000},(error, workflowResponse, body) => {
                    if(error) {
                        global.socketio.emit("error", 'Error, webserver lost connection to ffastrans server. Is FFAStrans API online? ' + buildApiUrl(global.config.STATIC_GET_WORKFLOWS_URL));
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
                        
                      // FILTER VARIABLES - this needs to be done in a to be generated getworkflow.js file and webui needs to use this url instead of proxy
                       
                       try{
                           for (x in allpermissions){
                                try{
                                       //if we have a filter, iterate all variables of this workflow and filter them
                                       var allowed_variable_array = [];
                                       if (allpermissions[x]["key"] == "FILTER_WORKFLOW_VARIABLES"){
                                           
                                           console.log(req.user["local"]["username"] + " has got Filter permissions FILTER_WORKFLOW_VARIABLES: " );
                                           console.log(allpermissions[x]["value"]);
                                           var filter = allpermissions[x]["value"]["filter"];
                                           console.log("VARIABLE FILTER ACTIVE: " + filter)
                                           
                                           for (var i in workflowlist["workflows"]){
                                               console.log(workflowlist["workflows"][i]);
                                               for (var user_var_index in (workflowlist["workflows"][i]["variables"])){
                                                   
                                                   var user_var = (workflowlist["workflows"][i]["variables"][user_var_index])
                                                        if (user_var["name"].toLowerCase().match(filter.toLowerCase())){
                                                             //allow
                                                             console.log("Matched allowed User variable: " + user_var["name"])
                                                             allowed_variable_array.push(user_var)
                                                        }else{
                                                            console.log("Hiding User variable due to filter settings: " + user_var["name"])
                                                        }
                                                   }
                                               }//for all workflows
                                            //finally update workflowlist with new allowed variable array 
                                       }
                                       workflowlist["workflows"][i]["variables"] = allowed_variable_array;
                                   }
                                   catch(exec){
                                       console.error("Error parsing user variables from workflows (contact developer): " + exec);
                                   }
                               
                       
                       
                           }//for allpermissions
                       }catch(ex){
                            console.log("ERROR: error in getworkflow variables: " + ex);
                            res.status(500);//Send error response here
                            res.end();
                            return;
                       }

                       //finally output filtered list 
                        console.log("serving filtered workflow variables list")
                        //workflowlist["workflows/details"] = filteredWorkflowList;
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

  
  
  

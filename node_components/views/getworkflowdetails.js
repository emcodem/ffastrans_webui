const Request = require("request");
var userpermissions = require("../userpermissions");
const { build_new_api_url } = require("../common/helpers");

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
               
               //download workflowlist from ffastrans server
                var _url = build_new_api_url("/workflows?id=" + wf_id);
                console.log("calling ",_url)
                Request.get(_url, {timeout: 7000},(error, workflowResponse, body) => {
                    if(error) {
                        console.log("Error response from getworkflowdetails,",error)
                        global.socketio.emit("error", 'Error, could not get workflows. Is FFAStrans API online? ' );
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
                       var allowed_variable_array = [];
                       try{
                           var alreadyAdded = {};
                           var show_all_variables = true;
                           //check if we have any workflow variable filter, if no, show all variables
                           for (x in allpermissions){ 
                                if (allpermissions[x]["key"] == "FILTER_WORKFLOW_VARIABLES"){
                                    show_all_variables = false;
                                }
                           }
                           
                           if (show_all_variables){
                               console.log("serving unfiltered workflow variables list")
                                res.writeHead(200,{"Content-Type" : "application/JSON"});
                                res.write(JSON.stringify(workflowlist));//output json array to client
                                res.end();
                                return;
                           }
                           
                           for (x in allpermissions){   //parse through all permissions from all groups
                                try{
                                       //if we have a filter, iterate all variables of this workflow and filter them
                                       if (allpermissions[x]["key"] == "FILTER_WORKFLOW_VARIABLES"){
                                           console.log(req.user["local"]["username"] + " has got Filter permissions FILTER_WORKFLOW_VARIABLES: " );
                                           console.log(allpermissions[x]["value"]);
                                           var filter = allpermissions[x]["value"]["filter"];
                                           console.log("VARIABLE FILTER ACTIVE: " + filter)
                                           
                                           //for (var i in workflowlist["workflows"]){
                                               
                                               for (var user_var_index in (workflowlist["user_variables"])){
                                                   var user_var = (workflowlist["user_variables"][user_var_index])
                                                        if (user_var["name"].toLowerCase().match(filter.toLowerCase())){
                                                             //allow
                                                             console.log("Matched allowed User variable: " + user_var["name"])
                                                             if (!alreadyAdded[user_var["name"]]){
                                                                 allowed_variable_array.push(user_var);
                                                                 alreadyAdded[user_var["name"]] = 1;
                                                             }
                                                             
                                                        }else{
                                                            console.log("Hiding User variable due to filter settings: " + user_var["name"])
                                                        }
                                                   }
                                               
                                       }
                                       
                                   }
                                   catch(exec){
                                       console.error("Error parsing user variables from workflows (contact developer): " + exec);
                                   }
                           }//for allpermissions
                           
                           //finally update workflowlist with new allowed variable array 
                           workflowlist["user_variables"] = allowed_variable_array;
                           
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

  
  
  

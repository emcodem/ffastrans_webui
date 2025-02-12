var userpermissions = require("../userpermissions");

module.exports = function(app, express){

//returns filtered list of activejobs based on user permissions

  var configServer = require(global.approot  + '/node_components/server_config');
	app.get('/getactivejobsajax_treegrid', async (req, res) => {
      //BEWARE, there can potentially be many requests per second to this
      try{
            if (!global.hasOwnProperty("lastactive")){
              res.json([]);
              return;
            }
            var lastactive = JSON.parse(global.lastactive);
            if (lastactive.length == 0){
              res.json([]);
              return;
            }
            //filter based on user permissions
            var allowedWorkflows = [];
            var allWorkflows = lastactive.map(wf => {return wf.wf_name})
            if (req.user){
              //serve only workflows the user has rights for
              for (let _wf of allWorkflows){
                if (await userpermissions.checkworkflowpermission(req.user.local.username,_wf)){
                  allowedWorkflows.push(_wf);
                }
              }
            }else{
              allowedWorkflows = allWorkflows;
            }
            
            var allowed = []
            for(var i=0;i<lastactive.length;i++){
              if ( allowedWorkflows.includes(lastactive[i].wf_name))
                allowed.push(lastactive[i])  
            }
            

            res.json(allowed);//Send error response here
            
      }catch (ex){
        
        if (ex.message.indexOf("timeout")!=-1)
          console.error("getactivejobsajax_treegrid timeout exeeded",ex.message);
        else
          console.error("unexpected error in getactivejobsajax_treegrid",ex);
        res.status(500);//Send error response here
        res.end();
      }
	});
}

  

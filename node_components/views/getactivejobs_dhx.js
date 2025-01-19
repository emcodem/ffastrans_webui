var userpermissions = require("../userpermissions");

module.exports = function(app, express){

//returns filtered list of activejobs based on user permissions

	app.get('/getactivejobs_dhx', async (req, res) => {
      //BEWARE, there can potentially be many requests per second to this
      try{
            let returnobj = [];
            if (!global.hasOwnProperty("lastactive") || !global.hasOwnProperty("lastqueued")){
              res.json(returnobj);
              return;
            }

            let sortcol = req.query.sortcol;
            let sortdir = req.query.direction;
            var lastactive = JSON.parse(global.lastactive);
            var lastqueued = JSON.parse(global.lastqueued);

            if (lastactive.length == 0 && lastqueued.length == 0){
              res.json(returnobj);
              return;
            }

            //inject status for grid display
            lastactive = lastactive.map(j=>{j.state = "Active";return j});
            lastqueued = lastqueued.map(j=>{j.state = "Queued";return j});

            let allactive = [...lastactive,...lastqueued];

            //filter based on user permissions
            var allowedWorkflows = [];
            var allWorkflows = allactive.map(wf => {
              if (!wf.wf_name){
                wf.wf_name = wf.internal_wf_name; //workaround queued jobs have no wf_name
              }
              return wf.internal_wf_name || wf.wf_name;
            })
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
            for(var i=0;i<allactive.length;i++){
              if (allowedWorkflows.includes(allactive[i].wf_name))
                allowed.push(allactive[i]);
            }
            
            if (sortcol){
              allowed = allowed.sort((a, b) => {
                let valueA = a[sortcol];
                let valueB = b[sortcol];
  
                if (!sortcol || sortcol == "state"){
  
                }
    
                if (sortdir === "asc") {
                    return valueA > valueB ? 1 : -1;
                } else {
                    return valueA > valueB ? -1 : 1;
                }
              });
  
            }
            
            res.json(allowed);//Send error response here
            
      }catch (ex){
        
        if (ex.message.indexOf("timeout")!=-1)
          console.error("getactivejobs timeout exeeded",ex.message);
        else
          console.error("unexpected error in getactivejobs",ex);
        res.status(500);//Send error response here
        res.end();
      }
	});
}

  

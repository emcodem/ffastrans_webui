var userpermissions = require("../node_components/userpermissions");

module.exports = function(app, passport){
//create navigation menu based on user permissions
	app.get('/getusermenue', function(req, res) { 
       passport.authenticate('local-login');//fills req.user with infos from cookie
       if (global.config.STATIC_USE_WEB_AUTHENTIFICATION+"" == "false"){
           var allperms = userpermissions.getallallpossiblemenupermissions();
           renderUserMenue(req,res,allperms);
       }else{
           userpermissions.getpermissionlist (req.user.local.username,function(data){
                //as we now have all userpermissions, finish web request, 
                try{
                        renderUserMenue(req, res, data);  
                }catch (ex){
                        console.log("ERROR: unxepected error in index.js: " + ex);
                        res.status(500);//Send error response here
                        res.end();
                }            
           })
        }//else
	});
}

function renderUserMenue(req,res,permArray){
        //userpermissions.haspermission(req.user.local.username,"GROUPRIGHT_MENU_ADMIN",function(hasperm){ });
        var dhxSideBarConfig = {items:[]};
        var alreadyExisting = [];//removes duplicates
        for (i in permArray){
            if (!permArray[i].key){
                console.error("Error, got some user permission without key");
                console.error(permArray[i]);
                continue;
            }
            if (permArray[i].key.indexOf("MENU") != -1){//filter for menu items
                if (alreadyExisting.indexOf(permArray[i].key) == -1){
                    dhxSideBarConfig.items.push({id: permArray[i].key, text: permArray[i].key, icon: permArray[i].key + ".ico"});
                    alreadyExisting.push(permArray[i].key);
                }
            }
        }
        res.write(JSON.stringify(dhxSideBarConfig))
        res.status(200);//Send error response here
        res.end(); 
    
}
const fs = require('fs');
var path = require('path');
var regexEscape = require('escape-string-regexp');

module.exports = function(app, express){

	//respond to calls to /
	app.get('/filebrowser', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {

                
				var baseFolder;
				baseFolder = req.body.name || req.query.name;
				if ((!baseFolder.endsWith("/")) && (!baseFolder.endsWith("\\"))){
					baseFolder += "\\";
				}
                if (!checkFolderInGlobalConfig(baseFolder,res)){
                   return; 
                }; //ends request with error if basefolder is is not within configured locations

				var rows = {};
				rows.rows =[];
				if (!baseFolder){throw "Parameter name not specified"};//todo: handle no basepath error
				var split = baseFolder.split("\\");//todo: make sure path contains only backslashes
				var parentPath = split.slice(0, split.length - 2).join("\\") + "\\";
				rows.rows.push({id:"oneup",data:["..",parentPath, true, 0]});//add parent folder
				fs.readdir(baseFolder, (err, files) => {
                    if (!files){
                        res.status(500);//Send error response here
                        res.send("ERROR: could not list files in " + baseFolder);
                        res.end();
                        return;//todo: get out how to catch error of nested 
                    }
                    
				  files.forEach(filename => {
					  try{//ignore non accessible files and folders
						const stats = fs.statSync(baseFolder + filename)
					  rows.rows.push({id:Math.random(),data:[filename,baseFolder + filename, stats.isDirectory(), stats.size]});//name,fullpath,is_folder,size
					  }catch(exce){
						  console.log("WARNING: cannot stat file: " + baseFolder + filename +" , Exception: " + exce);
					  }
				  });
                  res.writeHead(200,{"Content-Type" : "application/JSON"});
				  res.write(JSON.stringify(rows));//output dhtmlx compatible json
				  res.end();
                  
				})		
			}
		}catch (ex){
				console.log("ERROR: in filebrowser : " + ex.stacktrace);
                res.status(500);//Send error response here
                res.send("ERROR: unxepected error in filebrowser: " + ex);
                res.end();
		}
	});
	
    function checkFolderInGlobalConfig(folder,res){
        //checks if global conf allows changing into this folder
        var allowed = false;
        for (i=0;i<global.config.allowed_browse_locations.length;i++){
            var regex = new RegExp(regexEscape(global.config.allowed_browse_locations[i]), "i");            
            if (regex.exec(folder)){
               allowed = true; 
            }
        }
        if (allowed){
            return true;
        }else {
            console.log("Directory not allowed: " + folder);
            res.status(404);//Send error response here
            res.send("Browsing \""+folder+"\" is not allowed");
            res.end();
        }
        
    }
}
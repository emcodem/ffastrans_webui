const fs = require('fs');


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
				res.writeHead(200,{"Content-Type" : "application/JSON"});
				//serve default directory
				var rows = {};
				rows.rows =[];
				if (!baseFolder){baseFolder = 'c:\\';};//todo: handle no basepath error
				fs.readdir(baseFolder, (err, files) => {
				  files.forEach(filename => {
					  try{//ignore non accessible files and folders
						const stats = fs.statSync(baseFolder + filename)
					  rows.rows.push({id:Math.random(),data:[filename,baseFolder + filename, stats.isDirectory(), stats.size]});//name,fullpath,is_folder,size
					  }catch(exce){
						  console.log("WARNING: cannot stat file: " + baseFolder + filename +" , Exception: " + exce);
					  }
				  });
				  res.write(JSON.stringify(rows));//output dhtmlx compatible json
				  res.end();
				})		
			}
		}catch (ex){
				console.log("ERROR: unxepected error in filebrowse: " + ex)            ;
                res.status(500);//Send error response here
                res.end();
		}
	});
	
	app.post('/filebrowser', (req, res) => {
		if (req.method === 'POST') {
			//change to directory
			var baseFolder;
			var rows =[];
			try{
				baseFolder = req.body.name;
				fs.readdir(testFolder, (err, files) => {
				  files.forEach(filename => {
						rows.push({'name':filename,'fullpath':baseFolder + filename, 'is_folder':fs.lstatSync(baseFolder + filename).isDirectory()});
				  });
				})
			}catch(ex){
				console.log("ERROR: cannot list files in folder: [" + name + "], message: " + ex);
			}
			
			res.end();
		}
	});
}
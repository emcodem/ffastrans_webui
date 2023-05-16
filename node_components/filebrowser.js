const fs = require('fs');
const path = require('path');
const { spawn,execSync } = require('child_process');

function regexEscape(string) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	// Escape characters with special meaning either inside or outside character sets.
	// Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
	return string
		.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
		.replace(/-/g, '\\x2d');
}


function twoDigits(d) {//todo: move this to server.js?
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

Date.prototype.toMysqlFormat = function() {//todo: move this to server.js?
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};

module.exports = function(app, express){
/* presents files from filesystem based on allowed directories in config and post/get params*/
    app.get('/download', async (req, res) => {

        try{
            if (!checkFolderInGlobalConfig(req.query.fullpath,res)){
                throw new ("Folder not allowed."); 
             };

            res.download(req.query.fullpath);
        }catch(ex){
            console.trace("ERROR: in download : " + ex);
            res.status(500);//Send error response here
            res.send("ERROR: Error in download: " + ex);
            res.end();
        }

    })

	app.get('/filebrowser', (req, res) => {
		try{
			if (req.method === 'GET' || req.method === 'POST') {
				var baseFolder;
				baseFolder = req.body.name || req.query.name;
                baseFolder = baseFolder.replace(/&amp;/g, '&');
                console.log("Filebrowser request to: " + baseFolder)
                if (!baseFolder){
                    console.log("Filebrowser was called without valid directory");
                    res.status(500);
                    res.send("Filebrowser was called without valid directory");
                    res.end();
                }
                
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
                        res.send("ERROR: could not list files in " + baseFolder +" " + err);
                        res.end();
                        return;//todo: get out how to catch error of nested 
                    }
                    
				  files.forEach(filename => {
					  try{//ignore non accessible files and folders
						const stats = fs.statSync(baseFolder + filename);
                        rows.rows.push({id:Math.random(),userdata:{"fullpath":baseFolder + filename} ,data:[filename,baseFolder + filename, stats.isDirectory(), getReadableFileSizeString(stats.size), stats.ctime.toMysqlFormat(),stats.mtime.toMysqlFormat(),stats.size]});//name,fullpath,is_folder,size
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
				console.error("ERROR: in filebrowser : " + ex);
                res.status(500);//Send error response here
                res.send("ERROR: Error in filebrowser: " + ex);
                res.end();
		}
	});



    app.get('/getjpeg', async (req, res) => {

        return new Promise((resolve,reject) => {
            var standard_args = [
                "-i", req.query.fullpath, 
                "-vframes","1",
                "-c:v", "mjpeg","-f","rawvideo",
                "-"
                ];
            
            var binarydata = Buffer.from("");
            
            var ffmpegexe = path.join(global.approot,"tools","ffmpeg","ffmpeg.exe");

            this.ffrewrap = spawn(ffmpegexe, standard_args); 
                                
            this.ffrewrap.stdout.on('data', data => {
                binarydata = Buffer.concat([binarydata,data]);
            });

            this.ffrewrap.stderr.on('data', data => {
                console.log(`preview extraction log: ${data}`);
            });
    
            this.ffrewrap.on('exit', returncode => { 
                console.log ("ffmpeg image extraction end, returncode: "+returncode);
                
                if (returncode != "0"){
                    console.log("ffmpeg preview extraction failed, return code: ",returncode);
                    console.error("Error extracting preview image, read logs above");
                    res.writeHead(500,{"Content-Type" : "text/html"});
                    res.write("ffmpeg preview extraction failed, return code: " + returncode);
                    res.end();
                    resolve();
                    return;
                }
                res.writeHead(200,{"Content-Type" : "image/jpeg"});
                res.write(binarydata);
                res.end();
                resolve();
                return;
            });
    
            /* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
            this.ffrewrap.on('error', data => {
                console.error("Error extracting preview image, read logs above");
                res.writeHead(500,{"Content-Type" : "text/html"});
                res.write("ffmpeg preview extraction failed, return code: ");
                res.end();
                reject();
                return;
            });
            

        })//extractpreview promise

    })

    function getReadableFileSizeString(fileSizeInBytes) {
    //helper, translates number of file size bytes into human readable value
        var originalFilesize = fileSizeInBytes;
        if (fileSizeInBytes == 0){
            return "0 kB";
        }
        var i = -1;
        var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        do {
            fileSizeInBytes = fileSizeInBytes / 1024;
            i++;
        } while (fileSizeInBytes > 1024);
        return (Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i]) ;
    }


    function checkFolderInGlobalConfig(folder,res){
        //checks if global conf allows changing into this folder
        var allowed = false;
        for (i=0;i<global.config.STATIC_ALLOWED_BROWSE_LOCATIONS.length;i++){
            var regex = new RegExp(regexEscape(global.config.STATIC_ALLOWED_BROWSE_LOCATIONS[i]), "i");            
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


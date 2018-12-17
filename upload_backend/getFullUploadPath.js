var path = require('path');
var fs = require('fs');
var path = require('path');

module.exports = function(app, express){

    config.uploadpath
	//respond to calls to /
	app.get('/getfulluploadpath', (req, res) => {
		if (req.method === 'GET') {
            try{    
                fs.exists(global.config.uploadpath, function(notcomplied) { 
            if (notcomplied) { 
                 res.write(global.config.uploadpath);
                 res.end();
              }
              else{
                console.log("ERROR: Upload path does not exist: ["+global.config.uploadpath+"]");
                res.status(404);//Send error response here
                res.end();
              }
            }); 
            }catch(e){
                console.log("ERROR: Check for upload path returned error: " + e);
                res.status(500);//Send error response here
                res.end();
            }

		}

	});

}
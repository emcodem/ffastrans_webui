var path = require('path');
var fs = require('fs');
var path = require('path');

module.exports = function(app, express){

	//respond to calls to /
	app.get('/getfulluploadpath', (req, res) => {
		if (req.method === 'GET') {
            try{    
                fs.exists(global.config.STATIC_UPLOADPATH, function(notcomplied) { 
            if (notcomplied) { 
                 res.write(global.config.STATIC_UPLOADPATH);
                 res.end();
              }
              else{
                console.log("ERROR: Upload path does not exist: ["+global.config.STATIC_UPLOADPATH+"]");
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
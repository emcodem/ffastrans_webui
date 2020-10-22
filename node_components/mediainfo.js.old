const fs = require('fs');
var path = require('path');
var regexEscape = require('escape-string-regexp');
const mediainfo = require('node-mediainfo');

module.exports = function(app, express){
    app.get('/mediainfohtml',  async  (req, res) => {
            try{
                var baseFolder;
				file_path = req.query.name;
                
                console.log("analyzing filepath: " + file_path)
              
                if (!file_path){
                    //throw new Error("Parameter \"name\" required")
                }
                file_path = file_path.replace(/&amp;/g, '&');
                var result;
                //mediainfo.Option('Inform','HTML');
                await mediainfo(file_path).then(arg => {result = arg}).catch(
                                                                                                e=>console.error(e)
                                                                                            )
                                                                                            
              res.writeHead(200,{"Content-Type" : "application/JSON"});
              res.write(JSON.stringify(result));//output dhtmlx compatible json
              res.end();
              
              return;    
            }catch(ex){
				console.trace(ex)
            }
            /*
        console.trace("ERROR: in mediainfo.js : " + " reached end of script unexpectedly");
        res.status(500);//Send error response here
        res.send("ERROR: Error in mediainfo.js: " + " reached end of script unexpectedly");
        res.end();
        return;*/
    })
}

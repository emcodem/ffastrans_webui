const userpermissions = require("../userpermissions");
const configServer = require('../server_config');

//as many clients can poll this parallel, we cache some stuff that is heavy

module.exports = async function(app, passport){
    /* gets allowed variablecolumns */
    app.get('/video_generator', async (req, res) => {
        //todo generate all kinds of nice test patterns

        // return new Promise((resolve,reject) => {
        //     var standard_args = [
        //         "-i", req.query.fullpath, 
        //         "-vframes","1",
        //         "-c:v", "mjpeg","-f","rawvideo",
        //         "-"
        //         ];
            
        //     var binarydata = Buffer.from("");
            
        //     var ffmpegexe = path.join(global.approot,"tools","ffmpeg","ffmpeg.exe");

        //     this.ffrewrap = spawn(ffmpegexe, standard_args); 
                                
        //     this.ffrewrap.stdout.on('data', data => {
        //         binarydata = Buffer.concat([binarydata,data]);
        //     });

        //     this.ffrewrap.stderr.on('data', data => {
        //         console.log(`preview extraction log: ${data}`);
        //     });
    
        //     this.ffrewrap.on('exit', returncode => { 
        //         console.log ("ffmpeg image extraction end, returncode: "+returncode);
                
        //         if (returncode != "0"){
        //             console.log("ffmpeg preview extraction failed, return code: ",returncode);
        //             console.error("Error extracting preview image, read logs above");
        //             res.writeHead(500,{"Content-Type" : "text/html"});
        //             res.write("ffmpeg preview extraction failed, return code: " + returncode);
        //             res.end();
        //             resolve();
        //             return;
        //         }
        //         res.writeHead(200,{"Content-Type" : "image/jpeg"});
        //         res.write(binarydata);
        //         res.end();
        //         resolve();
        //         return;
        //     });
    
        //     /* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
        //     this.ffrewrap.on('error', data => {
        //         console.error("Error extracting preview image, read logs above");
        //         res.writeHead(500,{"Content-Type" : "text/html"});
        //         res.write("ffmpeg preview extraction failed, return code: ");
        //         res.end();
        //         reject();
        //         return;
        //     });
            

        // })//extractpreview promise

    });

}

function sendSuccess(res){
    res.json({success:true});
}

function sendError(res,returnobj){
    console.log("ERROR: unxepected error: " + returnobj);
    res.writeHead(500,{"Content-Type" : "application/JSON"});
    res.write(returnobj);//output json array to client
    res.end();
}
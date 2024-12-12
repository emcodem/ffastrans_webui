/*routes takes care about authentification for all urls*/
const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const os = require("os");
const axios = require("axios");
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const {Server,EVENTS} = require('@tus/server');
const {FileStore} = require('@tus/file-store');


let binaryPath  = os.tmpdir();   //where mongod binary will be extracted to. Can be changed before calling start method
let port        = 28017;

module.exports = function(app, passport) {
    initializeUppy(app);
}

function initializeUppy(app){
    //downloadTusD();
    
    const tusServer = new Server({
        path: '/uppy',
        datastore: new FileStore({directory: global.config.STATIC_UPLOADPATH}),
      });
    global.tusServer = tusServer; //needed to reset upload path when changed in admin config

    //listen to changes of STATIC_UPLOADPATH
    let current_uploadpath = global.config.STATIC_UPLOADPATH;
    async function observeUploadPath(){
        while(true){
            if (current_uploadpath != global.config.STATIC_UPLOADPATH){
                try{
                    tusServer.datastore.directory = global.config.STATIC_UPLOADPATH;
                    tusServer.datastore.configstore.directory = global.config.STATIC_UPLOADPATH;
                    current_uploadpath = global.config.STATIC_UPLOADPATH;    
                }catch(ex){
                    let stop =1;
                }
            }
            await sleep(1000);
        
        }
    }
    observeUploadPath()

    //this is from tusServer documentation, not sure if it is really neccessary to to app.all and *
    app.all('*', (req, res) => {
        tusServer.handle(req, res);
    });
    
    //rename files after upload
    tusServer.on(EVENTS.POST_FINISH, async (req,res,upload) => {
        //todo: we cannot send an error to client here beacuase res is just true, might be bug in uppy
        let fullpath = upload.storage.path.replace("\\/","\\");
        let upload_dirname = path.dirname(fullpath);
        let originalname = upload.metadata.filename;

        let normalized_filename = originalname.replace(/[ö\/\|:\?"\*<>\\]/g, '_');

        await fsExtra.ensureDir(path.join(upload_dirname,upload.id + "_"));
        let target_full = path.join(upload_dirname,upload.id + "_",normalized_filename);
        
        if (await exists(target_full)){
            try{
                console.warn("Upload file already exists, trying to overwrite: ",target_full);
                await fs.promises.unlink( target_full )}
            catch(ex){
                    console.warn("Upload file already exists, trying to overwrite: ",target_full);
            };
        }
        console.log("Renaming upload file from: ",fullpath,"to",target_full);
        await fs.promises.rename(fullpath, target_full)
        
    })

};

// async function downloadTusD(){
//     let link_win = "https://github.com/tus/tusd/releases/download/v2.6.0/tusd_windows_amd64.zip";
    
//     const fileResponse = await axios({
//         url: link_win,
//         method: "GET",
//         responseType: "stream",
//     });
//     console.log("writing tuds to ", path.join(binaryPath,"tusd.zip"));
//     await fsPromises.writeFile(path.join(binaryPath,"tusd.zip"), fileResponse.data);
    
     
//      let unzipcmd = 'powershell -Command "Expand-Archive -Force "' + path.join(binaryPath,"tusd.zip").replaceAll("\\","\\\\") + '" "' + path.join(binaryPath,"tusd").replaceAll("\\","\\\\") + '""';
//      try{
//         const { stdout, stderr } = await exec(unzipcmd);
//         console.log("success unzipping tusd to",path.join(binaryPath,"tusd").replaceAll("\\","\\\\"));
//      }catch(ex){
//         console.error("Error unzipping",ex)
//      }
    
// }


function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }


async function exists(f) {
    try {
      await fs.promises.stat(f);
      return true;
    } catch {
      return false;
    }
  }
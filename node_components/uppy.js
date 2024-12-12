/*routes takes care about authentification for all urls*/
const path = require("path");
const fs = require("fs");

const {Server,EVENTS} = require('@tus/server')
const {FileStore} = require('@tus/file-store')

module.exports = function(app, passport) {
    initializeUppy(app);
}

function initializeUppy(app){
    
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
        let target_full = path.join(upload_dirname,originalname);
        if (await (target_full)){
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
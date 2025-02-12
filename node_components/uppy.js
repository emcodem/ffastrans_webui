/*routes takes care about authentification for all urls*/
const path = require("path");
const fs = require("fs");
const fsExtra = require("fs-extra");
const os = require("os");
const axios = require("axios");
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require("child_process");

const {Server,EVENTS} = require('@tus/server');
const {FileStore} = require('@tus/file-store');
const portfinder = require("portfinder");

module.exports = function(app, passport) {
    initializeUppy(app);
}

/**
 * @param {*} app express
 * initializes tusd (external process) or node-tus-server upload, depending on server config
 * @returns 
 */
async function initializeUppy(app){
    if (global.config.USE_TUSD != "disabled"){
        try{
            await initializeTUSdProxy(app);
            return;
        }catch(ex){
            console.error("FATAL Error starting tusd, did you update the webinterface/tools?");
        }
    }

    console.log("Using Alternate upload node-tus-server.");
    //if we shall not start external process, initialize node-tus-server
    const tusServer = new Server({
        path: '/tusd_proxy',
        // relativeLocation:true,
        datastore: new FileStore({directory: global.config.STATIC_UPLOADPATH}),
      });
    
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
    observeUploadPath();

    //this is from tusServer documentation, not sure if it is really neccessary to to app.all and *
    //it seems to be neccessary, app.use dont work and 
    app.all('*', (req, res) => {
        tusServer.handle(req, res);
    });
    
    //rename files after upload
    tusServer.on(EVENTS.POST_FINISH, async (req,res,upload) => {
        //todo: we cannot send an error to client here beacuase res is just true, might be bug in uppy
        let fullpath = upload.storage.path.replace("\\/","\\");
        let upload_dirname = path.dirname(fullpath);
        let originalname = upload.metadata.filename;

        let normalized_filename = originalname.replace(/[ö\/\|:\?"\*<>\\]/g, '_'); //client must do the same

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

async function initializeTUSdProxy(app){

    let tusinstance = new TUSd(global.config.STATIC_UPLOADPATH);
    await tusinstance.start();

    app.use('/tusd_callback',async function(req,res){
        /* 
            we register this url when starting tusd.exe as callback url for reporting everything to us, especially finish
            on upload finish, rename uploaded file
        */
        console.debug("/tusd_callback was called, type:",req.body.Type);
        try{
            if (req.body && req.body.Type == "post-finish"){
                console.log("post-finish",req.body.Event);
                let uploadPath = req.body.Event?.Upload?.Storage?.Path;
                let filename = req.body.Event?.Upload?.MetaData?.filename;
                if (filename){
                    let normalized_filename = filename.replace(/[ö\/\|:\?"\*<>\\]/g, '_'); //client must do the same
                    //TUSd and node tus (called uppy here) are slightly different in fieldnames
                    await fsExtra.ensureDir(uploadPath + "_");
                    let target_full = path.join(uploadPath + "_",normalized_filename);
                    if (await exists(target_full)){
                        try{
                            console.warn("Upload file already exists, trying to overwrite: ",target_full);
                            await fs.promises.unlink( target_full )}
                        catch(ex){
                            console.warn("Upload file already exists, trying to overwrite: ",target_full);
                        };
                    }
                    console.log("Moving upload file from: ",uploadPath,"to",target_full);
                    await fs.promises.rename(uploadPath, target_full);

                    ////attempt to delete segments on tusd
                    // let uploadurl = req.body.Event.Upload.ID;
                    
                    // //Tus-Extension: creation,expiration
                    // let deleteurl = build_self_url("/tusd_proxy/" + uploadurl);
                    // let deleteresponse = await axios.delete(deleteurl, {
                    //         timeout: global.config.STATIC_API_TIMEOUT,
                    //         agent: false, 
                    //         headers: {"Tus-Resumable":"1.0.0"},
                    //         maxSockets: Infinity
                    //     });
                    // let stophere =1;
                }
            }
        }catch(ex){
            console.error("Unexpected Error in TUS callback",ex);
            res.status(500);
            res.json({});
            return;
        }

        res.status(200);
        res.json({});
    });


    // Proxy configuration
    const proxyOptions = {
        target: "http://localhost:" + tusinstance.port, // Replace with the actual target server
        
        pathRewrite: (path,req) => {
            //otherwise the path is /tusd_proxy/tusd_proxy/...
            return req.originalUrl;
        },

        selfHandleResponse: false,  // Let the target server handle the response
    };
    app.use('/tusd_proxy', createProxyMiddleware(proxyOptions));

    let current_uploadpath = global.config.STATIC_UPLOADPATH;
    async function observeUploadPath(){
        while(true){
            if (current_uploadpath != global.config.STATIC_UPLOADPATH){
                try{  
                    current_uploadpath = global.config.STATIC_UPLOADPATH;   
                    tusinstance.stop();
                    tusinstance = new TUSd(global.config.STATIC_UPLOADPATH);
                    await tusinstance.start();
                }catch(ex){
                    console.error("Unexpected error restarting TUS after uploadpath change",ex)
                }
            }
            await sleep(1000);
        
        }
    }
    observeUploadPath();

}

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


  class TUSd {
    //https://github.com/tus/tusd/releases/download/v2.6.0/tusd_windows_amd64.zip
    constructor(uploadPath) {
        this.#uploadPath = uploadPath;
        if (!uploadPath){
            throw new Error("You must pass uploadPath paramter to Class constructor");
        }
    }
    
    onStdErr = function(line){
        console.log("TUSD stderr",line.toString())
    };
    onStdOut = function(line){
        console.log("TUSD stdout",line.toString())
    };
    onExit = function(){};
    onError = function(){};

    //public fields readonly
    isRunning   = false;
    lastPid     = -1;
    childProcess = null;
    binaryFull  = false;

    //public fields read/write (change before calling start)
    binaryPath  = os.tmpdir();   //where mongod binary will be extracted to. Can be changed before calling start method
    port        = 27017;

    //private fields
    #uploadPath = "";   //private field, initialized by start

    async stop(){
        if (this.childProcess){
            this.childProcess.kill('SIGINT');
        }
    }

    locateBinary(){
        let existingBinary;
        if (fs.existsSync(path.join(global.approot,"tools","tusd","tusd.exe"))){
            existingBinary = path.join(global.approot,"tools","tusd","tusd.exe");
        }
        if (fs.existsSync(path.join(this.#uploadPath,"../","tusd"))){
            existingBinary = (path.join(this.#uploadPath,"../","tusd"));
        }
        if (fs.existsSync(path.join(this.#uploadPath,"../","tusd.exe")) ){
            existingBinary = (path.join(this.#uploadPath,"../","tusd.exe"));
        }  
        if (existingBinary){
            this.binaryFull = existingBinary;
            console.log("Using existing TUS binary: ",existingBinary);
        }
        return  this.binaryFull;
    }

    /**
     * starts tusd, returns listen port 
    * */
    async start(){
        
        this.port = await portfinder.getPortPromise({port: 9010, stopPort: 9100});
        console.log("Port for TUSD: ",this.port);
        let existingBinary = false;
        //locate executable

        this.locateBinary();
        if (!this.binaryFull){
            //create database binary
            throw new Error("Did not find TUS executeable Binary.");
        }
        console.log("Starting TUSD Process...");
        
        //start console visible for user
        let params = [
            "-upload-dir",
            this.#uploadPath,
            "-port",
            this.port,
            "-hooks-http",
            "http://localhost:" + global.config.STATIC_WEBSERVER_LISTEN_PORT + "/tusd_callback",
            "-enable-experimental-protocol",
            "-host",
            "127.0.0.1",
            "-disable-download",

            "-base-path",
            "/tusd_proxy"
        ];
        console.log("Starting TUSD with params: ",this.binaryFull, params.join(" "));
        this.childProcess = spawn(this.binaryFull, params, {cwd: this.binaryPath});

        console.log("TUSD process pid",this.childProcess.pid);
        this.lastPid = this.childProcess.pid;
        this.isRunning = true;

        this.childProcess.stdout.on('data', this.onStdOut);
        this.childProcess.stderr.on('data', this.onStdErr);
        this.childProcess.on('error', this.onError);
        this.childProcess.on('exit', (code) => {this.internal_process_exit(code)});  //arrow syntax makes this work in called function
        return this.port;
    }

    internal_process_exit(code){
        console.error("TUSd process exited, code: ",code);
        //todo: restart?
        this.isRunning = false;
        this.childProcess = null;
        this.lastPid = -1;
        this.onExit(code);
    }
}

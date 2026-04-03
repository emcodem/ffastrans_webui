const os = require("os")
const path = require("path");
const fs = require("fs");
const fsextra = require('fs-extra');
const { spawn } = require("child_process");
const zlib = require('zlib');

class Mongod {

    constructor(dbpath) {
        this.#dbpath = dbpath;
        if (!dbpath) {
            throw new Error("You must pass dbpath paramter to Class constructor");
        }
        //callbacks - called by childprocess "on" events

    }

    //eventcallbacks can be overrided from outside
    onStdErr = function () { };
    onStdOut = function () { };
    onExit = function () { };
    onError = function () { };

    //public fields readonly
    isRunning = false;
    lastPid = -1;
    childProcess = null;
    binaryFull = false;

    //public fields read/write (change before calling start)
    binaryPath = path.join(os.tmpdir(), "ffastrans_webinterface");   //where mongod binary will be extracted to. Can be changed before calling start method

    port = 27017; //default, caller can override 
    configFilePath = null; //path to config file, if set this will be used instead of commandline parameters

    //private fields
    #dbpath = "";   //private field, initialized by start


    async stop() {
        if (this.childProcess) {
            this.childProcess.kill('SIGINT');
        }
    }


    /* starts the database process */
    async start() {

        //read file this.#dbpath/job_db/WiredTiger, check if it contains 10.0.2
        var wiredTigerFile = path.join(this.#dbpath, "WiredTiger");
        if (fs.existsSync(wiredTigerFile)) {
            var wiredTigerFileContent = fs.readFileSync(wiredTigerFile, "utf8");
            if (wiredTigerFileContent.includes("10.0.2")) {
                return 6;
            }
        }

        var existingDbBinary = false;
        if (fs.existsSync(path.join(this.#dbpath, "../", "mongod"))) {
            existingDbBinary = (path.join(this.#dbpath, "../", "mongod"));
        }
        if (fs.existsSync(path.join(this.#dbpath, "../", "mongod.exe"))) {
            existingDbBinary = (path.join(this.#dbpath, "../", "mongod.exe"));
        }

        if (existingDbBinary) {
            this.binaryFull = existingDbBinary;
            console.log("Using existing Database binary: ", existingDbBinary);
        }

        if (!this.binaryFull) {
            //create database binary
            console.log("Writing Database binary to: ", this.binaryPath);
            try {
                await fsextra.ensureDir(this.binaryPath);
                this.binaryFull = await dumpBinaryToDisk(this.binaryPath);
            } catch (ex) {
                console.error("Error writing database binaries:", ex);
                return;
            }
        }
        console.log("Starting Database Process...");
        if (!this.configFilePath)
            this.childProcess = spawn(this.binaryFull, ["--dbpath", this.#dbpath, "--port", this.port], { cwd: this.binaryPath });
        else {
            this.childProcess = spawn(this.binaryFull, ["--config", this.configFilePath], { cwd: path.join(global.approot, "database") });
            console.log("Using config file for database:", this.configFilePath);
        }
        //"mongod.exe --dbpath c:\webinterface\database\job_db\ --port 8010
        console.log("Database process pid", this.childProcess.pid);
        this.lastPid = this.childProcess.pid;
        this.isRunning = true;
        // listen for errors as they may prevent the exit event from firing

        this.childProcess.stdout.on('data', this.onStdOut);
        this.childProcess.stderr.on('data', this.onStdErr);
        this.childProcess.on('error', this.onError);
        this.childProcess.on('exit', (code) => { this.internal_process_exit(code) });  //arrow syntax makes this work in called function


    }

    internal_process_exit(code) {
        this.isRunning = false;
        this.childProcess = null;
        this.lastPid = -1;
        this.onExit(code);
    }
}

/* Writes binary from internally stored base64 to os temp path */
async function dumpBinaryToDisk(where) {

    var fullMongoPath = path.join(where, "mongod.exe");
    //todo: decide os here and deliver more choices of binaries with package
    var b64 = require("./bin/mongod_w64.js").getMongoBase64();

    let zipped_buff = Buffer.from(b64, 'base64');
    let buff = zlib.gunzipSync(zipped_buff);

    try {
        fs.writeFileSync(fullMongoPath, buff);
    } catch (ex) {
        if (!fs.existsSync(fullMongoPath)) {
            throw new Error(ex);
        } else {
            //maybe just another instance already running, try to go on
            console.warn("Could not write mongo exe, is there another instance of webinterface running?");
        }
    }

    var dependencies = require("./bin/mongod_w64.js").getDependenciesBase64();
    for (var i in dependencies) {
        //writes vcredist dll's and mongo exe to temp dir
        try {
            let buff = Buffer.from(dependencies[i].data, 'base64');
            let fullPath = path.join(where, dependencies[i].name);
            try {
                fs.writeFileSync(fullPath, buff);
            } catch (ex) {
                if (!fs.existsSync(fullPath)) {
                    throw new Error(ex);
                } else {
                    //maybe just another instance already running, try to go on
                    console.warn("Could not write dependency to disk but the file already exists, is there another instance of webinterface running?");
                }
            }
        } catch (ex) {
            console.log("Error writing database dependency to disk: " + dependencies[i].name, ex);
        }
    }

    return fullMongoPath;
}

module.exports = Mongod;
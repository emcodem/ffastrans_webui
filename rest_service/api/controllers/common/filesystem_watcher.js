let chokidar = require("chokidar");
let fs = require("fs");
let path = require("path");


class FilesystemWatcher {
    constructor(rootFolder) {
        this.rootFolder = rootFolder;
        this.cache = {};
        this.lastHeartbeat = Date.now();
        this.watcher = null;
		this.debounceTimeouts = {}; // Object to store timeouts for each file path
        this.debounceDelay = 2000;  // Time to wait until reading file in Change evt
		
        this.abortController = null;
		this.intervalsRunning = false;
		this.restartPending = false;
		this.lastPollingDuration = 0;
        
        this.HEARTBEAT_FILE = path.join(rootFolder, `.heartbeat_${global.MY_OWN_LISTEN_PORT}`);		
		this.HEARTBEAT_INTERVAL = 5000; // Interval to write the heartbeat file (ms)
		this.TIMEOUT_INTERVAL = 5000; // Time to wait before restarting if no events are detected (ms)		
        this.init();
    }

    cacheSize() {
        return Object.keys(this.cache).length;
    }

    getCachedContentAsArray() {
        return Object.values(this.cache);
    }

    async init() {
		
		await this.startWatcher();//stop signal, see nodejs fs.watch docs

		if (!this.intervalsRunning) {
			setInterval(this.writeHeartbeatFile.bind(this), this.HEARTBEAT_INTERVAL);
			setInterval(this.checkHeartbeat.bind(this), this.TIMEOUT_INTERVAL);
			this.intervalsRunning = true;
		}

    }

    async startWatcher() {
		console.log("Starting Watcher",this.rootFolder);
		//reset everything
		clearInterval(this.restartPending);
		this.restartPending = false;
		this.lastHeartbeat = Date.now();
		if (this.abortController)
			this.abortController.abort();
		this.abortController = new AbortController();
		const { signal } = this.abortController;
        // start fs.watch
		this.watcher = fs.promises.watch(this.rootFolder, { signal, recursive: false });
		// Load initial file list, this is automatically fallback polling in case watcher is being restarted forever
		await this.readAllFiles();
		
        (async () => {
            try {
                for await (const event of this.watcher) {
                    const filePath = path.join(this.rootFolder, event.filename);

                    if (event.eventType === "rename") {
                        const exists = await this.fileExists(filePath);
                        if (exists) {
                            this.onFileChange(filePath);
                        } else {
                            this.onFileRemove(filePath);
                        }
                    } else if (event.eventType === "change") {
                        this.onFileChange(filePath);
                    }
                }
            } catch (error) {
                if (error.name == "AbortError") 
                    return;
                setTimeout(this.restartWatcher.bind(this),5000
				,"fs.watch Error");
            }
        })();
    }

    async stopWatcher() {
        if (this.watcher) {
			console.log("Stopping watcher",this.rootFolder)
           this.abortController.abort();
        }
    }

    async restartWatcher(reason) {
		if (this.restartPending)
			return; //someone else already scheduled the restart
		console.warn("Scheduling Watcher restart, reason [",reason,"], timeout:",this.TIMEOUT_INTERVAL,this.rootFolder);
		this.restartPending = setTimeout(this.startWatcher.bind(this),this.TIMEOUT_INTERVAL);
    }

    async fileExists(filePath) {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async onFileChange(filePath) {
        if (filePath === this.HEARTBEAT_FILE) {
			//console.log("Heartbeat stable",this.rootFolder)
            this.lastHeartbeat = Date.now();
            return;
        }
		
        // Clear the existing debounce for this specific filePath (if any)
        if (this.debounceTimeouts[filePath]) {
            clearTimeout(this.debounceTimeouts[filePath]);
        }
		
		// we dont read the file immediately, maybe we get multiple updates in short time
        this.debounceTimeouts[filePath] = setTimeout(async () => {
            try {
                const stats = await fs.promises.stat(filePath);
                if (stats.isFile() && filePath.endsWith(".json")) {
                    await this.updateCache(filePath);
                }
            } catch (error) {
                console.error(`Error processing file change for: ${filePath}`, error);
            } finally {
                delete this.debounceTimeouts[filePath];
            }
        }, this.debounceDelay);

    }

    async onFileRemove(filePath) {
        delete this.cache[filePath];
        console.log(`Cache entry removed for file: ${filePath}`);
    }

    async readAllFiles() {
		const startTime = Date.now();
		this.cache = {};
        try {
            const files = await fs.promises.readdir(this.rootFolder);
            for (const file of files) {
                const filePath = path.join(this.rootFolder, file);
                try {
                    if (filePath.endsWith(".json")) {
                        await this.updateCache(filePath);
                    }
                } catch (error) {
                    console.error(`Error reading file: ${filePath}`, error);
                }
            }
			const endTime = Date.now();
			this.lastPollingDuration = endTime-startTime || 10000; //just in case
			console.log("Last Polling duration",this.lastPollingDuration,this.rootFolder);
        } catch (error) {
            console.error("Error readAllFiles",this.rootFolder, error.message);
        }finally{
			
		}
    }

    async updateCache(filePath) {
        try {
            const data = await fs.promises.readFile(filePath, "utf8");
            const parsedData = JSON.parse(data.replace(/^\uFEFF/, ""));
            this.cache[filePath] = parsedData;
            console.log(`Cache updated for file: ${filePath}`);
        } catch (error) {
            console.error(`Error updating cache for file: ${filePath}`, error);
        }
    }

    async writeHeartbeatFile() {
		if (this.restartPending)
			return;
        try {
            const timestamp = `Heartbeat: ${Date.now()}`;
            await fs.promises.writeFile(this.HEARTBEAT_FILE, timestamp);
            //console.log("[Heartbeat] Written to", this.HEARTBEAT_FILE);
        } catch (error) {
			if (! (this.restartPending))
				console.error("Error writing heartbeat file", error.message);
        }
    }

    async checkHeartbeat() {
		if (this.restartPending)
			return;
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;
        if (timeSinceLastHeartbeat > this.HEARTBEAT_INTERVAL*2) {
            await this.restartWatcher("heartbeat");
        }
    }
}

module.exports = FilesystemWatcher;

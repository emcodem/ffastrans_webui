const portfinder = require("portfinder");
const dgram = require('node:dgram');
const { spawn,execSync } = require('child_process');
const ffprobeApi = require("ffprobe");
const path = require("path");

class Player
{
    constructor()
    {
		this.port = 8000;
		this.playerProcess = null;
		this.selectedAudioTrack = 0;
		this.websocket = null;
		this.config = null;
		this.mpvexe = "C:\\dev\\mpv-installer-messed\\mpv.exe",
		this.mpv = null;
    }
	
	async initiate(_websocket,_config){ //initobj has field file
		this.websocket 	= _websocket;
		this.config 	= _config;
		let playerInstance = this;
		console.log("PLAYER INITATE", playerInstance.config);
		//get free udp localhost port for this instance
		try{
			
			playerInstance.execFfprobe(playerInstance.config)
			let udpServer = await playerInstance.startUdpServer();
			playerInstance.port = udpServer.address().port;
			console.log("Current Players port:",playerInstance.port)
			//pipe player data to websocket
			udpServer.on("message", function (msg, rinfo) {
			  //console.log("udpServer got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
			  playerInstance.websocket.emit("binarydata",msg)
			});
			udpServer.on('close', (err) => {
			  console.log("udpServer closed")
			});
			
			//no need to wait for mpv to return ;-)
			playerInstance.startmpv(_config.file,playerInstance.port)

			//user closed player?
			playerInstance.websocket.on('disconnect', function(){
				playerInstance.mpv.kill();
				udpServer.close();
				console.log("PLAYER DISCONNECT");
			});

		}catch(ex){
			let msg = "Could not get free player slot, most likely too many players are open on the server. Contact System Administrator. Error Message: " + ex.message;
			console.error(ex)
			playerInstance.websocket.emit("playererror", msg)
			return;
		}
		
		try{
			await playerInstance.startPlay(playerInstance.websocket,playerInstance.config); //throws!
			console.log("Player initiate success.")
		}catch(e){
			console.error(e);
			playerInstance.websocket.emit("playererror",e.message);
			return;
		}
		
	}

	async startPlay(){
		let playerInstance = this;

	}
	
	async execFfprobe(config){
		let playerInstance = this;
		try{
			const ffprobeexe = path.join(global.approot,"tools","ffmpeg","ffprobe.exe");
			var ffprobe = await ffprobeApi(config.file, { path: ffprobeexe });
			playerInstance.websocket.emit("ffprobe",ffprobe);
		}catch(ex){
			console.error(ex);
			throw new Error("Could not analyze the file, is it a valid media file? Path was: " + config.file);
		}
		var probe_streams = ffprobe["streams"];
		if (!probe_streams){
			var msg = "No streams/tracks found in this file, is it a media file? Path was: " + config.file;
			console.error(msg);
			playerInstance.websocket.emit("playererror",e.message);
		}
	}

	async startUdpServer(){
		/*just start and return the UDP listener*/
		return new Promise(function(resolve,reject){
			var srv = dgram.createSocket("udp4");
			// srv.on("message", function (msg, rinfo) {
			// console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
			// });

			srv.on("listening", function (){
				const address = srv.address();
				console.log(`server listening ${address.address}:${address.port}`);
				resolve(srv); //return server
			});
			srv.on('error', (err) => {
				reject(`udp server error:\n${err.stack}`);
				srv.close();
			});

			srv.bind(0,"127.0.0.1");//gets a random port
		})
	}

	async startmpv(sourceUrl,udpPort){
		//C:\dev\mpv-installer-messed\mpv.com  --profile=myencprofile --o=udp://127.0.0.1:12345 C:\temp\fjolla.mp4 --demuxer-seekable-cache=yes --cache=yes --demuxer-max-back-bytes=10000M --hr-seek=yes --demuxer-cache-wait=yes
		let playerInstance = this;
		let opts = [	
				"--profile=myencprofile", 
				"--demuxer-seekable-cache=yes",
				"--cache=yes",
				"--o=udp://127.0.0.1:" + udpPort,	//prevent downmix all channels
				"--demuxer-max-back-bytes=10000M",
				"--hr-seek=yes",
				"--demuxer-cache-wait=yes",
				sourceUrl,
			]

			console.log("Opts: [" +playerInstance.mpvexe, opts.join(' ') + "]");
			playerInstance.mpv = spawn(playerInstance.mpvexe, opts,{windowsHide: true,detached: true }); 
			playerInstance.mpv.stderr.on('data', data => {
				//console.log(`${data}`);
			});

			playerInstance.mpv.on('exit', returncode => { 
				console.log ("mpv end: ",udpPort,returncode  )
				if (returncode != "0"){
					console.log("mpv failed code: ",udpPort,returncode)
				}

			});

		}
} //class

module.exports = {
    Player,
};

const portfinder = require("portfinder");
const dgram = require('node:dgram');
const { spawn,execSync } = require('child_process');
const ffprobeApi = require("ffprobe");
const path = require("path");
const mpvAPI = require('node-mpv');
const fs = require("fs")

class Player
{
    constructor()
    {
		this.port = 8000;
		this.playerProcess = null;
		this.selectedAudioTrack = 0;
		this.websocket = null;
		this.config = null;
		this.mpvexe = path.join(global.approot,"tools","mpv","mpv.exe");
		this.mpv = null;
		this.senderInterval = null;
		this.outCounter = 0;
		this.arewrap = 0;
		this.vrewrap = 0;
		this.lastPlayerProps ={};
		this.lastPlayerCommand = "play"
    }
	
	async initiate(_websocket,_config){ //initobj has field file

		this.websocket 	= _websocket;
		this.config 	= _config;
		let playerInstance = this;
		console.log("PLAYER INITATE", playerInstance.config);
		//get free udp localhost port for this instance
		try{
			
			let ffprobe = await playerInstance.execFfprobe(playerInstance.config)
			playerInstance.config.ffprobe = ffprobe;
			let udpServer = await playerInstance.startUdpServer()
			playerInstance.port = udpServer.address().port;
			udpServer.close()
			let mpvExtraOpts = []
			// try{
			// 	var vstreams = ffprobe.streams.filter(s => s.height)
			// 	var _framerate = eval(vstreams[0].r_frame_rate)
			// 	if (_framerate > 30)
			// 		mpvExtraOpts.push("--vf-add=fps="+_framerate/2 + ":round=near")

			// }catch(ex){}

			playerInstance.mpv = await this.startmpv(playerInstance.config,playerInstance.port,mpvExtraOpts)
			
			console.log("Current Players port:",playerInstance.port)
			// var udpbuffer =  Buffer.concat([])
			// playerInstance.senderInterval = setInterval(function(){
			// 	//collect some udp data and only send out every x ms
			// 	if (udpbuffer.byteLength != 0){
			// 		playerInstance.websocket.emit("videodata",udpbuffer)
			// 		udpbuffer = Buffer.concat([])
			// 	}
			// },44)

			//pipe player data to websocket
			udpServer.on("message", function (msg, rinfo) {
			  //console.log("udpServer got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
			  playerInstance.websocket.emit("videodata",msg)
			  //udpbuffer = Buffer.concat([udpbuffer,msg]);
			})

			udpServer.on('close', (err) => {
			  console.log("udpServer closed");
			  
			})
			
			playerInstance.websocket.on('disconnect', function(){
				//user closed player, important to clean up resources
				clearInterval(playerInstance.senderInterval)
				//playerInstance.mpv.quit();
				playerInstance.mpv.kill();
				udpServer.close();
				console.log("PLAYER DISCONNECT");
			})

			playerInstance.websocket.on('player', async function(data){
				//user initiated commands
				data = JSON.parse(data)
				playerInstance.playerCommand(data)
			})

		}catch(ex){
			let msg = "Could not get free player slot, most likely too many players are open on the server. Contact System Administrator. Error Message: " + ex.message;
			console.error(ex)
			playerInstance.websocket.emit("playererror", msg)
			return;
		}
		
		// try{
		// 	//await playerInstance.startPlay(playerInstance.websocket,playerInstance.config); //throws!
		// 	console.log("Player initiate success.")
		// }catch(e){
		// 	console.error(e);
		// 	playerInstance.websocket.emit("playererror",e.message);
		// 	return;
		// }
		
	}

	async checkForPlayDirChange(newDir){
		let playerInstance = this;
		if (playerInstance.lastPlayerProps["play-direction"] != newDir){
			//clears the cache to avoid overflow
			playerInstance.mpv.setProperty ("cache", "no")
			playerInstance.mpv.setProperty ("cache", "yes")
		}
	}

	async playerCommand(data){

		let playerInstance = this;
		this.lastPlayerCommand = data;

		if (data.command == "forceplay"){
			playerInstance.checkForPlayDirChange("forward")
			playerInstance.mpv.setProperty ("speed", 1)
			playerInstance.mpv.setProperty ("play-direction", "+")
			playerInstance.mpv.play()
		}
		if (data.command == "forcepause"){
			playerInstance.mpv.setProperty ("speed", 1)
			playerInstance.mpv.pause()
		}
		if (data.command == "play"){
			playerInstance.checkForPlayDirChange("forward")
			playerInstance.mpv.setProperty ("speed", 1)
			playerInstance.mpv.setProperty ("play-direction", "+")
			playerInstance.mpv.togglePause()
		}
		if (data.command == "seek"){
			playerInstance.mpv.goToPosition (data.val)
		}
		if (data.command == "fastbackward"){
			playerInstance.checkForPlayDirChange("backward")
			//--speed=<0.01-100>
			playerInstance.mpv.play()
			playerInstance.mpv.setProperty ("play-direction", "-")
			playerInstance.mpv.setProperty ("speed", data.val)
		}
		if (data.command == "fastforward"){
			playerInstance.checkForPlayDirChange("forward")
			playerInstance.mpv.play()
			playerInstance.mpv.setProperty ("play-direction", "+")
			playerInstance.mpv.setProperty ("speed", data.val)
		}
		if (data.command == "frameStepBack"){
			playerInstance.mpv.setProperty ("speed", 1)
			playerInstance.checkForPlayDirChange("backward")
			playerInstance.mpv.setProperty ("play-direction", "-")
			playerInstance.mpv.pause()
			playerInstance.mpv.command("frame-step")
		}
		if (data.command == "frameStepForward"){
			playerInstance.mpv.setProperty ("speed", 1)
			playerInstance.checkForPlayDirChange("forward")
			playerInstance.mpv.setProperty ("play-direction", "+")
			playerInstance.mpv.pause()
			playerInstance.mpv.command("frame-step")
		}
		if (data.command == "aid"){
			//apply-profile to non transcode output, and back again
			
			// playerInstance.mpv.setProperty ("watch-later-dir", "c:\\temp\\watch")
			// playerInstance.mpv.setProperty ("watch-later-options-add", "aid",data.val)
			// playerInstance.mpv.setProperty ("write-filename-in-watch-later-config","yes")
			// playerInstance.mpv.command ("write-watch-later-config")
			//playerInstance.mpv.command ("quit-watch-later");
			
			await playerInstance.mpv.kill()
			//playerInstance.mpv.command ("quit")

			playerInstance.mpv = await playerInstance.startmpv(
				playerInstance.config,
				playerInstance.port,
				false,
				playerInstance.lastPlayerProps["time-pos"],
				data.val
			)
			

			// write-watch-later-config
			// delete-watch-later-config
			// 
			// watch-later-options
			// -- (aid)

			//playerInstance.mpv.setProperty("apply-profile","ffasAudProfile")
			//playerInstance.mpv.setProperty ("aid", data.val)
			//playerInstance.mpv.command("frame-step")
		}
	}

	appendAudioBars(){
		let playerInstance = this;

	}

	getAudioVuFilterString(aid_pad_prefix = "aid",audio_track = 1){
		var audio_filters = "";
		let playerInstance = this;
		try{
			//add audio VU meters on the right
			var atracks = playerInstance.config.ffprobe.streams.filter(s => s.codec_type=="audio")
			var audio_bars = []
			for (let aid=1;aid<atracks.length+1;aid++){
				var bar_width = atracks[aid-1].channels * 40
				var vwidth = 1920;
				var vheight = 1080;
				var current_bar_filter = ""
				//for the selected track, we need to create the ao pad for mpv to play
				if (aid.toString().indexOf(audio_track) != -1)
					current_bar_filter = '['+aid_pad_prefix+aid+']asplit[a'+aid+'][ao],'
				else
					current_bar_filter = '['+aid_pad_prefix+aid+']acopy[a'+aid+'],'

				current_bar_filter += '[a'+aid+']showvolume=r=25:c=0xAA00FF00:t=0:o=v:m=r:ds=log:f=0:s=4:w='+vheight+':h=20:b=5:dm=1[va],[va]pad=iw+6:ih:-1:-1:[va],[withaudiobars][va]hstack[withaudiobars]'

				audio_bars.push(current_bar_filter)
			}
			audio_filters = audio_bars.join(",")
			return audio_filters
		}catch(ex){
			
		}
	}

	async startmpv(config,port,extraopts = [],seekToSec = false,audio_track = 1){
		let playerInstance = this;
		let mpvopts = [
			"--log-file=mpvoutput.log",
			"--o=-",//+ playerInstance.port ,	//prevent downmix all channels
			]
			if (extraopts)
				mpvopts.push(...extraopts)
			var vtracks = playerInstance.config.ffprobe.streams.filter(s => s.height)
			if (vtracks.length != 0){
				//VIDEO only or VIDEO+AUDIO
				//it is a video, link the corresponding mpv conf section
				mpvopts.push(
					"--profile=ffasVidProfile", 
				)

				var final_filter = "[vid1]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:color=2D3039[withaudiobars]"

				var audio_filters = playerInstance.getAudioVuFilterString("aid",audio_track)
				if (audio_filters)
					final_filter += "," + audio_filters

				final_filter += ",[withaudiobars]copy[vo]" //mpv looks for vo pad
	
				mpvopts.push("--lavfi-complex=" + final_filter)

			}else if (JSON.stringify(playerInstance.config.ffprobe).indexOf('audio') != -1){
				//AUDIO ONLY
				mpvopts.push(
					"--profile=ffasVidProfile", 
				)
				//attach Audio VU Bars on right side of video
				
				var final_filter = "[aid1]asplit[copy0][copy1],[copy0]avectorscope=draw=line:s=1920x1080[withaudiobars]"
				var audio_filters = playerInstance.getAudioVuFilterString("copy",audio_track)
				 if (audio_filters)
				 	final_filter += "," + audio_filters

				

				final_filter += ",[withaudiobars]copy[vo]" //mpv looks for vo pad	
				mpvopts.push("--lavfi-complex=" + final_filter)

			}else{
				playerInstance.websocket.emit("playererror","No Video or Audio");
				return;
			}
			
			
			console.log("Starting MPV with opts ", mpvopts)
			const mpv = new mpvAPI({
				"binary": playerInstance.mpvexe, 
				debug:false,
				"socket": "\\\\.\\pipe\\mpv_" + port, // Windows
				//"ipcCommand": "--input-ipc-server.",   
			},mpvopts);

			mpv.unobserveProperty("filename")
			mpv.observeProperty("time-pos")
			mpv.observeProperty("speed")
			mpv.observeProperty("play-direction")
			mpv.observeProperty("eof-reached")
			mpv.observeProperty("demux-fps")
			mpv.observeProperty("play-direction")
			mpv.observeProperty("video-out-params")

			mpv.on('mpvProcessStarted', function() {
				mpv.mpvPlayer.stdout.on('data', async function(data) {
					//Here is where the output goes
					playerInstance.websocket.emit("videodata",data)
				});
				mpv.mpvPlayer.stderr.on('data', async function(data) {
					//workaround mpv cache buffer overflow in backward play/fast mode
					if (data.toString().indexOf("Backward playback is likely stuck/broken now") != -1){
						console.log("mpv backward play cache overflow, initiating workaround")
						playerInstance.checkForPlayDirChange("forward")
						playerInstance.mpv.setProperty ("play-direction", "forward")
						playerInstance.mpv.pause()
						playerInstance.playerCommand(playerInstance.lastPlayerCommand)

					}
					//console.log("mpv stderr: ",data.toString())
				});
			});

			mpv.on('stopped', function() {
				console.log("mpv stopped");
							
			});

			mpv.on('started', async function() {
				//add half fps filter when fps > 50
				console.log("started")
				var mpv_streams = await mpv.getProperty("track-list");
				var video_stream = mpv_streams.filter(str => str.type=="video");

				//if framerate is > 30, do vf-add=fps=30:round=near
				if (seekToSec){
					console.log("MPV Started, seeking to ", seekToSec)
					mpv.goToPosition (seekToSec) 
					seekToSec = false;
				}
							
			});


			let firstPropchange = false;
			//vf-add=fps=30:round=near
			mpv.on('statuschange', async function(what) {
					if (!firstPropchange){
					//only after first message load the file
					await mpv.load(config.file, "replace");
					mpv.setProperty ("keep-open", "always"); //!! if we dont do this, end will jump to start, even if this is set in conf
					firstPropchange= true;

				}
				if (what["time-pos"]){
					playerInstance.lastPlayerProps = what
				}
				playerInstance.websocket.emit("property-change",what)	
			});	
			


			return mpv;	
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
		return ffprobe
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
				srv.close();x
			});

			srv.bind(0,"127.0.0.1");//gets a random port
		})
	}

	async startFFRewrap(port,is_audio = false){

		var ffmpegexe = path.join(global.approot,"tools","ffmpeg","ffmpeg.exe");
		let playerInstance = this;
		let myconfig = {is_audio:is_audio}
		var args = 	[	
			"-re",
			"-reuse","1",
			"-i","udp://127.0.0.1:"+port,
			"-ar","48000",
			"-codec",(is_audio ? "copy" : "copy"),
			"-map","0",
			//"-map","0:" + (is_audio ? "a" : "v"),
			
			"-f",(is_audio ? "mpegts" : "mpegts"),
			"-"
		]
		//check if there is video
		// probe_streams.forEach(function(str){
		// 	if (str["codec_type"] == "video"){
		// 		selected_args = standard_args;
		// 	}
		// });

		let ffrewrap = spawn(ffmpegexe, args); 
		if (is_audio)
			playerInstance.arewrap = this.ffrewrap
		else
			playerInstance.vrewrap = this.ffrewrap
		ffrewrap.stdout.on('data', data => {
			if (myconfig.is_audio){
				playerInstance.websocket.emit("audiodata",data)
				fs.appendFile("c:\\temp\\raw.bin", data,  "binary",function(err) { });
			}else{
				playerInstance.websocket.emit("videodata",data)
			}
		});

		ffrewrap.stderr.on('data', data => {
			console.log(`${data}`);
		});

		ffrewrap.on('exit', returncode => { 
			console.log ("ffmpeg rewrapper end, returncode: "+returncode  )
			if (returncode != "0"){
				console.log("ffmpeg failed, return code: ",returncode)
			}
		});

		/* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
		ffrewrap.on('error', data => {
		  socket.emit("playererror","Error spawning ffmpeg on webinterface server, check if ffmpeg is in the PATH");
		});

		
	}
	// async startmpv(sourceUrl,udpPort){
	// 	//C:\dev\mpv-installer-messed\mpv.com  --profile=myencprofile --o=udp://127.0.0.1:12345 C:\temp\fjolla.mp4 --demuxer-seekable-cache=yes --cache=yes --demuxer-max-back-bytes=10000M --hr-seek=yes --demuxer-cache-wait=yes
	// 	let playerInstance = this;
	// 	let opts = [	
	// 			"--profile=myencprofile", 
	// 			"--demuxer-seekable-cache=yes",
	// 			"--cache=yes",
	// 			"--o=udp://127.0.0.1:" + udpPort,	//prevent downmix all channels
	// 			"--demuxer-max-back-bytes=10000M",
	// 			"--hr-seek=yes",
	// 			"--demuxer-cache-wait=yes",
	// 			sourceUrl,
	// 		]

	// 		console.log("Opts: [" +playerInstance.mpvexe, opts.join(' ') + "]");
	// 		playerInstance.mpv = spawn(playerInstance.mpvexe, opts,{windowsHide: true,detached: true }); 
	// 		playerInstance.mpv.stderr.on('data', data => {
	// 			//console.log(`${data}`);
	// 		});

	// 		playerInstance.mpv.on('exit', returncode => { 
	// 			console.log ("mpv end: ",udpPort,returncode  )
	// 			if (returncode != "0"){
	// 				console.log("mpv failed code: ",udpPort,returncode)
	// 			}

	// 		});

	// 	}
} //class

module.exports = {
    Player,
};

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
		this.selected_channels = [0,1];
		this.websocket = null;
		this.config = {"file":"",analyzeTools:{audioVu:true, wfm:false}};
		this.mpvexe = path.join(global.approot,"tools","mpv","mpv.exe");
		this.mpv = null;
		this.senderInterval = null;
		this.outCounter = 0;
		this.arewrap = 0;
		this.vrewrap = 0;
		this.lastPlayerProps ={};
		this.lastPlayerCommand = "play";
    }
	
	async initiate(_websocket,_config){ //_config has field file
		//called from server.js on "player" socket event
		
		let playerInstance = this;
		playerInstance.websocket 		   = _websocket;
		playerInstance.config.file 		   = _config.file;
		if (playerInstance.config.analyzeTools){
			playerInstance.config.analyzeTools.audioVu 	= _config.analyzeTools.audioVu;
			playerInstance.config.analyzeTools.wfm 		= _config.analyzeTools.wfm;
		}

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

			playerInstance.mpv = await playerInstance.startmpv(playerInstance.config,playerInstance.port,mpvExtraOpts)
			
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

			
			playerInstance.websocket.on('disconnect', function(){
				//user closed player, important to clean up resources
				clearInterval(playerInstance.senderInterval)
				//playerInstance.mpv.quit();
				playerInstance.mpv.kill();
				
				console.log("Player disconnected, kill executed");
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
			//if (!this.lastPlayerProps.seeking) //this causes output frames to not update
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
		if (data.command == "setAudioTrackArray"){
			playerInstance.selected_channels = data.val;
			playerInstance.restartPlayerAtCurrentPos();
		}

		if (data.command == "addAnalyzeTool"){
			if (data.val == "audioVu"){
				playerInstance.config.analyzeTools.audioVu = true;
			}
			if (data.val == "wfm"){
				playerInstance.config.analyzeTools.wfm = true;
			}
			playerInstance.restartPlayerAtCurrentPos();
		}
		
		if (data.command == "removeAnalyzeTool"){
			if (data.val == "audioVu"){
				playerInstance.config.analyzeTools.audioVu = false;
			}
			if (data.val == "wfm"){
				playerInstance.config.analyzeTools.wfm = false;
			}
			playerInstance.restartPlayerAtCurrentPos();
		}
	}

	async restartPlayerAtCurrentPos(){
		let playerInstance = this;
		await playerInstance.mpv.kill()
			
		playerInstance.mpv = await playerInstance.startmpv(
			playerInstance.config,
			playerInstance.port,
			false,
			playerInstance.lastPlayerProps["time-pos"]
		)
	}

	appendAudioBars(){
		let playerInstance = this;

	}


	getAudioVuFilterString(aid_pad_prefix = "aid",audio_channels = [1]){
		//creates video pad [withaudiobars] which needs to be mapped by the caller to "vo" for mpv
		//if there is audio, lines up all channels of all tracks, creates audio visual and VU meters as well as a track with selected audio channels, creating an [ao] pad for mpv

		console.log("Selected Audio Channels",audio_channels)
		let playerInstance = this;
		var vheight = 1080; //todo: make flexible
		var vwidth = 1920; //todo: make flexible
		try{
			//add audio VU meters on the right
			var atracks = playerInstance.config.ffprobe.streams.filter(s => s.codec_type=="audio")
			var achannels = atracks.map(t=>t.channels);
			var vtracks = playerInstance.config.ffprobe.streams.filter(s => s.height)

			if (atracks.length == 0){
				//VID ONLY
				return "[vid_right_border]copy[withaudiobars]" //just create withaudiobars label
			}

			//merge all channels from all track into one
			let f_allChannelsInOneTrack = ""
			var a_filters = [];
			
			//SECTION: merge all channels of all tracks: [aid1][aid2][aid3]amerge=inputs=3[all]
			if (atracks.length != 0){
				for (let aid=1;aid<atracks.length+1;aid++){
					f_allChannelsInOneTrack += '['+aid_pad_prefix+aid+']'
				}
				f_allChannelsInOneTrack += "amerge=inputs=" + atracks.length + "[all]"
				a_filters.push(f_allChannelsInOneTrack)
				//we got all channels of all tracks now in [all]

				//push selected audio channels to pan filter, creating the final output for mpv [pc_audio]
				let f_selected_channels = '[all]asplit[all_copy][all],[all_copy]pan=stereo';
				if (!playerInstance.config.analyzeTools.audioVu){
					//we dont need the [all] label in case of non audio VU display
					f_selected_channels = '[all]pan=stereo';
				}


				if (audio_channels.length != 0){
					var left = 	[]//"|c0="
					var right = []//"|c1="
					for (let c =0; c<audio_channels.length;c+=1){ //odd channels go left, even go right ear
						if (audio_channels[c] %2 != 0){
							right.push	("c"+ (audio_channels[c])) //mpv channel numbers start at 1, ffmpeg at 0
						}else{
							left.push	("c"+ (audio_channels[c])) //mpv channel numbers start at 1, ffmpeg at 0
						}
					}
					
					//as we only output stereo, we sum up left and right channels for final display
					if (left.length != 0){
						f_selected_channels += "|c0="+left.join("+")
					}
					if (right.length != 0){
						f_selected_channels += "|c1="+right.join("+")
					}
					
				}else{
					//fallback, no selected audio channels then just play c1
					console.error("ERROR, NO AUDIO CHANNELS SELECTED; CHECK YOUR CODE")
					f_selected_channels += "|c0=c0"
				}
				f_selected_channels += "[pc_audio]" //output pad of selected channels
				a_filters.push(f_selected_channels)
			}
			
			//NO VIDEO create audio visualisation
			if (vtracks.length == 0){
				a_filters.push("[pc_audio]asplit[pc_audio][vectorscopeaudio]")
				var visual = "[vectorscopeaudio]avectorscope=draw=line:s=1920x1080[vid_right_border]"
				a_filters.push(visual)
			}

			//is WFM filter active?
			if (vtracks.length != 0 && playerInstance.config.analyzeTools.wfm){
				a_filters.push("[vid_right_border]split[voriginal][vwfm]")
				a_filters.push("[vwfm]waveform=filter=lowpass:scale=digital:graticule=green:mirror=1:intensity=0.9,scale="+vwidth+":"+512+"[vwfm]")
				a_filters.push("[voriginal][vwfm]vstack,scale="+vwidth+":"+vheight+"[vid_right_border]")
			}

			//AUDIO ONLY AND VIDEO WITH AUDIO, 
			if (atracks.length != 0 && playerInstance.config.analyzeTools.audioVu){
				//audio analyzer active, build VU display
				var f_show_volume = '[all]showvolume=r=25:c=0xAA00FF00:t=0:o=v:m=r:ds=log:f=0:s=4:w='+vheight+':h=20:b=5:dm=1[vid_showvolume],[vid_right_border][vid_showvolume]hstack[withaudiobars]'
				a_filters.push(f_show_volume);
				a_filters.push("[pc_audio]asetpts=PTS-0.24/TB[ao]") //final audio output for mpv Audio delay by ~200msec, hopefully compensating the delay mpv has currently
			}else{
				//just foward video unmodified
				a_filters.push ("[vid_right_border]copy[withaudiobars]");
				a_filters.push("[pc_audio]asetpts=PTS-0.24/TB[ao]"); //final audio output for mpv Audio delay by ~200msec, hopefully compensating the delay mpv has currently
				
			}

			return a_filters.join(",")

		}catch(ex){
			var stop = 1
		}
	}

	

	async startmpv(config,port,extraopts = [],seekToSec = false){
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
				
				var vwidth  = 1920;
				var vheight = 1080;

				var final_filter = "[vid1]sidedata=delete,metadata=delete,yadif=deint=1,scale="+vwidth+":"+vheight+",pad="+vwidth+":"+vheight+":-1:-1:color=2D3039[vid_right_border]" //scale=1920:1080:force_original_aspect_ratio=decrease
				var audio_filters = playerInstance.getAudioVuFilterString("aid",playerInstance.selected_channels)
				
				if (audio_filters)
					final_filter += "," + audio_filters
				
				final_filter += ",[withaudiobars]copy[vo]" //mpv looks for vo pad
				mpvopts.push("--lavfi-complex=" + final_filter)

			}else if (JSON.stringify(playerInstance.config.ffprobe).indexOf('audio') != -1){
				//AUDIO ONLY
				mpvopts.push(
					"--profile=ffasVidProfile", 
				)
				var final_filter = playerInstance.getAudioVuFilterString("aid",playerInstance.selected_channels)
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
			mpv.observeProperty("seeking")
			mpv.observeProperty("play-direction")
			mpv.observeProperty("video-out-params")
			mpv.observeProperty("demuxer-lavf-list")

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

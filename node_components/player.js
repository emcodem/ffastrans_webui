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
		this.config = {"file":"",analyzeTools:{audioVu:true, wfm:false, vec:true}};
		this.mpvexe = path.join(global.approot,"tools","mpv","mpv.exe");
		this.mpv = null;
		this.senderInterval = null;
		this.outCounter = 0;
		this.arewrap = 0;
		this.vrewrap = 0;
		this.lastPlayerProps ={};
		this.lastPlayerCommand = "play";
		this.outputWidth = 1920;
		this.outputHeight = 1080;
		

    }
	
	async initiate(_websocket,_config){ //_config has field file
		//called from server.js on "player" socket event
		
		let playerInstance = this;
		playerInstance.websocket 		   = _websocket;
		playerInstance.config.file 		   = _config.file;
		if (playerInstance.config.analyzeTools){
			playerInstance.config.analyzeTools.audioVu 	= _config.analyzeTools.audioVu;
			playerInstance.config.analyzeTools.wfm 		= _config.analyzeTools.wfm;
			playerInstance.config.analyzeTools.vec 		= _config.analyzeTools.vec;
		}
		if (_config.outputWidth)
			playerInstance.outputWidth = _config.outputWidth;
		if (_config.outputHeight)
			playerInstance.outputWidth = _config.outputHeight;
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
		if (data.command == "setQuality"){
			var new_w = JSON.parse(data.val).width;
			var new_h = JSON.parse(data.val).height;
			playerInstance.outputWidth = new_w;
			playerInstance.outputHeight = new_h;
			playerInstance.restartPlayerAtCurrentPos();
		}
		if (data.command == "addAnalyzeTool"){
			if (data.val == "audioVu"){
				playerInstance.config.analyzeTools.audioVu = true;
			}
			if (data.val == "wfm"){
				playerInstance.config.analyzeTools.wfm = true;
			}
			if (data.val == "vec"){
				playerInstance.config.analyzeTools.vec = true;
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
			if (data.val == "vec"){
				playerInstance.config.analyzeTools.vec = false;
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

		try{
			//add audio VU meters on the right
			var atracks = playerInstance.config.ffprobe.streams.filter(s => s.codec_type=="audio")
			var achannels = atracks.map(t=>t.channels);
			var vtracks = playerInstance.config.ffprobe.streams.filter(s => s.height)

			// if (atracks.length == 0){
			// 	//VID ONLY
			// 	return "[vid_right_border]copy[withaudiobars]" //just create withaudiobars label
			// }

			//merge all channels from all track into one
			let f_allChannelsInOneTrack = ""
			var a_filters = [];
			
			//we always produce video,  
			if (vtracks.length != 0){
				a_filters.push("[vid1]sidedata=delete,metadata=delete,yadif=deint=1,scale="+playerInstance.outputWidth+":"+playerInstance.outputHeight+",pad="+playerInstance.outputWidth+":"+playerInstance.outputHeight+":-1:-1:color=2D3039[vid_right_border]"); //scale=1920:1080:force_original_aspect_ratio=decrease
			}

			//is WFM filter active?
			if (vtracks.length != 0 && playerInstance.config.analyzeTools.wfm){
				var original_pix_fmt = vtracks[0].pix_fmt;
				let oneQuater = playerInstance.outputHeight / 3;
				let wfmHeight =  16.0*Math.ceil(oneQuater/16.0)
				a_filters.push("[vid_right_border]split[vid_right_border][vwfm]")
				let force_pix_fmt_workaround = "copy"; //
				if (original_pix_fmt.indexOf("10")!=-1){
					//there is a bug in ffmpeg scale filter for 10bit sources in combination with scale and waveform. need to insert format filter to correct it (otherwise green or shattered graphics)
					force_pix_fmt_workaround = "format="+original_pix_fmt; //
				}
				a_filters.push("[vwfm]"+force_pix_fmt_workaround+"[vwfm]");
				a_filters.push("[vwfm]waveform=filter=lowpass:envelope=instant:d=parade:scale=digital:graticule=green:mirror=1:intensity=0.9[vwfm]");//scale="+playerInstance.outputWidth+":"+wfmHeight+":sws_flags=bicublin
				//a_filters.push("[voriginal][vwfm]vstack,scale="+playerInstance.outputWidth+":"+playerInstance.outputHeight+"[vid_right_border]");
			}
			
			//is vectorscope filter active?
			if (vtracks.length != 0 && playerInstance.config.analyzeTools.vec){
				//workaround ffmpeg bug: format=yuv444p, otherwise it will just fail with error "could not select any format", no matter what format the original was
				a_filters.push("[vid_right_border]split[vid_right_border][vectorscope],[vectorscope]format=yuv444p,vectorscope=x=1:y=2:i=0.5:g=green:m=color3,scale="+playerInstance.outputHeight+":"+playerInstance.outputHeight+",setsar=1[vectorscope]");
				//if wfm is active, need to resize original+wfm horitzontal half

				
				//a_filters.push("[vectorscope][vid_right_border]hstack[vid_right_border]");
			}

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
				
				//Audio only? - create audio visualisation
				if (vtracks.length == 0){
					a_filters.push("[pc_audio]asplit[pc_audio][vectorscopeaudio]")
					let visual = "[vectorscopeaudio]avectorscope=mode=polar:draw=line:s="+playerInstance.outputWidth+"x"+playerInstance.outputHeight+"[vid_right_border]"
					//let visual = "[vectorscopeaudio]ebur128=video=1:size="+playerInstance.outputWidth+"x"+playerInstance.outputHeight+"[vid_right_border]"
					
					a_filters.push(visual)
				}


				//is Audio VU analyzer active?
				if (atracks.length != 0 && playerInstance.config.analyzeTools.audioVu){
					//audio analyzer active, build VU display
					let showvolume_framerate = 1;
					if (vtracks.length != 0)
						showvolume_framerate = vtracks[0].r_frame_rate;
					let singleBarWidth =  playerInstance.outputWidth / 140;
					singleBarWidth = 2.0*Math.ceil(singleBarWidth/2.0);//make sure its a multiple of 2
					let f_show_volume = '[all]showvolume=r='+showvolume_framerate+':c=0xAA00FF00:t=0:o=v:m=r:ds=log:f=0:s=4:w='+playerInstance.outputHeight+':h='+singleBarWidth+':b=5:dm=1[vid_showvolume]'
					a_filters.push(f_show_volume);
				}
	
			}

			//wfm [vwfm] pad
			if (vtracks.length != 0 && playerInstance.config.analyzeTools.wfm)
				a_filters.push("[vid_right_border][vwfm]vstack,scale=-1:"+playerInstance.outputHeight+"[vid_right_border]"); //
			
			//vectorscope [vectorscope] pad
			if (vtracks.length != 0 && playerInstance.config.analyzeTools.vec)
				a_filters.push("[vectorscope][vid_right_border]hstack,scale="+playerInstance.outputWidth+":"+playerInstance.outputHeight+"[vid_right_border]");

			if (atracks.length != 0 && playerInstance.config.analyzeTools.audioVu)
				a_filters.push("[vid_right_border][vid_showvolume]hstack,scale="+playerInstance.outputWidth+":"+playerInstance.outputHeight+"[vid_right_border]")


			//Some final decisions
			if (atracks.length != 0){
				a_filters.push("[pc_audio]asetpts=PTS-0.24/TB[ao]"); //final audio output for mpv Audio delay by ~200msec, hopefully compensating the delay mpv has currently
			}

			//all filter chains are expected to produce a final vid named vid_right_border
			//a_filters.push ("[vid_right_border]copy[withaudiobars]"); //we dont know which path crated the final video out and we cannot re-use the same label as often as we wish

			return a_filters.join(",")

		}catch(ex){
			console.error("Error constructing mpv filter chain!",ex)
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

				var _filters = playerInstance.getAudioVuFilterString("aid",playerInstance.selected_channels)
			
				_filters += ",[vid_right_border]copy[vo]" //mpv looks for vo pad
				mpvopts.push("--lavfi-complex=" + _filters)

			}else if (JSON.stringify(playerInstance.config.ffprobe).indexOf('audio') != -1){
				//AUDIO ONLY
				mpvopts.push(
					"--profile=ffasVidProfile", 
				)
				var final_filter = playerInstance.getAudioVuFilterString("aid",playerInstance.selected_channels)
				final_filter += ",[vid_right_border]copy[vo]" //mpv looks for vo pad	
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

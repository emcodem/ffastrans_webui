const { spawn,execSync } = require('child_process');
var fs = require("fs");
const axios = require('axios');
const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
var path = require("path")
var os = require("os");
var portfinder = require("portfinder");
const tail = require('tail').Tail;
const ffprobeApi = require("ffprobe");

/* Player is initated via socket commands in server.js initSocketIo */
class Player
{
    constructor()
    {
		this.port = 8000;
		this.vlc = null;
		this.ffrewrap = null;
		this.selectedAudioTrack = 0;
		this.socket = null;
		this.config = null;
    }
	

	async initiate(socket,config) {
		this.socket = socket;
		this.config = config;
		var playerInstance = this;

		console.log("PLAYER INITATE", config);
		try{
			console.log("PLAYER INITIAL PORT: ",playerInstance.port)
			playerInstance.port = await getFreePort(playerInstance.port)
		}catch(ex){
			socket.emit("playererror", "Could not get free player slot, most likely too many vlc.exe players are open on the server. Contact System Administrator. Error Message: " + ex.message);
			return;
		}
		try{
			console.log("port for vlc",playerInstance.port)
			await playerInstance.startPlay(socket,config); //throws!
			console.log("Player initiate success. ", playerInstance.vlc)
			
		}catch(e){
			socket.emit("playererror",e.message);
			return;
		}
		
		socket.onAny((eventName, ...args) => {
			console.log("SOCKET EVENT",eventName)
		});
		
		//attach disconnect event to socket for the case that client closes
		socket.on('disconnect', function(){
			playerInstance.vlc.kill();
			playerInstance.ffrewrap.kill();
			console.log("PLAYER CLOSED");
		});
		
		/* player commands from client player.html via socket.io */
		socket.on('player', async function(data){

				var vlcCommandAuth = {
					username: '',
					password: 'vlc'
				}

				data = JSON.parse(data);

				if (!data.getstatus){
					console.log("player command received",data);
				}

				if (data.getstatus){
					try{
						var resp = await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml",{auth:vlcCommandAuth});
						const options = {
							ignoreAttributes : false
						};
						var fastparser = new XMLParser(options);
						let jObj = fastparser.parse(resp.data);
						socket.emit("setstatus",jObj);
						return;
					}catch(ex){

					}
				}

				if (data.command){
					try{
						if (data.command == "changeAtrack"){
							var newAtrack = data.value;
							playerInstance.vlc.kill();
							playerInstance.ffrewrap.kill();
							playerInstance.selectedAudioTrack = newAtrack;
							playerInstance.startPlay(playerInstance.socket,playerInstance.config);
						}
						if (data.command == "play"){
							var resp = await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=pl_pause",{auth:vlcCommandAuth});
							return;
						} 
						if (data.command == "seek"){
							console.log("seeking to", data.val)
							await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=seek&val=" + data.val,{auth:vlcCommandAuth});
							return;
						}
						if (data.command == "rate"){
							await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=rate&val=" + data.val,{auth:vlcCommandAuth});
							return;

						}
						await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=" + data.command,{auth:vlcCommandAuth});
					}catch(ex){

					}
					
					return;
				}
		});

	}

	async changeAtrack(newAtrack){
		//kill old vlc and rewrap and restart

	}

	async startPlay(socket,config){

		var playerInstance = this;
		var vlcexe = path.join(global.approot,"tools","vlc","vlc.exe");
		var ffmpegexe = path.join(global.approot,"tools","ffmpeg","ffmpeg.exe");
		var ffprobeexe = path.join(global.approot,"tools\\ffmpeg\\ffprobe.exe");


		if (!fs.existsSync(ffprobeexe)){
			console.error("ffprobe.exe not found in " + ffprobeexe);
			throw new Error("Installation error, ffprobe not found: " + ffprobeexe);
		}
		if (!fs.existsSync(ffmpegexe)){
			console.error("ffmpeg.exe not found in " + ffmpegexe);
			throw new Error("Error, ffmpeg exe not found in " + path.join(global.approot,"tools","ffmpeg","ffmpeg.exe"));
		}
		
		if (!fs.existsSync(vlcexe)){
			console.error("VLC Player not found in " + vlcexe);
			throw new Error("Error, VLC Media player not found on webinterface server. Please either install it or place in webinterface/tools/vlc or make sure vlc.exe is in PATH");
		}

		try{
			var ffprobe = await ffprobeApi(config.file, { path: ffprobeexe });
		}catch(ex){
			throw new Error("Could not analyze the file, is it a valid media file? Path was: " + config.file);
		}
		var probe_streams = ffprobe["streams"];
		if (!probe_streams){
			var msg = "No streams/tracks found in this file, is it a media file? Path was: " + config.file;
			console.error(msg);
			throw new Error(msg);
		}

		console.log("Player ffprobe:",JSON.stringify(ffprobe))
		//emit ffprobe to the client
		socket.emit("ffprobe",ffprobe);

		//REWRAPPING - we need that in order to compensate "frame bursts" from vlc when loading some source formats e.g. mp4aacavc 
		//jsmpeg does not have any inbuilt buffer so it will just display the frame bursts and lags that vlc delivers 
		//ffmpeg -re option to the rescue
		console.log("Spawning ",ffmpegexe);
		
		//-filter_complex "[0:a]ebur128=peak=true:video=1:meter=9[v]" -map "[v]" -map 0:a
		var standard_args = [					
							"-re",
							"-i","-", 
							"-map","0:v?",
							"-map","0:a?",
							"-af", "asetpts=PTS-0.2/TB", //for some reason vlc live stream is async, try to compensate. this adds some latency!
							"-f","mpegts",
							"-c:v", "copy",
							"-c:a","mp2",
							"-ab","256k",
							"-"
							];
										
	    var audio_only_args = [		
							"-re",
							"-i","-", 
							"-filter_complex","[0:a]ebur128=:video=1:meter=9:size=hd480[v]",
							"-f","mpegts",
							"-c:v", "mpeg1video", "-g", "1",
							"-c:a","mp2",
							"-map", "[v]" , "-map", "0:a",
							"-s","512x288",
							"-b:a","256k",
							"-b:v","5256k",
							"-"
							]
		
		//assume audio only
		var selected_args = audio_only_args;

		//check if there is video
		probe_streams.forEach(function(str){
			if (str["codec_type"] == "video"){
				selected_args = standard_args;
			}
		});

		this.ffrewrap = spawn(ffmpegexe, selected_args); 
						
		this.ffrewrap.stdout.on('data', data => {
			socket.emit("binarydata",data)
		});
		this.ffrewrap.stderr.on('data', data => {
			console.log(`${data}`);
		});

		this.ffrewrap.on('exit', returncode => { 
			console.log ("ffmpeg rewrapper end, returncode: "+returncode  )
			if (returncode != "0"){
				console.log("ffmpeg failed, return code: ",returncode)
			}

		});

		/* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
		this.ffrewrap.on('error', data => {
		  socket.emit("playererror","Error spawning ffmpeg on webinterface server, check if ffmpeg is in the PATH");
		});
		


		
	//"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" -I http C:\temp\play\BigBuckBunny1080p30s.mp4 :sout=#transcode{video_enable=yes,audio_enable=yes,vcodec=mp1v,acodec=mpga,vb=1256k,ab=256k,width=512,height=240}:duplicate{dst=standard{access=udp,mux=ts,dst="127.0.0.1:1234"},dst=standard{access=file,mux=ts,dst="c:\\temp\\vlc.ts"}}  --sout-avcodec-keyint=1 --http-host 127.0.0.1 --http-port 3010 --http-pass oida
	
		var ffreportvar = "c:\\temp\\ffmpeg.log";
		var secondaryaccess = 'udp' //"udp"  || 'file,dst="c:\\temp\\recording.ts"'
		
		var tempfile = path.join(os.tmpdir(),"vlc_"+this.port+".log");
		try{fs.unlinkSync(tempfile)}catch(ex){}
		console.log("Writing vlc logs to ",tempfile);
		console.log("Spawning VLC",vlcexe,"port",this.port);
		var vlcopts = [	
						"-I","http", 
						"-vv",
						"--file-logging",
						"--logfile",tempfile,
						config.file,
						"--no-sout-all",	//prevent downmix all channels

						"--play-and-pause", //pause at last frame 
						//"--start-paused",
						"--audio-track=" + this.selectedAudioTrack,//  in encode below dont work but only here, so we have to restart the player for selecting tracks
						':sout=#transcode{vcodec=mp1v,vb=5256k,width=512,height=288}:std{access=file,mux=avformat{mux=matroska},dst="-"}',
						"--sout-avcodec-keyint=1",// I frame only
						"--http-host" ,"127.0.0.1",
						"--http-port", this.port,
						'--http-pass','vlc',					
						]
		console.log("VLC Opts: [" + vlcopts.join(' ') + "]");
		this.vlc = spawn(vlcexe, vlcopts,{windowsHide: true},
												
						); 
						
		
						this.vlc.stdout.pipe(this.ffrewrap.stdin);
		
		// vlc.stderr.on('data', data => {
			//this does not work, for some reason we get only truncated output her
		// 	const result = data.toString().split(/\r?\n/);
		// 	result.forEach(element => {
		// 		console.log("VLC log: ",element);
		// 	});
			
		// });

		//continuously read vlc outptut, don't forget to unwatch in error/exit cmd
		// var tailEvent = new tail(tempfile);
		// tailEvent.on("line", function(data) {
		// 	//TODO: find out how to determine player errors from vlc
		// 	console.log("VLC: ",data);
		// });

		this.vlc.on('exit', returncode => { 
			
			console.log ("vlc end, returncode: "+returncode  )
			if (returncode != "0"){
				console.log("vlc failed, return code: ",returncode)
			}
			//.unwatch();
		});

		/* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
		this.vlc.on('error', data => {
		  var returnobj = {"message":"Fatal error spawning ingest command, check for installation errors. "};
		  returnobj["exception"] = data;
		  //tailEvent.unwatch();
		});	
		
		return true;
			
	}

}

module.exports = {
    Player,
};



async function systemSync(cmd){
  child_process.exec(cmd, (err, stdout, stderr) => {
    console.log('stdout is:' + stdout)
    console.log('stderr is:' + stderr)
    console.log('error is:' + err)
  }).on('exit', code => console.log('final exit code is', code))
}

async function getFreePort(initport){

	return await portfinder.getPortPromise({stopPort: initport + 2});

}
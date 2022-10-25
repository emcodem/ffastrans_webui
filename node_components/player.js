const { spawn,execSync } = require('child_process');
var fs = require("fs");
const axios = require('axios');
const { XMLParser, XMLBuilder, XMLValidator} = require("fast-xml-parser");
var path = require("path")
var os = require("os");
var portfinder = require("portfinder");
const tail = require('tail').Tail;
class Player
{
	child = null
	server = null
	
    constructor()
    {
        this.type = "Person";
		this.child = null;
		this.server = null;
		this.port = 3200;
		
    }
	


	// destructor()
    // {
    //     console.log("Player is destructed")
    // }
	async initiate(socket,config) {
		var playerInstance = this;
		var vlcCommandAuth = {
			username: '',
			password: 'vlc'
		  }
		console.log("PLAYER INITATE", config);
		
		try{
			
			this.port = await getFreePort(this.port);
			console.log("port for vlc",this.port)
			
		}catch(e){
			socket.emit("playererror",e.message);
			return;
		}
		var {vlc,ffrewrap} = this.startPlay(socket,config);
		
		//attach disconnect event to socket for the case that client closes
		socket.on('disconnect', function(){
			console.log("PLAYER CLOSED");
			vlc.kill();
			ffrewrap.kill();
		});
		
		/* player commands from client player.html via socket.io */
		socket.on('player', async function(data){
			data = JSON.parse(data);
				if (!data.getstatus){
					console.log("player command received",data);
				}
				if (data.getstatus){
					var resp = await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml",{auth:vlcCommandAuth});
					
					const options = {
						ignoreAttributes : false
					};
					var fastparser = new XMLParser(options);
					let jObj = fastparser.parse(resp.data);
					socket.emit("setstatus",jObj);
				} 
				if (data.command){
					if (data.command == "play"){
						var resp = await axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=pl_pause",{auth:vlcCommandAuth});
						return;
					} 
					if (data.command == "seek"){
						console.log("seeking to", data.val)
						axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=seek&val=" + data.val,{auth:vlcCommandAuth});
						return;
					}
					if (data.command == "rate"){
						axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=rate&val=" + data.val,{auth:vlcCommandAuth});
						return;

					}
					axios.get("http://127.0.0.1:" + playerInstance.port + "/requests/status.xml?command=" + data.command,{auth:vlcCommandAuth});
					return;
			}
		});

	}
	
	
	startPlay(socket,config){

		var playerInstance = this;
		var vlcexe = "";
		var ffmpegexe = "";
		
		const { ext } = path.parse(config.file);
		
		vlcexe = path.join(global.approot,"tools","vlc","vlc.exe");
		try{
			ffmpegexe = path.join(global["ffastrans-about"].about.general.install_dir,"Processors","ffmpeg","x64","ffmpeg.exe");
		}catch(ex){}
		
		if (!fs.existsSync(vlcexe)){
			console.error("VLC Player not found in " + vlcexe + ", trying next path");
			vlcexe = "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe";
			if (!fs.existsSync(vlcexe)){
				console.error("VLC Player not found in " + vlcexe + ", using just 'vlc', let us hope it is in the path");
				if (systemSync("where ffmpeg") == 0){
					vlcexe = "vlc";
				}else{
					socket.emit("playererror","Error, VLC Media player not found on webinterface server. Please either install it or place in webinterface/tools/vlc or make sure vlc.exe is in PATH");
				}
			
			}
		}
		if (!fs.existsSync(ffmpegexe)){
			console.error("ffmpeg.exe not found in " + ffmpegexe + ", using just 'ffmpeg', let us hope it is in the path");
			// if (systemSync("where ffmpeg") == 0){
				ffmpegexe = "ffmpeg";
			// }else{
				// socket.emit("playererror","Error, ffmpeg not found on webinterface server. Please either make sure it is in path or place here: ",ffmpegexe)
			// }
		}
		
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
											"-af", "asetpts=PTS-0.2/TB", //for some reason vlc live stream is async, try to compensate
											"-f","mpegts",
											"-c:v", "copy",
											"-c:a","mp2",
											"-ab","256k",
											"-"
							];
										
	    var audio_only_args = [	
												
											"-re",
											"-i","-", 
											"-filter_complex","[0:a]ebur128=:video=1:meter=9:size=spal[v]",
											"-f","mpegts",
											"-c:v", "mpeg1video", "-g", "1",
											"-c:a","mp2",
											"-map", "[v]" , "-map", "0:a",
											"-s","512x288",
											"-b:a","256k",
											"-b:v","5256k",
											"-"
							]
		
		var selected_args = standard_args;
		
		if (ext.match(/mp3$|wav$/i)){
			selected_args = audio_only_args;
		}
		var ffrewrap = spawn(ffmpegexe, selected_args); 
						
		ffrewrap.stdout.on('data', data => {
			socket.emit("binarydata",data)
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
		


		
	//"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" -I http C:\temp\play\BigBuckBunny1080p30s.mp4 :sout=#transcode{video_enable=yes,audio_enable=yes,vcodec=mp1v,acodec=mpga,vb=1256k,ab=256k,width=512,height=240}:duplicate{dst=standard{access=udp,mux=ts,dst="127.0.0.1:1234"},dst=standard{access=file,mux=ts,dst="c:\\temp\\vlc.ts"}}  --sout-avcodec-keyint=1 --http-host 127.0.0.1 --http-port 3010 --http-pass oida
	
		var ffreportvar = "c:\\temp\\ffmpeg.log";
		var secondaryaccess = 'udp' //"udp"  || 'file,dst="c:\\temp\\recording.ts"'
		
		var tempfile = path.join(os.tmpdir(),"vlc_"+this.port+".log");
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
						//"--audio-track=0",//  in encode below dont work but only here, so we have to restart the player for selecting tracks
						':sout=#transcode{vcodec=mp1v,vb=5256k,width=512,height=288}:std{access=file,mux=avformat{mux=matroska},dst="-"}',
						"--sout-avcodec-keyint=1",// I frame only
						"--http-host" ,"127.0.0.1",
						"--http-port", this.port,
						'--http-pass','vlc',					
						]
		console.log("VLC Opts: [" + vlcopts.join(' ') + "]");
		var vlc = spawn(vlcexe, vlcopts,{windowsHide: true},
												
						); 
						
		
		vlc.stdout.pipe(ffrewrap.stdin);
		
		// vlc.stderr.on('data', data => {
			//this does not work, for some reason we get only truncated output her
		// 	const result = data.toString().split(/\r?\n/);
		// 	result.forEach(element => {
		// 		console.log("VLC log: ",element);
		// 	});
			
		// });

		//continuously read vlc outptut, don't forget to unwatch in error/exit cmd
		var tailEvent = new tail(tempfile);
		tailEvent.on("line", function(data) {
			console.log("VLC: ",data);
		});

		vlc.on('exit', returncode => { 
			
			console.log ("vlc end, returncode: "+returncode  )
			if (returncode != "0"){
				console.log("vlc failed, return code: ",returncode)
			}
			tailEvent.unwatch();
		});

		/* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
		vlc.on('error', data => {
		  var returnobj = {"message":"Fatal error spawning ingest command, check for installation errors. "};
		  returnobj["exception"] = data;
		  tailEvent.unwatch();
		});	
		
		return {vlc,ffrewrap};
			
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

async function getFreePort(){
	return await portfinder.getPortPromise();
}
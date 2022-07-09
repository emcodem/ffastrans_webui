const { spawn,execSync } = require('child_process');
var fs = require("fs");
const axios = require('axios');
var parser = require('xml2json');
var path = require("path")


class Player
{
	child = null
	server = null
	
    constructor()
    {
        this.type = "Person";
		this.child = null;
		this.server = null;
    }
	


	// destructor()
    // {
    //     console.log("Player is destructed")
    // }
	async initiate(socket,config) {
		
		var vlcCommandAuth = {
			username: '',
			password: 'vlc'
		  }
		console.log("PLAYER INITATE", config);
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
					var resp = await axios.get("http://127.0.0.1:3010/requests/status.xml",{auth:vlcCommandAuth});
					var xmljson = parser.toJson(resp.data);
					socket.emit("setstatus",xmljson);
				} 
				if (data.command){
					if (data.command == "play"){
						var resp = await axios.get("http://127.0.0.1:3010/requests/status.xml?command=pl_pause",{auth:vlcCommandAuth});
						
					} 
					if (data.command == "seek"){
						console.log("seeking to", data.val)
						axios.get("http://127.0.0.1:3010/requests/status.xml?command=seek&val=" + data.val,{auth:vlcCommandAuth});
					}
					if (data.command == "rate"){
						axios.get("http://localhost:3010/requests/status.xml?command=rate&val=" + data.val,{auth:vlcCommandAuth})

					}
				
			}
		});

	}
	
	
	startPlay(socket,config){


		var vlcexe = "";
		var ffmpegexe = "";
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
			if (systemSync("where ffmpeg") == 0){
				ffmpegexe = "ffmpeg";
			}else{
				socket.emit("playererror","Error, VLC not found on webinterface server. Please either make sure it is in path or place here: ",ffmpegexe)
			}
		}
		
		//REWRAPPING - we need that in order to compensate "frame bursts" from vlc when loading some source formats e.g. mp4aacavc 
		//jsmpeg does not have any inbuilt buffer so it will just display the frame bursts and lags that vlc delivers 
		//ffmpeg -re option to the rescue
		console.log("Spawning ",ffmpegexe);
		var ffrewrap = spawn(ffmpegexe, [	
												
											"-re","-i","-", 
											"-f","mpegts",
											"-c:v", "copy",
											"-c:a","mp2",
											"-ab","256k",
											"-"
										]
										
						 ); 
						
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
		  var returnobj = {"message":"Fatal error spawning ingest command, check for installation errors. "};
		  returnobj["exception"] = data;
		});	
		


		
	//"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" -I http C:\temp\play\BigBuckBunny1080p30s.mp4 :sout=#transcode{video_enable=yes,audio_enable=yes,vcodec=mp1v,acodec=mpga,vb=1256k,ab=256k,width=512,height=240}:duplicate{dst=standard{access=udp,mux=ts,dst="127.0.0.1:1234"},dst=standard{access=file,mux=ts,dst="c:\\temp\\vlc.ts"}}  --sout-avcodec-keyint=1 --http-host 127.0.0.1 --http-port 3010 --http-pass oida
	
		var ffreportvar = "c:\\temp\\ffmpeg.log";
		var secondaryaccess = 'udp' //"udp"  || 'file,dst="c:\\temp\\recording.ts"'
		
		
		console.log("Spawning ",vlcexe);
		var vlc = spawn(vlcexe, [
												
												"-I","http", 
												"-vv",
												config.file,
												"--no-sout-all",	//prevent downmix all channels
												"--play-and-pause", //pause at last frame 
												//"--start-paused",
												//"--audio-track=0",//  in encode below dont work but only here, so we have to restart the player for selecting tracks
												':sout=#transcode{vcodec=mp1v,vb=5256k,width=512,height=240}:std{access=file,mux=avformat{mux=matroska},dst="-"}',
												"--sout-avcodec-keyint=1",// I frame only
												"--http-host" ,"127.0.0.1",
												"--http-port", "3010",
												'--http-pass','vlc',
												
												]
												
						); 
						
		
		vlc.stdout.pipe(ffrewrap.stdin);
		
		
		// vlc.stdout.on('data', data => {
			// //console.log("got data from vlc",data.length)
			// //socket.emit("binarydata",data)
			// ffrewrap.stdin.write(data);
		// });
		vlc.stderr.on('data', data => {
			//console.log(`VLC: ${data}`);
		});

		vlc.on('exit', returncode => { 
			console.log ("ffmpeg rewrapper end, returncode: "+returncode  )
			if (returncode != "0"){
				console.log("ffmpeg failed, return code: ",returncode)
			}

		});

		/* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
		vlc.on('error', data => {
		  var returnobj = {"message":"Fatal error spawning ingest command, check for installation errors. "};
		  returnobj["exception"] = data;
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

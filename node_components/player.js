const { spawn } = require('child_process');
var udp = require('dgram');
var fs = require("fs");

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
	initiate(socket,config) {
		console.log("PLAYER INITATE", config);
		var child = this.startPlay(socket,config);
		//var udpsock = this.startUdpRelay(socket,config,child);
		//attach disconnect event to socket for the case that client closes
		socket.on('disconnect', function(){
			console.log("PLAYER CLOSED");
			//udpsock.close()
			child.kill()
		});

	}
	
	
	//UDP IS FOR VLC: "C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" -I rc "C:\temp\play\test_PCM_DolbyE_PCM_PCM.mxf" :sout=#transcode{vcodec=mp1v,width:512,height:240,vb=256k}:std{access=udp,mux=ts,dst=127.0.0.1:1234}
	startUdpRelay(socket,config,child){
			var dumpfile = "C:\\temp\\node.ts";
			try{fs.unlinkSync(dumpfile)}catch(ex){}
			var buffercache = [];
			// creating a udp server
			this.server = udp.createSocket('udp4');
			var server = this.server
			// emits when any error occurs
		server.on('error',function(error){
		  console.log('Error: ' + error);
		  server.close();
		});

			// emits on new datagram msg
		server.on('message',function(msg,info){
			  
			var buf = Buffer.from(msg.buffer)
			console.log("writing to ffmpeg",msg)
			//socket.emit("binarydata",buf);
			child.stdin.write(msg)
			fs.appendFile(dumpfile, buf,function(){});
			
			// buffercache.push(buf);
			// if (buffercache.length > 20){
				
				// console.log("Buffer sent");
				// buffercache = [];
			// }
			
			

		});
		server.on('listening',function(){
		  var address = server.address();
		  var port = address.port;
		  var family = address.family;
		  var ipaddr = address.address;
		  console.log('Server is listening at port' + port);
		  console.log('Server ip :' + ipaddr);
		  console.log('Server is IP4/IP6 : ' + family);
		});
		//emits after the socket is closed using socket.close();
		server.on('close',function(){
		  console.log('Socket is closed !');
		});
		server.bind(1234);
		return server;
	}
	
	startPlay(socket,config){
		var internal_buffer = [];
		//ffmpeg -re -i file.ext -f ismv -c:v libx264 -listen 1 -seekable 0 -g 1 http://localhost:1935/live
		
		//C:\temp\mencoder\mencoder.exe C:\Users\emcod\Downloads\Test_DolbyE_broken.mxf -of lavf -lavfopts format=mpegts  -ovc lavc -lavcopts vcodec=mpeg1video -oac lavc -lavcopts acodec=mp2 -really-quiet
		// var ffreportvar = "c:\\temp\\ffmpeg.log";
		// var child = spawn("C:\\temp\\mencoder\\mencoder.exe", [	
												// config.file, 
												// "-of","lavf","-lavfopts","format=mpegts",
												// "-oac", "lavc", "-ovc", "lavc", "-lavcopts", "aglobal=1:vglobal=1:vcodec=mpeg1video:keyint=1",
												
												// "-really-quiet",
												// "-o", "-"
												// ]
												// ,{ env: { ...process.env, "FFREPORT":ffreportvar }}//sets ffmpeg lopath
						// ); 
						
		// var ffreportvar = "c:\\temp\\ffmpeg.log";
		// var child = spawn("ffmpeg", [	"-re",
												// "-ss","5",
												// "-i",config.file, 
												// "-f","mpegts",
												// "-mpegts_copyts", "1",
												// "-c:v","mpeg1video", //libx264
												// "-c:a","mp2",
												// //"-listen","1", 
												// //"-seekable","0",
												// "-b:v","256k",
												// //"-vf", "setpts=0",
												// //"-fflags", "nobuffer",
												// "-s","512x240",
												// "-"
												// ]
												// ,{ env: { ...process.env, "FFREPORT":ffreportvar }}//sets ffmpeg lopath
						// ); 

	//REWRAPPING
		// var ffreportvar = "c:\\temp\\ffmpeg.log";
		// var ffrewrap = spawn("ffmpeg", [	
												
												// "-i","-", 
												// "-f","mpegts",
												// "-codec", "copy",
												// "-"
												// ]
												// ,{ env: { ...process.env, "FFREPORT":ffreportvar }}//sets ffmpeg lopath
						// ); 
						
			// ffrewrap.stdout.on('data', data => {
				// console.log("ffmpeg data: ",data.length)
				// socket.emit("binarydata",data)
			// });
			// ffrewrap.stderr.on('data', data => {
				// console.log(`${data}`);
			// });

			// ffrewrap.on('exit', returncode => { 
				// console.log ("ffmpeg rewrapper end, returncode: "+returncode  )
				// if (returncode != "0"){
					// console.log("ffmpeg failed, return code: ",returncode)
				// }

			// });

			// /* process could not be spawned, or The process could not be killed, or Sending a message to the child process failed. */
			// ffrewrap.on('error', data => {
			  // var returnobj = {"message":"Fatal error spawning ingest command, check for installation errors. "};
			  // returnobj["exception"] = data;
			// });	
		
		
	//"C:\Program Files (x86)\VideoLAN\VLC\vlc.exe" -I http C:\temp\play\BigBuckBunny1080p30s.mp4 :sout=#transcode{video_enable=yes,audio_enable=yes,vcodec=mp1v,acodec=mpga,vb=1256k,ab=256k,width=512,height=240}:duplicate{dst=standard{access=udp,mux=ts,dst="127.0.0.1:1234"},dst=standard{access=file,mux=ts,dst="c:\\temp\\vlc.ts"}}  --sout-avcodec-keyint=1 --http-host 127.0.0.1 --http-port 1235 --http-pass oida
	
		var ffreportvar = "c:\\temp\\ffmpeg.log";
		var secondaryaccess = 'udp,select="novideo"' //"udp"  || 'file,dst="c:\\temp\\recording.ts"'
		
		
		
		var vlc = spawn("C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe", [	
												
												"-I","http", 
												"-vv",
												config.file,
												"--no-sout-all",	//prevent downmix all channels
												"--play-and-pause", //pause at last frame 
												//"--start-paused",
												//audio-track=1  in encode below dont work
												':sout=#transcode{fps=24,vcodec=mp1v,avcodec-options{threads=442},acodec=mpga,vb=2256k,ab=256k,width=512,height=250}:duplicate{dst=standard{access='+secondaryaccess+',},dst=standard{access=file,mux=avformat{mux=mpegts,options={muxdelay=0.001}},dst="-"}}',
												"--sout-avcodec-keyint=1",
												"--sout-ts-dts-delay=1",
												"--http-host" ,"127.0.0.1",
												"--http-port", "1235",
												'--http-pass','oida',
												
												]
												,{ env: { ...process.env, "FFREPORT":ffreportvar }}//sets ffmpeg lopath
						); 
						
		
		//vlc.stdout.pipe(ffrewrap.stdin);
		
		console.log("vlc PID: ", vlc.pid);
		
		vlc.stdout.on('data', data => {
			console.log("got data from vlc",data.length)
			socket.emit("binarydata",data)
			//ffrewrap.stdin.write(data);
		});
		vlc.stderr.on('data', data => {
			console.log(`${data}`);
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
		
		return vlc;
			
	}

}

module.exports = {
    Player,
};






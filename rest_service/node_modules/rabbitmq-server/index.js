module.exports = {start:start,enable_stomp:enable_stomp};

const fs = require('fs')
const ini = require('ini')
const { fork, spawn } = require('child_process');
var bindir = "";
var rootdir = "";

function update_ini(filepath){
	console.log("Checking config file: "+filepath)
	var config = ini.parse(fs.readFileSync(filepath,"utf-8"))
	console.log(config)
	if (bindir != config["erlang"]["Bindir"]){
		config["erlang"]["Bindir"] = bindir;
		console.log("Detected installation moved, updating paths in file " + filepath)
		fs.writeFileSync(filepath, ini.stringify(config))
	}
	if (rootdir != config["erlang"]["Rootdir"]){
		config["erlang"]["Rootdir"] = rootdir;
		console.log("Detected installation moved, updating paths in file " + filepath)
		fs.writeFileSync(filepath, ini.stringify(config))
	}
	
}

function enable_stomp(){
    var start_options = {
      slient:false,
      windowsHide: false,
      detached:true,
      stdio: [null, null, null, 'ipc']
    };
    var child = spawn(__dirname + "/bin/erl10.5/lib/rabbitmq_server-3.8.3/sbin/rabbitmq-plugins.bat", ["enable", "rabbitmq_web_stomp"], start_options);
    
}

function start(){
        
    const start_options = {
      slient:true,
      windowsHide: true,
      detached:true,
        stdio: [null, null, null, 'ipc']
    };

	//check and set needed erlang ini settings to absolute paths
	bindir = __dirname + "/bin/erl10.5/erts-10.5/bin/";
	bindir = bindir.split("\\").join("/")
	rootdir = __dirname + "/bin/erl10.5/";
	rootdir = rootdir.split("\\").join("/")
	var erl_ini = rootdir + "/bin/erl.ini";
	erl_ini.split("\\").join("/")
	update_ini(erl_ini)
	var erts_ini = rootdir + "erts-10.5/bin/erl.ini";
	erts_ini = erts_ini.split("\\").join("/")
	update_ini(erts_ini)
	//set environment variable
	start_options["env"]={"ERLANG_HOME":rootdir};
    // set RABBITMQ_BASE=c:\RabbitMQ
    // set RABBITMQ_CONFIG_FILE=c:\RabbitMQ\rabbitmq
    // set RABBITMQ_LOG_BASE=c:\RabbitMQ\logs
    // set RABBITMQ_MNESIA_BASE=c:\RabbitMQ\db
    // set RABBITMQ_ENABLED_PLUGINS_FILE=c:\RabbitMQ\enabled_plugins
    let str = '%APPDATA%\\RabbitMQ\\'
    let targetDir = str.replace(/%([^%]+)%/g, (_,n) => process.env[n])
    fs.mkdirSync(targetDir, { recursive: true });
    start_options["env"]={"RABBITMQ_BASE":targetDir };
    //start_options["env"]={"RABBITMQ_CONFIG_FILE":rootdir};
    start_options["env"]={"RABBITMQ_LOG_BASE":targetDir  + "\\log"};
    start_options["env"]={"RABBITMQ_MNESIA_BASE":targetDir  + "\\db"};
    start_options["env"]={"RABBITMQ_ENABLED_PLUGINS_FILE":targetDir  + "\\enabled_plugins"};
    
    console.log("Added ERLANG_HOME to env: ", rootdir)
	var child = spawn(__dirname + "/bin/erl10.5/lib/rabbitmq_server-3.8.3/sbin/rabbitmq-server.bat", ["-detached"], start_options);

	child.on('message', (data) => {
		console.log("Exiting RabbitMQ msg:" + data);
		child.unref();
		process.exit(0);
	});

	// process.on('SIGTERM', () => {
	  // console.log('SIGTERM signal received.');
	  // //child.kill('SIGINT');
	// });

	// process.on('SIGINT', () => {
	  // console.log('SIGINT signal received.');
	  // //child.kill('SIGINT');
	// });
}
/* Starts app.js from commandline */
const path = require("path");
const { program,Option  } = require("commander"); //command line arguments
const rest_service = require(path.resolve( __dirname, "./app.js" ));
processCommandlineArgs();

function processCommandlineArgs(){
    //entry point for program start from shell
    
    program 
        .addOption(new Option('-p, --ffastranspath <int>', 'ffastrans root folder'))
        .addOption(new Option('-l, --listenport <int>', 'listen port for this api service'))

    program.parse();
    let opts = program.opts();
    console.log("Commandline Options: ", opts)

    //init (_host, _hostport, _listenport,_ffastranspath)
    rest_service.init(opts.listenport,opts.ffastranspath)
}
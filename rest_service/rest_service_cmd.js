/* Starts app.js used for standalone commandline start */
const path = require("path");
const { program,Option  } = require("commander"); //command line arguments
const rest_service = require(path.resolve( __dirname, "./app.js" ));

function processCommandlineArgs(){
    //entry point for program start from shell
    
    program 
        .addOption(new Option('-p, --ffastranspath <string>', 'ffastrans root folder'))
        .addOption(new Option('-l, --listenport <int>', 'listen port for this api service'));

    program.parse();
    let opts = program.opts();
    console.log("Commandline Options: ", opts);
    if (!opts.ffastranspath || !opts.listenport) {
        console.log('Error: Both --name and --age options are required.\n');
        program.help(); // Show help and exit if options are missing
      }

    //start webserver
    rest_service.init(opts.listenport,opts.ffastranspath);
}

processCommandlineArgs();
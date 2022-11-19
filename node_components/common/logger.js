const path = require("path");
const winston = require('winston');
const fs = require("fs-extra");
const util = require("util");

module.exports = {
    getLogger: getLogger
}

function getLogger(label,suppress_startup_msg = false) {
  /* returns a logger if exists, if not creates a new one */

  var logpath = path.join(global.approot, "/logs/");
  fs.ensureDirSync(logpath);
  if (!winston.loggers.has(label)) {
	
    winston.loggers.add(label, {
		exitOnError: false,
		transports: [
			new winston.transports.Console({"level": "debug"}),        
			new winston.transports.File({
				level: 'debug',
				// Create the log directory if it does not exist
				filename: path.join( logpath, label + ".log"),
				handleExceptions: true,
				json: true,
				maxsize: 55242880, // 5MB
				maxFiles: 2,
				tailable: true,
				timestamp: true,
				zippedArchive: false
			})
			// new winston.transports.File({
			// 	level: 'debug',
			// 	// Create the log directory if it does not exist
			// 	filename: path.join( logpath, "combined.log"),
			// 	handleExceptions: true,
			// 	json: true,
			// 	maxsize: 100242880, // 55MB
			// 	maxFiles: 2,
			// 	tailable: true,
			// 	timestamp: true,
			// 	zippedArchive: false
			// })
		],
		format: winston.format.combine(
			winston.format.label({ label: label }),
			winston.format.errors({ stack: true }),
			winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}), 
			winston.format.printf(info => `${[info.timestamp]}: ${info.level}: [${info.label}]: ${info.message}`),

		)	
    });
	
	var winstonLogger = winston.loggers.get(label);
	winstonLogger.error = wrapper(winstonLogger.error);
	winstonLogger.warn = wrapper(winstonLogger.warn);
	winstonLogger.info = wrapper(winstonLogger.info);
	winstonLogger.verbose = wrapper(winstonLogger.verbose);
	winstonLogger.debug = wrapper(winstonLogger.debug);
	winstonLogger.silly = wrapper(winstonLogger.silly);
	if (!suppress_startup_msg)
		winstonLogger.info("------------------------- log " +label+ " startup -------------------------");
	
  }
  return winston.loggers.get(label);
}

const wrapper = (original) => {
    
        const args = Array.from(arguments);
        return (...args) => original(util.formatWithOptions({ colors: true },...args));
    
};

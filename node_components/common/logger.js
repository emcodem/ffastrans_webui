const path = require("path");
const winston = require('winston');
const fs = require("fs-extra");
const util = require("util");
const { format } = require('winston');
const { combine, colorize, timestamp, printf } = format;

module.exports = {
    getLogger: getLogger
}

// /**
//  * this is for getting out the line and file of the caller. use by adding to winston.format.combine: humanReadableFormatter,
//  * Use CallSite to extract filename and number
//  * @returns {string} filename and line number separated by a colon
//  */
// const getFileNameAndLineNumber = () => {
//     const oldStackTrace = Error.prepareStackTrace;
//     try {
//         // eslint-disable-next-line handle-callback-err
//         Error.prepareStackTrace = (err, structuredStackTrace) => structuredStackTrace;
//         Error.captureStackTrace(this);
//         // in this example I needed to "peel" the first 10 CallSites in order to get to the caller we're looking for, hence the magic number 11
//         // in your code, the number of stacks depends on the levels of abstractions you're using, which mainly depends on winston version!
//         // so I advise you to put a breakpoint here and see if you need to adjust the number!
// 		var files = [];
// 		var nums = [];
// 		files = this.stack.map(st=> st.getFileName())
// 		nums = this.stack.map(st=> st.getLineNumber())
// 		var cnt = 0;
// 		var to_return = "";
// 		for (f of files){
// 			to_return += f;
// 			to_return += nums [cnt]+ "\n";
// 			cnt++
// 		}
//         return to_return
//     } finally {
//         Error.prepareStackTrace = oldStackTrace;
//     }
// };

  
// const humanReadableFormatter = winston.format((info) => {
// 	const {level, message} = info;
//     const filename = getFileNameAndLineNumber();
// 	info.message = `${message} ${filename}`;
//     return info;
// })();

function getLogger(label,suppress_startup_msg = false, log_subdir = "") {
  /* returns a logger if exists, if not creates a new one */

  var logpath = path.join(global.approot, "/logs/",log_subdir);
  fs.ensureDirSync(logpath);
  if (!winston.loggers.has(label)) {
	
    winston.loggers.add(label, {
		exitOnError: false,
		transports: [
			new winston.transports.Console({
				label: label,
				level: "debug",
				handleExceptions: true,
				
			}),        
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


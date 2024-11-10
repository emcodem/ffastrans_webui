const path = require("path");
const winston = require('winston');
const fs = require("fs-extra");
const util = require("util");
const { format } = require('winston');
require('winston-daily-rotate-file');
const { combine, colorize, timestamp, printf } = format;
const logfactory = require("../shared_modules/logger.js")
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

	let consoleTransport = new winston.transports.Console({
		label: label,
		level: "debug",
		handleExceptions: true,

	});

	/* BEWARE, winston inbuilt File transport either stops logging under pressure or crashes application (happened at work) */
	/* for this reason, we switched to DailyrotateFile */
	// let fileTransport = new winston.transports.File({
	// 	level: 'debug',
	// 	// Create the log directory if it does not exist
	// 	filename: path.join( logpath, label + ".log"),
	// 	handleExceptions: true,
	// 	json: true,
	// 	maxsize: 55242880, // 5MB
	// 	maxFiles: 2,
	// 	//tailable: true,
	// 	timestamp: true,
	// 	zippedArchive: false,
	// 	debug: true
	// });
	let dailyFileTransport = new winston.transports.DailyRotateFile({
		level: 'info',
		filename: path.join( logpath, label + "-%DATE%.log"),
		auditFile: path.join( logpath,"audit", label),
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		maxSize: '50m',
		maxFiles: '14d'
	  });

    winston.loggers.add(label, {
		exitOnError: false,
		transports: [
			consoleTransport,
			dailyFileTransport
		],
		format: winston.format.combine(
			winston.format.label({ label: label }),
			winston.format.errors({ stack: true }),
			winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
			winston.format.printf(info => `${[info.timestamp]}: ${info.level}: [${info.label}]: ${info.message}`),
		)
    });

	//add colors, todo: is there a way to do it only for console output?
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
	try{
		const args = Array.from(arguments);
        return (...args) => original(util.formatWithOptions({ colors: true },...args));
	}catch(ex){
		console.log("-----------WINSTON LOGGER ERROR-----------",ex);
		return original;
	}

};


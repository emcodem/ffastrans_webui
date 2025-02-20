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

const m_maxLogAgeMillis = 86400000 * 14; //14 days
const m_deleteIntervals = {};

function ensureDeleteInterval(dir){
	if (! m_deleteIntervals[dir]){
		m_deleteIntervals[dir] = setInterval(function(){deleteOldFiles(dir,m_maxLogAgeMillis)},3600);
		deleteOldFiles(dir,m_maxLogAgeMillis);
	}
}

/**
 * Retrieves or creates a new logger instance with the specified label.
 *
 * @param {string} label - The label for the logger instance.
 * @param {boolean} [suppress_startup_msg=false] - If true, suppresses the startup message in the log.
 * @param {string} [log_subdir=""] - Subdirectory under the global log path for storing logs.
 * @returns {object} - A winston logger instance.
 *
 * This function checks if a logger with the given label already exists. If not, it creates a new logger
 * configured with console and daily rotating file transports. The log files are stored in the specified
 * subdirectory, or the default log path if no subdirectory is provided. The logger writes logs with
 * timestamps and supports error stack traces. The console transport is configured for debugging, and
 * the daily file transport archives logs daily, keeping them for 14 days with a maximum size of 200MB each.
 */

function getLogger(label,suppress_startup_msg = false, log_subdir = "") {
  /* returns a logger if exists, if not creates a new one */
  
  var logpath = path.join(global.approot, "/logs/",log_subdir);
  ensureDeleteInterval(logpath);

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
		level: 'debug',
		filename: path.join( logpath, label + "-%DATE%.log"),
		//auditFile: path.join( logpath,"audit", label),
		datePattern: 'YYYY-MM-DD',
		maxSize: '200m',
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

const deleteOldFiles = (directory, maxAge, maxFiles) => {
	const now = Date.now();
  
	// Read all files in the directory
	fs.readdir(directory, (err, files) => {
	  if (err) {
		console.error('Error reading directory', err);
		return;
	  }
  
	  // If there are more than maxFiles, start deleting old ones
	  if (files.length > 10000) {
		// Get file stats (including modification time) for each file
		const fileStats = [];
  
		files.forEach(file => {
		  const filePath = path.join(directory, file);
		  
		  fs.stat(filePath, (err, stats) => {
			if (err) {
			  console.error('Error reading file stats', err);
			  return;
			}
  
			// Add file stats to the array
			fileStats.push({ file, stats });
  
			// After collecting all file stats, proceed to sort and delete
			if (fileStats.length === files.length) {
			  // Sort the files by modification time (oldest first)
			  fileStats.sort((a, b) => a.stats.mtimeMs - b.stats.mtimeMs);
  
			  // Loop through sorted files and delete the oldest ones if older than maxAge
			  fileStats.forEach(({ file, stats }) => {
				const filePath = path.join(directory, file);
  
				if (now - stats.mtimeMs > maxAge) {
				  fs.unlink(filePath, (err) => {
					if (err) {
					  console.error('Error deleting file', err);
					} else {
					  console.log(`Deleted old file: ${file}`);
					}
				  });
				}
			  });
			}
		  });
		});
	  }
	});
  };
  
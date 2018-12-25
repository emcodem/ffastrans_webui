const fs = require('fs');
const path = require('path');
const regexEscape = require('escape-string-regexp');
const url = require('url');
const firstline = require('firstline');
var encoding = require("encoding");
const util = require('util')

module.exports = function(app, express){
    const ffastransapi = require("./ffastransapi");
	//find log file and return result
	app.get('/logparser', (req, res) => {
		try{
			if (req.method === 'GET') {
                const url_parts = url.parse(req.url, true);
                const query = url_parts.query;
                console.log("Request for log file ");
                console.log(url_parts);
				if (!req.query.job_id){
                    //nightmare mode: we did not get a jobid (job was a history job) but instead wf_name,start_date,end_date and filename - now we have to find a matching log file
                    //the first logfile that matches all search params is returned
                    var wf_id = req.query.wf_id;
                    var wf_name = req.query.wf_name;
                    //the following is crazy. TODO: in a future version, when all jobs have a jobid, delete this whole very if body content 
                    //I'M SORRY.
                    ffastransapi.getWorkflowDetails(
                            function(allworkflows){
                                //find workflow log directory 
                                allworkflows=JSON.parse(allworkflows);
                                allworkflows["workflows/details"].forEach(
                                    function(wf){
                                        if (wf.general.wf_name== wf_name){
                                            if (!wf.special.log_jobs){
                                                global.socketio.emit("error", "Workflow \"" + wf_name + "\" is not log enabled, contact your ffastrans Admin");
                                                res.status(500);
                                                res.write("Workflow \"" + wf_name + "\" is not log enabled, contact your ffastrans Admin<br>");
                                                res.write(wf.special.log_jobs + "<br>");
                                                res.write("Debug info: " + JSON.stringify(wf.special));
                                                res.end();
                                            }
                                            if (wf.special.log_file){ //log_file is actually the log directory
                                                //finally we have a log directory. but as we dont have a jobid, we must grep for the file of interest.
                                                fs.readdir( wf.special.log_file, function( err, files ) {
                                                    if( err ) {
                                                        global.socketio.emit("error", "Unexpected Error finding log file: " + err);
                                                        res.write("Unexpected Error finding log file: " + err);
                                                        res.end();
                                                    }  
                                                    files.forEach( function( file, index ) {
                                                        //loop through files on filesystem - read first line in file an see if start_date is contained
                                                        var filename = path.join( wf.special.log_file, file );
                                                        var stat = fs.statSync(filename);
                                                        var dateRequired = new Date(req.query.job_start);//only logs on the same day, otherwise we read too many files
                                                        var dateCurrentFile = new Date(stat.ctime);//only logs on the same day
                                                        dateRequired.setHours(0);dateRequired.setMinutes(0);dateRequired.setSeconds(0);
                                                        dateCurrentFile.setHours(0);dateCurrentFile.setMinutes(0);dateCurrentFile.setSeconds(0);
                                                       //we are nearly there, now just open all the files from the same day
                                                        if (dateRequired.toString() == dateCurrentFile.toString()){
                                                              const opts = {encoding: 'UTF16',lineEnding: '\n'};
                                                                firstline(filename).then(function(what){
                                                                //i love that ffastrans logs are utf-16
                                                                var convertedLine = (encoding.convert(what, "ascii", "UTF16")).toString();
                                                                //finally, we have a file with required start_date in first line. assum this is the log of interest!
                                                                var matchdate = req.query.job_start.replace(/\//g,"-");//replaces / by -  as the ffastrans api returns a date with / but in logs it is -
                                                                if (convertedLine.match(matchdate)){
                                                                    //todo:output parsed log
                                                                    try{
                                                                        var returnstr = parseLogFile(filename);//check if we have a JSON
                                                                        JSON.parse(JSON.stringify(returnstr));
                                                                        //res.setHeader('Content-Type', 'application/json');
                                                                        res.send(JSON.stringify(returnstr));
                                                                        return;
                                                                    }catch(ex){
                                                                        global.socketio.emit("error", ex);
                                                                        
                                                                        return;
                                                                    }
                                                                        
                                                                    res.write(parseLogFile(filename));
                                                                    res.end();
                                                                    return;
                                                                }
                                                            }, function(err){
                                                                
                                                            }).catch();
                                                        }
                                                    })
                                                })
                                            }else{
                                                console.error("Log File path not found in workflow details")
                                                global.socketio.emit("error", "Log File path not found in workflow details");
                                            }
                                        }
                                    }
                                )
                                
                            },
                            function(err){
                                console.trace(err)
                            });
                }else{
                    //we did get a jobid, finding the matching log should be easier than above
                    //LIFE IS GOOD
                    if (!req.query.wf_name || !req.query.job_id){
                        throw new Error("wf_name or job_id not set in query");
                    }
                    ffastransapi.getWorkflowDetails(
                        function(allworkflows){
                            allworkflows=JSON.parse(allworkflows);
                            allworkflows["workflows/details"].forEach(function(wf){
                            if (wf.general.wf_name== req.query.wf_name){
                                if (!wf.special.log_jobs){
                                    global.socketio.emit("error", "Workflow \"" + wf_name + "\" is not log enabled, contact your ffastrans Admin");
                                    res.status(500);
                                    res.write("Workflow \"" + wf_name + "\" is not log enabled, contact your ffastrans Admin<br>");
                                    res.write(wf.special.log_jobs + "<br>");
                                    res.write("Debug info: " + JSON.stringify(wf.special));
                                    res.end();
                                }
                                var filename = path.join( wf.special.log_file, req.query.job_id+".txt" );
                                console.log("Calculated Filename for log: " + filename)
                                res.write(JSON.stringify(parseLogFile(filename)));
                                res.end();     
                            }                        
                        });//foreach
                        });//getworkflowdetails
                }
			}
		}catch (ex){
                global.socketio.emit("error", "ERROR: in logparser : " + ex);
                console.log("ERROR: in logparser : " + ex.stacktrace);
                res.status(500);//Send error response here
                res.send("ERROR: unxepected error in logparser: " + ex);
                res.end();
		}
	});
}

function parseLogFile(filepath){
    //return a dhtmlx grid compatible JSON, takes path to log file as parameter
    console.log("Parsing log file:" + filepath)
    try{
        var stat = fs.statSync(filepath);
        if (stat.size > 10000000){
            return "Log too big: " + stat.size;
        }  
        
        var readOptions = { 'flags': 'r', 'encoding': 'utf16le', 'mode': 0666, 'bufferSize': 4 * 1024};
        var text = fs.readFileSync(filepath, readOptions);
        var i = 0;
        var linearray = text.split("\r\n");
        console.log(linearray.length);
        

        //iterate string line by line, avoid copy in memory
        var dhtmlxJson = {};
        dhtmlxJson.rows = []; //look at dhtmlx grid json data documentation
        var last_valid_row_data =[];  
        dhtmlxJson.rows.push({id:"info",data: ["","","","","Path to logfile: " + filepath]})
                               //as some log rows have no prefix (e.g. ffmpeg output), we add the data of the last valid row to it7
        for (linenum = 0;linenum<linearray.length;linenum++){
                var current_line = linearray[linenum];
                var prefixarray = current_line.split(",");      //first comma is of interest only, note that there coult be more commas
                if (prefixarray.length>1){
                    var prefix_left = (prefixarray[0]);         // e.g. =PROC=> 2018-12-25 10:16:19.041 on Populate variables@DESKTOP-UIFQT86
                    var regex = /.*?(\d.*?) on (.*?)\@(.*)/;    //matchgroup1: date, matchgroup2: name of processor, matchgroup3: hostname
                    var leftmatch = regex.exec(prefix_left);
                    
                     if(!leftmatch){
                        //invalid row
                        var style = getRowColor(current_line,false);
                        dhtmlxJson.rows.push({"style":style,id:linenum,data: [last_valid_row_data[0],last_valid_row_data[1],last_valid_row_data[2],"none",current_line]})
                        
                        continue;
                    }                                  
                    if(leftmatch.length != 4){
                        //invalid row
						var style = getRowColor(current_line,false);
                        dhtmlxJson.rows.push({style:style,id:linenum,data: [last_valid_row_data[0],last_valid_row_data[1],last_valid_row_data[2],"none",current_line]})
                        continue;
                    }
                    var prefix_right = (prefixarray[1]);        //e.g. PID: 4996 
                    regex = /PID: (.*?) /;                      //matchgroup1: date, matchgroup2: name of processor, matchgroup3: hostname
                    var rightmatch = regex.exec(prefix_right);
                    var pid = rightmatch[1];
                    var the_rest = prefixarray.slice(1,prefixarray.length).join(",") //reinsert commas to the rest of the text 
                    regex = /.*?PID.*?->(.*?)$/;
                    var restmatch = regex.exec(the_rest);
                    var newrowdata = [leftmatch[1],leftmatch[2],leftmatch[3],pid,restmatch[1]];  
                    last_valid_row_data = newrowdata; 
                    //finally push into output rows
					var style = getRowColor(restmatch[1],true);
                    dhtmlxJson.rows.push({style:style,id:linenum,data:last_valid_row_data});
                }else{
                    //invalid row data
                    var style = getRowColor(current_line,false);
                    dhtmlxJson.rows.push({style:style,id:linenum,data: [last_valid_row_data[0],last_valid_row_data[1],last_valid_row_data[2],"none",current_line]})
                }              
        }
            
    }catch(ex){
        global.socketio.emit("error", "Error in log parser function: " + ex);
        console.trace("Error in log parser function:  " + ex)
        return "Error in log parser function: " + ex;
    }
   console.log("logparser finished gracefully");
   //console.log(util.inspect(dhtmlxJson, {showHidden: false, depth: null}));
    return dhtmlxJson;
}

function getRowColor(stringToParse,validprefix){
	var style = "gray";
	if (/error/i.test(stringToParse)){
		return "color:red";
	}
	if (/WaitForResources/.test(stringToParse)){
		return "color:rgb(200,200,200)";
	}
	if (/configuration:/.test(stringToParse)){
		return "color:rgb(200,200,200)";
	}
	if (validprefix){
		if (/creation_time/i.test(stringToParse)){
			return "color:green";
		}
		return "color:black";
	}

	return style;//default is gray
}
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
            const url_parts = url.parse(req.url, true);
            const query = url_parts.query;
            console.log("Request for log file ");
            console.log(url_parts);
            ffastransapi.getJobLog(req.query["job_id"],0,200,
                function(data){
                    res.status(200);//Send error response here
                    res.send(data);
                    res.end();  
                    
                },
                function(error){
                    console.log("ERROR getting joblog, " + error);
                    res.status(500);//Send error response here
                    res.send("ERROR getting joblog, " + error);
                    res.end();                        
                })
			
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
        
        var readOptions = { 'flags': 'r', 'encoding': 'utf16le', 'mode': '0666', 'bufferSize': 4 * 1024};
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
	var style = "color:rgb(100,100,100)";
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

function findExistingWorkingDir(object, key) {
    var value = [];
    Object.keys(object).some(function(k) {
        if (k === key) {
            value = object[k];
            return true;
        }
        if (object[k] && typeof object[k] === 'object') {
             var vl = findExistingWorkingDir(object[k], key);
             if (fs.existsSync(vl)){
                 value.push(vl)
             }
            
        }
    });
    return value;
}

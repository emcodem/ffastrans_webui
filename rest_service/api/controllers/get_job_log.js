'use strict';
//var util = require('util');
const fs = require('fs');
const strip_bom = require('strip-bom');
var path = require('path');
const common = require("./common/helpers.js");
const Busboy = require('busboy');
const AdmZip = require('adm-zip');

module.exports = {
  get: start,
  post: uploadJobZip
};

/*
  Functions in a127 controllers used for operations should take two parameters:

  Param 1: a handle to the request object
  Param 2: a handle to the response object
 */
var START = 0;


async function start(req, res) {
  // variables defined in the Swagger document can be referenced using req.swagger.params.{parameter_name}
  var jobid = req.query.jobid;
  START = req.query.start | 0;
  
	console.debug("get_job_log called for: " + jobid);
	
	// Download job folder as ZIP if requested
	if (req.query.download) {
		try {
			const jobFolder = path.join(global.api_config["s_SYS_JOB_DIR"], jobid);
			if (!await fs.promises.exists(jobFolder)) {
				return res.status(404).json({ error: 'Job folder not found' });
			}
			const zip = new AdmZip();
			zip.addLocalFolder(jobFolder);
			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', `attachment; filename="${jobid}.zip"`);
			return res.send(zip.toBuffer());
		} catch (err) {
			console.error('Error creating ZIP download:', err);
			return res.status(500).json({ error: err.message, stack: err.stack });
		}
	}
	
	//check if full log exists, if yes, serve contents
  const jobPath = path.join(global.api_config["s_SYS_JOB_DIR"], jobid, "full_log.json");  //C:\dev\FFAStrans1.0.0_beta1\Processors\db\cache\jobs\20191116-1019-1699-3067-cb691333052e\full_log.json
	console.debug("trying to find file " + jobPath)
	try {
    if (!await fs.promises.exists(jobPath)) {
      const ajob = path.join(global.api_config["s_SYS_CACHE_DIR"] ,"archive", 'jobs', jobid.substring(0, 8), jobid + '.7z');
      console.log("job don't exist, searching archive: ", ajob)
      const z7path = path.join(global.api_config["s_SYS_DIR"], 'processors', 'resources', '7zr.exe');
      const out = path.join(global.api_config["s_SYS_JOB_DIR"], jobid);
      await common.exeCmd(`"${z7path}" x "${ajob}" -y -o"${out}"`);
    }
	  if (await fs.promises.exists(jobPath)) {
		console.debug("Full Log file exists, returning contents");
          res.set('Content-Type', 'application/json')
          res.set('ffastrans_log_type', 'full')
          res.sendFile(jobPath);
	  }else{
		//serve log for running job
        console.log("Serving log from running job");
        serveRunningLog(global.api_config["s_SYS_JOB_DIR"]  + jobid + "/log/",0,0,res);
      }
	} catch(err) {
		console.debug(err);
		return res.status(500).json({description: err});
	}
}

function serveRunningLog(jobdir, start, end, response) {
    var COUNT = 0;
    console.log("Serving running job log from " + start)
    //a running job has multiple logs, find all files on filesystem by date
    var files = fs.readdirSync(jobdir)
              .map(function(v) { 
                  return {
                           name: jobdir + v,
                           time:fs.statSync(jobdir + v).mtime.getTime()
                         }; 
               })
              .sort(function(a, b) { return a.time - b.time; })
              .map(function (v) { return v.name; });    
    //concat and serve all logs
    response.set('Content-Type', 'application/json')

    
    require("async").concat(files, readFile, function (err, buffers) {
        if (err) {
            console.log(err);
            //todo: error to client
        }
        
        console.log("Num found log files: " + buffers.length);
        if (START > buffers.length) {
            console.error("Requested more log lines than i have, start was: " + START + " but i only have: " + buffers.length);
            response.set('ffastrans_log_last_endpos', START);
            response.write("[]");
            response.end();
            return;
        }
        
        COUNT = buffers.length;
        response.set('ffastrans_log_type', 'partial')
        response.set('ffastrans_log_last_endpos', COUNT)
        response.write("[");
        console.log("Log lines count: " + buffers.length)
        console.log("Log lines wanted: " + COUNT)
        for (let i = START; i < COUNT; i++) {
            console.log(buffers[i].toString());
            response.write(strip_bom(buffers[i].toString()));
            if (i < COUNT - 1) {
                response.write(",");
            }
            
        }

        response.write("]");
        response.end();
    })   
         
}


function readFile(file, cb) {
    require('fs').readFile(file, cb)
}

/*
  POST method to upload a zip file containing job logs
  
  Expected format:
  - Multipart form data with a file field
  - ZIP file contains either:
    1. A single top-level folder with job GUID name containing log files
    2. Log files directly at root level with job GUID in the filename/path
  
  The files will be extracted to: s_SYS_JOB_DIR/{jobguid}_upload/
  
  Example usage:
  curl -X POST -F "file=@job_logs.zip" http://localhost:3003/api/v1/json/getjoblog
*/
async function uploadJobZip(req, res) {
  try {
    console.log('uploadJobZip called');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Check if content-type is multipart
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return res.status(400).json({ 
        error: 'Invalid Content-Type. Expected multipart/form-data',
        received: contentType
      });
    }
    
    console.log('Creating busboy instance...');
    const busboy = Busboy({ headers: req.headers });
    const tempZipPath = path.join(require('os').tmpdir(), `upload_${Date.now()}.zip`);
    let fileReceived = false;
    let responseHandled = false;
    
    console.log('Setting up busboy event handlers...');
    
    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      console.log(`Receiving file: ${filename}, type: ${mimeType}`);
      
      fileReceived = true;
      
      // Stream file to temporary location
      const writeStream = fs.createWriteStream(tempZipPath);
      
      file.pipe(writeStream);
      
      writeStream.on('error', (error) => {
        console.error('Error writing temp file:', error);
        if (!responseHandled) {
          responseHandled = true;
          res.status(500).json({ error: 'Failed to save uploaded file: ' + error.message });
        }
      });
      
      writeStream.on('finish', async () => {
        console.log('File saved to temp location, extracting...');
        
        try {
          await extractZipToJobFolder(tempZipPath, res);
          responseHandled = true;
          
          // Clean up temp file
          try {
            fs.unlinkSync(tempZipPath);
          } catch (err) {
            console.error('Error cleaning up temp file:', err);
          }
        } catch (error) {
          console.error('Error extracting zip:', error);
          
          // Clean up on error
          if (fs.existsSync(tempZipPath)) {
            try {
              fs.unlinkSync(tempZipPath);
            } catch (e) {
              console.error('Error deleting temp file:', e);
            }
          }
          
          if (!responseHandled) {
            responseHandled = true;
            res.status(500).json({ error: error.message });
          }
        }
      });
    });
    
    busboy.on('error', (error) => {
      console.error('Busboy error:', error);
      console.error('Error stack:', error.stack);
      if (!responseHandled) {
        responseHandled = true;
        res.status(500).json({ error: 'Error parsing upload: ' + error.message });
      }
    });
    
    busboy.on('finish', () => {
      console.log('Busboy finished parsing');
      if (!fileReceived && !responseHandled) {
        console.error('No file received in upload');
        responseHandled = true;
        res.status(400).json({ error: 'No file uploaded. Please send a file in multipart/form-data format with field name "file".' });
      }
    });
    
    console.log('Piping request to busboy...');
    req.pipe(busboy);
    
  } catch (error) {
    console.error('Exception in uploadJobZip:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error: ' + error.message });
    }
  }
}

async function extractZipToJobFolder(zipPath, res) {
  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    if (zipEntries.length === 0) {
      throw new Error('ZIP file is empty');
    }
    
    console.log(`ZIP contains ${zipEntries.length} entries`);
    
    // Determine job GUID
    let jobGuid = null;
    let topLevelFolder = null;
    
    // Check if there's a single top-level folder
    const topLevelItems = new Set();
    zipEntries.forEach(entry => {
      const parts = entry.entryName.split('/').filter(p => p);
      if (parts.length > 0) {
        topLevelItems.add(parts[0]);
      }
    });
    
    console.log('Top level items in ZIP:', Array.from(topLevelItems));
    
    if (topLevelItems.size === 1) {
      // Single top-level folder - check if it's a valid job GUID
      topLevelFolder = Array.from(topLevelItems)[0];
      // Validate GUID format: YYYYMMDD-HHMM-SSSS-PPPP-XXXXXXXXXXXX
      if (/^[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(topLevelFolder)) {
        jobGuid = topLevelFolder;
        console.log('Found job GUID from top-level folder:', jobGuid);
      }else{
        throw new Error('There is only one Top-level item and it is not a valid job GUID:', topLevelFolder);

      }
    }
    
    // If no valid GUID found in folder name, try to find it in a JSON file
    if (!jobGuid) {
      for (const entry of zipEntries) {
        if (!entry.isDirectory && entry.entryName.endsWith('.json')) {
          try {
            const jsonContent = strip_bom(entry.getData().toString('utf8'));
            const jsonData = JSON.parse(jsonContent);
            if (jsonData.job_id && /^[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jsonData.job_id)) {
              jobGuid = jsonData.job_id;
              console.log('Found job GUID from JSON file:', entry.entryName, '-> job_id:', jobGuid);
              break;
            }
          } catch (err) {
            console.error('Failed to parse JSON file:', entry.entryName, err.stack);
            // Continue to next JSON file instead of throwing
          }
        }
      }
    }

    if (!jobGuid) {
      throw new Error('Could not determine job GUID. ZIP must contain a file called ".json" or a folder named with job GUID (format: YYYYMMDD-HHMM-SSSS-PPPP-XXXXXXXXXXXX) or files must contain job GUID in path');
    }
    
    // Extract to job folder with _upload suffix
    const extractPath = path.join(global.api_config["s_SYS_JOB_DIR"], `${jobGuid}`);
    
    console.log('Extracting to:', extractPath);
    
    // Create directory if it doesn't exist
    if (!await fs.promises.exists(extractPath)) {
      await fs.promises.mkdir(extractPath, { recursive: true });
    }
    
    // Extract files
    let extractedCount = 0;
    for (const entry of zipEntries) {
      if (!entry.isDirectory) {
        let targetPath;
        
        if (topLevelFolder && entry.entryName.startsWith(topLevelFolder + '/')) {
          // Remove top-level folder from path
          const relativePath = entry.entryName.substring(topLevelFolder.length + 1);
          targetPath = path.join(extractPath, relativePath);
        } else {
          targetPath = path.join(extractPath, entry.entryName);
        }
        
        // Ensure directory exists
        const targetDir = path.dirname(targetPath);
        if (!await fs.promises.exists(targetDir)) {
          await fs.promises.mkdir(targetDir, { recursive: true });
        }
        
        // Extract file
        await fs.promises.writeFile(targetPath, entry.getData());
        extractedCount++;
      }
    }
    
    console.log(`Successfully extracted ${extractedCount} files to ${extractPath}`);
    
    res.status(200).json({
      success: true,
      job_id: jobGuid,
      extractPath: extractPath.replace(global.api_config["s_SYS_JOB_DIR"], ''),
      filesExtracted: extractedCount,
      message: `Successfully extracted ${extractedCount} files to ${jobGuid}_upload folder`
    });
    
  } catch (error) {
    console.error('Error in extractZipToJobFolder:', error);
    
    // Send error response to caller
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to extract ZIP file',
        details: error.stack
      });
    }
  }
}

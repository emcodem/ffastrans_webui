'use strict';
//var util = require('util');
const fs = require('fs');
const strip_bom = require('strip-bom');
var path = require('path');
const jobFiles = require('./common/job_log_files.js');
const { getBusyJobIds } = require('./common/ffastrans_active_jobs.js');
const { createHash } = require('crypto');
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
async function start(req, res) {
    try {
        res.set('Access-Control-Expose-Headers', 'ffastrans_log_type, ffastrans_log_last_endpos, ffastrans_log_cursor');
        const jobid = req.query.jobid;
        const jobDir = jobFiles.getJobDir(jobid);
        const offset = req.query.start == null ? 0 : Number(req.query.start);
        if ((req.query.start != null && typeof req.query.start !== 'string' && typeof req.query.start !== 'number') ||
            !Number.isFinite(offset) || Math.abs(offset) > Number.MAX_SAFE_INTEGER) {
            return res.status(400).json({ error: 'start must be a finite log offset' });
        }
        const startpos = Math.max(0, Math.floor(offset));
        const cursor = req.query.cursor;
        if (cursor != null && (typeof cursor !== 'string' || !/^[a-f0-9]{64}$/.test(cursor))) {
            return res.status(400).json({ error: 'Invalid log cursor' });
        }

        if (req.query.download === true || req.query.download === 'true' || req.query.download === '1') {
            if (!await jobFiles.exists(jobDir)) return res.status(404).json({ error: 'Job folder not found' });
            const zip = new AdmZip();
            zip.addLocalFolder(jobDir);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${jobid}.zip"`);
            return res.send(zip.toBuffer());
        }

        await jobFiles.restoreArchivedJob(jobid);
        if (!await jobFiles.exists(jobDir)) return res.status(404).json({ error: 'Job folder not found' });
        const jobPath = path.join(jobDir, 'full_log.json');
        const fullLogExists = await jobFiles.exists(jobPath);
        // Retries retain the previous full log while new branches are running.
        const busy = (await getBusyJobIds()).has(jobid);
        if (fullLogExists && !busy) {
            if (!await jobFiles.isConsolidatedLogReady(jobPath)) {
                return res.status(503).json({ description: 'The completed log is still being written; retry shortly' });
            }
            res.set('Content-Type', 'application/json');
            res.set('ffastrans_log_type', 'full');
            return res.sendFile(jobPath);
        }
        const currentLogDir = path.join(jobDir, '.log');
        const logDir = await jobFiles.exists(currentLogDir) ? currentLogDir : path.join(jobDir, 'log');
        return await serveRunningLog(logDir, startpos, cursor, fullLogExists ? jobPath : null, res);
    } catch (error) {
        console.debug(error);
        return res.status(error.statusCode || (pendingWrite(error) ? 503 : 500)).json({ description: error.message });
    }
}

async function listLogFiles(jobdir) {
    let files = [];
    try {
        files = (await fs.promises.readdir(jobdir, { withFileTypes: true }))
            .filter(entry => entry.isFile() && /\.json$/i.test(entry.name))
            .map(entry => ({ filename: path.join(jobdir, entry.name), name: entry.name, id: 'file:' + entry.name }));
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    if (path.basename(jobdir) === '.log') {
        // 1.5 names encode event time; no stat per snippet is necessary.
        return files.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Legacy ordering uses mtime. Limit outstanding stat operations on shares.
    const result = [];
    for (let offset = 0; offset < files.length; offset += 32) {
        const batch = await Promise.all(files.slice(offset, offset + 32).map(async file => {
            try { return { ...file, time: (await fs.promises.stat(file.filename)).mtimeMs }; }
            catch (error) { if (error.code === 'ENOENT') return null; throw error; }
        }));
        result.push(...batch.filter(Boolean));
    }
    return result.sort((a, b) => a.time - b.time || a.name.localeCompare(b.name));
}

function logObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new SyntaxError('A log event must be a JSON object');
    }
    return value;
}

async function readLogFile(file) {
    const line = logObject(JSON.parse(strip_bom(await fs.promises.readFile(file.filename, 'utf8'))));
    return { ...line, _log_file: file.name };
}

function contentKey(line) {
    const { _log_file, ...data } = line;
    const canonical = JSON.stringify(data, (key, value) => value && typeof value === 'object' && !Array.isArray(value)
        ? Object.fromEntries(Object.keys(value).sort().map(name => [name, value[name]])) : value);
    return createHash('sha256').update(canonical).digest('hex');
}

function prefixCursor(entries, count) {
    const hash = createHash('sha256');
    for (let i = 0; i < count && i < entries.length; i++) hash.update(entries[i].id + '\n');
    return hash.digest('hex');
}

function pendingWrite(error) {
    return error instanceof SyntaxError || ['ENOENT', 'EBUSY', 'EACCES', 'EPERM'].includes(error.code);
}

async function serveRunningLog(jobdir, start, cursor, fullLogPath, response) {
    const files = await listLogFiles(jobdir);
    let entries = [];
    const archivedNames = new Set();
    const legacyEntries = new Map();
    if (fullLogPath) {
        const archive = JSON.parse(strip_bom(await fs.promises.readFile(fullLogPath, 'utf8')));
        if (!Array.isArray(archive)) throw new SyntaxError('The completed log must be a JSON array');
        entries = archive.map(value => {
            const line = logObject(value);
            const entry = { line, id: line._log_file ? 'file:' + line._log_file : 'legacy:' + contentKey(line) };
            if (line._log_file) archivedNames.add(line._log_file);
            else {
                const matches = legacyEntries.get(entry.id) || [];
                matches.push(entry);
                legacyEntries.set(entry.id, matches);
            }
            return entry;
        });
    }
    for (const file of files) {
        if (archivedNames.has(file.name)) continue;
        // Old consolidations omitted filenames. Match leftover snippets one-to-one
        // so cleanup races don't duplicate archive entries or lose repeated events.
        if (legacyEntries.size) {
            try {
                file.line = await readLogFile(file);
                const matches = legacyEntries.get('legacy:' + contentKey(file.line));
                if (matches?.length) {
                    const entry = matches.shift();
                    entry.id = file.id;
                    entry.line = file.line;
                    continue;
                }
            } catch (error) {
                if (!pendingWrite(error)) throw error;
                entries.push(file);
                break;
            }
        }
        entries.push(file);
    }

    // A numeric offset alone loses late arrivals or files reordered by a writer.
    // New clients send a digest of their consumed prefix; replay on a mismatch.
    // Clients deduplicate by filename. Existing numeric-only clients still work.
    if (cursor && (start > entries.length || cursor !== prefixCursor(entries, start))) start = 0;

    const lines = [];
    let end = start;
    for (let i = start; i < entries.length; i++) {
        try {
            const line = entries[i].line || await readLogFile(entries[i]);
            lines.push(line);
            end = i + 1;
        } catch (error) {
            if (pendingWrite(error)) break; // Retry this event next poll.
            throw error;
        }
    }
    response.set('Content-Type', 'application/json');
    response.set('ffastrans_log_type', 'partial');
    response.set('ffastrans_log_last_endpos', String(end));
    response.set('ffastrans_log_cursor', prefixCursor(entries, end));
    return response.json(lines);
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
    if (!await jobFiles.exists(extractPath)) {
      await fs.promises.mkdir(extractPath, { recursive: true });
    }
    
    // Determine target paths, reject the whole zip if any entry would end up outside of the job folder (e.g. "../x")
    const extractRoot = path.resolve(extractPath) + path.sep;
    const targets = [];
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

        if (!path.resolve(targetPath).startsWith(extractRoot)) {
          throw new Error('ZIP entry points outside of the job folder: ' + entry.entryName);
        }
        targets.push({ entry, targetPath });
      }
    }

    // Extract files
    let extractedCount = 0;
    for (const { entry, targetPath } of targets) {
        // Ensure directory exists
        const targetDir = path.dirname(targetPath);
        if (!await jobFiles.exists(targetDir)) {
          await fs.promises.mkdir(targetDir, { recursive: true });
        }
        
        // Extract file
        await fs.promises.writeFile(targetPath, entry.getData());
        extractedCount++;
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

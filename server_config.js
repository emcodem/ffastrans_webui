var config = {};

//you can change these values but check if you created valid javascript
config.port = 3002;

//escape backslash with a backslash, so \\server\folder is written as \\\\server\\folder
//your path MUST end with slash or backslash, the rest of the code assumes it.
config.uploadpath = "\\\\localhost\\c$\\temp\\";

//not yet active, files in upload dir are deleted if older than x hours check/delete happens everytime a new file is uploaded...
config.uploaded_files_maxage = 1;

//this line is mandatory, do not remove it!
module.exports = config;


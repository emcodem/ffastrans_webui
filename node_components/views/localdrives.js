let si      = require("systeminformation");
let path    = require('path');
const exec = require('child_process').exec;

module.exports = async function(app, passport){
    app.get('/getlocaldrives', async (req, res) => {
        try{
            let current_drives = await si.fsSize();
            let running_in_background = []
            for (let i=0;i<current_drives.length;i++){
                try{
                    let _cur = current_drives[i];
                    let cmd = "get-partition -DriveLetter "+_cur.mount.replace(":","")+" | get-disk |Select-Object -ExpandProperty FriendlyName"
                    _cur.sizeFriendly = formatBytes(_cur.size);
                    let worker = async function(){
						try{
							let name = await (execPowerShellCommand(cmd));
							name = name.replace(/\r?\n|\r/g, " ");
							current_drives[i].name = name;
							
						}catch(exc){
							current_drives[i].name = "";
						}
                    } 
                    running_in_background.push(worker());
                }catch(ex){
                    console.error(ex)
                } 
            }
			
			
            await Promise.all(running_in_background);
            //get-partition -DriveLetter C | get-disk |Select-Object -ExpandProperty FriendlyName

            res.json(current_drives);
			
        }catch(ex){
            console.json(ex);
            res.status(500);
            res.end();
        }
    })
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function execPowerShellCommand(cmd) {
        return new Promise((resolve, reject) => {
        exec(cmd, {'shell':'powershell.exe'},(error, stdout, stderr) => {
        if (error) {
        console.warn(error);
        }
        resolve(stdout? stdout : stderr);
        });
        });
   }
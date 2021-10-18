const fs = require('fs');
var path = require('path');

module.exports = function(app, express){
    app.get('/farmadmin_install_service',  async  (req, res) => {
            console.log("Attempting metrics service installation")
            try{
                var install_bat_grafana = path.join(global["approot"],"tools\\install_metrics_server.bat")
                
                var _stdout = await spawnChild(install_bat_grafana)
                res.writeHead(200,{"Content-Type" : "application/JSON"});
                res.write("success\n" + _stdout);//output dhtmlx compatible json
                res.end();
                return;    
            }catch(ex){
                console.trace(ex)
                res.status(500);//Send error response here
                res.send(ex.toString() + "<br/><br/>Please try to install it manually (run as Administrator): " + install_bat_grafana);
                res.end();
                
            }
            
    })
}

async function spawnChild(s_args) {
    const { spawn } = require('child_process');
    console.log("starting cmd: " + s_args)
    const child = spawn('cmd', ["/C", s_args, "2>&1"]);
    
    let data = "";
    for await (const chunk of child.stdout) {
        console.log('stdout chunk: '+chunk);
        data += chunk;
    }
    let error = "";
    for await (const chunk of child.stderr) {
        console.error('stderr chunk: '+chunk);
        error += chunk;
    }
    const exitCode = await new Promise( (resolve, reject) => {
        child.on('close', resolve);
    });

    if( exitCode) {
        console.log("Installation error, ",exitCode)
        throw new Error( `Installation error exit code ${exitCode}: ${error} ${data}`);
    }
    return data;
}
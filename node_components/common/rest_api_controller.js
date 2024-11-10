
const { Worker } = require('worker_threads');

class RestApi {

    private_shutdown_requested = false;
    private_rest_api_worker;

    start_rest_api_thread(port,path,self){
        if (!self)
            self = this; //need this because we cannot use "this" in setTimeout, this becomes the timeout function itself
        //const ffastrans_new_rest_api = require("./rest_service");
        console.log("starting up rest api");
        this.private_rest_api_worker = new Worker("./rest_service/app.js",{
            workerData: {
                port:port,
                path:path
            }
        });
        this.private_rest_api_worker.on('exit', (code) => {
            console.log("rest api thread exited, exit code: ",code);
            if (!this.private_shutdown_requested){
                console.error("rest_api shutdown unexpected, restarting it in 1 second...");
                setTimeout(self.start_rest_api_thread,1000,port,path,self); //avoid potential recursive stack overflow by using setTimeout
            }
        });
        //return this.private_rest_api_worker;
    }
    
    async stop_rest_api_thread(){
        if (this.private_rest_api_worker){
            this.private_shutdown_requested = true;
            await this.private_rest_api_worker.terminate();
        }
    }
    
    sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      }   
  }

//when we use classes, we cannot access them before they are "written" in the script, so we must move module.exports to bottom
//this special "exports" syntax ensures there is only one instance of the class(singleton), no matter how often require(thismodule) is executed
module.exports = new RestApi(); 


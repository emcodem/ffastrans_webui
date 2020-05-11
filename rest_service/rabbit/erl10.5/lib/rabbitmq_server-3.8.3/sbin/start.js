const { fork, spawn } = require('child_process');
const options = {
  slient:true,
  detached:true,
    stdio: [null, null, null, 'ipc']
};

child = spawn('F:\\dev\\ffa\\ffastrans_webui\\rest_service\\rabbit\\erl10.5\\lib\\rabbitmq_server-3.8.3\\sbin\\rabbitmq-server.bat', [], options);

child.on('message', (data) => {
    console.log(data);
    child.unref();
    process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received.');
  //child.kill('SIGINT');
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received.');
  //child.kill('SIGINT');
});
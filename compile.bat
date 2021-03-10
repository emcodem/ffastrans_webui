REM DOWNLOAD PREBUILT NEXE NODE BINS for your version FROM https://github.com/nexe/nexe/releases/
cd "%~dp0"
nexe server.js -t windows-x64-14.15.3 -r "./webinterface/**" -r "./rest_service/*/!(rabbitmq-server)**" 
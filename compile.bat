REM DOWNLOAD PREBUILT NEXE NODE BINS for your version FROM https://github.com/nexe/nexe/releases/
cd "%~dp0"
REM nexe server.js -t windows-x64-14.15.3 -r "./webinterface/**" -r "./rest_service/*/{*,!(rabbitmq-server)/**}" -r  "./rest_service/app.js" --verbose
nexe .\server.js -t windows-x64-14.15.3  -r "./webinterface/**" -r "./rest_service/**" -r  "./rest_service/app.js" -r  "./node_components/mongodb_server/bin" --verbose
pause
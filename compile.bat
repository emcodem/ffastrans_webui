REM DOWNLOAD PREBUILT NEXE NODE BINS for your version FROM https://github.com/nexe/nexe/releases/
cd "%~dp0"
REM nexe server.js -t windows-x64-14.15.3 -r "./webinterface/**" -r "./rest_service/*/{*,!(rabbitmq-server)/**}" -r  "./rest_service/app.js" --verbose

cmd /C "ncc build server.js -o dist"

REM WORKS cmd /C "nexe /dist/index.js  -t windows-x64-18.14.0 -r ./webinterface/** -r ./rest_service/** -r  ./rest_service/app.js" --remote https://github.com/urbdyn/nexe_builds/releases/download/0.3.0/
cmd /C "nexe /dist/index.js  -t windows-x64-18.14.0 -r ./webinterface/**  -r "./rest_service/**" -r  "./rest_service/app.js" --remote https://github.com/urbdyn/nexe_builds/releases/download/0.3.0/

REM cmd /C "nexe test.js  -t windows-x64-18.14.0 --remote https://github.com/urbdyn/nexe_builds/releases/download/0.3.0/


REM nexe .\server.js -t windows -r "./webinterface/**" -r "./rest_service/**" -r  "./rest_service/app.js" --verbose
REM nexe .\server.js -t windows-x64-14.15.3  -r "./webinterface/**" -r  "./rest_service/bundle.js" --verbose
pause
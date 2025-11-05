REM DOWNLOAD PREBUILT NEXE NODE BINS for your version FROM https://github.com/nexe/nexe/releases/
cd "%~dp0"
set /p FULLVERSION=<"%~dp0webinterface/version.txt"
set MAJOR=%FULLVERSION:~0,1%
set MINOR=%FULLVERSION:~2,1%
set SECMINOR=%FULLVERSION:~4,1%
set BUILDNUM=%FULLVERSION:~6,10%
set /a NEWVERSION=%BUILDNUM%+1
echo %MAJOR%.%MINOR%.%SECMINOR%.%NEWVERSION% > "%~dp0/webinterface/version.txt"


cmd /C "npx webpack"

cd dist

::cmd /C "nexe /dist/bundle.js  -t windows-x64-20.18.0 -r ./webinterface/** -r "./rest_service/**" -r  "./rest_service/app.js" --verbose --ico "%~dp0build_tools/webint_icon.ico""
cmd /C "..\node_modules\.bin\nexe.cmd server.js  -t windows-x64-20.18.0 -r webinterface/** -r "rest_service/**" --verbose "

cmd /C "%~dp0build_tools/verpatch.exe server.exe "%MAJOR%.%MINOR%.%SECMINOR%.%NEWVERSION%"  /s product "FFAStrans Webinterface" /s desc "FFAStrans Webinterface" /s copyright "emcodem@FFAStrans.com" "

cmd /C ""%~dp0build_tools/ResourceHacker.exe" -open "server.exe" -save "server.exe" -action addoverwrite -resource "%~dp0build_tools\webint_icon.ico" -mask ICONGROUP,MAINICON"
 
ie4uinit.exe -ClearIconCache

cd "%~dp0"
node scripts\package.js

pause
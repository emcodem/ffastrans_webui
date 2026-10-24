REM node base binary: build_tools\windows-x64-<version>, build it for another node version with build_tools\nexe_sea\build_base.bat <version>
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

REM pack server.js and its resources into the node base binary (same layout nexe 4 wrote),
REM see build_tools\nexe_sea\pack.js and build_tools\nexe_sea\sea-boot.js
cmd /C "node "%~dp0build_tools\nexe_sea\pack.js" --base "%~dp0build_tools\windows-x64-24.22.1" --entry server.js --out server.exe --include webinterface --include rest_service --include node_modules --exclude webinterface/dependencies/mxgraph/406/javascript/examples"

cmd /C "%~dp0build_tools/verpatch.exe server.exe "%MAJOR%.%MINOR%.%SECMINOR%.%NEWVERSION%"  /s product "FFAStrans Webinterface" /s desc "FFAStrans Webinterface" /s copyright "emcodem@FFAStrans.com" "

cmd /C ""%~dp0build_tools/ResourceHacker.exe" -open "server.exe" -save "server.exe" -action addoverwrite -resource "%~dp0build_tools\webint_icon.ico" -mask ICONGROUP,MAINICON"
 
ie4uinit.exe -ClearIconCache

cd "%~dp0"
node scripts\package.js

pause
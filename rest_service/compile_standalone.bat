%~d0
cd "%~dp0"
ncc build rest_service_cmd.js -o dist
copy dist/inde.js ./rest_service_compiled.js
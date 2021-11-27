@echo off

REM :: BatchGotAdmin
REM :-------------------------------------
REM REM  --> Check for permissions
    REM IF "%PROCESSOR_ARCHITECTURE%" EQU "amd64" (
REM >nul 2>&1 "%SYSTEMROOT%\SysWOW64\cacls.exe" "%SYSTEMROOT%\SysWOW64\config\system"
REM ) ELSE (
REM >nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
REM )

REM REM --> If error flag set, we do not have admin.
REM if '%errorlevel%' NEQ '0' (
    REM echo You have not enough privileges to install a service, please run as administrator
    REM exit 1
REM ) else ( goto gotAdmin )



REM :gotAdmin
    REM pushd "%CD%"
    REM CD /D "%~dp0"
REM :--------------------------------------    
REM @echo off
@echo off
echo "%~dp0\nssm"

REM uninstall 

set InstallFolder="%~dp0"

net stop "FFAStrans Metrics Collector"
"%~dp0\nssm" remove "FFAStrans Metrics Collector" confirm

net stop "FFAStrans Metrics UI"
"%~dp0\nssm" remove "FFAStrans Metrics UI" confirm


REM install prometheus
echo "%~dp0prometheus\prometheus.exe"
"%~dp0\nssm" install "FFAStrans Metrics Collector" "%~dp0prometheus\prometheus.exe"
REM "%~dp0\nssm" set "FFAStrans Metrics Collector" AppDirectory "%~dp0prometheus"

"%~dp0\nssm" set "FFAStrans Metrics Collector" Description "Prometheus server"
"%~dp0\nssm" set "FFAStrans Metrics Collector" Start SERVICE_AUTO_START

net start "FFAStrans Metrics Collector"

REM install grafana
echo "%~dp0prometheus\grafana-7.4.3\bin\grafana-server.exe"
"%~dp0\nssm" install "FFAStrans Metrics UI" "%~dp0prometheus\grafana-7.4.3\bin\grafana-server.exe"
REM "%~dp0\nssm" set "FFAStrans Metrics UI" AppDirectory "%~dp0prometheus\grafana-7.4.3\bin"

"%~dp0\nssm" set "FFAStrans Metrics UI" Description "Grafana server"
"%~dp0\nssm" set "FFAStrans Metrics UI" Start SERVICE_AUTO_START

net start "FFAStrans Metrics UI"

exit /b %ERRORLEVEL%
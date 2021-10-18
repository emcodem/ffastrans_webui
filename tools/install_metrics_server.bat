@echo off

:: BatchGotAdmin
:-------------------------------------
REM  --> Check for permissions
    IF "%PROCESSOR_ARCHITECTURE%" EQU "amd64" (
>nul 2>&1 "%SYSTEMROOT%\SysWOW64\cacls.exe" "%SYSTEMROOT%\SysWOW64\config\system"
) ELSE (
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
)

REM --> If error flag set, we do not have admin.
if '%errorlevel%' NEQ '0' (
    echo You have not enough privileges to install a service, please run as administrator
    exit 1
) else ( goto gotAdmin )



:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------    
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

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
    echo Requesting administrative privileges...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    set params= %*
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0"" %params:"=""%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"
:--------------------------------------    
@echo off

echo "%~dp0"tools\nssm

REM install prometheus
"%~dp0\nssm" install "FFAStrans Metrics Client" "%~dp0prometheus\prometheus_clients\windows_exporter.exe"
"%~dp0\nssm" set "FFAStrans Metrics Client" AppDirectory "%~dp0prometheus\prometheus_clients"

"%~dp0\nssm" set "FFAStrans Metrics Client" Description "Prometheus server"
"%~dp0\nssm" set "FFAStrans Metrics Client" Start SERVICE_AUTO_START

net start "FFAStrans Metrics Client"
pause
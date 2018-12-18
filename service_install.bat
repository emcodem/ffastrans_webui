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

"%~dp0tools\nssm" install "FFAStrans Webinterface" "%~dp0server.exe"
"%~dp0"tools\nssm" set "FFAStrans Webinterface" AppDirectory "%~dp0"

"%~dp0tools\nssm" set "FFAStrans Webinterface" Description "FFAStrans Webinterface"
"%~dp0tools\nssm" set "FFAStrans Webinterface" Start SERVICE_AUTO_START

"%~dp0tools\nssm" set "FFAStrans Webinterface" AppStdout "%~dp0log\Windows_Service_STDOUT.log"
"%~dp0tools\nssm" set "FFAStrans Webinterface" AppStderr "%~dp0log\Windows_Service_STERR.log"

net start "FFAStrans Webinterface"

echo Hello and thank you for using FFAStrans. If you did not change the port, you cann access the webserver on:
echo http://localhost:3002

pause
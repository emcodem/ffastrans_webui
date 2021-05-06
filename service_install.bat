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

set SERVICE_NAME=FFAStrans Webinterface

if exist "%~dp0alternate-server\css\override.css" (
	rem service name is "last folder" when override.css exists
	set /p SERVICE_NAME=Enter service name: 
) 
echo Installing Service Name: %SERVICE_NAME%

"%~dp0tools\nssm" install "%SERVICE_NAME%" "%~dp0server.exe"
REM "%~dp0tools\nssm" set "%SERVICE_NAME%" AppDirectory "%~dp0"

"%~dp0tools\nssm" set "%SERVICE_NAME%" Description "%SERVICE_NAME%"
"%~dp0tools\nssm" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

"%~dp0tools\nssm" set "%SERVICE_NAME%" AppStdout "%~dp0log\Windows_Service_STDOUT.log"
"%~dp0tools\nssm" set "%SERVICE_NAME%" AppStderr "%~dp0log\Windows_Service_STERR.log"

net start "%SERVICE_NAME%"

echo Hello and thank you for using %SERVICE_NAME%. If you did not change the port, you cann access the webserver on:
echo http://localhost:3002

pause
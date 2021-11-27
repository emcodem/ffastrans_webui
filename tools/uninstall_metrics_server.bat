REM @echo off

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
    REM echo Requesting administrative privileges...
    REM goto UACPrompt
REM ) else ( goto gotAdmin )

REM :UACPrompt
    REM echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    REM set params= %*
    REM echo UAC.ShellExecute "cmd.exe", "/c ""%~s0"" %params:"=""%", "", "runas", 1 >> "%temp%\getadmin.vbs"

    REM "%temp%\getadmin.vbs"
    REM del "%temp%\getadmin.vbs"
    REM exit /B

REM :gotAdmin
    REM pushd "%CD%"
    REM CD /D "%~dp0"
REM :--------------------------------------    
REM @echo off
@echo off
set InstallFolder="%~dp0"

net stop "FFAStrans Metrics Collector"
"%~dp0\nssm" remove "FFAStrans Metrics Collector" confirm

net stop "FFAStrans Metrics UI"
"%~dp0\nssm" remove "FFAStrans Metrics UI" confirm

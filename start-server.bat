@echo off
title Selim HR Server
echo ========================================
echo    Selim HR - Server
echo ========================================
echo.

REM Set environment variables
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
set ANDROID_HOME=C:\Users\rabea\AppData\Local\Android\Sdk

REM Check if MySQL is running
C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe ping -u root >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Starting MySQL server...
    start /MIN cmd.exe /c "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe --defaults-file=C:\Users\rabea\AppData\Local\MySQL\my.ini --standalone"
    timeout /t 8 /nobreak >nul
)

cd /d "C:\horizon-hr"

echo [INFO] Starting Selim HR server...
echo.
echo    Local:  http://localhost:3000
echo    Network: http://192.168.0.117:3000
echo.
echo    Press Ctrl+C to stop
echo.
C:\Program Files\nodejs\npx.cmd vite --host 0.0.0.0 --port 3000

pause

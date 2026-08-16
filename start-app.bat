@echo off
title سليم HR
echo ========================================
echo    سليم HR - نظام إدارة الموارد البشرية
echo ========================================
echo.
echo جاري فتح التطبيق...
echo.

REM Check if Electron is installed
IF EXIST "node_modules\electron\cli.js" (
    npx electron electron/main.js
) ELSE (
    echo.
    echo [خطأ] Electron مش متثبت!
    echo.
    echo 1. افتح موجه الأوامر (CMD) في هذا المجلد
    echo 2. شغل: npm install
    echo 3. شغل: npm start
    echo.
    pause
)

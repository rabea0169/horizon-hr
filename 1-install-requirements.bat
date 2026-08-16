@echo off
REM ═══════════════════════════════════════════════════════════════
REM  سكريبت تثبيت متطلبات نظام Horizon HR
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     تثبيت متطلبات نظام Horizon HR - نظام إدارة الموارد البشرية   ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM التحقق من Node.js
echo [1/3] التحقق من تثبيت Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js غير مثبت!
    echo الرجاء تحميل وتثبيت Node.js من: https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✓ Node.js مثبت
    node --version
)

echo.

REM التحقق من npm
echo [2/3] التحقق من تثبيت npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm غير مثبت!
    pause
    exit /b 1
) else (
    echo ✓ npm مثبت
    npm --version
)

echo.

REM تثبيت المتطلبات
echo [3/3] تثبيت المتطلبات (قد يستغرق عدة دقائق)...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء التثبيت!
    pause
    exit /b 1
) else (
    echo.
    echo ✓ تم التثبيت بنجاح!
    echo.
    echo الخطوات التالية:
    echo 1. عدّل ملف .env بمعلومات قاعدة البيانات
    echo 2. شغّل: 2-تشغيل-في-المتصفح.bat
    echo    أو: 3-تشغيل-تطبيق-Electron.bat
    echo.
    pause
)

@echo off
REM ═══════════════════════════════════════════════════════════════
REM  سكريبت تشغيل تطبيق Electron
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     تشغيل تطبيق Horizon HR - Electron                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo ❌ المتطلبات غير مثبتة!
    echo الرجاء تشغيل: 1-تثبيت-المتطلبات.bat
    pause
    exit /b 1
)

echo ⏳ جاري تشغيل التطبيق...
echo.

REM تشغيل Electron في وضع التطوير
npm run electron

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء التشغيل!
    pause
    exit /b 1
)

pause

@echo off
REM ═══════════════════════════════════════════════════════════════
REM  سكريبت تشغيل نظام Horizon HR في المتصفح
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     تشغيل نظام Horizon HR في المتصفح                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo ❌ المتطلبات غير مثبتة!
    echo الرجاء تشغيل: 1-تثبيت-المتطلبات.bat
    pause
    exit /b 1
)

echo ⏳ جاري البناء والتشغيل...
echo.

REM بناء المشروع
echo ⏳ جاري بناء ملفات المشروع...
call npm run build && (
    echo ✓ تم البناء بنجاح
) || (
    echo ❌ فشل البناء! تحقق من الأخطاء أعلاه
    pause
    exit /b 1
)

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء البناء!
    pause
    exit /b 1
)

echo.
echo ✓ تم البناء بنجاح!
echo.
echo 🚀 جاري تشغيل الخادم على http://localhost:3000
echo.
echo اضغط Ctrl+C لإيقاف الخادم
echo.

REM تشغيل الخادم
call npm run start

pause

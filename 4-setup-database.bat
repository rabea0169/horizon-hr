@echo off
REM ═══════════════════════════════════════════════════════════════
REM  سكريبت إعداد قاعدة البيانات
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     إعداد قاعدة البيانات - Horizon HR                        ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo ❌ المتطلبات غير مثبتة!
    echo الرجاء تشغيل: 1-تثبيت-المتطلبات.bat
    pause
    exit /b 1
)

REM التحقق من ملف .env
if not exist ".env" (
    echo ❌ ملف .env غير موجود!
    echo الرجاء نسخ .env.example إلى .env وتعديله
    echo.
    copy .env.example .env
    echo ✓ تم إنشاء ملف .env
    echo الرجاء تعديل ملف .env بمعلومات قاعدة البيانات ثم شغّل هذا السكريبت مجدداً
    pause
    exit /b 1
)

echo ⏳ جاري توليد ملفات الهجرة...
npm run db:generate

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء توليد الهجرات!
    pause
    exit /b 1
)

echo.
echo ✓ تم توليد الهجرات بنجاح!
echo.
echo ⏳ جاري تطبيق الهجرات على قاعدة البيانات...
npm run db:push

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء تطبيق الهجرات!
    echo تأكد من:
    echo 1. تشغيل MySQL Server
    echo 2. صحة بيانات الاتصال في ملف .env
    echo 3. وجود قاعدة البيانات
    pause
    exit /b 1
)

echo.
echo ✓ تم إعداد قاعدة البيانات بنجاح!
echo.
echo الخطوات التالية:
echo 1. شغّل: 2-تشغيل-في-المتصفح.bat
echo    أو: 3-تشغيل-تطبيق-Electron.bat
echo.
pause

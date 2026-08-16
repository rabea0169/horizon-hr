@echo off
REM ═══════════════════════════════════════════════════════════════
REM  سكريبت بناء تطبيق الأندرويد
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║     بناء تطبيق Horizon HR - Android                          ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

REM التحقق من وجود node_modules
if not exist "node_modules" (
    echo ❌ المتطلبات غير مثبتة!
    echo الرجاء تشغيل: 1-تثبيت-المتطلبات.bat
    pause
    exit /b 1
)

REM التحقق من Android Studio
where adb >nul 2>&1
if errorlevel 1 (
    echo ⚠️  تحذير: Android SDK غير موجود في PATH
    echo تأكد من تثبيت Android Studio
    echo.
)

echo ⏳ جاري البناء...
npm run build

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء البناء!
    pause
    exit /b 1
)

echo.
echo ✓ تم البناء بنجاح!
echo.
echo ⏳ جاري مزامنة Capacitor...
call npx cap sync android

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء المزامنة!
    pause
    exit /b 1
)

echo.
echo ✓ تم المزامنة بنجاح!
echo.
echo ⏳ جاري فتح Android Studio...
call npx cap open android

if errorlevel 1 (
    echo.
    echo ❌ حدث خطأ أثناء فتح Android Studio!
    echo تأكد من تثبيت Android Studio
    pause
    exit /b 1
)

echo.
echo ✓ تم فتح Android Studio!
echo.
echo الخطوات التالية في Android Studio:
echo 1. اختر جهاز محاكي أو جهاز حقيقي
echo 2. اضغط على Run (Shift+F10)
echo 3. سيتم بناء وتثبيت التطبيق
echo.
pause

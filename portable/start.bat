@echo off
chcp 65001 >nul
title Horizon HR - Portable Server
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          Horizon HR - النسخة المحمولة                       ║
echo ║          يعمل مباشرة من USB بدون تثبيت                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM تحقق من وجود Node.js
WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [❌] Node.js غير موجود!
    echo [ℹ️]  جاري استخدام Node.js المحمول...
    set "NODE_PATH=%~dp0node-win"
    set "PATH=%NODE_PATH%;%PATH%"
)

REM تعيين متغيرات البيئة
set "PORTABLE_DIR=%~dp0"
set "NODE_ENV=production"
set "PORT=3000"
set "DATABASE_URL=mysql://root@localhost:3306/horizon_hr"

REM قراءة إعدادات الخادم من server.json إن وجد
if exist "%PORTABLE_DIR%server.json" (
    echo [✓] تم العثور على إعدادات الخادم
) else (
    echo [ℹ️]  إنشاء إعدادات افتراضية...
    echo {"port":3000,"dbType":"sqlite","autoOpen":true} > "%PORTABLE_DIR%server.json"
)

echo.
echo [✓] المجلد: %PORTABLE_DIR%
echo [✓] المنفذ: 3000
echo [✓] قاعدة البيانات: SQLite (محلية)
echo.

cd /d "%PORTABLE_DIR%"

echo [🚀] تشغيل الخادم...
echo [ℹ️]  افتح المتصفح على: http://localhost:3000
echo [ℹ️]  أو على الهاتف بنفس شبكة WiFi:
echo [ℹ️]  استكشف IP الجهاز ثم افتح: http://[IP]:3000
echo.
echo [⚡] اضغط Ctrl+C لإيقاف الخادم
echo ══════════════════════════════════════════════════════════════
echo.

node server.js

echo.
echo [👋] تم إيقاف الخادم. شكراً لاستخدام Horizon HR!
pause

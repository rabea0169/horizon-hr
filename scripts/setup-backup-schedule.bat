@echo off
:: ═══════════════════════════════════════════════════════════════
:: setup-backup-schedule.bat
:: إعداد مهمة Windows Task Scheduler لنسخ احتياطية يومية
:: يُشغَّل مرة واحدة فقط كمدير (Administrator)
:: ═══════════════════════════════════════════════════════════════

echo ╔══════════════════════════════════════════════════════╗
echo ║   إعداد النسخ الاحتياطي التلقائي - Horizon HR ERP   ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: التحقق من صلاحيات المدير
net session >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo ✗ يجب تشغيل هذا الملف كمدير (Run as Administrator)
    pause
    exit /b 1
)

:: مسار سكريبت النسخ الاحتياطي
SET SCRIPT_PATH=%~dp0backup-database.bat

:: إنشاء مجلد النسخ الاحتياطية
IF NOT EXIST "C:\horizon-hr\backups" MKDIR "C:\horizon-hr\backups"

:: إنشاء مهمة مجدولة يومياً الساعة 2 صباحاً
schtasks /Create ^
    /SC DAILY ^
    /TN "HorizonHR_DailyBackup" ^
    /TR "\"%SCRIPT_PATH%\"" ^
    /ST 02:00 ^
    /RU SYSTEM ^
    /RL HIGHEST ^
    /F

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ تم إعداد النسخ الاحتياطي بنجاح!
    echo   المهمة: HorizonHR_DailyBackup
    echo   التوقيت: يومياً الساعة 2:00 صباحاً
    echo   الملفات: C:\horizon-hr\backups\
    echo.
    echo ✓ لعرض المهمة:
    echo   schtasks /Query /TN "HorizonHR_DailyBackup"
    echo.
    echo ✓ لتشغيل النسخ الاحتياطي يدوياً الآن:
    echo   schtasks /Run /TN "HorizonHR_DailyBackup"
) ELSE (
    echo.
    echo ✗ فشل إعداد المهمة المجدولة!
)

pause

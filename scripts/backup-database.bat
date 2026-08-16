@echo off
:: ═══════════════════════════════════════════════════════════════
:: backup-database.bat — نسخ احتياطي تلقائي لقاعدة البيانات
:: يُشغَّل يومياً عبر Windows Task Scheduler
::
:: إعداد المجدول:
::   schtasks /Create /SC DAILY /TN "HorizonHR_Backup" /TR "C:\horizon-hr\scripts\backup-database.bat" /ST 02:00
:: ═══════════════════════════════════════════════════════════════
SETLOCAL

:: ─── إعدادات قاعدة البيانات ───────────────────────────────────
SET DB_HOST=localhost
SET DB_PORT=3306
SET DB_NAME=horizon_hr
SET DB_USER=hr_user
SET DB_PASS=YOUR_DB_PASSWORD_HERE

:: ─── مسار حفظ النسخ الاحتياطية ───────────────────────────────
SET BACKUP_DIR=C:\horizon-hr\backups
IF NOT EXIST "%BACKUP_DIR%" MKDIR "%BACKUP_DIR%"

:: ─── اسم الملف مع التاريخ والوقت ─────────────────────────────
FOR /F "tokens=1-3 delims=/ " %%A IN ("%DATE%") DO (
    SET BACKUP_DATE=%%C-%%B-%%A
)
FOR /F "tokens=1-2 delims=: " %%A IN ("%TIME%") DO (
    SET BACKUP_TIME=%%A%%B
)
SET BACKUP_FILE=%BACKUP_DIR%\horizon_hr_%BACKUP_DATE%_T%BACKUP_TIME%.sql.gz

:: ─── تنفيذ النسخة الاحتياطية ──────────────────────────────────
echo [%DATE% %TIME%] Starting backup...
mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% ^
    --single-transaction ^
    --routines ^
    --triggers ^
    --events ^
    --hex-blob ^
    --add-drop-table ^
    %DB_NAME% | gzip > "%BACKUP_FILE%"

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] ✓ Backup saved to: %BACKUP_FILE%
) ELSE (
    echo [%DATE% %TIME%] ✗ Backup FAILED!
    exit /b 1
)

:: ─── حذف النسخ الأقدم من 30 يوم ─────────────────────────────
echo [%DATE% %TIME%] Cleaning old backups (>30 days)...
forfiles /P "%BACKUP_DIR%" /M "*.gz" /D -30 /C "cmd /c del @path" 2>NUL
echo [%DATE% %TIME%] ✓ Cleanup done.

ENDLOCAL

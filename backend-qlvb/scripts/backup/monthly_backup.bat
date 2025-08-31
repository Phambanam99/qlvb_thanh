@echo off
setlocal enabledelayedexpansion

:: ========================================
::     BACKUP HÀNG THÁNG HỆ THỐNG QLVB
:: ========================================
:: Script backup toàn diện hàng tháng bao gồm source code
:: Author: System Administrator
:: Date: 2025-08-03

:: Load cấu hình
call "%~dp0config.bat" export

echo.
echo ========================================
echo     BACKUP HÀNG THÁNG HỆ THỐNG QLVB
echo ========================================
echo Bắt đầu lúc: %date% %time%
echo.

:: Tạo thư mục backup tháng
set MONTH_YEAR=%date:~3,2%-%date:~6,4%
set MONTHLY_FOLDER=%BACKUP_ROOT%\Monthly\%MONTH_YEAR%
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if not exist "%BACKUP_ROOT%\Monthly" mkdir "%BACKUP_ROOT%\Monthly"
if not exist "%MONTHLY_FOLDER%" mkdir "%MONTHLY_FOLDER%"

:: Log file cho backup tháng
set LOG_FILE=%MONTHLY_FOLDER%\monthly_backup_%TIMESTAMP%.log

echo [%date% %time%] Bắt đầu backup tháng %MONTH_YEAR% > "%LOG_FILE%"
echo Database: %DB_NAME% >> "%LOG_FILE%"
echo Server: %DB_SERVER% >> "%LOG_FILE%"
echo Project: %PROJECT_PATH% >> "%LOG_FILE%"
echo Monthly Folder: %MONTHLY_FOLDER% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

:: Kiểm tra kết nối database
echo Kiểm tra kết nối database...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "SELECT GETDATE() AS CurrentTime" > nul 2>&1

if errorlevel 1 (
    echo [ERROR] Không thể kết nối database! >> "%LOG_FILE%"
    echo ✗ LỖI: Không thể kết nối database
    goto :error
)

echo ✓ Kết nối database thành công

:: ==========================================
:: BƯỚC 1: BACKUP DATABASE (FULL BACKUP)
:: ==========================================
echo.
echo [1/5] Đang tạo full backup database...
echo [%date% %time%] Bắt đầu full backup database >> "%LOG_FILE%"

:: Tạo full backup với tên đặc biệt cho tháng
set DB_BACKUP_FILE=%MONTHLY_FOLDER%\%DB_NAME%_Monthly_%TIMESTAMP%.bak

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "BACKUP DATABASE [%DB_NAME%] TO DISK = '%DB_BACKUP_FILE%' WITH COMPRESSION, CHECKSUM, INIT, FORMAT, STATS = 10, DESCRIPTION = N'QLVB Monthly Full Backup'" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
    echo [%date% %time%] LỖI: Full backup database thất bại >> "%LOG_FILE%"
    echo ✗ LỖI: Full backup database thất bại
    goto :error
)

echo ✓ Full backup database hoàn thành
echo [%date% %time%] Full backup database thành công: %DB_BACKUP_FILE% >> "%LOG_FILE%"

:: ==========================================
:: BƯỚC 2: BACKUP TOÀN BỘ SOURCE CODE
:: ==========================================
echo.
echo [2/5] Đang backup source code...
echo [%date% %time%] Bắt đầu backup source code >> "%LOG_FILE%"

set SOURCE_BACKUP_FOLDER=%MONTHLY_FOLDER%\SourceCode

:: Tạo thư mục source code backup
mkdir "%SOURCE_BACKUP_FOLDER%" 2>nul

:: Copy toàn bộ project (trừ các thư mục không cần thiết)
echo Đang copy source code...
xcopy "%PROJECT_PATH%" "%SOURCE_BACKUP_FOLDER%\" /E /Y /I /Q /EXCLUDE:"%~dp0exclude_list.txt" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
    echo [%date% %time%] LỖI: Backup source code thất bại >> "%LOG_FILE%"
    echo ✗ LỖI: Backup source code thất bại
    goto :error
)

echo ✓ Backup source code hoàn thành
echo [%date% %time%] Backup source code thành công >> "%LOG_FILE%"

:: ==========================================
:: BƯỚC 3: BACKUP CONFIGURATION FILES
:: ==========================================
echo.
echo [3/5] Đang backup configuration files...
echo [%date% %time%] Bắt đầu backup configurations >> "%LOG_FILE%"

set CONFIG_BACKUP_FOLDER=%MONTHLY_FOLDER%\Configurations

mkdir "%CONFIG_BACKUP_FOLDER%" 2>nul

:: Backup các file cấu hình quan trọng
copy "%PROJECT_PATH%\src\main\resources\application.properties" "%CONFIG_BACKUP_FOLDER%\" >> "%LOG_FILE%" 2>&1
copy "%PROJECT_PATH%\src\main\resources\application-*.properties" "%CONFIG_BACKUP_FOLDER%\" >> "%LOG_FILE%" 2>&1
copy "%PROJECT_PATH%\build.gradle" "%CONFIG_BACKUP_FOLDER%\" >> "%LOG_FILE%" 2>&1
copy "%PROJECT_PATH%\settings.gradle" "%CONFIG_BACKUP_FOLDER%\" >> "%LOG_FILE%" 2>&1
copy "%PROJECT_PATH%\docker-compose.yml" "%CONFIG_BACKUP_FOLDER%\" >> "%LOG_FILE%" 2>&1
copy "%PROJECT_PATH%\Dockerfile*" "%CONFIG_BACKUP_FOLDER%\" >> "%LOG_FILE%" 2>&1

echo ✓ Backup configurations hoàn thành
echo [%date% %time%] Backup configurations thành công >> "%LOG_FILE%"

:: ==========================================
:: BƯỚC 4: BACKUP DATA VÀ UPLOADS
:: ==========================================
echo.
echo [4/5] Đang backup data và uploads...
echo [%date% %time%] Bắt đầu backup data folders >> "%LOG_FILE%"

set DATA_BACKUP_FOLDER=%MONTHLY_FOLDER%\DataFiles

mkdir "%DATA_BACKUP_FOLDER%" 2>nul
mkdir "%DATA_BACKUP_FOLDER%\data" 2>nul
mkdir "%DATA_BACKUP_FOLDER%\document-uploads" 2>nul
mkdir "%DATA_BACKUP_FOLDER%\signature-uploads" 2>nul
mkdir "%DATA_BACKUP_FOLDER%\uploads" 2>nul

:: Backup từng thư mục data
if exist "%PROJECT_PATH%\data" (
    xcopy "%PROJECT_PATH%\data\*" "%DATA_BACKUP_FOLDER%\data\" /E /Y /I /Q >> "%LOG_FILE%" 2>&1
)

if exist "%PROJECT_PATH%\document-uploads" (
    xcopy "%PROJECT_PATH%\document-uploads\*" "%DATA_BACKUP_FOLDER%\document-uploads\" /E /Y /I /Q >> "%LOG_FILE%" 2>&1
)

if exist "%PROJECT_PATH%\signature-uploads" (
    xcopy "%PROJECT_PATH%\signature-uploads\*" "%DATA_BACKUP_FOLDER%\signature-uploads\" /E /Y /I /Q >> "%LOG_FILE%" 2>&1
)

if exist "%PROJECT_PATH%\uploads" (
    xcopy "%PROJECT_PATH%\uploads\*" "%DATA_BACKUP_FOLDER%\uploads\" /E /Y /I /Q >> "%LOG_FILE%" 2>&1
)

echo ✓ Backup data folders hoàn thành
echo [%date% %time%] Backup data folders thành công >> "%LOG_FILE%"

:: ==========================================
:: BƯỚC 5: NÉN VÀ HOÀN THIỆN
:: ==========================================
echo.
echo [5/5] Đang nén backup tháng...
echo [%date% %time%] Bắt đầu nén backup tháng >> "%LOG_FILE%"

:: Tạo file thống kê
echo THỐNG KÊ BACKUP THÁNG %MONTH_YEAR% > "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo ================================== >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo Ngày tạo: %date% %time% >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo Database: %DB_NAME% >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo Server: %DB_SERVER% >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo Project Path: %PROJECT_PATH% >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo. >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo NỘI DUNG BACKUP: >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo - Database full backup (.bak) >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo - Source code đầy đủ >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo - Configuration files >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo - Data và upload folders >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"
echo - Logs và documentation >> "%MONTHLY_FOLDER%\BACKUP_SUMMARY.txt"

:: Nén toàn bộ thư mục backup tháng
set MONTHLY_ZIP=%BACKUP_ROOT%\Monthly\QLVB_Monthly_%MONTH_YEAR%_%TIMESTAMP%.zip

powershell "Compress-Archive -Path '%MONTHLY_FOLDER%\*' -DestinationPath '%MONTHLY_ZIP%' -Force" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
    echo [%date% %time%] LỖI: Nén backup tháng thất bại >> "%LOG_FILE%"
    echo ✗ LỖI: Nén backup tháng thất bại
    goto :error
)

:: Xóa thư mục tạm sau khi nén
rmdir "%MONTHLY_FOLDER%" /S /Q

echo ✓ Nén backup hoàn thành
echo [%date% %time%] Nén backup thành công: %MONTHLY_ZIP% >> "%LOG_FILE%"

:: ==========================================
:: DỌN DẸP BACKUP THÁNG CŨ
:: ==========================================
echo.
echo Đang dọn dẹp backup tháng cũ (giữ lại 12 tháng)...

:: Xóa backup tháng cũ hơn 12 tháng
forfiles /p "%BACKUP_ROOT%\Monthly" /m *.zip /d -365 /c "cmd /c del @path" 2>nul

:: ==========================================
:: THỐNG KÊ BACKUP
:: ==========================================
echo.
echo ========================================
echo         THỐNG KÊ BACKUP THÁNG
echo ========================================

:: Hiển thị kích thước backup
for %%F in ("%MONTHLY_ZIP%") do set BACKUP_SIZE=%%~zF
set /a "BACKUP_SIZE_MB=%BACKUP_SIZE%/1024/1024"

echo Backup file: %MONTHLY_ZIP%
echo Kích thước: %BACKUP_SIZE_MB% MB
echo Tháng/Năm: %MONTH_YEAR%

:: Đếm số backup tháng hiện có
for /f %%i in ('dir /b "%BACKUP_ROOT%\Monthly\*.zip" 2^>nul ^| find /c /v ""') do set MONTHLY_COUNT=%%i
echo Tổng backup tháng: %MONTHLY_COUNT% files

echo.
echo ✓ BACKUP HÀNG THÁNG HOÀN THÀNH THÀNH CÔNG!
echo Thời gian hoàn thành: %date% %time%
echo File backup: %MONTHLY_ZIP%

:: Log kết quả
echo [%date% %time%] Backup tháng hoàn thành thành công >> "%LOG_FILE%"
echo File backup: %MONTHLY_ZIP% >> "%LOG_FILE%"
echo Kích thước: %BACKUP_SIZE_MB% MB >> "%LOG_FILE%"

:: Gửi email thông báo nếu được bật
if "%ENABLE_EMAIL_NOTIFICATION%"=="true" (
    call "%~dp0send_notification.bat" "SUCCESS" "Backup tháng %MONTH_YEAR% thành công" "%LOG_FILE%"
)

goto :end

:error
echo.
echo ========================================
echo         BACKUP THÁNG THẤT BẠI!
echo ========================================
echo Thời gian lỗi: %date% %time%
echo Chi tiết lỗi trong file: %LOG_FILE%
echo.

:: Gửi email cảnh báo nếu được bật
if "%ENABLE_EMAIL_NOTIFICATION%"=="true" (
    call "%~dp0send_notification.bat" "ERROR" "Backup tháng %MONTH_YEAR% thất bại" "%LOG_FILE%"
)

exit /b 1

:end
echo.
echo Nhấn phím bất kỳ để đóng...
pause > nul
endlocal
exit /b 0

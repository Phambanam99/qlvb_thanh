@echo off
setlocal enabledelayedexpansion

:: ========================================
::     BACKUP HÀNG NGÀY HỆ THỐNG QLVB
:: ========================================
:: Script tự động backup database và files mỗi ngày
:: Author: System Administrator
:: Date: 2025-08-03

:: Load cấu hình từ config.bat
call "%~dp0config.bat" export

echo.
echo ========================================
echo     BACKUP HÀNG NGÀY HỆ THỐNG QLVB
echo ========================================
echo Bắt đầu lúc: %date% %time%
echo.

:: Tạo thư mục backup
if not exist "%BACKUP_ROOT%" (
    echo Tạo thư mục backup: %BACKUP_ROOT%
    mkdir "%BACKUP_ROOT%"
)

if not exist "%BACKUP_ROOT%\Daily" (
    mkdir "%BACKUP_ROOT%\Daily"
)

if not exist "%BACKUP_ROOT%\Files" (
    mkdir "%BACKUP_ROOT%\Files"
)

:: Log file cho session này
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOG_FILE=%BACKUP_ROOT%\backup_daily_%TIMESTAMP%.log

echo [%date% %time%] Bắt đầu backup hàng ngày > "%LOG_FILE%"
echo Database: %DB_NAME% >> "%LOG_FILE%"
echo Server: %DB_SERVER% >> "%LOG_FILE%"
echo Project: %PROJECT_PATH% >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

:: Kiểm tra kết nối database
echo Kiểm tra kết nối database...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "SELECT GETDATE() AS CurrentTime" > nul 2>&1

if errorlevel 1 (
    echo [ERROR] Không thể kết nối database! >> "%LOG_FILE%"
    echo ✗ LỖI: Không thể kết nối database %DB_SERVER%
    echo Vui lòng kiểm tra:
    echo - SQL Server đã chạy chưa?
    echo - Thông tin đăng nhập đúng chưa?
    echo - Firewall có chặn không?
    goto :error
)

echo ✓ Kết nối database thành công

:: ==========================================
:: BƯỚC 1: BACKUP DATABASE
:: ==========================================
echo.
echo [1/3] Đang backup database...
echo [%date% %time%] Bắt đầu backup database >> "%LOG_FILE%"

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -d %DB_NAME% -i "%~dp0backup_database.sql" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
    echo [%date% %time%] LỖI: Backup database thất bại >> "%LOG_FILE%"
    echo ✗ LỖI: Backup database thất bại
    goto :error
)

echo ✓ Backup database hoàn thành
echo [%date% %time%] Backup database thành công >> "%LOG_FILE%"

:: ==========================================
:: BƯỚC 2: BACKUP FILES VÀ DATA
:: ==========================================
echo.
echo [2/3] Đang backup files và data...
echo [%date% %time%] Bắt đầu backup files >> "%LOG_FILE%"

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -d %DB_NAME% -i "%~dp0backup_data_folders.sql" >> "%LOG_FILE%" 2>&1

if errorlevel 1 (
    echo [%date% %time%] LỖI: Backup files thất bại >> "%LOG_FILE%"
    echo ✗ LỖI: Backup files thất bại
    goto :error
)

echo ✓ Backup files hoàn thành
echo [%date% %time%] Backup files thành công >> "%LOG_FILE%"

:: ==========================================
:: BƯỚC 3: DỌN DẸP BACKUP CŨ
:: ==========================================
echo.
echo [3/3] Đang dọn dẹp backup cũ...
echo [%date% %time%] Bắt đầu dọn dẹp backup cũ (giữ %BACKUP_RETENTION_DAYS% ngày) >> "%LOG_FILE%"

:: Xóa database backup cũ
forfiles /p "%BACKUP_ROOT%\Daily" /m *.bak /d -%BACKUP_RETENTION_DAYS% /c "cmd /c del @path" 2>nul
if not errorlevel 1 (
    echo ✓ Đã xóa database backup cũ
    echo [%date% %time%] Đã xóa database backup cũ >> "%LOG_FILE%"
)

:: Xóa files backup cũ
forfiles /p "%BACKUP_ROOT%\Files" /m *.zip /d -%BACKUP_RETENTION_DAYS% /c "cmd /c del @path" 2>nul
if not errorlevel 1 (
    echo ✓ Đã xóa files backup cũ
    echo [%date% %time%] Đã xóa files backup cũ >> "%LOG_FILE%"
)

:: Xóa log cũ
forfiles /p "%BACKUP_ROOT%" /m backup_daily_*.log /d -%BACKUP_RETENTION_DAYS% /c "cmd /c del @path" 2>nul

:: ==========================================
:: THỐNG KÊ BACKUP
:: ==========================================
echo.
echo ========================================
echo           THỐNG KÊ BACKUP
echo ========================================

:: Đếm số file backup
for /f %%i in ('dir /b "%BACKUP_ROOT%\Daily\*.bak" 2^>nul ^| find /c /v ""') do set DB_COUNT=%%i
for /f %%i in ('dir /b "%BACKUP_ROOT%\Files\*.zip" 2^>nul ^| find /c /v ""') do set FILES_COUNT=%%i

echo Database backups: %DB_COUNT% files
echo Files backups: %FILES_COUNT% files

:: Hiển thị dung lượng thư mục backup
for /f "tokens=3" %%a in ('dir /-c "%BACKUP_ROOT%" ^| find "File(s)"') do set BACKUP_SIZE=%%a
echo Tổng dung lượng: %BACKUP_SIZE% bytes

echo.
echo ✓ BACKUP HÀNG NGÀY HOÀN THÀNH THÀNH CÔNG!
echo Thời gian hoàn thành: %date% %time%
echo Log file: %LOG_FILE%

echo [%date% %time%] Backup hàng ngày hoàn thành thành công >> "%LOG_FILE%"
echo Tổng database backups: %DB_COUNT% >> "%LOG_FILE%"
echo Tổng files backups: %FILES_COUNT% >> "%LOG_FILE%"
echo Dung lượng backup: %BACKUP_SIZE% bytes >> "%LOG_FILE%"

:: Gửi email thông báo nếu được bật
if "%ENABLE_EMAIL_NOTIFICATION%"=="true" (
    call "%~dp0send_notification.bat" "SUCCESS" "Backup hàng ngày thành công" "%LOG_FILE%"
)

goto :end

:error
echo.
echo ========================================
echo           BACKUP THẤT BẠI!
echo ========================================
echo Thời gian lỗi: %date% %time%
echo Chi tiết lỗi trong file: %LOG_FILE%
echo.
echo [%date% %time%] BACKUP THẤT BẠI! >> "%LOG_FILE%"

:: Gửi email cảnh báo nếu được bật
if "%ENABLE_EMAIL_NOTIFICATION%"=="true" (
    call "%~dp0send_notification.bat" "ERROR" "Backup hàng ngày thất bại" "%LOG_FILE%"
)

exit /b 1

:end
echo.
echo Nhấn phím bất kỳ để đóng...
pause > nul
endlocal
exit /b 0

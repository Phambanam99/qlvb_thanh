@echo off
setlocal enabledelayedexpansion

:: ========================================
::     KHÔI PHỤC BACKUP HỆ THỐNG QLVB
:: ========================================
:: Script khôi phục database và files từ backup
:: Author: System Administrator
:: Date: 2025-08-03

echo.
echo ========================================
echo     KHÔI PHỤC BACKUP HỆ THỐNG QLVB
echo ========================================
echo.

:: Load cấu hình
call "%~dp0config.bat" export

echo THÔNG TIN HỆ THỐNG:
echo ===================
echo Database: %DB_NAME%
echo Server: %DB_SERVER%
echo Backup Path: %BACKUP_ROOT%
echo.

echo ⚠️  CẢNH BÁO QUAN TRỌNG ⚠️
echo ========================
echo Thao tác này sẽ:
echo - GHI ĐÈ toàn bộ database hiện tại
echo - THAY THẾ tất cả files data hiện có
echo - KHÔNG THỂ hoàn tác sau khi thực hiện
echo.
echo Vui lòng đảm bảo:
echo ✓ Đã dừng ứng dụng QLVB
echo ✓ Không có user nào đang kết nối database
echo ✓ Đã backup dữ liệu hiện tại (nếu cần)
echo.

set /p CONFIRM1=Bạn có chắc chắn muốn tiếp tục? (YES/NO): 
if /i not "%CONFIRM1%"=="YES" (
    echo Hủy quá trình khôi phục backup.
    goto :end
)

:: ==========================================
:: BƯỚC 1: CHỌN LOẠI BACKUP
:: ==========================================
echo.
echo ========================================
echo         CHỌN LOẠI BACKUP
echo ========================================
echo.
echo [1] Database backup (*.bak files)
echo [2] Monthly backup (*.zip files)
echo [3] Khôi phục từ đường dẫn tùy chỉnh
echo.

set /p BACKUP_TYPE=Chọn loại backup (1-3): 

if "%BACKUP_TYPE%"=="1" goto :restore_database
if "%BACKUP_TYPE%"=="2" goto :restore_monthly
if "%BACKUP_TYPE%"=="3" goto :restore_custom
echo Lựa chọn không hợp lệ!
goto :end

:: ==========================================
:: KHÔI PHỤC DATABASE BACKUP
:: ==========================================
:restore_database
echo.
echo ========================================
echo      KHÔI PHỤC DATABASE BACKUP
echo ========================================
echo.

:: Hiển thị danh sách database backup
echo DANH SÁCH DATABASE BACKUP CÓ SẴN:
echo ==================================
if exist "%BACKUP_ROOT%\Daily\*.bak" (
    echo.
    echo Database backups trong %BACKUP_ROOT%\Daily\:
    dir /b /o-d "%BACKUP_ROOT%\Daily\*.bak" 2>nul | findstr /v "^$"
)
echo.

set /p DB_BACKUP_FILE=Nhập tên file backup (.bak): 

:: Kiểm tra file tồn tại
set FULL_DB_BACKUP_PATH=%BACKUP_ROOT%\Daily\%DB_BACKUP_FILE%
if not exist "%FULL_DB_BACKUP_PATH%" (
    echo ✗ LỖI: File backup không tồn tại: %FULL_DB_BACKUP_PATH%
    goto :end
)

echo.
echo File backup: %FULL_DB_BACKUP_PATH%
set /p FINAL_CONFIRM=XÁC NHẬN CUỐI: Khôi phục database từ file này? (YES/NO): 
if /i not "%FINAL_CONFIRM%"=="YES" (
    echo Hủy khôi phục database.
    goto :end
)

echo.
echo Đang khôi phục database...

:: Ngắt kết nối users
echo [1/4] Ngắt kết nối users khỏi database...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE" >nul 2>&1

:: Khôi phục database
echo [2/4] Đang khôi phục database từ backup...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "RESTORE DATABASE [%DB_NAME%] FROM DISK = '%FULL_DB_BACKUP_PATH%' WITH REPLACE, STATS = 10"

if errorlevel 1 (
    echo ✗ LỖI: Khôi phục database thất bại!
    echo Đang khôi phục chế độ multi-user...
    sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER" >nul 2>&1
    goto :error
)

:: Khôi phục multi-user mode
echo [3/4] Khôi phục chế độ multi-user...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER" >nul 2>&1

echo [4/4] Kiểm tra tính toàn vẹn database...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -d %DB_NAME% -Q "DBCC CHECKDB('%DB_NAME%') WITH NO_INFOMSGS" >nul 2>&1

echo.
echo ✓ KHÔI PHỤC DATABASE THÀNH CÔNG!
echo Database: %DB_NAME%
echo Từ file: %DB_BACKUP_FILE%
echo Thời gian: %date% %time%

goto :end

:: ==========================================
:: KHÔI PHỤC MONTHLY BACKUP
:: ==========================================
:restore_monthly
echo.
echo ========================================
echo      KHÔI PHỤC MONTHLY BACKUP
echo ========================================
echo.

:: Hiển thị danh sách monthly backup
echo DANH SÁCH MONTHLY BACKUP CÓ SẴN:
echo ===============================
if exist "%BACKUP_ROOT%\Monthly\*.zip" (
    echo.
    dir /b /o-d "%BACKUP_ROOT%\Monthly\*.zip" 2>nul | findstr /v "^$"
)
echo.

set /p MONTHLY_BACKUP_FILE=Nhập tên file monthly backup (.zip): 

set FULL_MONTHLY_BACKUP_PATH=%BACKUP_ROOT%\Monthly\%MONTHLY_BACKUP_FILE%
if not exist "%FULL_MONTHLY_BACKUP_PATH%" (
    echo ✗ LỖI: File backup không tồn tại: %FULL_MONTHLY_BACKUP_PATH%
    goto :end
)

echo.
echo File backup: %FULL_MONTHLY_BACKUP_PATH%
set /p FINAL_CONFIRM=XÁC NHẬN CUỐI: Khôi phục toàn bộ từ monthly backup? (YES/NO): 
if /i not "%FINAL_CONFIRM%"=="YES" (
    echo Hủy khôi phục monthly backup.
    goto :end
)

:: Tạo thư mục tạm để giải nén
set TEMP_RESTORE_FOLDER=%BACKUP_ROOT%\TempRestore_%RANDOM%
mkdir "%TEMP_RESTORE_FOLDER%" 2>nul

echo.
echo Đang khôi phục monthly backup...

:: Giải nén monthly backup
echo [1/5] Đang giải nén monthly backup...
powershell "Expand-Archive -Path '%FULL_MONTHLY_BACKUP_PATH%' -DestinationPath '%TEMP_RESTORE_FOLDER%' -Force" >nul 2>&1

if errorlevel 1 (
    echo ✗ LỖI: Không thể giải nén monthly backup!
    rmdir "%TEMP_RESTORE_FOLDER%" /S /Q 2>nul
    goto :error
)

:: Tìm file database backup trong monthly backup
echo [2/5] Tìm database backup trong monthly backup...
for %%f in ("%TEMP_RESTORE_FOLDER%\*.bak") do (
    set MONTHLY_DB_FILE=%%f
    goto :found_db
)

echo ✗ LỖI: Không tìm thấy database backup trong monthly backup!
rmdir "%TEMP_RESTORE_FOLDER%" /S /Q 2>nul
goto :error

:found_db
echo Database backup: !MONTHLY_DB_FILE!

:: Khôi phục database từ monthly backup
echo [3/5] Khôi phục database...
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE" >nul 2>&1
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "RESTORE DATABASE [%DB_NAME%] FROM DISK = '!MONTHLY_DB_FILE!' WITH REPLACE, STATS = 10"

if errorlevel 1 (
    echo ✗ LỖI: Khôi phục database từ monthly backup thất bại!
    sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER" >nul 2>&1
    rmdir "%TEMP_RESTORE_FOLDER%" /S /Q 2>nul
    goto :error
)

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER" >nul 2>&1

:: Khôi phục data files
echo [4/5] Khôi phục data files...
if exist "%TEMP_RESTORE_FOLDER%\DataFiles\" (
    if exist "%PROJECT_PATH%\data\" rmdir "%PROJECT_PATH%\data" /S /Q 2>nul
    if exist "%PROJECT_PATH%\document-uploads\" rmdir "%PROJECT_PATH%\document-uploads" /S /Q 2>nul
    if exist "%PROJECT_PATH%\signature-uploads\" rmdir "%PROJECT_PATH%\signature-uploads" /S /Q 2>nul
    if exist "%PROJECT_PATH%\uploads\" rmdir "%PROJECT_PATH%\uploads" /S /Q 2>nul
    
    xcopy "%TEMP_RESTORE_FOLDER%\DataFiles\*" "%PROJECT_PATH%\" /E /Y /I /Q >nul 2>&1
)

:: Dọn dẹp
echo [5/5] Dọn dẹp files tạm...
rmdir "%TEMP_RESTORE_FOLDER%" /S /Q 2>nul

echo.
echo ✓ KHÔI PHỤC MONTHLY BACKUP THÀNH CÔNG!
echo Monthly backup: %MONTHLY_BACKUP_FILE%
echo Thời gian: %date% %time%

goto :end

:: ==========================================
:: KHÔI PHỤC TỪ ĐƯỜNG DẪN TÙY CHỈNH
:: ==========================================
:restore_custom
echo.
echo ========================================
echo    KHÔI PHỤC TỪ ĐƯỜNG DẪN TÙY CHỈNH
echo ========================================
echo.

set /p CUSTOM_PATH=Nhập đường dẫn đầy đủ đến file backup: 

if not exist "%CUSTOM_PATH%" (
    echo ✗ LỖI: File không tồn tại: %CUSTOM_PATH%
    goto :end
)

:: Kiểm tra loại file
echo "%CUSTOM_PATH%" | findstr /i "\.bak$" >nul
if not errorlevel 1 (
    echo Phát hiện database backup file...
    set CUSTOM_DB_FILE=%CUSTOM_PATH%
    goto :restore_custom_db
)

echo "%CUSTOM_PATH%" | findstr /i "\.zip$" >nul
if not errorlevel 1 (
    echo Phát hiện zip backup file...
    set CUSTOM_ZIP_FILE=%CUSTOM_PATH%
    goto :restore_custom_zip
)

echo ✗ LỖI: Định dạng file không được hỗ trợ. Chỉ hỗ trợ .bak và .zip
goto :end

:restore_custom_db
echo.
echo Đang khôi phục database từ: %CUSTOM_DB_FILE%
set /p FINAL_CONFIRM=Xác nhận khôi phục? (YES/NO): 
if /i not "%FINAL_CONFIRM%"=="YES" goto :end

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE" >nul 2>&1
sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "RESTORE DATABASE [%DB_NAME%] FROM DISK = '%CUSTOM_DB_FILE%' WITH REPLACE, STATS = 10"

if errorlevel 1 (
    sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER" >nul 2>&1
    goto :error
)

sqlcmd -S %DB_SERVER% -U %DB_USER% -P %DB_PASSWORD% -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER" >nul 2>&1
echo ✓ Khôi phục database thành công!
goto :end

:restore_custom_zip
echo Khôi phục từ zip file chưa được implement trong phiên bản này.
goto :end

:error
echo.
echo ========================================
echo         KHÔI PHỤC THẤT BẠI!
echo ========================================
echo Có lỗi xảy ra trong quá trình khôi phục.
echo Vui lòng kiểm tra:
echo - Kết nối database
echo - Quyền truy cập file backup
echo - Dung lượng ổ đĩa
echo - File backup không bị hỏng
echo.
exit /b 1

:end
echo.
echo ========================================
echo       HOÀN THÀNH KHÔI PHỤC
echo ========================================
echo.
echo KHUYẾN NGHỊ SAU KHI KHÔI PHỤC:
echo ✓ Khởi động lại ứng dụng QLVB
echo ✓ Kiểm tra kết nối database
echo ✓ Test các chức năng chính
echo ✓ Kiểm tra data integrity
echo.
echo Nhấn phím bất kỳ để đóng...
pause > nul
endlocal
exit /b 0

@echo off

:: ========================================
::   THIẾT LẬP BACKUP TỰ ĐỘNG QLVB
:: ========================================
:: Script thiết lập Windows Task Scheduler cho backup tự động
:: Author: System Administrator
:: Date: 2025-08-03

echo.
echo ========================================
echo   THIẾT LẬP BACKUP TỰ ĐỘNG QLVB
echo ========================================
echo.

:: Kiểm tra quyền administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ LỖI: Script này cần chạy với quyền Administrator!
    echo.
    echo Vui lòng:
    echo 1. Nhấn chuột phải vào Command Prompt
    echo 2. Chọn "Run as administrator"
    echo 3. Chạy lại script này
    echo.
    pause
    exit /b 1
)

echo ✓ Quyền Administrator: OK

:: Load cấu hình
call "%~dp0config.bat" export

echo.
echo CẤU HÌNH BACKUP TỰ ĐỘNG:
echo ========================
echo Backup hàng ngày: %DAILY_BACKUP_TIME% mỗi ngày
echo Backup hàng tháng: %MONTHLY_BACKUP_TIME% ngày %MONTHLY_BACKUP_DAY% hàng tháng
echo Script path: %~dp0
echo.

set /p CONFIRM=Bạn có muốn thiết lập backup tự động? (Y/N): 
if /i not "%CONFIRM%"=="Y" (
    echo Hủy thiết lập backup tự động.
    goto :end
)

echo.
echo Đang thiết lập scheduled tasks...

:: ==========================================
:: TẠO TASK BACKUP HÀNG NGÀY
:: ==========================================
echo.
echo [1/2] Tạo task backup hàng ngày...

:: Xóa task cũ nếu có
schtasks /delete /tn "QLVB_Daily_Backup" /f >nul 2>&1

:: Tạo task backup hàng ngày
schtasks /create ^
    /tn "QLVB_Daily_Backup" ^
    /tr "\"%~dp0daily_backup.bat\"" ^
    /sc daily ^
    /st %DAILY_BACKUP_TIME% ^
    /ru "SYSTEM" ^
    /rl highest ^
    /f >nul 2>&1

if errorlevel 1 (
    echo ✗ LỖI: Không thể tạo task backup hàng ngày
    goto :error
)

echo ✓ Task backup hàng ngày đã được tạo

:: ==========================================
:: TẠO TASK BACKUP HÀNG THÁNG
:: ==========================================
echo.
echo [2/2] Tạo task backup hàng tháng...

:: Xóa task cũ nếu có
schtasks /delete /tn "QLVB_Monthly_Backup" /f >nul 2>&1

:: Tạo task backup hàng tháng
schtasks /create ^
    /tn "QLVB_Monthly_Backup" ^
    /tr "\"%~dp0monthly_backup.bat\"" ^
    /sc monthly ^
    /d %MONTHLY_BACKUP_DAY% ^
    /st %MONTHLY_BACKUP_TIME% ^
    /ru "SYSTEM" ^
    /rl highest ^
    /f >nul 2>&1

if errorlevel 1 (
    echo ✗ LỖI: Không thể tạo task backup hàng tháng
    goto :error
)

echo ✓ Task backup hàng tháng đã được tạo

:: ==========================================
:: KIỂM TRA VÀ HIỂN THỊ THÔNG TIN TASKS
:: ==========================================
echo.
echo ========================================
echo        THIẾT LẬP HOÀN THÀNH!
echo ========================================
echo.

echo THÔNG TIN TASKS ĐÃ TẠO:
echo.

echo 📅 BACKUP HÀNG NGÀY:
schtasks /query /tn "QLVB_Daily_Backup" /fo LIST | findstr /i "TaskName Schedule Next"
echo.

echo 📅 BACKUP HÀNG THÁNG:
schtasks /query /tn "QLVB_Monthly_Backup" /fo LIST | findstr /i "TaskName Schedule Next"
echo.

echo ========================================
echo           HƯỚNG DẪN SỬ DỤNG
echo ========================================
echo.
echo ✓ Backup tự động đã được thiết lập thành công!
echo ✓ Không cần can thiệp thủ công
echo ✓ Backup sẽ chạy tự động theo lịch đã cài đặt
echo.
echo CÁC LỆNH QUẢN LÝ TASK:
echo.
echo 🔍 Xem thông tin task:
echo    schtasks /query /tn "QLVB_Daily_Backup"
echo    schtasks /query /tn "QLVB_Monthly_Backup"
echo.
echo ▶️ Chạy backup thủ công ngay:
echo    schtasks /run /tn "QLVB_Daily_Backup"
echo    schtasks /run /tn "QLVB_Monthly_Backup"
echo.
echo ⏹️ Tắt backup tự động:
echo    schtasks /change /tn "QLVB_Daily_Backup" /disable
echo    schtasks /change /tn "QLVB_Monthly_Backup" /disable
echo.
echo ⏯️ Bật lại backup tự động:
echo    schtasks /change /tn "QLVB_Daily_Backup" /enable
echo    schtasks /change /tn "QLVB_Monthly_Backup" /enable
echo.
echo 🗑️ Xóa backup tự động:
echo    schtasks /delete /tn "QLVB_Daily_Backup" /f
echo    schtasks /delete /tn "QLVB_Monthly_Backup" /f
echo.
echo 📁 Thư mục backup: %BACKUP_ROOT%
echo.

:: Tạo file hướng dẫn
echo HƯỚNG DẪN QUẢN LÝ BACKUP TỰ ĐỘNG QLVB > "%~dp0BACKUP_GUIDE.txt"
echo ======================================== >> "%~dp0BACKUP_GUIDE.txt"
echo Ngày tạo: %date% %time% >> "%~dp0BACKUP_GUIDE.txt"
echo. >> "%~dp0BACKUP_GUIDE.txt"
echo THÔNG TIN BACKUP: >> "%~dp0BACKUP_GUIDE.txt"
echo - Backup hàng ngày: %DAILY_BACKUP_TIME% mỗi ngày >> "%~dp0BACKUP_GUIDE.txt"
echo - Backup hàng tháng: %MONTHLY_BACKUP_TIME% ngày %MONTHLY_BACKUP_DAY% hàng tháng >> "%~dp0BACKUP_GUIDE.txt"
echo - Thư mục backup: %BACKUP_ROOT% >> "%~dp0BACKUP_GUIDE.txt"
echo - Database: %DB_NAME% on %DB_SERVER% >> "%~dp0BACKUP_GUIDE.txt"
echo. >> "%~dp0BACKUP_GUIDE.txt"
echo CÁC LỆNH QUẢN LÝ: >> "%~dp0BACKUP_GUIDE.txt"
echo - Xem task: schtasks /query /tn "QLVB_Daily_Backup" >> "%~dp0BACKUP_GUIDE.txt"
echo - Chạy ngay: schtasks /run /tn "QLVB_Daily_Backup" >> "%~dp0BACKUP_GUIDE.txt"
echo - Tắt task: schtasks /change /tn "QLVB_Daily_Backup" /disable >> "%~dp0BACKUP_GUIDE.txt"
echo - Bật task: schtasks /change /tn "QLVB_Daily_Backup" /enable >> "%~dp0BACKUP_GUIDE.txt"
echo - Xóa task: schtasks /delete /tn "QLVB_Daily_Backup" /f >> "%~dp0BACKUP_GUIDE.txt"

echo ✓ Đã tạo file hướng dẫn: %~dp0BACKUP_GUIDE.txt
echo.

set /p TEST_RUN=Bạn có muốn test chạy backup ngay không? (Y/N): 
if /i "%TEST_RUN%"=="Y" (
    echo.
    echo Đang test chạy backup hàng ngày...
    call "%~dp0daily_backup.bat"
)

goto :end

:error
echo.
echo ========================================
echo         THIẾT LẬP THẤT BẠI!
echo ========================================
echo.
echo Có lỗi xảy ra trong quá trình thiết lập.
echo Vui lòng kiểm tra:
echo - Quyền Administrator
echo - Windows Task Scheduler service đang chạy
echo - Đường dẫn script đúng
echo.
exit /b 1

:end
echo.
echo Nhấn phím bất kỳ để đóng...
pause > nul
exit /b 0

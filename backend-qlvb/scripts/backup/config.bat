@echo off
:: ========================================
::    CẤU HÌNH BACKUP HỆ THỐNG QLVB
:: ========================================
:: File này chứa tất cả cấu hình cho hệ thống backup
:: Chỉnh sửa các thông số dưới đây để phù hợp với môi trường của bạn

:: ===================
:: CẤU HÌNH DATABASE
:: ===================
:: Server name hoặc IP address của SQL Server
set DB_SERVER=localhost

:: Tên database cần backup
set DB_NAME=QLVB_Database

:: Username để kết nối database
set DB_USER=sa

:: Password của database (để trống nếu muốn nhập thủ công)
set DB_PASSWORD=your_password_here

:: Instance name (nếu có), ví dụ: SQLEXPRESS
set DB_INSTANCE=

:: ===================
:: CẤU HÌNH ĐƯỜNG DẪN
:: ===================
:: Đường dẫn project QLVB
set PROJECT_PATH=C:\Users\NamP7\Documents\qlvb\backend-qlvb

:: Đường dẫn lưu backup (ổ D)
set BACKUP_ROOT=D:\Database_Backups\QLVB

:: Thư mục chứa data uploads
set DATA_FOLDER=%PROJECT_PATH%\data
set DOCUMENT_UPLOADS=%PROJECT_PATH%\document-uploads
set SIGNATURE_UPLOADS=%PROJECT_PATH%\signature-uploads
set REGULAR_UPLOADS=%PROJECT_PATH%\uploads

:: ===================
:: CẤU HÌNH BACKUP
:: ===================
:: Số ngày giữ lại backup (mặc định 30 ngày)
set BACKUP_RETENTION_DAYS=30

:: Có nén backup không (true/false)
set COMPRESS_BACKUP=true

:: Định dạng nén (zip hoặc 7z)
set COMPRESSION_FORMAT=zip

:: ===================
:: CẤU HÌNH SCHEDULE
:: ===================
:: Thời gian backup hàng ngày (HH:MM format)
set DAILY_BACKUP_TIME=02:00

:: Ngày backup hàng tháng (1-31)
set MONTHLY_BACKUP_DAY=1

:: Thời gian backup hàng tháng (HH:MM format)
set MONTHLY_BACKUP_TIME=01:00

:: ===================
:: CẤU HÌNH EMAIL (TÙY CHỌN)
:: ===================
:: Email notification khi backup thất bại
set ENABLE_EMAIL_NOTIFICATION=false
set SMTP_SERVER=smtp.gmail.com
set SMTP_PORT=587
set EMAIL_USER=your_email@gmail.com
set EMAIL_PASSWORD=your_app_password
set NOTIFICATION_EMAIL=admin@company.com

:: ===================
:: HIỂN THỊ CẤU HÌNH
:: ===================
echo.
echo ========================================
echo     CẤU HÌNH BACKUP HIỆN TẠI
echo ========================================
echo Database Server: %DB_SERVER%
echo Database Name: %DB_NAME%
echo Database User: %DB_USER%
echo Project Path: %PROJECT_PATH%
echo Backup Path: %BACKUP_ROOT%
echo Retention Days: %BACKUP_RETENTION_DAYS%
echo Compression: %COMPRESS_BACKUP%
echo Daily Backup: %DAILY_BACKUP_TIME%
echo Monthly Backup: Day %MONTHLY_BACKUP_DAY% at %MONTHLY_BACKUP_TIME%
echo ========================================
echo.

:: Xuất biến môi trường để các script khác sử dụng
if "%1"=="export" (
    echo Đã xuất cấu hình cho các script khác
    goto :eof
)

echo Để sử dụng cấu hình này trong script khác:
echo call config.bat export
echo.
pause

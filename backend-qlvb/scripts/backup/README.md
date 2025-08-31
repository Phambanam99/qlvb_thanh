# Hướng Dẫn Sử Dụng Hệ Thống Backup QLVB

## 📋 Tổng Quan

Hệ thống backup QLVB được thiết kế để tự động sao lưu database và files quan trọng của hệ thống quản lý công văn. Hệ thống hỗ trợ backup hàng ngày, hàng tháng và khôi phục dữ liệu một cách an toàn.

## 📁 Cấu Trúc Thư Mục

```
scripts/backup/
├── config.bat                     # File cấu hình chính
├── backup_database.sql            # Script SQL backup database
├── backup_data_folders.sql        # Script SQL backup folders
├── daily_backup.bat              # Script backup hàng ngày
├── monthly_backup.bat             # Script backup hàng tháng
├── setup_scheduled_backup.bat     # Thiết lập backup tự động
├── restore_backup.bat             # Script khôi phục backup
├── exclude_list.txt               # Danh sách file loại trừ
└── README.md                      # Hướng dẫn này
```

## ⚙️ Cấu Hình Ban Đầu

### Bước 1: Chỉnh Sửa Cấu Hình

Mở file `config.bat` và chỉnh sửa các thông số phù hợp với hệ thống của bạn:

```batch
:: Cấu hình database
set DB_SERVER=localhost
set DB_NAME=QLVB_Database
set DB_USER=sa
set DB_PASSWORD=your_password_here

:: Đường dẫn backup
set BACKUP_ROOT=D:\Database_Backups\QLVB
set PROJECT_PATH=C:\Users\NamP7\Documents\qlvb\backend-qlvb

:: Cấu hình backup
set BACKUP_RETENTION_DAYS=30
set DAILY_BACKUP_TIME=02:00
set MONTHLY_BACKUP_DAY=1
set MONTHLY_BACKUP_TIME=01:00
```

### Bước 2: Kiểm Tra Kết Nối Database

Trước khi thiết lập backup, hãy kiểm tra kết nối database:

```cmd
sqlcmd -S localhost -U sa -P your_password -Q "SELECT GETDATE()"
```

### Bước 3: Tạo Thư Mục Backup

Tạo thư mục backup trên ổ D (hoặc ổ khác theo cấu hình):

```cmd
mkdir D:\Database_Backups\QLVB
```

## 🚀 Thiết Lập Backup Tự Động

### Chạy Script Thiết Lập

1. **Mở Command Prompt với quyền Administrator**
2. **Chạy script thiết lập:**

```cmd
cd C:\Users\NamP7\Documents\qlvb\backend-qlvb\scripts\backup
setup_scheduled_backup.bat
```

### Xác Nhận Thiết Lập

Script sẽ tạo 2 Windows Task Scheduler tasks:
- `QLVB_Daily_Backup` - Chạy hàng ngày lúc 02:00
- `QLVB_Monthly_Backup` - Chạy ngày đầu tháng lúc 01:00

## 📅 Sử Dụng Backup

### Backup Thủ Công

#### Backup Hàng Ngày

```cmd
daily_backup.bat
```

**Bao gồm:**
- Full database backup (.bak)
- Backup thư mục data, uploads, documents
- Nén files thành .zip
- Dọn dẹp backup cũ (> 30 ngày)

#### Backup Hàng Tháng

```cmd
monthly_backup.bat
```

**Bao gồm:**
- Full database backup
- Toàn bộ source code
- Configuration files
- Data và upload folders
- Nén thành 1 file .zip duy nhất

### Chạy Backup Tự Động Ngay

```cmd
# Chạy backup ngày
schtasks /run /tn "QLVB_Daily_Backup"

# Chạy backup tháng
schtasks /run /tn "QLVB_Monthly_Backup"
```

## 🔄 Khôi Phục Backup

### Chạy Script Khôi Phục

```cmd
restore_backup.bat
```

### Các Loại Khôi Phục

#### 1. Khôi Phục Database (.bak files)
- Chọn file .bak từ thư mục Daily
- Tự động ngắt kết nối users
- Khôi phục database
- Kiểm tra tính toàn vẹn

#### 2. Khôi Phục Monthly Backup (.zip files)
- Giải nén monthly backup
- Khôi phục database + files
- Khôi phục configuration
- Khôi phục data folders

#### 3. Khôi Phục Tùy Chỉnh
- Nhập đường dẫn file backup
- Hỗ trợ .bak và .zip files

## 📊 Quản Lý Backup

### Kiểm Tra Trạng Thái Tasks

```cmd
# Xem thông tin task
schtasks /query /tn "QLVB_Daily_Backup"
schtasks /query /tn "QLVB_Monthly_Backup"

# Xem lịch chạy tiếp theo
schtasks /query /tn "QLVB_Daily_Backup" /fo LIST | findstr "Next Run Time"
```

### Quản Lý Tasks

```cmd
# Tắt backup tự động
schtasks /change /tn "QLVB_Daily_Backup" /disable
schtasks /change /tn "QLVB_Monthly_Backup" /disable

# Bật lại backup tự động
schtasks /change /tn "QLVB_Daily_Backup" /enable
schtasks /change /tn "QLVB_Monthly_Backup" /enable

# Xóa tasks
schtasks /delete /tn "QLVB_Daily_Backup" /f
schtasks /delete /tn "QLVB_Monthly_Backup" /f
```

### Kiểm Tra Log Files

```cmd
# Xem log backup gần nhất
type "D:\Database_Backups\QLVB\backup_daily_*.log"

# Xem log lỗi
type "D:\Database_Backups\QLVB\backup_error_log.txt"
```

## 📁 Cấu Trúc Thư Mục Backup

```
D:\Database_Backups\QLVB\
├── Daily\
│   ├── QLVB_Database_Daily_20250803_020000.bak
│   └── backup_log.txt
├── Files\
│   ├── Files_20250803_020000.zip
│   └── files_backup_log.txt
├── Monthly\
│   ├── QLVB_Monthly_08-2025_20250801_010000.zip
│   └── 08-2025\
│       ├── BACKUP_SUMMARY.txt
│       ├── QLVB_Database_Monthly_*.bak
│       ├── SourceCode\
│       ├── Configurations\
│       └── DataFiles\
└── backup_daily_*.log
```

## 🛠️ Xử Lý Sự Cố

### Lỗi Thường Gặp

#### 1. Không Kết Nối Được Database
```
✗ LỖI: Không thể kết nối database
```
**Giải pháp:**
- Kiểm tra SQL Server đã chạy
- Xác nhận username/password
- Kiểm tra firewall
- Kiểm tra SQL Server Authentication mode

#### 2. Thiếu Quyền Truy Cập
```
✗ LỖI: Access denied
```
**Giải pháp:**
- Chạy Command Prompt với quyền Administrator
- Kiểm tra quyền truy cập thư mục backup
- Kiểm tra quyền SQL Server

#### 3. Thiếu Dung Lượng
```
✗ LỖI: Không đủ dung lượng ổ đĩa
```
**Giải pháp:**
- Giải phóng dung lượng ổ D
- Chuyển thư mục backup sang ổ khác
- Giảm thời gian lưu trữ backup

#### 4. xp_cmdshell Bị Tắt
```
✗ LỖI: xp_cmdshell not enabled
```
**Giải pháp:**
```sql
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
```

### Kiểm Tra Sức Khỏe Hệ Thống

#### Kiểm Tra Database
```sql
-- Kiểm tra kích thước database
SELECT 
    DB_NAME() as DatabaseName,
    SUM(size * 8.0 / 1024) as SizeMB
FROM sys.master_files 
WHERE database_id = DB_ID();

-- Kiểm tra backup gần nhất
SELECT TOP 5 
    database_name,
    backup_start_date,
    backup_finish_date,
    backup_size/1024/1024 as backup_size_mb
FROM msdb.dbo.backupset 
WHERE database_name = 'QLVB_Database'
ORDER BY backup_start_date DESC;
```

#### Kiểm Tra Dung Lượng Backup
```cmd
# Kiểm tra dung lượng thư mục backup
dir "D:\Database_Backups\QLVB" /-c

# Đếm số file backup
dir /b "D:\Database_Backups\QLVB\Daily\*.bak" | find /c /v ""
dir /b "D:\Database_Backups\QLVB\Files\*.zip" | find /c /v ""
```

## 🔐 Bảo Mật

### Bảo Vệ Thông Tin Database
- Không lưu password trong file batch
- Sử dụng Windows Authentication nếu có thể
- Mã hóa file backup nếu cần thiết

### Quyền Truy Cập
- Chỉ Administrator mới có quyền chạy backup
- Hạn chế quyền truy cập thư mục backup
- Backup thường xuyên ra thiết bị ngoài

## 📞 Hỗ Trợ

### Liên Hệ
- **System Administrator**: admin@company.com
- **Documentation**: Xem file log trong thư mục backup
- **Emergency**: Sử dụng restore_backup.bat

### Backup Emergency
Nếu hệ thống backup chính gặp sự cố:

1. **Copy thủ công database:**
```sql
BACKUP DATABASE [QLVB_Database] 
TO DISK = 'D:\Emergency_Backup.bak' 
WITH COMPRESSION, CHECKSUM;
```

2. **Copy thủ công data folders:**
```cmd
xcopy "C:\Users\NamP7\Documents\qlvb\backend-qlvb\data" "D:\Emergency_Data_Backup\" /E /Y
```

---

## 📝 Ghi Chú Phiên Bản

- **Version**: 1.0
- **Date**: 2025-08-03
- **Author**: System Administrator
- **Compatibility**: Windows 10/11, SQL Server 2019+

---

**⚠️ Lưu Ý Quan Trọng:**
- Luôn test script trên môi trường development trước
- Backup thường xuyên và kiểm tra tính toàn vẹn
- Lưu trữ backup ra thiết bị ngoài định kỳ
- Cập nhật documentation khi thay đổi cấu hình

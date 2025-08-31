# Hệ thống Backup QLVB

## Tổng quan
Hệ thống backup tự động cho ứng dụng QLVB (Quản lý công văn), bao gồm backup database PostgreSQL (chạy trên Docker), files external storage và cấu hình.

> **Quan trọng**: Files được lưu trữ ở external storage (thư mục `./data/` trên host) và được mount vào Docker containers.

## Cấu trúc Scripts
```
scripts/
├── backup-database.sh        # Backup database PostgreSQL
├── backup-files.sh           # Backup files từ external storage
├── backup-master.sh          # Script chính điều phối tất cả backup
├── restore-database.sh       # Restore database từ backup
├── setup-cron.sh            # Cài đặt cron jobs tự động
├── setup-external-storage.sh # Thiết lập external storage directories
├── test-docker-backup.sh     # Test Docker backup environment
├── cleanup-old-backups.sh    # Dọn dẹp backup cũ (tự động tạo)
├── backup-health-check.sh    # Kiểm tra sức khỏe system (tự động tạo)
└── README.md                # File hướng dẫn này
```

## Cài đặt ban đầu

### 1. Chuẩn bị môi trường
```bash
# Tạo thư mục backup
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups

# Đảm bảo Docker và Docker Compose đang chạy
docker --version
docker-compose --version

# Thiết lập external storage cho files
cd backend-qlvb
./scripts/setup-external-storage.sh

# Khởi động tất cả containers
docker-compose up -d
```

### 2. Cấp quyền thực thi cho scripts
```bash
cd backend-qlvb/scripts
chmod +x *.sh
```

### 3. Cài đặt cron jobs tự động
```bash
# Cài đặt cron jobs (cần sudo)
sudo ./setup-cron.sh install

# Kiểm tra trạng thái cron
./setup-cron.sh status

# Test các scripts
./setup-cron.sh test
```

## Sử dụng thủ công

### Backup Database
```bash
# Backup database đầy đủ
./backup-database.sh

# Kiểm tra log
tail -f /opt/backups/database/backup.log
```

### Backup Files
```bash
# Backup tất cả files
./backup-files.sh

# Kiểm tra log
tail -f /opt/backups/files/backup.log
```

### Backup tổng thể
```bash
# Chạy tất cả backup
./backup-master.sh

# Chỉ backup database
./backup-master.sh database

# Chỉ backup files
./backup-master.sh files

# Chỉ backup config
./backup-master.sh config

# Tạo report
./backup-master.sh report
```

### Restore Database
```bash
# Kiểm tra backup file trước khi restore
./restore-database.sh -v /opt/backups/database/daily/qlvb_daily_20241222_020000.sql.gz

# Restore database (có xác nhận)
./restore-database.sh /opt/backups/database/daily/qlvb_daily_20241222_020000.sql.gz

# Restore database (không xác nhận)
./restore-database.sh -f /opt/backups/database/daily/qlvb_daily_20241222_020000.sql.gz

# Hiển thị help
./restore-database.sh -h
```

## Lịch trình Backup tự động

### Cron Jobs được cài đặt:
- **2:00 AM hàng ngày**: Backup đầy đủ (database + files + config)
- **1:00 AM Chủ nhật**: Backup + dọn dẹp files cũ  
- **6:00 AM ngày 1 hàng tháng**: Tạo báo cáo backup
- **8:00 AM hàng ngày**: Kiểm tra sức khỏe hệ thống

### Retention Policy:
- **Daily backups**: 30 ngày
- **Weekly backups**: 12 tuần (84 ngày)
- **Monthly backups**: 12 tháng (365 ngày)

## Cấu trúc thư mục Backup
```
/opt/backups/
├── database/
│   ├── daily/          # Backup hàng ngày
│   ├── weekly/         # Backup hàng tuần
│   ├── monthly/        # Backup hàng tháng
│   └── backup.log      # Log file
├── files/
│   ├── daily/          # File backup hàng ngày
│   ├── weekly/         # File backup hàng tuần
│   ├── monthly/        # File backup hàng tháng
│   └── backup.log      # Log file
├── config/             # Configuration backup
│   └── qlvb_config_*.tar.gz
├── master-backup.log   # Master log file
└── backup-report-*.txt # Báo cáo backup
```

## Monitoring và Alerting

### Kiểm tra trạng thái backup
```bash
# Xem log tổng thể
tail -f /opt/backups/master-backup.log

# Xem log database backup
tail -f /opt/backups/database/backup.log  

# Xem log file backup
tail -f /opt/backups/files/backup.log

# Xem báo cáo gần nhất
ls -la /opt/backups/backup-report-*.txt | tail -1
```

### Cấu hình thông báo
Để cấu hình email hoặc Slack notifications, chỉnh sửa các function `send_notification` trong:
- `backup-database.sh`
- `backup-files.sh` 
- `backup-master.sh`

## Troubleshooting

### Lỗi thường gặp:

#### 1. Permission denied
```bash
# Cấp quyền cho scripts
chmod +x scripts/*.sh

# Cấp quyền cho thư mục backup
sudo chown -R $USER:$USER /opt/backups
```

#### 2. PostgreSQL connection failed
```bash
# Kiểm tra PostgreSQL container
docker ps | grep postgres_db

# Khởi động lại container
cd backend-qlvb
docker-compose up -d db

# Kiểm tra logs container
docker logs postgres_db

# Kiểm tra kết nối database
docker exec postgres_db psql -U admin -d qlvb -c "SELECT 1;"
```

#### 3. Disk space insufficient
```bash
# Kiểm tra dung lượng
df -h /opt/backups

# Dọn dẹp backup cũ thủ công
find /opt/backups -name "*.gz" -mtime +30 -delete
```

#### 4. Cron jobs không chạy
```bash
# Kiểm tra cron service
sudo systemctl status cron

# Kiểm tra cron log
sudo tail -f /var/log/cron

# Kiểm tra cron jobs
crontab -l | grep QLVB
```

## Bảo mật

### Khuyến nghị:
1. **Encrypt backups**: Sử dụng GPG để mã hóa backup files
2. **Secure storage**: Lưu backup ở remote location (S3, FTP, etc.)
3. **Access control**: Chỉ admin có quyền truy cập thư mục backup
4. **Regular testing**: Định kỳ test restore process

### Mã hóa backup files:
```bash
# Mã hóa backup file
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Giải mã backup file  
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

## Remote Backup

### Sử dụng rsync để sync backup remote:
```bash
# Sync backup to remote server
rsync -avz --delete /opt/backups/ user@remote-server:/backup/qlvb/

# Cài đặt trong cron để tự động sync
0 3 * * * rsync -avz --delete /opt/backups/ user@remote-server:/backup/qlvb/ >/dev/null 2>&1
```

### Upload lên AWS S3:
```bash
# Cài đặt AWS CLI
sudo apt install awscli

# Cấu hình AWS credentials
aws configure

# Upload backup lên S3
aws s3 sync /opt/backups/ s3://your-backup-bucket/qlvb-backups/
```

## Liên hệ
- **Hệ thống**: QLVB Document Management
- **Admin**: System Administrator
- **Log Location**: `/opt/backups/`
- **Cron User**: `root` (có thể thay đổi trong setup-cron.sh) 
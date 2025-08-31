-- ========================================
-- SCRIPT BACKUP DATABASE QLVB
-- ========================================
-- Script SQL để backup database với compression
-- Sử dụng cho SQL Server
-- Author: System Administrator
-- Date: 2025-08-03

-- Kích hoạt xp_cmdshell nếu chưa được bật
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;

-- Khai báo các biến
DECLARE @DatabaseName NVARCHAR(128) = DB_NAME();
-- Lấy tên database hiện tại
DECLARE @BackupPath NVARCHAR(500);
DECLARE @BackupFileName NVARCHAR(255);
DECLARE @BackupFullPath NVARCHAR(500);
DECLARE @LogicalDataName NVARCHAR(128);
DECLARE @LogicalLogName NVARCHAR(128);
DECLARE @CreateFolderCmd NVARCHAR(1000);
DECLARE @Timestamp NVARCHAR(20);

-- Tạo timestamp cho tên file
SET @Timestamp = FORMAT(GETDATE(), 'yyyyMMdd_HHmmss');

-- Đường dẫn backup (có thể thay đổi)
SET @BackupPath = 'D:\Database_Backups\QLVB\Daily\';

-- Tên file backup
SET @BackupFileName = @DatabaseName + '_Daily_' + @Timestamp + '.bak';
SET @BackupFullPath = @BackupPath + @BackupFileName;

-- Tạo thư mục backup nếu chưa tồn tại
SET @CreateFolderCmd = 'mkdir "' + @BackupPath + '" 2>nul';
EXEC xp_cmdshell @CreateFolderCmd, no_output;

-- Hiển thị thông tin backup
PRINT '========================================';
PRINT 'BẮT ĐẦU BACKUP DATABASE: ' + @DatabaseName;
PRINT '========================================';
PRINT 'Thời gian: ' + CONVERT(NVARCHAR, GETDATE(), 120);
PRINT 'File backup: ' + @BackupFileName;
PRINT 'Đường dẫn: ' + @BackupPath;
PRINT '';

-- Kiểm tra dung lượng database
DECLARE @DatabaseSizeMB DECIMAL(10,2);
SELECT @DatabaseSizeMB = SUM(CAST(size AS DECIMAL(10,2)) * 8 / 1024)
FROM sys.master_files
WHERE database_id = DB_ID(@DatabaseName);

PRINT 'Dung lượng database: ' + CAST(@DatabaseSizeMB AS NVARCHAR) + ' MB';
PRINT '';

-- Thực hiện backup với các tùy chọn tối ưu
BEGIN TRY
    BACKUP DATABASE @DatabaseName 
    TO DISK = @BackupFullPath
    WITH 
        COMPRESSION,                    -- Nén backup
        CHECKSUM,                      -- Kiểm tra tính toàn vẹn
        INIT,                          -- Ghi đè file cũ
        FORMAT,                        -- Format media
        STATS = 10,                    -- Hiển thị tiến trình mỗi 10%
        DESCRIPTION = N'QLVB Daily Backup',
        NAME = N'QLVB_Daily_Backup';

    -- Kiểm tra kích thước file backup
    DECLARE @BackupSizeCmd NVARCHAR(1000);
    DECLARE @BackupSizeMB NVARCHAR(50);
    
    SET @BackupSizeCmd = 'forfiles /p "' + @BackupPath + '" /m "' + @BackupFileName + '" /c "cmd /c echo @fsize"';
    
    PRINT '';
    PRINT '✓ BACKUP HOÀN THÀNH THÀNH CÔNG!';
    PRINT 'File backup: ' + @BackupFullPath;
    
    -- Tạo file log
    DECLARE @LogFile NVARCHAR(500) = @BackupPath + 'backup_log.txt';
    DECLARE @LogCmd NVARCHAR(1000);
    SET @LogCmd = 'echo [' + CONVERT(NVARCHAR, GETDATE(), 120) + '] Backup thành công: ' + @BackupFileName + ' >> "' + @LogFile + '"';
    EXEC xp_cmdshell @LogCmd, no_output;

END TRY
BEGIN CATCH
    -- Xử lý lỗi
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '';
    PRINT '✗ LỖI TRONG QUÁ TRÌNH BACKUP!';
    PRINT 'Lỗi: ' + @ErrorMessage;
    
    -- Log lỗi
    DECLARE @ErrorLogFile NVARCHAR(500) = @BackupPath + 'backup_error_log.txt';
    DECLARE @ErrorLogCmd NVARCHAR(1000);
    SET @ErrorLogCmd = 'echo [' + CONVERT(NVARCHAR, GETDATE(), 120) + '] LỖI BACKUP: ' + @ErrorMessage + ' >> "' + @ErrorLogFile + '"';
    EXEC xp_cmdshell @ErrorLogCmd, no_output;
    
    -- Ném lỗi để batch file có thể xử lý
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH

-- Hiển thị thông tin database sau backup
PRINT '';
PRINT 'THÔNG TIN DATABASE:';
PRINT '- Tên database: ' + @DatabaseName;
PRINT '- Collation: ' + CONVERT(NVARCHAR, DATABASEPROPERTYEX(@DatabaseName, 'Collation'));
PRINT '- Recovery Model: ' + CONVERT(NVARCHAR, DATABASEPROPERTYEX(@DatabaseName, 'Recovery'));
PRINT '- Trạng thái: ' + CONVERT(NVARCHAR, DATABASEPROPERTYEX(@DatabaseName, 'Status'));

-- Hiển thị danh sách backup gần nhất
PRINT '';
PRINT 'DANH SÁCH 5 BACKUP GẦN NHẤT:';
SELECT TOP 5
    backup_set_id,
    database_name,
    backup_start_date,
    backup_finish_date,
    CAST(backup_size/1024/1024 AS DECIMAL(10,2)) AS backup_size_mb,
    physical_device_name
FROM msdb.dbo.backupset bs
    INNER JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE database_name = @DatabaseName
    AND type = 'D'
-- Database backup
ORDER BY backup_start_date DESC;

PRINT '';
PRINT '========================================';
PRINT 'HOÀN THÀNH BACKUP DATABASE';
PRINT '========================================';

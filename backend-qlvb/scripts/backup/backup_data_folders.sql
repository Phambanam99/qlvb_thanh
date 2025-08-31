-- ========================================
-- SCRIPT BACKUP THỦ MỤC DATA VÀ FILES
-- ========================================
-- Script SQL để backup các thư mục data, uploads, documents
-- Sử dụng xp_cmdshell để copy files
-- Author: System Administrator
-- Date: 2025-08-03

-- Kích hoạt xp_cmdshell nếu chưa được bật
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;

-- Khai báo các biến
DECLARE @ProjectPath NVARCHAR(500) = 'C:\Users\NamP7\Documents\qlvb\backend-qlvb\';
DECLARE @BackupBasePath NVARCHAR(500) = 'D:\Database_Backups\QLVB\Files\';
DECLARE @Timestamp NVARCHAR(20);
DECLARE @BackupFolder NVARCHAR(500);
DECLARE @CreateFolderCmd NVARCHAR(1000);
DECLARE @CopyCmd NVARCHAR(2000);
DECLARE @ZipCmd NVARCHAR(2000);
DECLARE @CleanupCmd NVARCHAR(1000);

-- Tạo timestamp
SET @Timestamp = FORMAT(GETDATE(), 'yyyyMMdd_HHmmss');
SET @BackupFolder = @BackupBasePath + 'Files_' + @Timestamp + '\';

PRINT '========================================';
PRINT 'BẮT ĐẦU BACKUP THỦ MỤC DATA VÀ FILES';
PRINT '========================================';
PRINT 'Thời gian: ' + CONVERT(NVARCHAR, GETDATE(), 120);
PRINT 'Project path: ' + @ProjectPath;
PRINT 'Backup folder: ' + @BackupFolder;
PRINT '';

-- Tạo thư mục backup chính
SET @CreateFolderCmd = 'mkdir "' + @BackupFolder + '" 2>nul';
EXEC xp_cmdshell @CreateFolderCmd, no_output;

-- Tạo các thư mục con
DECLARE @DataFolderCmd NVARCHAR(1000) = 'mkdir "' + @BackupFolder + 'data" 2>nul';
DECLARE @DocFolderCmd NVARCHAR(1000) = 'mkdir "' + @BackupFolder + 'document-uploads" 2>nul';
DECLARE @SigFolderCmd NVARCHAR(1000) = 'mkdir "' + @BackupFolder + 'signature-uploads" 2>nul';
DECLARE @UploadFolderCmd NVARCHAR(1000) = 'mkdir "' + @BackupFolder + 'uploads" 2>nul';
DECLARE @LogFolderCmd NVARCHAR(1000) = 'mkdir "' + @BackupFolder + 'logs" 2>nul';

EXEC xp_cmdshell @DataFolderCmd, no_output;
EXEC xp_cmdshell @DocFolderCmd, no_output;
EXEC xp_cmdshell @SigFolderCmd, no_output;
EXEC xp_cmdshell @UploadFolderCmd, no_output;
EXEC xp_cmdshell @LogFolderCmd, no_output;

BEGIN TRY
    -- Backup thư mục data
    PRINT 'Đang backup thư mục data...';
    SET @CopyCmd = 'xcopy "' + @ProjectPath + 'data\*" "' + @BackupFolder + 'data\" /E /Y /I /Q';
    EXEC xp_cmdshell @CopyCmd, no_output;
    
    -- Backup thư mục document-uploads
    PRINT 'Đang backup thư mục document-uploads...';
    SET @CopyCmd = 'xcopy "' + @ProjectPath + 'document-uploads\*" "' + @BackupFolder + 'document-uploads\" /E /Y /I /Q';
    EXEC xp_cmdshell @CopyCmd, no_output;
    
    -- Backup thư mục signature-uploads
    PRINT 'Đang backup thư mục signature-uploads...';
    SET @CopyCmd = 'xcopy "' + @ProjectPath + 'signature-uploads\*" "' + @BackupFolder + 'signature-uploads\" /E /Y /I /Q';
    EXEC xp_cmdshell @CopyCmd, no_output;
    
    -- Backup thư mục uploads
    PRINT 'Đang backup thư mục uploads...';
    SET @CopyCmd = 'xcopy "' + @ProjectPath + 'uploads\*" "' + @BackupFolder + 'uploads\" /E /Y /I /Q';
    EXEC xp_cmdshell @CopyCmd, no_output;
    
    -- Backup logs nếu có
    PRINT 'Đang backup logs...';
    SET @CopyCmd = 'xcopy "' + @ProjectPath + 'logs\*" "' + @BackupFolder + 'logs\" /E /Y /I /Q 2>nul';
    EXEC xp_cmdshell @CopyCmd, no_output;
    
    PRINT '';
    PRINT 'Đang nén files backup...';
    
    -- Nén thư mục backup bằng PowerShell
    SET @ZipCmd = 'powershell "Compress-Archive -Path ''' + @BackupFolder + '*'' -DestinationPath ''' + @BackupFolder + '../Files_' + @Timestamp + '.zip'' -Force"';
    EXEC xp_cmdshell @ZipCmd, no_output;
    
    -- Xóa thư mục tạm sau khi nén
    SET @CleanupCmd = 'rmdir "' + @BackupFolder + '" /S /Q';
    EXEC xp_cmdshell @CleanupCmd, no_output;
    
    PRINT '';
    PRINT '✓ BACKUP FILES HOÀN THÀNH THÀNH CÔNG!';
    PRINT 'File backup: ' + @BackupBasePath + 'Files_' + @Timestamp + '.zip';
    
    -- Tạo file log
    DECLARE @LogFile NVARCHAR(500) = @BackupBasePath + 'files_backup_log.txt';
    DECLARE @LogCmd NVARCHAR(1000);
    SET @LogCmd = 'echo [' + CONVERT(NVARCHAR, GETDATE(), 120) + '] Files backup thành công: Files_' + @Timestamp + '.zip >> "' + @LogFile + '"';
    EXEC xp_cmdshell @LogCmd, no_output;

END TRY
BEGIN CATCH
    -- Xử lý lỗi
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    PRINT '';
    PRINT '✗ LỖI TRONG QUÁ TRÌNH BACKUP FILES!';
    PRINT 'Lỗi: ' + @ErrorMessage;
    
    -- Log lỗi
    DECLARE @ErrorLogFile NVARCHAR(500) = @BackupBasePath + 'files_backup_error_log.txt';
    DECLARE @ErrorLogCmd NVARCHAR(1000);
    SET @ErrorLogCmd = 'echo [' + CONVERT(NVARCHAR, GETDATE(), 120) + '] LỖI FILES BACKUP: ' + @ErrorMessage + ' >> "' + @ErrorLogFile + '"';
    EXEC xp_cmdshell @ErrorLogCmd, no_output;
    
    -- Dọn dẹp thư mục tạm nếu có lỗi
    EXEC xp_cmdshell @CleanupCmd, no_output;
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH

-- Hiển thị thống kê files đã backup
PRINT '';
PRINT 'THỐNG KÊ BACKUP:';

-- Kiểm tra kích thước file zip
DECLARE @ZipSizeCmd NVARCHAR(1000);
SET @ZipSizeCmd = 'forfiles /p "' + @BackupBasePath + '" /m "Files_' + @Timestamp + '.zip" /c "cmd /c echo Kích thước file zip: @fsize bytes"';
EXEC xp_cmdshell @ZipSizeCmd;

-- Liệt kê 5 backup files gần nhất
PRINT '';
PRINT 'DANH SÁCH 5 FILES BACKUP GẦN NHẤT:';
DECLARE @ListFilesCmd NVARCHAR(1000);
SET @ListFilesCmd = 'forfiles /p "' + @BackupBasePath + '" /m "Files_*.zip" /c "cmd /c echo @fname - @fdate @ftime" 2>nul | sort /r';
EXEC xp_cmdshell @ListFilesCmd;

PRINT '';
PRINT '========================================';
PRINT 'HOÀN THÀNH BACKUP FILES';
PRINT '========================================';

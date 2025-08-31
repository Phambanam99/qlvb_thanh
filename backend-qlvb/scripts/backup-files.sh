#!/bin/bash

# File Backup Script for QLVB System
# Author: System Administrator
# Date: $(date)

set -e # Exit on any error

# Configuration - Files are now stored on host machine
SOURCE_DIRS=(
"./data/document-uploads"
"./data/uploads"
)

# Backup directories
BACKUP_DIR="/opt/backups/files"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"

# Create backup directories if they don't exist
mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE=$(date +"%Y-%m-%d")
DAY_OF_WEEK=$(date +"%u") # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +"%d")

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

# Function to send notification
send_notification() {
local status=$1
local message=$2
log "$status: $message"
# Add email/slack notification here if needed
# echo "$message" | mail -s "QLVB Files Backup $status" admin@yourdomain.com
}

# Function to cleanup old backups
cleanup_old_backups() {
local dir=$1
local days=$2

log "Cleaning up file backups older than $days days in $dir"
find "$dir" -name "*.tar.gz" -type f -mtime +$days -delete
}

# Function to calculate directory size
get_directory_size() {
local dir=$1
if [[ -d "$dir" ]]; then
du -sh "$dir" 2>/dev/null | cut -f1
else
echo "0"
fi
}

# Function to backup files
backup_files() {
local backup_file="$1"
local backup_type="$2"

log "Starting $backup_type file backup to $backup_file"

# Calculate total size before backup
local total_size=0
for source_dir in "${SOURCE_DIRS[@]}"; do
if [[ -d "$source_dir" ]]; then
local dir_size=$(get_directory_size "$source_dir")
log "Directory $source_dir size: $dir_size"
else
log "WARNING: Directory $source_dir does not exist, skipping"
fi
done

# Create tar archive with compression
if tar -czf "$backup_file" \
--exclude="*.tmp" \
--exclude="*.temp" \
--exclude="*~" \
--exclude=".DS_Store" \
--exclude="Thumbs.db" \
"${SOURCE_DIRS[@]}" 2>/dev/null; then

# Verify backup file exists and has content
if [[ -f "$backup_file" && -s "$backup_file" ]]; then
local file_size=$(du -h "$backup_file" | cut -f1)
log "File backup completed successfully. Archive size: $file_size"
send_notification "SUCCESS" "$backup_type file backup completed: $backup_file ($file_size)"
return 0
else
log "ERROR: Backup file is empty or doesn't exist"
send_notification "ERROR" "$backup_type file backup failed: Empty or missing file"
return 1
fi
else
log "ERROR: tar command failed"
send_notification "ERROR" "$backup_type file backup failed: tar command failed"
return 1
fi
}

# Function to create incremental backup
backup_files_incremental() {
local backup_file="$1"
local snapshot_file="$2"
local backup_type="$3"

log "Starting $backup_type incremental file backup"

# Create incremental backup using tar with snapshot
if tar -czf "$backup_file" \
--listed-incremental="$snapshot_file" \
--exclude="*.tmp" \
--exclude="*.temp" \
--exclude="*~" \
--exclude=".DS_Store" \
--exclude="Thumbs.db" \
"${SOURCE_DIRS[@]}" 2>/dev/null; then

if [[ -f "$backup_file" && -s "$backup_file" ]]; then
local file_size=$(du -h "$backup_file" | cut -f1)
log "Incremental file backup completed successfully. Archive size: $file_size"
send_notification "SUCCESS" "$backup_type incremental backup completed: $backup_file ($file_size)"
return 0
else
log "ERROR: Incremental backup file is empty or doesn't exist"
return 1
fi
else
log "ERROR: Incremental tar command failed"
return 1
fi
}

# Function to verify backup integrity
verify_backup() {
local backup_file="$1"

log "Verifying backup integrity: $backup_file"

if tar -tzf "$backup_file" >/dev/null 2>&1; then
log "Backup verification passed: $backup_file"
return 0
else
log "ERROR: Backup verification failed: $backup_file"
send_notification "ERROR" "Backup verification failed: $backup_file"
return 1
fi
}

# Main execution
main() {
log "=== Starting QLVB File Backup Process ==="

# Check if source directories exist
local missing_dirs=()
for source_dir in "${SOURCE_DIRS[@]}"; do
if [[ ! -d "$source_dir" ]]; then
missing_dirs+=("$source_dir")
fi
done

if [[ ${#missing_dirs[@]} -eq ${#SOURCE_DIRS[@]} ]]; then
        log "ERROR: All source directories are missing"
        send_notification "ERROR" "All source directories are missing"
        exit 1
    fi
    
    if [[ ${#missing_dirs[@]} -gt 0 ]]; then
        log "WARNING: Some source directories are missing: ${missing_dirs[*]}"
    fi
    
    # Daily backup (incremental)
    DAILY_BACKUP="$DAILY_DIR/qlvb_files_daily_$TIMESTAMP.tar.gz"
    DAILY_SNAPSHOT="$DAILY_DIR/snapshot.snar"
    
    if backup_files_incremental "$DAILY_BACKUP" "$DAILY_SNAPSHOT" "daily"; then
        verify_backup "$DAILY_BACKUP"
        log "Daily file backup completed"
    else
        log "Daily file backup failed, trying full backup"
        if backup_files "$DAILY_BACKUP" "daily"; then
            verify_backup "$DAILY_BACKUP"
        else
            exit 1
        fi
    fi
    
    # Weekly backup (full backup on Sunday)
    if [[ "$DAY_OF_WEEK" == "7" ]]; then
        WEEKLY_BACKUP="$WEEKLY_DIR/qlvb_files_weekly_$TIMESTAMP.tar.gz"
        if backup_files "$WEEKLY_BACKUP" "weekly"; then
            verify_backup "$WEEKLY_BACKUP"
            log "Weekly file backup completed"
        fi
    fi
    
    # Monthly backup (full backup on 1st of month)
    if [[ "$DAY_OF_MONTH" == "01" ]]; then
        MONTHLY_BACKUP="$MONTHLY_DIR/qlvb_files_monthly_$TIMESTAMP.tar.gz"
        if backup_files "$MONTHLY_BACKUP" "monthly"; then
            verify_backup "$MONTHLY_BACKUP"
            log "Monthly file backup completed"
        fi
    fi
    
    # Cleanup old backups
    cleanup_old_backups "$DAILY_DIR" 30      # Keep 30 days
    cleanup_old_backups "$WEEKLY_DIR" 84     # Keep 12 weeks  
    cleanup_old_backups "$MONTHLY_DIR" 365   # Keep 12 months
    
    log "=== QLVB File Backup Process Completed ==="
}

# Run main function
main "$@" 
#!/bin/bash

# Database Backup Script for QLVB System
# Author: System Administrator
# Date: $(date)

set -e # Exit on any error

# Configuration
DB_NAME="qlvb"
DB_USER="admin"
DB_PASSWORD="Phamnam99"
DB_HOST="localhost"
DB_PORT="5432"
DOCKER_CONTAINER="postgres_db" # PostgreSQL container name

# Backup directories
BACKUP_DIR="/opt/backups/database"
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

# Function to check if Docker container is running
check_docker_container() {
if docker ps | grep -q "$DOCKER_CONTAINER"; then
log "PostgreSQL Docker container is running"
return 0
else
log "ERROR: PostgreSQL Docker container '$DOCKER_CONTAINER' is not running"
return 1
fi
}

# Function to send notification (you can customize this)
send_notification() {
local status=$1
local message=$2
log "$status: $message"
# Add email/slack notification here if needed
# echo "$message" | mail -s "QLVB Backup $status" admin@yourdomain.com
}

# Function to cleanup old backups
cleanup_old_backups() {
local dir=$1
local days=$2

log "Cleaning up backups older than $days days in $dir"
find "$dir" -name "*.sql.gz" -type f -mtime +$days -delete
}

# Main backup function
backup_database() {
local backup_file="$1"

log "Starting database backup to $backup_file"

# Create SQL dump using Docker exec
if docker exec "$DOCKER_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
--no-owner --no-privileges --create --clean | gzip > "$backup_file"; then

# Verify backup file exists and has content
if [[ -f "$backup_file" && -s "$backup_file" ]]; then
local file_size=$(du -h "$backup_file" | cut -f1)
log "Database backup completed successfully. File size: $file_size"
send_notification "SUCCESS" "Database backup completed: $backup_file ($file_size)"
return 0
else
log "ERROR: Backup file is empty or doesn't exist"
send_notification "ERROR" "Database backup failed: Empty or missing file"
return 1
fi
else
log "ERROR: Docker exec pg_dump command failed"
send_notification "ERROR" "Database backup failed: Docker exec pg_dump command failed"
return 1
fi
}

# Main execution
main() {
log "=== Starting QLVB Database Backup Process ==="

# Check if Docker container is running
if ! check_docker_container; then
log "Docker container check failed"
exit 1
fi

# Daily backup
DAILY_BACKUP="$DAILY_DIR/qlvb_daily_$TIMESTAMP.sql.gz"
if backup_database "$DAILY_BACKUP"; then
log "Daily backup completed"
else
log "Daily backup failed"
exit 1
fi

# Weekly backup (on Sunday)
if [[ "$DAY_OF_WEEK" == "7" ]]; then
WEEKLY_BACKUP="$WEEKLY_DIR/qlvb_weekly_$TIMESTAMP.sql.gz"
if backup_database "$WEEKLY_BACKUP"; then
log "Weekly backup completed"
fi
fi

# Monthly backup (on 1st of month)
if [[ "$DAY_OF_MONTH" == "01" ]]; then
MONTHLY_BACKUP="$MONTHLY_DIR/qlvb_monthly_$TIMESTAMP.sql.gz"
if backup_database "$MONTHLY_BACKUP"; then
log "Monthly backup completed"
fi
fi

# Cleanup old backups
cleanup_old_backups "$DAILY_DIR" 30 # Keep 30 days
cleanup_old_backups "$WEEKLY_DIR" 84 # Keep 12 weeks
cleanup_old_backups "$MONTHLY_DIR" 365 # Keep 12 months

log "=== QLVB Database Backup Process Completed ==="
}

# Run main function
main "$@"
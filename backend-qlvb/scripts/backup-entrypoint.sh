#!/bin/bash

# QLVB Backup Service Entrypoint
# Chạy trong Docker container để backup tự động

set -e

# Configuration from environment variables
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_DB=${POSTGRES_DB:-qlvb}
POSTGRES_USER=${POSTGRES_USER:-admin}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-Phamnam99}
BACKUP_SCHEDULE=${BACKUP_SCHEDULE:-"0 2 * * *"} # Default: 2:00 AM daily
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
BACKUP_DIR="/backups"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/files"
mkdir -p "$BACKUP_DIR/logs"

# Install required packages
apk add --no-cache dcron postgresql-client tar gzip curl

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/logs/backup.log"
}

# Function to backup database
backup_database() {
log "Starting database backup..."

local backup_file="$BACKUP_DIR/database/qlvb_db_$(date +%Y%m%d_%H%M%S).sql"
local backup_file_gz="${backup_file}.gz"

# Create database backup
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
-h "$POSTGRES_HOST" \
-U "$POSTGRES_USER" \
-d "$POSTGRES_DB" \
--no-password \
--verbose \
> "$backup_file"

# Compress backup
gzip "$backup_file"

log "Database backup completed: $backup_file_gz"

# Create latest symlink
ln -sf "$(basename "$backup_file_gz")" "$BACKUP_DIR/database/latest.sql.gz"

return 0
}

# Function to backup files
backup_files() {
log "Starting files backup..."

local backup_file="$BACKUP_DIR/files/qlvb_files_$(date +%Y%m%d_%H%M%S).tar.gz"

# Backup application files
tar -czf "$backup_file" \
-C /app \
document-uploads \
signature-uploads \
uploads \
2>/dev/null || true

log "Files backup completed: $backup_file"

# Create latest symlink
ln -sf "$(basename "$backup_file")" "$BACKUP_DIR/files/latest.tar.gz"

return 0
}

# Function to cleanup old backups
cleanup_old_backups() {
log "Cleaning up old backups (older than $BACKUP_RETENTION_DAYS days)..."

# Cleanup database backups
find "$BACKUP_DIR/database" -name "qlvb_db_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true

# Cleanup file backups
find "$BACKUP_DIR/files" -name "qlvb_files_*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true

# Cleanup old logs
find "$BACKUP_DIR/logs" -name "*.log" -mtime +30 -delete 2>/dev/null || true

log "Cleanup completed"
}

# Function to send notification (optional)
send_notification() {
local status=$1
local message=$2

log "$status: $message"

# Send webhook notification if configured
if [ -n "$WEBHOOK_URL" ]; then
curl -X POST -H 'Content-type: application/json' \
--data "{\"text\":\"QLVB Backup $status: $message\"}" \
"$WEBHOOK_URL" 2>/dev/null || true
fi
}

# Function to perform full backup
perform_backup() {
log "=== Starting QLVB Backup Process ==="

local start_time=$(date +%s)

# Wait for database to be ready
log "Waiting for database to be ready..."
while ! PGPASSWORD="$POSTGRES_PASSWORD" pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -q; do
sleep 5
done

# Perform backups
if backup_database && backup_files; then
cleanup_old_backups

local end_time=$(date +%s)
local duration=$((end_time - start_time))

send_notification "SUCCESS" "Backup completed successfully in ${duration} seconds"
log "=== Backup Process Completed Successfully ==="
else
send_notification "FAILED" "Backup process failed"
log "=== Backup Process Failed ==="
exit 1
fi
}

# Function to setup cron job
setup_cron() {
log "Setting up cron job with schedule: $BACKUP_SCHEDULE"

# Create cron job
echo "$BACKUP_SCHEDULE /scripts/backup-entrypoint.sh backup >> $BACKUP_DIR/logs/cron.log 2>&1" > /tmp/crontab

# Install cron job
crontab /tmp/crontab

log "Cron job installed successfully"
}

# Function to show backup status
show_status() {
echo "=== QLVB Backup Service Status ==="
echo "Database Host: $POSTGRES_HOST"
echo "Database: $POSTGRES_DB"
echo "Backup Schedule: $BACKUP_SCHEDULE"
echo "Retention Days: $BACKUP_RETENTION_DAYS"
echo "Backup Directory: $BACKUP_DIR"
echo ""

echo "Recent Database Backups:"
ls -la "$BACKUP_DIR/database/" 2>/dev/null | head -10 || echo "No backups found"
echo ""

echo "Recent File Backups:"
ls -la "$BACKUP_DIR/files/" 2>/dev/null | head -10 || echo "No backups found"
echo ""

echo "Disk Usage:"
du -sh "$BACKUP_DIR"/* 2>/dev/null || echo "No backup data"
}

# Main script logic
case "${1:-daemon}" in
"backup")
perform_backup
;;
"status")
show_status
;;
"daemon")
log "Starting QLVB Backup Service..."
setup_cron

# Perform initial backup
perform_backup

log "Starting cron daemon..."
crond -f -l 2
;;
*)
echo "Usage: $0 {backup|status|daemon}"
echo " backup - Perform backup immediately"
echo " status - Show backup status"
echo " daemon - Run as daemon with cron schedule"
exit 1
;;
esac
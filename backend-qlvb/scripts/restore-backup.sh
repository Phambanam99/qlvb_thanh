#!/bin/bash

# QLVB Restore Script
# Script để khôi phục dữ liệu từ backup

set -e

# Configuration
BACKUP_DIR="/backups"
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_DB=${POSTGRES_DB:-qlvb}
POSTGRES_USER=${POSTGRES_USER:-admin}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-Phamnam99}

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to list available backups
list_backups() {
echo "=== Available Database Backups ==="
ls -la "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null | nl || echo "No database backups found"
echo ""

echo "=== Available File Backups ==="
ls -la "$BACKUP_DIR/files/"*.tar.gz 2>/dev/null | nl || echo "No file backups found"
echo ""
}

# Function to restore database
restore_database() {
local backup_file=$1

if [ -z "$backup_file" ]; then
echo "Available database backups:"
ls -la "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null | nl
echo ""
read -p "Enter backup file name (or 'latest' for latest backup): " backup_file
fi

if [ "$backup_file" = "latest" ]; then
backup_file="$BACKUP_DIR/database/latest.sql.gz"
elif [ ! -f "$backup_file" ] && [ -f "$BACKUP_DIR/database/$backup_file" ]; then
backup_file="$BACKUP_DIR/database/$backup_file"
fi

if [ ! -f "$backup_file" ]; then
log "ERROR: Backup file not found: $backup_file"
exit 1
fi

log "Restoring database from: $backup_file"

# Confirm restore
read -p "Are you sure you want to restore the database? This will overwrite existing data. (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
log "Restore cancelled"
exit 0
fi

# Drop existing database and recreate
log "Dropping existing database..."
PGPASSWORD="$POSTGRES_PASSWORD" dropdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB" --if-exists

log "Creating new database..."
PGPASSWORD="$POSTGRES_PASSWORD" createdb -h "$POSTGRES_HOST" -U "$POSTGRES_USER" "$POSTGRES_DB"

# Restore from backup
log "Restoring data..."
gunzip -c "$backup_file" | PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB"

log "Database restore completed successfully"
}

# Function to restore files
restore_files() {
local backup_file=$1
local restore_dir=${2:-/app}

if [ -z "$backup_file" ]; then
echo "Available file backups:"
ls -la "$BACKUP_DIR/files/"*.tar.gz 2>/dev/null | nl
echo ""
read -p "Enter backup file name (or 'latest' for latest backup): " backup_file
fi

if [ "$backup_file" = "latest" ]; then
backup_file="$BACKUP_DIR/files/latest.tar.gz"
elif [ ! -f "$backup_file" ] && [ -f "$BACKUP_DIR/files/$backup_file" ]; then
backup_file="$BACKUP_DIR/files/$backup_file"
fi

if [ ! -f "$backup_file" ]; then
log "ERROR: Backup file not found: $backup_file"
exit 1
fi

log "Restoring files from: $backup_file to $restore_dir"

# Confirm restore
read -p "Are you sure you want to restore files? This will overwrite existing files. (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
log "Restore cancelled"
exit 0
fi

# Create backup of existing files
if [ -d "$restore_dir" ]; then
local backup_existing="$BACKUP_DIR/files/existing_files_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
log "Backing up existing files to: $backup_existing"
tar -czf "$backup_existing" -C "$restore_dir" . 2>/dev/null || true
fi

# Restore files
log "Extracting files..."
mkdir -p "$restore_dir"
tar -xzf "$backup_file" -C "$restore_dir"

log "Files restore completed successfully"
}

# Function to show usage
show_usage() {
echo "Usage: $0 {list|db|files|full} [backup_file] [restore_dir]"
echo ""
echo "Commands:"
echo " list - List available backups"
echo " db [backup_file] - Restore database from backup"
echo " files [backup_file] [restore_dir] - Restore files from backup"
echo " full - Restore both database and files from latest backups"
echo ""
echo "Examples:"
echo " $0 list"
echo " $0 db latest"
echo " $0 db qlvb_db_20250130_020000.sql.gz"
echo " $0 files latest /app"
echo " $0 full"
}

# Main script logic
case "${1:-}" in
"list")
list_backups
;;
"db")
restore_database "$2"
;;
"files")
restore_files "$2" "$3"
;;
"full")
log "=== Full System Restore ==="
restore_database "latest"
restore_files "latest" "/app"
log "=== Full Restore Completed ==="
;;
*)
show_usage
exit 1
;;
esac
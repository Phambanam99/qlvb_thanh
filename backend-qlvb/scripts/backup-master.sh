#!/bin/bash

# Master Backup Script for QLVB System
# Author: System Administrator
# Date: $(date)

set -e # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_ROOT="/opt/backups"
LOG_FILE="$BACKUP_ROOT/master-backup.log"

# Ensure backup root directory exists
mkdir -p "$BACKUP_ROOT"

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send notification
send_notification() {
local status=$1
local message=$2
log "$status: $message"

# Send email notification (customize as needed)
# echo "Subject: QLVB Backup $status
#
# $message
#
# Time: $(date)
# Server: $(hostname)" | sendmail admin@yourdomain.com

# Send Slack notification (customize webhook URL)
# curl -X POST -H 'Content-type: application/json' \
# --data "{\"text\":\"QLVB Backup $status: $message\"}" \
# YOUR_SLACK_WEBHOOK_URL
}

# Function to check prerequisites
check_prerequisites() {
log "Checking prerequisites..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
log "ERROR: Docker not found. Please install Docker"
exit 1
fi

# Check if tar is available
if ! command -v tar &> /dev/null; then
log "ERROR: tar not found"
exit 1
fi

# Check if gzip is available
if ! command -v gzip &> /dev/null; then
log "ERROR: gzip not found"
exit 1
fi

# Check disk space (ensure at least 5GB free)
local available_space=$(df "$BACKUP_ROOT" | awk 'NR==2 {print $4}')
local required_space=5242880 # 5GB in KB

if [[ $available_space -lt $required_space ]]; then
log "WARNING: Low disk space. Available: $(($available_space/1024/1024))GB, Recommended: 5GB"
send_notification "WARNING" "Low disk space for backups"
fi

log "Prerequisites check passed"
}

# Function to check Docker containers
check_docker_status() {
log "Checking Docker container status..."

# Check if PostgreSQL container is running
if docker ps | grep -q "postgres_db"; then
log "PostgreSQL container is running"
return 0
else
log "WARNING: PostgreSQL container is not running"

# Try to start the container
log "Attempting to start PostgreSQL container..."
cd "$PROJECT_DIR"
if docker-compose up -d db; then
log "PostgreSQL container started successfully"
sleep 10 # Wait for container to be ready
return 0
else
log "ERROR: Failed to start PostgreSQL container"
return 1
fi
fi
}

# Function to run database backup
run_database_backup() {
local script_path="$SCRIPT_DIR/backup-database.sh"

log "Starting database backup..."

if [[ -f "$script_path" ]]; then
cd "$PROJECT_DIR"
if bash "$script_path"; then
log "Database backup completed successfully"
return 0
else
log "ERROR: Database backup failed"
return 1
fi
else
log "ERROR: Database backup script not found at $script_path"
return 1
fi
}

# Function to run file backup
run_file_backup() {
local script_path="$SCRIPT_DIR/backup-files.sh"

log "Starting file backup..."

if [[ -f "$script_path" ]]; then
cd "$PROJECT_DIR"
if bash "$script_path"; then
log "File backup completed successfully"
return 0
else
log "ERROR: File backup failed"
return 1
fi
else
log "ERROR: File backup script not found at $script_path"
return 1
fi
}

# Function to run configuration backup
run_config_backup() {
log "Starting configuration backup..."

local config_backup_dir="$BACKUP_ROOT/config"
local timestamp=$(date +"%Y%m%d_%H%M%S")
local backup_file="$config_backup_dir/qlvb_config_$timestamp.tar.gz"

mkdir -p "$config_backup_dir"

cd "$PROJECT_DIR"

# Backup configuration files
if tar -czf "$backup_file" \
--exclude=".git" \
--exclude="*.log" \
--exclude="target/" \
--exclude="build/" \
--exclude=".gradle/" \
--exclude="node_modules/" \
src/main/resources/ \
docker-compose.yml \
build.gradle \
settings.gradle \
Dockerfile \
scripts/ 2>/dev/null; then

local file_size=$(du -h "$backup_file" | cut -f1)
log "Configuration backup completed successfully. Size: $file_size"

# Cleanup old config backups (keep 90 days)
find "$config_backup_dir" -name "*.tar.gz" -type f -mtime +90 -delete

return 0
else
log "ERROR: Configuration backup failed"
return 1
fi
}

# Function to generate backup report
generate_backup_report() {
local report_file="$BACKUP_ROOT/backup-report-$(date +%Y%m%d).txt"

log "Generating backup report..."

cat > "$report_file" << EOF
    QLVB System Backup Report========================Date: $(date)
    Server: $(hostname)
    User: $(whoami)

    Backup Locations:
    - Database: $BACKUP_ROOT/database/
    - Files: $BACKUP_ROOT/files/
    - Configuration: $BACKUP_ROOT/config/

    Database Backup Status:
    $(ls -la $BACKUP_ROOT/database/daily/ 2>/dev/null | tail -5)

    File Backup Status:
    $(ls -la $BACKUP_ROOT/files/daily/ 2>/dev/null | tail -5)

    Configuration Backup Status:
    $(ls -la $BACKUP_ROOT/config/ 2>/dev/null | tail -5)

    Disk Usage:
    $(df -h $BACKUP_ROOT)

    System Load:
    $(uptime)

    Memory Usage:
    $(free -h)

    Docker Status:
    $(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

    End of Report
    EOF

    log "Backup report generated: $report_file"
    }

    # Main execution
    main() {
    log "=== Starting QLVB Master Backup Process ==="

    local backup_success=true
    local failed_components=()

    # Check prerequisites
    if ! check_prerequisites; then
    log "Prerequisites check failed"
    exit 1
    fi

    # Check Docker status
    if ! check_docker_status; then
    log "Docker status check failed"
    failed_components+=("Docker")
    backup_success=false
    fi

    # Run database backup
    if ! run_database_backup; then
    log "Database backup failed"
    failed_components+=("Database")
    backup_success=false
    fi

    # Run file backup
    if ! run_file_backup; then
    log "File backup failed"
    failed_components+=("Files")
    backup_success=false
    fi

    # Run configuration backup
    if ! run_config_backup; then
    log "Configuration backup failed"
    failed_components+=("Configuration")
    backup_success=false
    fi

    # Generate report
    generate_backup_report

    # Send final notification
    if [[ "$backup_success" == true ]]; then
    log "=== QLVB Master Backup Process Completed Successfully ==="
    send_notification "SUCCESS" "All backup components completed successfully"
    else
    local failed_str=$(IFS=', '; echo "${failed_components[*]}")
    log "=== QLVB Master Backup Process Completed With Errors ==="
    log "Failed components: $failed_str"
    send_notification "ERROR" "Backup completed with errors. Failed: $failed_str"
    exit 1
    fi
    }

    # Handle script arguments
    case "${1:-}" in
    "database")
    log "Running database backup only"
    check_prerequisites
    check_docker_status && run_database_backup
    ;;
    "files")
    log "Running file backup only"
    check_prerequisites
    run_file_backup
    ;;
    "config")
    log "Running configuration backup only"
    check_prerequisites
    run_config_backup
    ;;
    "report")
    log "Generating backup report only"
    generate_backup_report
    ;;
    *)
    # Run full backup
    main
    ;;
    esac
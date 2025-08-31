#!/bin/bash

# Setup Cron Jobs for QLVB Backup System
# Author: System Administrator
# Date: $(date)

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_USER="root" # Change this to your preferred user

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if running as root (if needed)
check_permissions() {
if [[ "$CRON_USER" == "root" && $EUID -ne 0 ]]; then
log "ERROR: This script must be run as root to setup cron jobs for root user"
log "Run with: sudo $0"
exit 1
fi
}

# Function to backup existing crontab
backup_crontab() {
local backup_file="/tmp/crontab_backup_$(date +%Y%m%d_%H%M%S).txt"

if crontab -l -u "$CRON_USER" > "$backup_file" 2>/dev/null; then
log "Existing crontab backed up to: $backup_file"
return 0
else
log "No existing crontab found for user $CRON_USER"
return 0
fi
}

# Function to setup cron jobs
setup_cron_jobs() {
log "Setting up cron jobs for QLVB backup system..."

# Create temporary cron file
local temp_cron="/tmp/qlvb_cron_$(date +%Y%m%d_%H%M%S)"

# Get existing crontab (if any)
crontab -l -u "$CRON_USER" 2>/dev/null > "$temp_cron" || true

# Add QLVB backup cron jobs
cat >> "$temp_cron" << EOF

    # QLVB Backup System Cron Jobs
    # Generated on $(date)

    # Daily backup at 2:00 AM
    0 2 * * * cd $PROJECT_DIR && bash $SCRIPT_DIR/backup-master.sh>/dev/null 2>&1

    # Weekly cleanup and maintenance at 1:00 AM on Sunday
    0 1 * * 0 cd $PROJECT_DIR && bash $SCRIPT_DIR/backup-master.sh && bash $SCRIPT_DIR/cleanup-old-backups.sh >/dev/null 2>&1

    # Monthly backup report at 6:00 AM on 1st of month
    0 6 1 * * cd $PROJECT_DIR && bash $SCRIPT_DIR/backup-master.sh report

    # Daily health check at 8:00 AM
    0 8 * * * cd $PROJECT_DIR && bash $SCRIPT_DIR/backup-health-check.sh >/dev/null 2>&1

    EOF

    # Install the crontab
    if crontab -u "$CRON_USER" "$temp_cron"; then
    log "Cron jobs installed successfully for user: $CRON_USER"
    rm -f "$temp_cron"
    return 0
    else
    log "ERROR: Failed to install cron jobs"
    rm -f "$temp_cron"
    return 1
    fi
    }

    # Function to create additional backup scripts
    create_additional_scripts() {
    log "Creating additional backup support scripts..."

    # Create cleanup script
    cat > "$SCRIPT_DIR/cleanup-old-backups.sh" << 'EOF'
        #!/bin/bash

        # Cleanup Old Backups Script
        # This script performs additional cleanup and maintenance

        BACKUP_ROOT="/opt/backups"

        log() {
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
        }

        # Remove empty directories
        find "$BACKUP_ROOT" -type d -empty -delete 2>/dev/null || true

        # Compress old log files
        find "$BACKUP_ROOT" -name "*.log" -mtime +7 -exec gzip {} \; 2>/dev/null || true

        # Remove compressed logs older than 30 days
        find "$BACKUP_ROOT" -name "*.log.gz" -mtime +30 -delete 2>/dev/null || true

        # Remove temporary files
        find /tmp -name "qlvb_*" -mtime +1 -delete 2>/dev/null || true

        log "Cleanup completed"
        EOF

        # Create health check script
        cat > "$SCRIPT_DIR/backup-health-check.sh" << 'EOF'
            #!/bin/bash

            # Backup Health Check Script
            # This script checks the health of the backup system

            BACKUP_ROOT="/opt/backups"
            ALERT_EMAIL="admin@yourdomain.com" # Change this

            log() {
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
            }

            send_alert() {
            local message="$1"
            log "ALERT: $message"
            # Uncomment to enable email alerts
            # echo "$message" | mail -s "QLVB Backup Alert" "$ALERT_EMAIL"
            }

            # Check if backup directories exist
            for dir in database files config; do
            if [[ ! -d "$BACKUP_ROOT/$dir" ]]; then
            send_alert "Backup directory missing: $BACKUP_ROOT/$dir"
            fi
            done

            # Check for recent backups
            YESTERDAY=$(date -d "yesterday" +%Y%m%d)
            if ! find "$BACKUP_ROOT/database/daily" -name "*$YESTERDAY*" -type f 2>/dev/null | grep -q .; then
            send_alert "No database backup found for yesterday"
            fi

            if ! find "$BACKUP_ROOT/files/daily" -name "*$YESTERDAY*" -type f 2>/dev/null | grep -q .; then
            send_alert "No file backup found for yesterday"
            fi

            # Check disk space
            DISK_USAGE=$(df "$BACKUP_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
            if [[ $DISK_USAGE -gt 85 ]]; then
            send_alert "High disk usage in backup directory: ${DISK_USAGE}%"
            fi

            log "Health check completed"
            EOF

            # Make scripts executable
            chmod +x "$SCRIPT_DIR/cleanup-old-backups.sh"
            chmod +x "$SCRIPT_DIR/backup-health-check.sh"

            log "Additional scripts created and made executable"
            }

            # Function to test cron setup
            test_backup_system() {
            log "Testing backup system..."

            # Test database backup script
            if [[ -f "$SCRIPT_DIR/backup-database.sh" ]]; then
            if bash -n "$SCRIPT_DIR/backup-database.sh"; then
            log "Database backup script syntax OK"
            else
            log "ERROR: Database backup script has syntax errors"
            return 1
            fi
            else
            log "ERROR: Database backup script not found"
            return 1
            fi

            # Test file backup script
            if [[ -f "$SCRIPT_DIR/backup-files.sh" ]]; then
            if bash -n "$SCRIPT_DIR/backup-files.sh"; then
            log "File backup script syntax OK"
            else
            log "ERROR: File backup script has syntax errors"
            return 1
            fi
            else
            log "ERROR: File backup script not found"
            return 1
            fi

            # Test master backup script
            if [[ -f "$SCRIPT_DIR/backup-master.sh" ]]; then
            if bash -n "$SCRIPT_DIR/backup-master.sh"; then
            log "Master backup script syntax OK"
            else
            log "ERROR: Master backup script has syntax errors"
            return 1
            fi
            else
            log "ERROR: Master backup script not found"
            return 1
            fi

            log "All backup scripts passed syntax check"
            return 0
            }

            # Function to display cron status
            show_cron_status() {
            log "Current cron jobs for user $CRON_USER:"
            echo "----------------------------------------"
            crontab -l -u "$CRON_USER" 2>/dev/null | grep -A 10 -B 2 "QLVB" || echo "No QLVB cron jobs found"
            echo "----------------------------------------"
            }

            # Function to remove cron jobs
            remove_cron_jobs() {
            log "Removing QLVB backup cron jobs..."

            local temp_cron="/tmp/qlvb_cron_remove_$(date +%Y%m%d_%H%M%S)"

            # Get existing crontab and remove QLVB jobs
            if crontab -l -u "$CRON_USER" 2>/dev/null | grep -v "QLVB" > "$temp_cron"; then
            crontab -u "$CRON_USER" "$temp_cron"
            log "QLVB cron jobs removed"
            rm -f "$temp_cron"
            else
            log "No existing crontab or no QLVB jobs found"
            fi
            }

            # Main execution
            main() {
            log "=== QLVB Backup Cron Setup ==="

            case "${1:-}" in
            "install"|"setup")
            check_permissions
            backup_crontab
            create_additional_scripts
            if test_backup_system; then
            setup_cron_jobs
            show_cron_status
            log "Cron setup completed successfully"
            else
            log "Backup system test failed. Cron setup aborted."
            exit 1
            fi
            ;;
            "remove"|"uninstall")
            check_permissions
            remove_cron_jobs
            show_cron_status
            ;;
            "status")
            show_cron_status
            ;;
            "test")
            test_backup_system
            ;;
            *)
            echo "Usage: $0 {install|remove|status|test}"
            echo ""
            echo "Commands:"
            echo " install - Install QLVB backup cron jobs"
            echo " remove - Remove QLVB backup cron jobs"
            echo " status - Show current cron jobs"
            echo " test - Test backup scripts syntax"
            echo ""
            echo "Example:"
            echo " sudo $0 install"
            exit 1
            ;;
            esac
            }

            # Run main function
            main "$@"
#!/bin/bash

# Database Restore Script for QLVB System
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

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to display usage
usage() {
echo "Usage: $0 <backup_file>"
    echo ""
    echo "Examples:"
    echo " $0 /opt/backups/database/daily/qlvb_daily_20241222_020000.sql.gz"
    echo " $0 /opt/backups/database/weekly/qlvb_weekly_20241222_010000.sql.gz"
    echo ""
    echo "Options:"
    echo " -h, --help Show this help message"
    echo " -v, --verify Verify backup file before restore"
    echo " -f, --force Force restore without confirmation"
    exit 1
    }

    # Function to verify backup file
    verify_backup() {
    local backup_file="$1"

    log "Verifying backup file: $backup_file"

    if [[ ! -f "$backup_file" ]]; then
    log "ERROR: Backup file does not exist: $backup_file"
    return 1
    fi

    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
    if ! gzip -t "$backup_file" 2>/dev/null; then
    log "ERROR: Backup file is corrupted (gzip test failed)"
    return 1
    fi

    # Check SQL content
    if ! zcat "$backup_file" | head -10 | grep -q "PostgreSQL database dump"; then
    log "ERROR: Backup file doesn't appear to be a PostgreSQL dump"
    return 1
    fi
    else
    # Check uncompressed SQL file
    if ! head -10 "$backup_file" | grep -q "PostgreSQL database dump"; then
    log "ERROR: Backup file doesn't appear to be a PostgreSQL dump"
    return 1
    fi
    fi

    log "Backup file verification passed"
    return 0
    }

    # Function to check database connection
    check_database_connection() {
    log "Checking database connection..."

    if docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    log "Database connection successful"
    return 0
    else
    log "ERROR: Cannot connect to database"
    return 1
    fi
    }

    # Function to create database backup before restore
    create_pre_restore_backup() {
    log "Creating pre-restore backup..."

    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="/tmp/qlvb_pre_restore_$timestamp.sql.gz"

    if docker exec "$DOCKER_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges | gzip > "$backup_file"; then
    log "Pre-restore backup created: $backup_file"
    echo "$backup_file"
    return 0
    else
    log "WARNING: Failed to create pre-restore backup"
    return 1
    fi
    }

    # Function to drop and recreate database
    recreate_database() {
    log "Recreating database..."

    # Terminate existing connections
    docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true

        # Drop database if exists
        docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

        # Create database
        if docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"; then
        log "Database recreated successfully"
        return 0
        else
        log "ERROR: Failed to recreate database"
        return 1
        fi
        }

        # Function to restore database
        restore_database() {
        local backup_file="$1"

        log "Starting database restore from: $backup_file"

        # Restore database
        if [[ "$backup_file" == *.gz ]]; then
        # Compressed file
        if zcat "$backup_file" | docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1; then
        log "Database restore completed successfully"
        return 0
        else
        log "ERROR: Database restore failed"
        return 1
        fi
        else
        # Uncompressed file
        if docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$backup_file" ; then
            log "Database restore completed successfully"
            return 0
            else
            log "ERROR: Database restore failed"
            return 1
            fi
            fi
            }

            # Function to verify restore
            verify_restore() {
            log "Verifying database restore..."

            # Check if database exists and is accessible
            if ! docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;">/dev/null 2>&1; then
            log "ERROR: Cannot access restored database"
            return 1
            fi

            # Check if main tables exist
            local table_count=$(docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

            if [[ "$table_count" -gt 0 ]]; then
            log "Database restore verification passed. Tables found: $table_count"
            return 0
            else
            log "ERROR: No tables found in restored database"
            return 1
            fi
            }

            # Main execution
            main() {
            local backup_file="$1"
            local verify_only=false
            local force_restore=false
            local pre_restore_backup=""

            # Parse arguments
            while [[ $# -gt 0 ]]; do
            case $1 in
            -h|--help)
            usage
            ;;
            -v|--verify)
            verify_only=true
            shift
            ;;
            -f|--force)
            force_restore=true
            shift
            ;;
            *)
            if [[ -z "$backup_file" ]]; then
            backup_file="$1"
            fi
            shift
            ;;
            esac
            done

            # Check if backup file is provided
            if [[ -z "$backup_file" ]]; then
            log "ERROR: No backup file specified"
            usage
            fi

            log "=== Starting QLVB Database Restore Process ==="
            log "Backup file: $backup_file"

            # Verify backup file
            if ! verify_backup "$backup_file"; then
            log "Backup file verification failed"
            exit 1
            fi

            if [[ "$verify_only" == true ]]; then
            log "Verification completed successfully"
            exit 0
            fi

            # Check database connection
            if ! check_database_connection; then
            log "Database connection check failed"
            exit 1
            fi

            # Confirmation prompt (unless forced)
            if [[ "$force_restore" != true ]]; then
            echo ""
            echo "WARNING: This will completely replace the current database!"
            echo "Database: $DB_NAME"
            echo "Backup file: $backup_file"
            echo ""
            read -p "Are you sure you want to continue? (yes/no): " confirmation

            if [[ "$confirmation" != "yes" ]]; then
            log "Restore cancelled by user"
            exit 0
            fi
            fi

            # Create pre-restore backup
            if pre_restore_backup=$(create_pre_restore_backup); then
            log "Pre-restore backup location: $pre_restore_backup"
            fi

            # Recreate database
            if ! recreate_database; then
            log "Failed to recreate database"
            exit 1
            fi

            # Restore database
            if ! restore_database "$backup_file"; then
            log "Database restore failed"

            if [[ -n "$pre_restore_backup" ]]; then
            log "You can restore the previous state using: $pre_restore_backup"
            fi

            exit 1
            fi

            # Verify restore
            if ! verify_restore; then
            log "Database restore verification failed"
            exit 1
            fi

            log "=== QLVB Database Restore Process Completed Successfully ==="

            if [[ -n "$pre_restore_backup" ]]; then
            log "Pre-restore backup saved at: $pre_restore_backup"
            log "You can delete it if the restore is working correctly"
            fi
            }

            # Run main function with all arguments
            main "$@"
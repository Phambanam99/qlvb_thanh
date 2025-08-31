#!/bin/bash

# Test Docker Backup Environment Script
# Author: System Administrator
# Date: $(date)

set -e

# Configuration
DOCKER_CONTAINER="postgres_db"
DB_NAME="qlvb"
DB_USER="admin"

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check Docker
check_docker() {
log "=== Checking Docker Environment ==="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
log "ERROR: Docker not found"
return 1
fi

log "✓ Docker is installed: $(docker --version)"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
log "ERROR: Docker Compose not found"
return 1
fi

log "✓ Docker Compose is installed: $(docker-compose --version)"

return 0
}

# Function to check PostgreSQL container
check_postgres_container() {
log "=== Checking PostgreSQL Container ==="

# Check if container exists
if ! docker ps -a --format "table {{.Names}}" | grep -q "$DOCKER_CONTAINER"; then
log "ERROR: PostgreSQL container '$DOCKER_CONTAINER' not found"
log "Available containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}"
return 1
fi

log "✓ PostgreSQL container exists"

# Check if container is running
if ! docker ps --format "table {{.Names}}" | grep -q "$DOCKER_CONTAINER"; then
log "WARNING: PostgreSQL container is not running"
log "Container status:"
docker ps -a --filter "name=$DOCKER_CONTAINER" --format "table {{.Names}}\t{{.Status}}"

# Try to start the container
log "Attempting to start container..."
if docker start "$DOCKER_CONTAINER"; then
log "✓ Container started successfully"
sleep 5 # Wait for container to be ready
else
log "ERROR: Failed to start container"
return 1
fi
else
log "✓ PostgreSQL container is running"
fi

return 0
}

# Function to test database connection
test_database_connection() {
log "=== Testing Database Connection ==="

# Test basic connection
if docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
log "✓ Can connect to PostgreSQL server"
else
log "ERROR: Cannot connect to PostgreSQL server"
return 1
fi

# Test specific database
if docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
log "✓ Can connect to database '$DB_NAME'"
else
log "ERROR: Cannot connect to database '$DB_NAME'"
return 1
fi

# Get database size
local db_size=$(docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')

if [[ -n "$db_size" ]]; then
log "✓ Database size: $db_size"
fi

# Get table count
local table_count=$(docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')

if [[ -n "$table_count" ]]; then
log "✓ Number of tables: $table_count"
fi

return 0
}

# Function to test backup functionality
test_backup_functionality() {
log "=== Testing Backup Functionality ==="

local test_backup="/tmp/test_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Test pg_dump through Docker
if docker exec "$DOCKER_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
--no-owner --no-privileges --create --clean | gzip > "$test_backup"; then

if [[ -f "$test_backup" && -s "$test_backup" ]]; then
local file_size=$(du -h "$test_backup" | cut -f1)
log "✓ Test backup created successfully: $file_size"

# Test backup integrity
if gzip -t "$test_backup" 2>/dev/null; then
log "✓ Test backup file integrity OK"
else
log "ERROR: Test backup file is corrupted"
return 1
fi

# Cleanup test backup
rm -f "$test_backup"
log "✓ Test backup cleaned up"
else
log "ERROR: Test backup file is empty or missing"
return 1
fi
else
log "ERROR: Test backup failed"
return 1
fi

return 0
}

# Function to display system information
display_system_info() {
log "=== System Information ==="

log "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

log ""
log "Docker Compose services:"
if [[ -f "docker-compose.yml" ]]; then
docker-compose ps 2>/dev/null || log "No docker-compose services found"
else
log "No docker-compose.yml found in current directory"
fi

log ""
log "Disk space:"
df -h /opt/backups 2>/dev/null || df -h /tmp

log ""
log "Current directory: $(pwd)"
}

# Main execution
main() {
log "=== QLVB Docker Backup Environment Test ==="

local all_tests_passed=true

# Run all tests
if ! check_docker; then
all_tests_passed=false
fi

if ! check_postgres_container; then
all_tests_passed=false
fi

if ! test_database_connection; then
all_tests_passed=false
fi

if ! test_backup_functionality; then
all_tests_passed=false
fi

# Display system information
display_system_info

log ""
if [[ "$all_tests_passed" == true ]]; then
log "=== ✅ ALL TESTS PASSED ==="
log "Your Docker backup environment is ready!"
exit 0
else
log "=== ❌ SOME TESTS FAILED ==="
log "Please fix the issues above before running backups"
exit 1
fi
}

# Run main function
main "$@"
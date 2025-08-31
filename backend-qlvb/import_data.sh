#!/bin/sh

set -e

echo "=== QLVB Data Import Script ==="

# Set default values if environment variables are not provided
DB_HOST=${POSTGRES_HOST:-"postgres"}
DB_NAME=${POSTGRES_DB:-"qlvb"}
DB_USER=${POSTGRES_USER:-"admin"}
DB_PASS=${POSTGRES_PASSWORD:-"Phamnam99"}

echo "Database configuration:"
echo " Host: $DB_HOST"
echo " Database: $DB_NAME"
echo " User: $DB_USER"

# Function to wait for database
wait_for_database() {
echo "Waiting for PostgreSQL to be ready..."
local retries=30
local count=0

while [ $count -lt $retries ]; do
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
echo "✓ PostgreSQL is ready"
return 0
fi

count=$((count + 1))
echo "PostgreSQL not ready, waiting... ($count/$retries)"
sleep 2
done

echo "✗ PostgreSQL connection failed after $retries attempts"
return 1
}

# Function to wait for Spring Boot
wait_for_spring_boot() {
echo "Waiting for Spring Boot to be ready (sleep 20s)..."
sleep 20
echo "✓ Spring Boot assumed ready after sleep"
return 0
}

# Function to check if data already exists
check_existing_data() {
echo "Checking existing data..."
user_count=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
if [ "$user_count" -ge 2 ]; then
echo "✓ Found $user_count users. Data already exists, skipping import."
return 1
fi
return 0
}

# Function to import SQL file
import_sql_file() {
local file_path="$1"
local description="$2"

if [ -f "$file_path" ]; then
echo "Importing $description..."
if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file_path"; then
echo "✓ $description imported successfully"
else
echo "✗ Failed to import $description"
return 1
fi
else
echo "⚠ File not found: $file_path"
return 1
fi
}

# Main execution
echo "Step 1: Wait for PostgreSQL"
if ! wait_for_database; then
echo "FATAL: Cannot connect to PostgreSQL"
exit 1
fi

echo "Step 2: Wait for Spring Boot"
if ! wait_for_spring_boot; then
echo "WARNING: Spring Boot not ready, but continuing with import"
fi

echo "Step 3: Check existing data"
if ! check_existing_data; then
echo "Data already exists, exiting"
exit 0
fi

echo "Step 4: Import data files"

# Import in correct order
import_sql_file "/app/src/main/resources/db/migration/V2__insert_department_data.sql" "Department data"
import_sql_file "/app/src/main/resources/db/migration/V3__insert_users_data.sql" "Users data"
import_sql_file "/app/src/main/resources/db/migration/V4__insert_senders_data.sql" "Senders data"
import_sql_file "/app/src/main/resources/db/migration/V7__insert_document_types.sql" "Document types"
import_sql_file "/app/src/main/resources/db/migration/V6__reset_all_user_passwords.sql" "Reset all passwords"

echo "✓ All data imported successfully!"
echo "=== Import completed ==="
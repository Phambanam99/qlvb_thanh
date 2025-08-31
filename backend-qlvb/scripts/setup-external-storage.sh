#!/bin/bash

# Setup External Storage Script for QLVB
# Author: System Administrator
# Date: $(date)

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_DIR="$PROJECT_DIR/data"
DOCUMENT_UPLOADS_DIR="$DATA_DIR/document-uploads"
UPLOADS_DIR="$DATA_DIR/uploads"

# Function to log messages
log() {
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to create directories
create_directories() {
log "=== Creating External Storage Directories ==="

# Create main data directory
if [[ ! -d "$DATA_DIR" ]]; then
mkdir -p "$DATA_DIR"
log "✓ Created data directory: $DATA_DIR"
else
log "✓ Data directory already exists: $DATA_DIR"
fi

# Create document-uploads directory
if [[ ! -d "$DOCUMENT_UPLOADS_DIR" ]]; then
mkdir -p "$DOCUMENT_UPLOADS_DIR"
log "✓ Created document-uploads directory: $DOCUMENT_UPLOADS_DIR"
else
log "✓ Document-uploads directory already exists: $DOCUMENT_UPLOADS_DIR"
fi

# Create uploads directory (for guide files)
if [[ ! -d "$UPLOADS_DIR" ]]; then
mkdir -p "$UPLOADS_DIR"
# Create subdirectory for guide files
mkdir -p "$UPLOADS_DIR/guide-files"
log "✓ Created uploads directory: $UPLOADS_DIR"
log "✓ Created guide-files subdirectory: $UPLOADS_DIR/guide-files"
else
log "✓ Uploads directory already exists: $UPLOADS_DIR"
if [[ ! -d "$UPLOADS_DIR/guide-files" ]]; then
mkdir -p "$UPLOADS_DIR/guide-files"
log "✓ Created guide-files subdirectory: $UPLOADS_DIR/guide-files"
fi
fi
}

# Function to migrate existing data
migrate_existing_data() {
log "=== Migrating Existing Data ==="

# Migrate document-uploads if exists
if [[ -d "$PROJECT_DIR/document-uploads" && "$(ls -A "$PROJECT_DIR/document-uploads" 2>/dev/null)" ]]; then
log "Found existing document-uploads data, migrating..."
cp -r "$PROJECT_DIR/document-uploads"/* "$DOCUMENT_UPLOADS_DIR/" 2>/dev/null || true
log "✓ Migrated document-uploads data"

# Ask user if they want to remove old directory
echo ""
read -p "Do you want to remove the old document-uploads directory? (y/n): " remove_old
if [[ "$remove_old" == "y" || "$remove_old" == "Y" ]]; then
rm -rf "$PROJECT_DIR/document-uploads"
log "✓ Removed old document-uploads directory"
else
log "⚠ Old document-uploads directory kept for safety"
fi
else
log "No existing document-uploads data to migrate"
fi

# Migrate uploads if exists
if [[ -d "$PROJECT_DIR/uploads" && "$(ls -A "$PROJECT_DIR/uploads" 2>/dev/null)" ]]; then
log "Found existing uploads data, migrating..."
cp -r "$PROJECT_DIR/uploads"/* "$UPLOADS_DIR/" 2>/dev/null || true
log "✓ Migrated uploads data"

# Ask user if they want to remove old directory
echo ""
read -p "Do you want to remove the old uploads directory? (y/n): " remove_old
if [[ "$remove_old" == "y" || "$remove_old" == "Y" ]]; then
rm -rf "$PROJECT_DIR/uploads"
log "✓ Removed old uploads directory"
else
log "⚠ Old uploads directory kept for safety"
fi
else
log "No existing uploads data to migrate"
fi
}

# Function to set permissions
set_permissions() {
log "=== Setting Permissions ==="

# Set appropriate permissions for Docker containers
# Docker will run as user 1000:1000 by default
if command -v chown &> /dev/null; then
# On Linux systems
if [[ $EUID -eq 0 ]]; then
chown -R 1000:1000 "$DATA_DIR"
log "✓ Set ownership to 1000:1000 (Docker user)"
else
log "⚠ Not running as root, skipping chown (may need sudo)"
fi
fi

# Set read/write permissions
chmod -R 755 "$DATA_DIR"
chmod -R 777 "$DOCUMENT_UPLOADS_DIR" # More permissive for file uploads
chmod -R 777 "$UPLOADS_DIR" # More permissive for file uploads

log "✓ Set directory permissions"
}

# Function to create .gitignore for data directory
create_gitignore() {
log "=== Creating .gitignore for Data Directory ==="

cat > "$DATA_DIR/.gitignore" << 'EOF'
    # Ignore all uploaded files but keep directory structure
    *
    !.gitignore
    !.gitkeep

    # Keep important subdirectories
    !document-uploads/
    !uploads/

    # But ignore all files in those directories
    document-uploads/*
    uploads/*

    # Keep .gitkeep files
    !**/.gitkeep
    EOF

    # Create .gitkeep files to maintain directory structure
    touch "$DOCUMENT_UPLOADS_DIR/.gitkeep"
    touch "$UPLOADS_DIR/.gitkeep"
    touch "$UPLOADS_DIR/guide-files/.gitkeep"

    log "✓ Created .gitignore and .gitkeep files"
    }

    # Function to update docker-compose paths if needed
    update_docker_compose_info() {
    log "=== Docker Compose Information ==="

    log "External storage directories are now set up at:"
    log "  - Document uploads: $DOCUMENT_UPLOADS_DIR"
    log "  - Guide files: $UPLOADS_DIR"
    log ""
    log "Docker Compose will mount these directories as:"
    log "  - ./data/document-uploads:/app/document-uploads"
    log "  - ./data/uploads:/app/uploads"
    log ""
    log "Make sure your docker-compose.yml has the correct volume mounts!"
    }

    # Function to test directory setup
    test_directory_setup() {
    log "=== Testing Directory Setup ==="

    # Test write permissions
    local test_file_1="$DOCUMENT_UPLOADS_DIR/test-write-$(date +%s).txt"
    local test_file_2="$UPLOADS_DIR/test-write-$(date +%s).txt"

    if echo "test"> "$test_file_1" 2>/dev/null; then
    rm -f "$test_file_1"
    log "✓ Document-uploads directory is writable"
    else
    log "❌ Document-uploads directory is NOT writable"
    return 1
    fi

    if echo "test" > "$test_file_2" 2>/dev/null; then
    rm -f "$test_file_2"
    log "✓ Uploads directory is writable"
    else
    log "❌ Uploads directory is NOT writable"
    return 1
    fi

    log "✓ All directories are properly configured"
    }

    # Function to display summary
    display_summary() {
    log "=== Setup Summary ==="

    echo ""
    echo "External Storage Setup Complete!"
    echo "================================"
    echo ""
    echo "Storage Locations:"
    echo " 📁 Data Directory: $DATA_DIR"
    echo " 📁 Document Uploads: $DOCUMENT_UPLOADS_DIR"
    echo " 📁 Guide Files: $UPLOADS_DIR"
    echo ""
    echo "Directory Sizes:"
    echo " $(du -sh "$DOCUMENT_UPLOADS_DIR" 2>/dev/null || echo "0B $DOCUMENT_UPLOADS_DIR")"
    echo " $(du -sh "$UPLOADS_DIR" 2>/dev/null || echo "0B $UPLOADS_DIR")"
    echo ""
    echo "Next Steps:"
    echo " 1. Start your Docker containers: docker-compose up -d"
    echo " 2. Test file uploads through the application"
    echo " 3. Run backup script: ./scripts/backup-files.sh"
    echo ""
    }

    # Main execution
    main() {
    log "=== QLVB External Storage Setup ==="
    log "Project directory: $PROJECT_DIR"

    # Create directories
    create_directories

    # Migrate existing data
    migrate_existing_data

    # Set permissions
    set_permissions

    # Create .gitignore
    create_gitignore

    # Display Docker Compose info
    update_docker_compose_info

    # Test setup
    if test_directory_setup; then
    display_summary
    log "✅ External storage setup completed successfully!"
    exit 0
    else
    log "❌ External storage setup failed!"
    exit 1
    fi
    }

    # Handle script arguments
    case "${1:-}" in
    "test")
    log "Testing directory setup only"
    test_directory_setup
    ;;
    "migrate")
    log "Migrating existing data only"
    create_directories
    migrate_existing_data
    ;;
    "permissions")
    log "Setting permissions only"
    set_permissions
    ;;
    *)
    # Run full setup
    main
    ;;
    esac
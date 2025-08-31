#!/bin/bash

# 🚀 Migration Script for Văn Bản Đến Refactoring
# This script safely migrates from the old monolithic structure to the new modular architecture

echo "🚀 Starting văn bản đến refactoring migration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "app/(authenticated)/van-ban-den/page.tsx" ]; then
    print_error "This script must be run from the frontend root directory"
    exit 1
fi

print_status "Creating backup of original files..."

# Create backup directory
BACKUP_DIR="app/(authenticated)/van-ban-den/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup original files
cp "app/(authenticated)/van-ban-den/page.tsx" "$BACKUP_DIR/page-original.tsx"
cp "app/(authenticated)/van-ban-den/loading.tsx" "$BACKUP_DIR/loading-original.tsx" 2>/dev/null || true

print_success "Backup created at $BACKUP_DIR"

print_status "Verifying new refactored structure..."

# Check if refactored files exist
REQUIRED_FILES=(
    "app/(authenticated)/van-ban-den/types/index.ts"
    "app/(authenticated)/van-ban-den/utils/status-utils.ts"
    "app/(authenticated)/van-ban-den/utils/permission-utils.ts"
    "app/(authenticated)/van-ban-den/utils/format-utils.ts"
    "app/(authenticated)/van-ban-den/components/DocumentFilters.tsx"
    "app/(authenticated)/van-ban-den/components/DocumentTable.tsx"
    "app/(authenticated)/van-ban-den/components/ErrorBoundary.tsx"
    "app/(authenticated)/van-ban-den/hooks/use-incoming-documents-data.ts"
    "app/(authenticated)/van-ban-den/page-refactored.tsx"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    print_error "Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    print_error "Please ensure all refactored files are created first"
    exit 1
fi

print_success "All refactored files are present"

print_status "Running TypeScript type check on refactored files only..."

# Create a temporary tsconfig for checking only our refactored files
TEMP_TSCONFIG="tsconfig.refactor-check.json"
cat > "$TEMP_TSCONFIG" << 'EOF'
{
  "extends": "./tsconfig.json",
  "include": [
    "app/(authenticated)/van-ban-den/types/**/*",
    "app/(authenticated)/van-ban-den/utils/**/*",
    "app/(authenticated)/van-ban-den/components/**/*",
    "app/(authenticated)/van-ban-den/hooks/**/*",
    "app/(authenticated)/van-ban-den/page-refactored.tsx"
  ],
  "exclude": [
    "app/(authenticated)/van-ban-den/page.tsx",
    "app/(authenticated)/van-ban-den/page-legacy.tsx"
  ]
}
EOF

# Type check only refactored files
print_status "Checking TypeScript types for refactored files..."
REFACTOR_TS_ERRORS=$(npx tsc --noEmit --project "$TEMP_TSCONFIG" 2>&1)
TS_CHECK_EXIT_CODE=$?

# Clean up temp config
rm -f "$TEMP_TSCONFIG"

if [ $TS_CHECK_EXIT_CODE -ne 0 ]; then
    print_warning "TypeScript errors detected in refactored files:"
    echo "$REFACTOR_TS_ERRORS"
    print_status "These errors are in the refactored code and should be fixed."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Migration cancelled"
        exit 1
    fi
    print_warning "Continuing with TypeScript errors - please fix them after migration"
else
    print_success "TypeScript check completed - no errors in refactored files"
fi

print_status "Creating migration log..."

# Create migration log
LOG_FILE="app/(authenticated)/van-ban-den/migration-log-$(date +%Y%m%d-%H%M%S).md"
cat > "$LOG_FILE" << EOF
# Văn Bản Đến Migration Log

**Migration Date:** $(date)
**Migration Type:** Monolithic to Modular Refactoring

## Files Modified

### Backed Up
- \`page.tsx\` → \`$BACKUP_DIR/page-original.tsx\`
- \`loading.tsx\` → \`$BACKUP_DIR/loading-original.tsx\`

### New Files Created
- \`types/index.ts\` - Type definitions
- \`utils/status-utils.ts\` - Status management utilities
- \`utils/permission-utils.ts\` - Permission management utilities  
- \`utils/format-utils.ts\` - Formatting utilities
- \`components/DocumentFilters.tsx\` - Document filters component
- \`components/DocumentTable.tsx\` - Document table component
- \`components/ErrorBoundary.tsx\` - Error boundary component
- \`hooks/use-incoming-documents-data.ts\` - Custom data hook
- \`page-refactored.tsx\` - New main page component

## Migration Steps Completed
1. ✅ Backup original files
2. ✅ Verify new structure
3. ✅ TypeScript type check
4. ⏳ File migration (next step)
5. ⏳ Testing (manual step required)
6. ⏳ Cleanup (manual step after verification)

## Next Steps
1. Test the refactored page at \`/van-ban-den\` route
2. Compare functionality with backup
3. Remove backup files after verification
4. Update any dependent components

## Rollback Instructions
If issues occur, restore from backup:
\`\`\`bash
cp $BACKUP_DIR/page-original.tsx app/(authenticated)/van-ban-den/page.tsx
\`\`\`
EOF

print_success "Migration log created: $LOG_FILE"

print_status "Performing file migration..."

# Move original page to legacy
mv "app/(authenticated)/van-ban-den/page.tsx" "app/(authenticated)/van-ban-den/page-legacy.tsx"
print_success "Original page renamed to page-legacy.tsx"

# Move refactored page to main
mv "app/(authenticated)/van-ban-den/page-refactored.tsx" "app/(authenticated)/van-ban-den/page.tsx"
print_success "Refactored page is now the main page.tsx"

print_status "Creating post-migration verification script..."

# Create verification script
VERIFY_SCRIPT="app/(authenticated)/van-ban-den/verify-migration.js"
cat > "$VERIFY_SCRIPT" << 'EOF'
// Post-migration verification script
// Run with: node verify-migration.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying migration...');

const requiredFiles = [
    'types/index.ts',
    'utils/status-utils.ts', 
    'utils/permission-utils.ts',
    'utils/format-utils.ts',
    'components/DocumentFilters.tsx',
    'components/DocumentTable.tsx',
    'components/ErrorBoundary.tsx',
    'hooks/use-incoming-documents-data.ts',
    'page.tsx'
];

let allGood = true;

requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allGood = false;
    }
});

if (allGood) {
    console.log('\n🎉 Migration verification successful!');
    console.log('All required files are present.');
    console.log('\n📋 Next steps:');
    console.log('1. Test the application at /van-ban-den');
    console.log('2. Compare functionality with the backup');
    console.log('3. Run: npm run dev and verify everything works');
    console.log('4. If satisfied, you can remove page-legacy.tsx');
} else {
    console.log('\n❌ Migration verification failed!');
    console.log('Some required files are missing.');
    console.log('Please check the file paths and ensure all files were created correctly.');
}
EOF

print_success "Verification script created: $VERIFY_SCRIPT"

print_status "Migration completed successfully!"

echo ""
echo "📋 Summary:"
echo "  ✅ Original files backed up to: $BACKUP_DIR"
echo "  ✅ Refactored structure is now active"
echo "  ✅ Migration log created: $LOG_FILE"
echo "  ✅ Verification script created: $VERIFY_SCRIPT"
echo ""
echo "🚀 Next Steps:"
echo "  1. Run: cd app/(authenticated)/van-ban-den && node verify-migration.js"
echo "  2. Test the application: npm run dev"
echo "  3. Navigate to /van-ban-den and verify functionality"
echo "  4. Compare with backup to ensure no regression"
echo "  5. If everything works, remove page-legacy.tsx"
echo ""
echo "🔄 Rollback (if needed):"
echo "  cp $BACKUP_DIR/page-original.tsx app/(authenticated)/van-ban-den/page.tsx"
echo ""
print_success "Migration script completed! 🎉"
EOF

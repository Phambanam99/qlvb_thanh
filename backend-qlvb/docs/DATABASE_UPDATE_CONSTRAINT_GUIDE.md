# Script để thêm UPDATE status vào database constraint

## Cách 1: Sử dụng psql command line
```bash
# Kết nối vào database
psql -U admin -d qlvb_database

# Chạy SQL commands
ALTER TABLE internal_document DROP CONSTRAINT IF EXISTS internal_document_status_check;

ALTER TABLE internal_document ADD CONSTRAINT internal_document_status_check 
CHECK (status IN (
    'DRAFT', 'REGISTERED', 'FORMAT_CORRECTION', 'FORMAT_CORRECTED', 
    'DISTRIBUTED', 'DEPT_ASSIGNED', 'PENDING_APPROVAL', 
    'SPECIALIST_PROCESSING', 'SPECIALIST_SUBMITTED', 
    'LEADER_REVIEWING', 'LEADER_APPROVED', 'LEADER_COMMENTED', 
    'NOT_PROCESSED', 'IN_PROCESS', 'PROCESSED', 
    'PUBLISHED', 'COMPLETED', 'REJECTED', 'ARCHIVED', 
    'HEADER_DEPARTMENT_REVIEWING', 'HEADER_DEPARTMENT_APPROVED', 
    'HEADER_DEPARTMENT_COMMENTED', 'UPDATE'
));
```

## Cách 2: Sử dụng pgAdmin hoặc database client
1. Mở pgAdmin
2. Kết nối tới database qlvb
3. Mở Query Tool
4. Paste và chạy SQL commands ở trên

## Cách 3: Sử dụng application.properties
Nếu dùng Flyway hoặc Liquibase migration, tạo file migration mới:

### File: src/main/resources/db/migration/V{next_version}__add_update_status.sql
```sql
ALTER TABLE internal_document DROP CONSTRAINT IF EXISTS internal_document_status_check;

ALTER TABLE internal_document ADD CONSTRAINT internal_document_status_check 
CHECK (status IN (
    'DRAFT', 'REGISTERED', 'FORMAT_CORRECTION', 'FORMAT_CORRECTED', 
    'DISTRIBUTED', 'DEPT_ASSIGNED', 'PENDING_APPROVAL', 
    'SPECIALIST_PROCESSING', 'SPECIALIST_SUBMITTED', 
    'LEADER_REVIEWING', 'LEADER_APPROVED', 'LEADER_COMMENTED', 
    'NOT_PROCESSED', 'IN_PROCESS', 'PROCESSED', 
    'PUBLISHED', 'COMPLETED', 'REJECTED', 'ARCHIVED', 
    'HEADER_DEPARTMENT_REVIEWING', 'HEADER_DEPARTMENT_APPROVED', 
    'HEADER_DEPARTMENT_COMMENTED', 'UPDATE'
));
```

## Kiểm tra sau khi update
```sql
-- Kiểm tra constraint đã được tạo
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'internal_document_status_check';

-- Test constraint với UPDATE status
INSERT INTO internal_document (status, ...) VALUES ('UPDATE', ...);
```

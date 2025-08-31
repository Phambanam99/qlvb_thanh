# API Documentation - Example JSON Payloads

This document provides example JSON payloads for testing the Document Management System API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Incoming Documents](#incoming-documents)
- [Outgoing Documents](#outgoing-documents)

## Authentication

### Login

```json
{
  "username": "admin",
  "password": "password123"
}
```

### Register New User

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "name": "New User",
  "userStatus": "ACTIVE",
  "userRoles": ["USER"]
}
```

### Register User with Organizational Role

```json
{
  "username": "department_head",
  "email": "head@example.com",
  "name": "Department Head",
  "userStatus": "ACTIVE",
  "userRoles": ["DEPARTMENT_HEAD"]
}
```

## Users

### Update User

```json
{
  "username": "updateduser",
  "email": "updated@example.com",
  "name": "Updated User Name",
  "userStatus": "ACTIVE",
  "userRoles": ["EDITOR"]
}
```

### Update User with Vietnamese Role

```json
{
  "username": "vietnamese_role",
  "email": "vn@example.com",
  "userStatus": "ACTIVE",
  "userRoles": ["Trưởng phòng"]
}
```

### Update Password

```json
{
  "newPassword": "newSecurePassword123"
}
```

### Filter Users

Example query parameters:

- `GET /api/users/filter?role=DEPARTMENT_HEAD&status=ACTIVE`
- `GET /api/users/filter?role=Trưởng%20phòng` (using Vietnamese name)
- `GET /api/users/filter?status=1` (using numeric status)

## Incoming Documents

### Create New Incoming Document

```json
{
  "title": "Sample Incoming Document",
  "documentNumber": "123",
  "referenceNumber": "REF-2025-001",
  "issuingAuthority": "Ministry of Finance",
  "urgencyLevel": "High",
  "signingDate": "2025-04-17",
  "processingStatus": "Pending",
  "closureRequest": false,
  "emailSource": "finance@ministry.gov",
  "sendingDepartmentName": "Finance Department",
  "primaryProcessorId": 1
}
```

### Update Existing Incoming Document

```json
{
  "id": 1,
  "title": "Updated Incoming Document",
  "documentNumber": "123",
  "referenceNumber": "REF-2025-001-UPD",
  "issuingAuthority": "Ministry of Finance",
  "urgencyLevel": "Critical",
  "signingDate": "2025-04-17",
  "processingStatus": "In Progress",
  "closureRequest": true,
  "emailSource": "finance@ministry.gov",
  "sendingDepartmentName": "Finance Department",
  "primaryProcessorId": 2
}
```

### Search Incoming Documents

Example query parameters:

- `GET /api/documents/incoming/search?keyword=finance`
- `GET /api/documents/incoming/urgency-level?level=High`
- `GET /api/documents/incoming/processing-status?status=Pending`
- `GET /api/documents/incoming/date-range?start=2025-04-01T00:00:00&end=2025-04-30T23:59:59`

## Outgoing Documents

### Create New Outgoing Document

```json
{
  "title": "Sample Outgoing Document",
  "documentType": "Official",
  "documentNumber": 456,
  "referenceNumber": "OUT-2025-001",
  "signerId": 1,
  "signingDate": "2025-04-17T09:30:00",
  "draftingDepartment": 1,
  "relatedDocuments": "REF-2025-001",
  "storageLocation": 2,
  "documentVolume": "Vol 3",
  "emailAddress": "recipient@example.com",
  "receivingDepartmentText": "Human Resources Department"
}
```

### Update Existing Outgoing Document

```json
{
  "id": 1,
  "title": "Updated Outgoing Document",
  "documentType": "Official",
  "documentNumber": 456,
  "referenceNumber": "OUT-2025-001-UPD",
  "signerId": 2,
  "signingDate": "2025-04-18T10:30:00",
  "draftingDepartment": 1,
  "relatedDocuments": "REF-2025-001, REF-2025-002",
  "storageLocation": 3,
  "documentVolume": "Vol 3A",
  "emailAddress": "newrecipient@example.com",
  "receivingDepartmentText": "Marketing Department"
}
```

### Search Outgoing Documents

Example query parameters:

- `GET /api/documents/outgoing/search?keyword=Official`
- `GET /api/documents/outgoing/document-type?type=Official`
- `GET /api/documents/outgoing/date-range?start=2025-04-01T00:00:00&end=2025-04-30T23:59:59`

## File Upload Examples

### Upload Incoming Document Attachment

```bash
curl -X POST \
  http://localhost:8080/api/documents/incoming/1/attachment \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@/path/to/your/document.pdf'
```

### Upload Outgoing Document Attachment

```bash
curl -X POST \
  http://localhost:8080/api/documents/outgoing/1/attachment \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'file=@/path/to/your/document.pdf'
```

## Testing with Roles and Status

### Example User with All Role Types

```json
{
  "username": "full_access_user",
  "email": "full@example.com",
  "name": "Full Access User",
  "userStatus": "ACTIVE",
  "userRoles": ["ADMIN", "DEPARTMENT_HEAD", "CUC_TRUONG"]
}
```

### Example Status Usage

```json
{
  "username": "pending_user",
  "email": "pending@example.com",
  "name": "Pending Approval User",
  "userStatus": "PENDING_APPROVAL",
  "userRoles": ["USER"]
}
```

## Notes for Testing

1. Replace placeholder IDs (like `signerId`, `primaryProcessorId`) with actual IDs from your database
2. The JWT token must be obtained first through the login endpoint
3. Vietnamese role names are fully supported in API requests
4. Both integer values and string names are supported for user status

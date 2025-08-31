# API Documentation - Internal Documents

## Tổng quan

Hệ thống quản lý công văn nội bộ cho phép gửi và nhận công văn giữa các phòng ban và cá nhân trong tổ chức.

## Base URL

```
/api/internal-documents
```

## Endpoints

### 1. Tạo công văn nội bộ (có đính kèm file)

**Endpoint:** `POST /api/internal-documents`  
**Content-Type:** `multipart/form-data`

#### Request Parameters:

- `document` (JSON string, required): Thông tin công văn
- `files` (file[], optional): Các file đính kèm
- `descriptions` (string[], optional): Mô tả cho từng file

#### Example Request:

```bash
curl -X POST \
  http://localhost:8080/api/internal-documents \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'document={
    "documentNumber": "CV-001/2025",
    "title": "Thông báo họp định kỳ",
    "summary": "Thông báo lịch họp định kỳ tháng 6",
    "documentType": "Thông báo",
    "signingDate": "2025-06-02T07:43:59.479Z",
    "priority": "NORMAL",
    "notes": "Mọi người tham dự đúng giờ",
    "recipients": [
      {"departmentId": 1},
      {"departmentId": 12, "userId": 18}
    ]
  }' \
  -F 'files=@file1.pdf' \
  -F 'files=@file2.docx' \
  -F 'descriptions=Tài liệu họp' \
  -F 'descriptions=Danh sách tham dự'
```

#### Document JSON Structure:

```json
{
  "documentNumber": "string (required)",
  "title": "string (required, max 2000 chars)",
  "summary": "string (optional)",
  "documentType": "string (optional)",
  "signingDate": "datetime (ISO format, optional)",
  "priority": "LOW|NORMAL|HIGH|URGENT (required)",
  "notes": "string (optional)",
  "recipients": [
    {
      "departmentId": "number (required)",
      "userId": "number (optional - null means send to all users in department)",
      "notes": "string (optional)"
    }
  ],
  "replyToId": "number (optional - for reply documents)"
}
```

#### Response (201 Created):

```json
{
  "id": 123,
  "documentNumber": "CV-001/2025",
  "title": "Thông báo họp định kỳ",
  "summary": "Thông báo lịch họp định kỳ tháng 6",
  "documentType": "Thông báo",
  "signingDate": "2025-06-02T07:43:59.479Z",
  "priority": "NORMAL",
  "notes": "Mọi người tham dự đúng giờ",
  "status": "PENDING_APPROVAL",
  "isInternal": true,
  "senderId": 5,
  "senderName": "Nguyễn Văn A",
  "senderDepartment": "Phòng Hành chính",
  "recipients": [
    {
      "id": 1,
      "departmentId": 1,
      "departmentName": "Phòng Kỹ thuật",
      "userId": null,
      "userName": null,
      "isRead": false,
      "receivedAt": "2025-06-02T07:43:59.479Z"
    },
    {
      "id": 2,
      "departmentId": 12,
      "departmentName": "Phòng Kinh doanh",
      "userId": 18,
      "userName": "Trần Thị B",
      "isRead": false,
      "receivedAt": "2025-06-02T07:43:59.479Z"
    }
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "file1.pdf",
      "contentType": "application/pdf",
      "fileSize": 1024000,
      "uploadedAt": "2025-06-02T07:43:59.479Z",
      "uploadedByName": "Nguyễn Văn A",
      "description": "Tài liệu họp"
    }
  ],
  "replyToId": null,
  "replyToTitle": null,
  "replyCount": 0,
  "createdAt": "2025-06-02T07:43:59.479Z",
  "updatedAt": "2025-06-02T07:43:59.479Z",
  "isRead": false,
  "readAt": null
}
```

### 2. Tạo công văn nội bộ (chỉ JSON, không file)

**Endpoint:** `POST /api/internal-documents/json`  
**Content-Type:** `application/json`

```bash
curl -X POST \
  http://localhost:8080/api/internal-documents/json \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "documentNumber": "CV-002/2025",
    "title": "Yêu cầu báo cáo",
    "summary": "Yêu cầu báo cáo tình hình hoạt động",
    "priority": "HIGH",
    "recipients": [
      {"departmentId": 1}
    ]
  }'
```

### 3. Xem công văn theo ID

**Endpoint:** `GET /api/internal-documents/{id}`

```bash
curl -X GET \
  http://localhost:8080/api/internal-documents/123 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 4. Lấy danh sách công văn

#### công văn đã gửi

```bash
GET /api/internal-documents/sent?page=0&size=10&sort=createdAt,desc
```

#### công văn đã nhận

```bash
GET /api/internal-documents/received?page=0&size=10
```

#### công văn chưa đọc

```bash
GET /api/internal-documents/unread?page=0&size=10
```

#### Số lượng công văn chưa đọc

```bash
GET /api/internal-documents/unread/count
```

### 5. Tìm kiếm công văn

#### Tìm kiếm cơ bản

```bash
GET /api/internal-documents/search?keyword=họp&page=0&size=10
```

#### Tìm kiếm nâng cao

```bash
GET /api/internal-documents/search/advanced?senderId=5&priority=HIGH&startDate=2025-06-01T00:00:00&endDate=2025-06-30T23:59:59
```

### 6. Trả lời công văn

**Endpoint:** `POST /api/internal-documents/{id}/reply`

```bash
curl -X POST \
  http://localhost:8080/api/internal-documents/123/reply \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "documentNumber": "TL-001/2025",
    "title": "Re: Thông báo họp định kỳ",
    "summary": "Xác nhận tham dự họp",
    "priority": "NORMAL",
    "recipients": [
      {"departmentId": 1, "userId": 5}
    ]
  }'
```

### 7. Đánh dấu đã đọc

**Endpoint:** `POST /api/internal-documents/{id}/mark-read`

```bash
curl -X POST \
  http://localhost:8080/api/internal-documents/123/mark-read \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 8. Upload file đính kèm (sau khi tạo công văn)

**Endpoint:** `POST /api/internal-documents/{id}/attachments`

```bash
curl -X POST \
  http://localhost:8080/api/internal-documents/123/attachments \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@document.pdf' \
  -F 'description=Tài liệu bổ sung'
```

### 9. Download file đính kèm

**Endpoint:** `GET /api/internal-documents/{id}/attachments/{attachmentId}`

```bash
curl -X GET \
  http://localhost:8080/api/internal-documents/123/attachments/1 \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -o downloaded_file.pdf
```

### 10. Thống kê

**Endpoint:** `GET /api/internal-documents/statistics`

```bash
curl -X GET \
  http://localhost:8080/api/internal-documents/statistics \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Priority Levels

- `LOW`: Thấp
- `NORMAL`: Bình thường
- `HIGH`: Cao
- `URGENT`: Khẩn cấp

## Recipient Types

1. **Gửi cho toàn bộ phòng ban**: `{"departmentId": 1}`
2. **Gửi cho cá nhân cụ thể**: `{"departmentId": 1, "userId": 18}`

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid input data",
  "message": "Document number is required"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied",
  "message": "Not authorized to access this document"
}
```

### 404 Not Found

```json
{
  "error": "Document not found",
  "message": "Document with ID 123 not found"
}
```

## Authentication

Tất cả endpoints yêu cầu Bearer token trong header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## File Upload Limits

- Kích thước file tối đa: 50MB per file
- Số lượng file tối đa: 10 files per request
- Định dạng file hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT

## Frontend Integration Example (JavaScript)

### Tạo công văn với file đính kèm

```javascript
async function createDocumentWithFiles(documentData, files) {
  const formData = new FormData();

  // Add document data as JSON string
  formData.append("document", JSON.stringify(documentData));

  // Add files
  files.forEach((file, index) => {
    formData.append("files", file);
    formData.append("descriptions", file.description || "");
  });

  const response = await fetch("/api/internal-documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}

// Usage
const documentData = {
  documentNumber: "CV-001/2025",
  title: "Test Document",
  priority: "NORMAL",
  recipients: [{ departmentId: 1 }, { departmentId: 2, userId: 5 }],
};

const files = [
  { file: fileInput.files[0], description: "Main document" },
  { file: fileInput.files[1], description: "Attachment" },
];

createDocumentWithFiles(documentData, files);
```

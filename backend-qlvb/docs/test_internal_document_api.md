# Test Internal Document API

## 1. Test với cURL

### Tạo văn bản với file đính kèm

```bash
# Tạo file test.json
echo '{
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
}' > test_document.json

# Tạo file test đơn giản
echo "This is a test document content" > test_file.txt
echo "This is attachment content" > attachment.txt

# Gọi API với cURL
curl -X POST http://localhost:8080/api/internal-documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@test_document.json;type=application/json" \
  -F "files=@test_file.txt" \
  -F "files=@attachment.txt" \
  -F "descriptions=Tài liệu chính" \
  -F "descriptions=Phụ lục"
```

### Alternative với inline JSON

```bash
curl -X POST http://localhost:8080/api/internal-documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'document={"documentNumber":"CV-002/2025","title":"Test Document","priority":"NORMAL","recipients":[{"departmentId":1}]}' \
  -F "files=@test_file.txt" \
  -F "descriptions=Test file"
```

## 2. Test với Postman

### Request Setup:

- **Method**: POST
- **URL**: `http://localhost:8080/api/internal-documents`
- **Headers**:
  - `Authorization: Bearer YOUR_TOKEN`

### Body (form-data):

- **document** (Text):
  ```json
  {
    "documentNumber": "CV-003/2025",
    "title": "Test from Postman",
    "priority": "HIGH",
    "recipients": [{ "departmentId": 1 }, { "departmentId": 2, "userId": 5 }]
  }
  ```
- **files** (File): Choose your files
- **descriptions** (Text): "File description 1"
- **descriptions** (Text): "File description 2"

## 3. Test với JavaScript

### Frontend Example:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Test Internal Document API</title>
  </head>
  <body>
    <form id="documentForm">
      <h3>Create Internal Document</h3>

      <label>Document Number:</label>
      <input
        type="text"
        id="documentNumber"
        value="CV-004/2025"
        required
      /><br /><br />

      <label>Title:</label>
      <input
        type="text"
        id="title"
        value="Test Document"
        required
      /><br /><br />

      <label>Priority:</label>
      <select id="priority">
        <option value="LOW">Low</option>
        <option value="NORMAL" selected>Normal</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option></select
      ><br /><br />

      <label>Department ID:</label>
      <input type="number" id="departmentId" value="1" required /><br /><br />

      <label>User ID (optional):</label>
      <input
        type="number"
        id="userId"
        placeholder="Leave empty for all department"
      /><br /><br />

      <label>Files:</label>
      <input type="file" id="files" multiple /><br /><br />

      <button type="submit">Create Document</button>
    </form>

    <div id="result"></div>

    <script>
      document
        .getElementById("documentForm")
        .addEventListener("submit", async function (e) {
          e.preventDefault();

          const documentData = {
            documentNumber: document.getElementById("documentNumber").value,
            title: document.getElementById("title").value,
            priority: document.getElementById("priority").value,
            recipients: [
              {
                departmentId: parseInt(
                  document.getElementById("departmentId").value
                ),
                userId: document.getElementById("userId").value
                  ? parseInt(document.getElementById("userId").value)
                  : null,
              },
            ],
          };

          const formData = new FormData();
          formData.append("document", JSON.stringify(documentData));

          const files = document.getElementById("files").files;
          for (let i = 0; i < files.length; i++) {
            formData.append("files", files[i]);
            formData.append("descriptions", `File ${i + 1}`);
          }

          try {
            const response = await fetch("/api/internal-documents", {
              method: "POST",
              headers: {
                Authorization: "Bearer YOUR_TOKEN",
              },
              body: formData,
            });

            const result = await response.json();
            document.getElementById("result").innerHTML =
              "<pre>" + JSON.stringify(result, null, 2) + "</pre>";
          } catch (error) {
            document.getElementById("result").innerHTML =
              '<div style="color: red">Error: ' + error.message + "</div>";
          }
        });
    </script>
  </body>
</html>
```

## 4. Test với Python

```python
import requests
import json

# Document data
document_data = {
    "documentNumber": "CV-005/2025",
    "title": "Test from Python",
    "priority": "NORMAL",
    "recipients": [
        {"departmentId": 1},
        {"departmentId": 2, "userId": 5}
    ]
}

# Files to upload
files = {
    'document': (None, json.dumps(document_data), 'application/json'),
    'files': ('test1.txt', open('test1.txt', 'rb'), 'text/plain'),
    'files': ('test2.txt', open('test2.txt', 'rb'), 'text/plain'),
    'descriptions': (None, 'First file'),
    'descriptions': (None, 'Second file')
}

headers = {
    'Authorization': 'Bearer YOUR_TOKEN'
}

response = requests.post(
    'http://localhost:8080/api/internal-documents',
    files=files,
    headers=headers
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
```

## 5. Expected Response

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
  "status": "DRAFT",
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
    }
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "test_file.txt",
      "contentType": "text/plain",
      "fileSize": 1024,
      "uploadedAt": "2025-06-02T07:43:59.479Z",
      "uploadedByName": "Nguyễn Văn A",
      "description": "Tài liệu chính"
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

## 6. Common Issues & Solutions

### Issue 1: 415 Unsupported Media Type

- **Cause**: Wrong Content-Type for document part
- **Solution**: Make sure document part has correct content type

```bash
-F "document=@test_document.json;type=application/json"
# OR inline JSON:
-F 'document={"documentNumber":"CV-001","title":"Test"}'
```

### Issue 2: 400 Bad Request

- **Cause**: Invalid JSON format
- **Solution**: Validate JSON before sending

```bash
# Test JSON validity:
echo '{"test": "json"}' | python -m json.tool
```

### Issue 3: Files not uploading

- **Cause**: File path issues or empty files
- **Solution**: Check file exists and is not empty

```bash
ls -la your_file.txt
file your_file.txt
```

## 7. Test Different Scenarios

### Scenario 1: Document only (no files)

```bash
curl -X POST http://localhost:8080/api/internal-documents/json \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentNumber": "CV-006/2025",
    "title": "No files document",
    "priority": "LOW",
    "recipients": [{"departmentId": 1}]
  }'
```

### Scenario 2: Multiple recipients

```bash
curl -X POST http://localhost:8080/api/internal-documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'document={
    "documentNumber": "CV-007/2025",
    "title": "Multiple recipients",
    "priority": "HIGH",
    "recipients": [
      {"departmentId": 1},
      {"departmentId": 2, "userId": 5},
      {"departmentId": 3, "userId": 10}
    ]
  }' \
  -F "files=@file1.txt" \
  -F "files=@file2.pdf"
```

### Scenario 3: Reply to document

```bash
curl -X POST http://localhost:8080/api/internal-documents/123/reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentNumber": "TL-001/2025",
    "title": "Re: Original Document",
    "priority": "NORMAL",
    "recipients": [{"departmentId": 1, "userId": 5}]
  }'
```

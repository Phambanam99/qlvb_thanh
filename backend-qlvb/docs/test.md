
Tôi sẽ hướng dẫn bạn cách sử dụng Internal Documents API cho một workflow hoàn chỉnh từ tạo văn bản đến tương tác với nó.

## 🔄 **Workflow Hoàn Chỉnh của Internal Documents**

### 1. **📝 Tạo Văn Bản Mới**

```bash
# Tạo văn bản với file đính kèm
curl -X POST http://localhost:8080/api/internal-documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'document={
    "documentNumber": "CV-001/2025",
    "title": "Thông báo họp định kỳ tháng 6", 
    "summary": "Cuộc họp sẽ diễn ra vào 9h sáng thứ 2",
    "documentType": "Thông báo",
    "priority": "HIGH",
    "recipients": [
      {"departmentId": 1},                    // Gửi toàn bộ phòng
      {"departmentId": 2, "userId": 5}        // Gửi cho user cụ thể trong phòng
    ]
  }' \
  -F "files=@agenda.pdf" \
  -F "descriptions=Chương trình họp"
```

**Response:**
```json
{
  "id": 123,
  "documentNumber": "CV-001/2025", 
  "title": "Thông báo họp định kỳ tháng 6",
  "status": "DRAFT",
  "senderId": 10,
  "senderName": "Nguyễn Văn A",
  "recipients": [
    {
      "id": 1,
      "departmentId": 1,
      "departmentName": "Phòng Kỹ thuật",
      "isRead": false
    }
  ],
  "attachments": [...]
}
```

### 2. **📨 Nhận và Xem Văn Bản**

```bash
# Xem danh sách văn bản nhận được
curl -X GET "http://localhost:8080/api/internal-documents/received?page=0&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Xem văn bản cụ thể (tự động đánh dấu đã đọc)
curl -X GET http://localhost:8080/api/internal-documents/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. **👁️ Đánh Dấu Đã Đọc (Manual)**

```bash
# Đánh dấu đã đọc thủ công
curl -X POST http://localhost:8080/api/internal-documents/123/mark-read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "message": "Document marked as read"
}
```

### 4. **💬 Trả Lời Văn Bản**

```bash
# Trả lời văn bản gốc
curl -X POST http://localhost:8080/api/internal-documents/123/reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentNumber": "TL-001/2025",
    "title": "Re: Thông báo họp định kỳ tháng 6",
    "summary": "Xác nhận tham dự cuộc họp",
    "priority": "NORMAL",
    "recipients": [
      {"departmentId": 1, "userId": 10}    // Trả lời cho người gửi
    ]
  }'
```

**Response:**
```json
{
  "id": 124,
  "documentNumber": "TL-001/2025",
  "title": "Re: Thông báo họp định kỳ tháng 6", 
  "replyToId": 123,
  "replyToTitle": "Thông báo họp định kỳ tháng 6",
  "senderId": 5,
  "recipients": [...]
}
```

### 5. **🔄 Tiếp Tục Trả Lời (Reply Chain)**

```bash
# Trả lời cho reply (tạo chuỗi conversation)
curl -X POST http://localhost:8080/api/internal-documents/124/reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "documentNumber": "TL-002/2025", 
    "title": "Re: Re: Thông báo họp định kỳ tháng 6",
    "summary": "Cảm ơn xác nhận, gửi thêm tài liệu",
    "priority": "NORMAL",
    "recipients": [
      {"departmentId": 2, "userId": 5}
    ]
  }'
```

### 6. **📎 Thêm File Đính Kèm Sau**

```bash
# Thêm file đính kèm vào văn bản đã tạo
curl -X POST http://localhost:8080/api/internal-documents/123/attachments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@additional_document.pdf" \
  -F "description=Tài liệu bổ sung"
```

### 7. **📥 Download File Đính Kèm**

```bash
# Download file đính kèm
curl -X GET http://localhost:8080/api/internal-documents/123/attachments/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output downloaded_file.pdf
```

## 📊 **Theo Dõi và Quản Lý**

### **📈 Thống Kê Văn Bản**
```bash
# Đếm văn bản chưa đọc
curl -X GET http://localhost:8080/api/internal-documents/unread/count \
  -H "Authorization: Bearer YOUR_TOKEN"

# Thống kê tổng quan
curl -X GET http://localhost:8080/api/internal-documents/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **🔍 Tìm Kiếm Văn Bản**
```bash
# Tìm kiếm cơ bản
curl -X GET "http://localhost:8080/api/internal-documents/search?keyword=họp" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tìm kiếm nâng cao
curl -X GET "http://localhost:8080/api/internal-documents/search/advanced?priority=HIGH&startDate=2025-06-01T00:00:00&endDate=2025-06-30T23:59:59" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **📂 Lọc Theo Loại**
```bash
# Văn bản đã gửi
curl -X GET http://localhost:8080/api/internal-documents/sent \
  -H "Authorization: Bearer YOUR_TOKEN"

# Văn bản chưa đọc
curl -X GET http://localhost:8080/api/internal-documents/unread \
  -H "Authorization: Bearer YOUR_TOKEN"

# Theo mức độ ưu tiên
curl -X GET http://localhost:8080/api/internal-documents/priority/HIGH \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 **Workflow Thực Tế**

### **Ví dụ: Quy trình họp phòng**

1. **Trưởng phòng tạo thông báo họp:**
```bash
POST /api/internal-documents
# Gửi cho toàn phòng với file chương trình
```

2. **Nhân viên nhận và xác nhận:**
```bash
GET /api/internal-documents/received  # Xem thông báo
POST /api/internal-documents/123/reply # Xác nhận tham dự
```

3. **Trưởng phòng gửi thêm tài liệu:**
```bash
POST /api/internal-documents/123/attachments # Thêm file
```

4. **Nhân viên có câu hỏi:**
```bash
POST /api/internal-documents/123/reply # Đặt câu hỏi
```

5. **Trưởng phòng trả lời:**
```bash
POST /api/internal-documents/125/reply # Trả lời câu hỏi
```

## 💡 **Tính Năng Đặc Biệt**

### **🎯 Auto-include Sender trong Reply**
- Khi reply, hệ thống tự động thêm người gửi ban đầu vào danh sách recipients
- Đảm bảo conversation liên tục

### **👥 Department vs Individual Recipients**
```json
{
  "recipients": [
    {"departmentId": 1},              // Toàn bộ phòng
    {"departmentId": 2, "userId": 5}  // User cụ thể trong phòng
  ]
}
```

### **📊 Read Status Tracking**
- Tự động đánh dấu đã đọc khi GET document
- Theo dõi thời gian đọc
- Đếm số lượng chưa đọc

### **🔗 Reply Chain Tracking**
- `replyToId` để theo dõi văn bản gốc
- `replyCount` để biết số lượng reply
- Tạo chuỗi conversation hoàn chỉnh

Bạn có muốn tôi giải thích chi tiết thêm về phần nào không?

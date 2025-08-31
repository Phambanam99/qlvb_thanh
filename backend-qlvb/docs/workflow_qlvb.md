# Chi Tiết Quy Trình Xử Lý Văn Bản Đến

Tôi sẽ mô tả chi tiết quy trình xử lý văn bản đến từ khi tiếp nhận đến khi hoàn thành. Quy trình này được thiết kế để phản ánh đầy đủ các hoạt động nghiệp vụ và tận dụng API của hệ thống quản lý văn bản hiện có.

## 1. Tiếp nhận và tạo mới văn bản đến

### 1.1. Tiếp nhận văn bản từ bên ngoài
- Văn thư nhận văn bản giấy hoặc văn bản điện tử qua email, hệ thống gửi nhận văn bản liên thông
- Kiểm tra tính đầy đủ, hợp lệ của văn bản (có đúng đơn vị nhận không, có đầy đủ chữ ký, con dấu không)
- Nếu là văn bản giấy, tiến hành scan thành file PDF

### 1.2. Tạo mới trong hệ thống
- Gọi API tạo văn bản đến:
```
POST /api/documents/incoming
```

- Dữ liệu gửi lên:
```json
{
  "title": "Văn bản về việc [nội dung chính của văn bản]",
  "referenceNumber": "123/CV-ABC", 
  "issuingAuthority": "Tên cơ quan phát hành văn bản",
  "documentType": "OFFICIAL_LETTER", // Công văn, quyết định, thông báo...
  "urgencyLevel": "HIGH", // NORMAL, HIGH, URGENT
  "securityLevel": "NORMAL", // NORMAL, CONFIDENTIAL, SECRET, TOP_SECRET
  "signingDate": "2025-04-20", 
  "receivedDate": "2025-04-22",
  "sendingDepartmentName": "Phòng/Ban/Đơn vị gửi văn bản",
  "summary": "Tóm tắt nội dung chính của văn bản",
  "notes": "Ghi chú thêm về văn bản nếu có"
}
```

## 2. Đính kèm file và metadata

### 2.1. Tải lên file văn bản đã scan
```
POST /api/documents/incoming/{documentId}/attachment
```
- Gửi lên file văn bản dạng multipart/form-data với field name là "file"

### 2.2. Tải lên nhiều tài liệu kèm theo (nếu có)
```
POST /api/documents/unified/{documentId}/multiple-attachments
```
- Gửi lên các file đính kèm dạng multipart/form-data với field name là "files"

### 2.3. Trích xuất thông tin từ văn bản (tùy chọn)
```
POST /api/documents/incoming/extract-from-scan
```
- Sử dụng OCR để trích xuất thông tin từ văn bản scan, tiết kiệm thời gian nhập liệu

## 3. Đăng ký và vào sổ văn bản

### 3.1. Văn thư đăng ký văn bản
```
PUT /api/workflow/{documentId}/register
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đã kiểm tra và đăng ký văn bản vào hệ thống",
  "actorId": 123, // ID của văn thư
  "registrationNumber": "VB-DEN-2025-123", // Số đăng ký văn bản đến
  "registrationDate": "2025-04-22T10:30:00"
}
```

## 4. Chuyển văn bản đến lãnh đạo xem xét

### 4.1. Chuyển văn bản đến lãnh đạo
```
POST /api/workflow/{documentId}/forward
```

- Dữ liệu gửi lên:
```json
{
  "forwardToId": 789, // ID của lãnh đạo cần xem xét
  "comments": "Kính trình lãnh đạo xem xét và cho ý kiến chỉ đạo",
  "actorId": 123 // ID người chuyển (văn thư)
}
```

### 4.2. Lãnh đạo ghi ý kiến chỉ đạo
```
POST /api/documents/unified/{documentId}/comments
```

- Dữ liệu gửi lên:
```json
{
  "content": "Chuyển Phòng XYZ chủ trì xử lý, phối hợp với Phòng ABC, Phòng D. Hoàn thành trước ngày 30/04/2025.",
  "userId": 789, // ID lãnh đạo
  "commentType": "INSTRUCTION" // Loại ý kiến: chỉ đạo
}
```

## 5. Phân phối văn bản đến phòng/ban xử lý

### 5.1. Phân phối văn bản
```
PUT /api/workflow/{documentId}/distribute
```

- Dữ liệu gửi lên:
```json
{
  "primaryDepartmentId": 101, // ID phòng ban chủ trì xử lý
  "collaboratingDepartmentIds": [102, 103], // ID các phòng ban phối hợp
  "comments": "Thực hiện theo ý kiến chỉ đạo của lãnh đạo. Hạn xử lý: 30/04/2025",
  "actorId": 123, // ID người phân phối
  "dueDate": "2025-04-30T17:00:00"
}
```

### 5.2. Kiểm tra thông tin phân phối
```
GET /api/workflow/{documentId}/departments
```
- API trả về danh sách các phòng ban được phân công xử lý, vai trò (chính/phối hợp)

## 6. Phòng ban chủ trì tiếp nhận và phân công

### 6.1. Trưởng phòng tiếp nhận văn bản
```
PUT /api/workflow/{documentId}/department-acknowledge
```

- Dữ liệu gửi lên:
```json
{
  "departmentId": 101, // ID phòng ban
  "comments": "Đã nhận văn bản. Sẽ phân công chuyên viên xử lý",
  "actorId": 200 // ID của trưởng phòng
}
```

### 6.2. Trưởng phòng phân công chuyên viên
```
POST /api/workflow/{documentId}/assign-specialist
```

- Dữ liệu gửi lên:
```json
{
  "assignedToId": 456, // ID của chuyên viên được phân công
  "comments": "Giao anh/chị nghiên cứu, tham mưu văn bản phúc đáp. Hoàn thành trước 28/04/2025",
  "actorId": 200, // ID của trưởng phòng
  "deadline": "2025-04-28T17:00:00" // Hạn xử lý nội bộ
}
```

## 7. Chuyên viên xử lý văn bản

### 7.1. Chuyên viên tiếp nhận xử lý
```
PUT /api/workflow/{documentId}/start-processing
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đã nhận và bắt đầu xử lý văn bản",
  "actorId": 456 // ID của chuyên viên
}
```

### 7.2. Thêm ghi chú nội bộ trong quá trình xử lý
```
POST /api/documents/unified/{documentId}/comments
```

- Dữ liệu gửi lên:
```json
{
  "content": "Đã liên hệ với cơ quan ABC để xác minh thông tin. Họ sẽ gửi thêm dữ liệu vào ngày mai.",
  "userId": 456, // ID chuyên viên
  "commentType": "WORKING_NOTE" // Ghi chú làm việc
}
```

### 7.3. Phối hợp với các phòng ban liên quan
- Các phòng ban phối hợp cũng thực hiện các bước tương tự từ 6.1 đến 7.2
- Sử dụng API comment để trao đổi thông tin giữa các phòng ban:
```
POST /api/documents/unified/{documentId}/comments
```

### 7.4. Tạo văn bản dự thảo phản hồi (nếu cần)
```
POST /api/documents/outgoing/draft
```

- Dữ liệu gửi lên:
```json
{
  "title": "Văn bản phúc đáp về việc [nội dung]",
  "referenceNumber": "Dự thảo",
  "documentType": "OFFICIAL_LETTER",
  "receivingDepartments": ["Tên đơn vị nhận"],
  "content": "Nội dung văn bản phúc đáp",
  "relatedDocumentIds": [documentId] // ID văn bản đến đang xử lý
}
```

### 7.5. Hoàn thành và trình lên trưởng phòng
```
PUT /api/workflow/{documentId}/submit
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đã xử lý xong, kính trình trưởng phòng xem xét. Đã tạo dự thảo văn bản phúc đáp ID: 456",
  "actorId": 456, // ID của chuyên viên
  "relatedOutgoingDocumentId": 456 // ID văn bản đi đã dự thảo (nếu có)
}
```

## 8. Trưởng phòng xem xét kết quả

### 8.1. Trưởng phòng tiến hành xem xét
```
PUT /api/workflow/{documentId}/start-reviewing
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đang xem xét kết quả xử lý của chuyên viên",
  "actorId": 200 // ID của trưởng phòng
}
```

### 8.2. Trưởng phòng cho ý kiến
Nếu cần chỉnh sửa:
```
PUT /api/workflow/{documentId}/provide-feedback
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Cần bổ sung thêm [nội dung], điều chỉnh [phần này]",
  "actorId": 200 // ID của trưởng phòng
}
```

hoặc nếu đồng ý với kết quả, chuyển lên lãnh đạo:
```
PUT /api/workflow/{documentId}/forward-to-leadership
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đã xem xét kết quả xử lý, kính trình lãnh đạo phê duyệt",
  "actorId": 200 // ID của trưởng phòng
}
```

## 9. Lãnh đạo phê duyệt kết quả xử lý

### 9.1. Lãnh đạo tiếp nhận và xem xét
```
PUT /api/workflow/{documentId}/leader-reviewing
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đang xem xét kết quả xử lý văn bản",
  "actorId": 789 // ID của lãnh đạo
}
```

### 9.2. Lãnh đạo phê duyệt hoặc góp ý

Phê duyệt:
```
PUT /api/workflow/{documentId}/approve
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đồng ý với kết quả xử lý. Chuyển văn thư phát hành văn bản phúc đáp",
  "actorId": 789, // ID của lãnh đạo
  "approvedOutgoingDocumentId": 456 // ID văn bản đi được phê duyệt
}
```

Hoặc góp ý chỉnh sửa:
```
PUT /api/workflow/{documentId}/provide-feedback
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Cần điều chỉnh [nội dung]. Bổ sung thêm [yêu cầu]",
  "actorId": 789 // ID của lãnh đạo
}
```

## 10. Hoàn thành xử lý văn bản

### 10.1. Văn thư thực hiện phát hành văn bản phúc đáp (nếu có)
```
PUT /api/workflow/{outgoingDocumentId}/publish
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đã phát hành văn bản phúc đáp",
  "actorId": 123, // ID của văn thư
  "documentNumber": "123/CV-XYZ", // Số hiệu chính thức của văn bản đi
  "publishDate": "2025-04-28T15:00:00"
}
```

### 10.2. Đánh dấu hoàn thành xử lý văn bản đến
```
PUT /api/workflow/{documentId}/complete
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Đã hoàn thành xử lý văn bản. Đã phát hành văn bản phúc đáp số 123/CV-XYZ",
  "actorId": 123, // ID của người hoàn thành
  "result": "Đã xử lý và phản hồi",
  "relatedDocuments": [456] // ID các văn bản liên quan (văn bản phúc đáp)
}
```

### 10.3. Lưu trữ văn bản
```
PUT /api/workflow/{documentId}/archive
```

- Dữ liệu gửi lên:
```json
{
  "comments": "Chuyển văn bản vào kho lưu trữ",
  "actorId": 123, // ID của văn thư
  "archiveCategory": "ADMINISTRATIVE",
  "retentionPeriod": "5-YEARS" // Thời gian lưu trữ
}
```

## 11. Theo dõi và báo cáo

### 11.1. Theo dõi trạng thái xử lý
```
GET /api/workflow/{documentId}/status
```

### 11.2. Xem lịch sử xử lý văn bản
```
GET /api/workflow/{documentId}/history
```

### 11.3. Tạo báo cáo xử lý văn bản
```
GET /api/reports/document-processing?startDate=2025-04-01T00:00:00&endDate=2025-04-30T23:59:59&outputFormat=pdf
```

## Lưu ý quan trọng trong quy trình

1. **Luồng phê duyệt linh hoạt**: Tùy theo tính chất văn bản, có thể rút gọn hoặc mở rộng các bước phê duyệt
2. **Đảm bảo tuân thủ thời hạn**: Hệ thống giám sát và gửi thông báo nhắc nhở khi gần đến hạn xử lý
3. **Tính minh bạch**: Mọi hành động trong quy trình đều được ghi lại trong lịch sử
4. **Hỗ trợ song song**: Các phòng ban phối hợp có thể xử lý đồng thời, trao đổi thông tin qua hệ thống
5. **Tích hợp với quy trình văn bản đi**: Liên kết chặt chẽ giữa văn bản đến và văn bản phúc đáp để theo dõi xuyên suốt

Quy trình này đảm bảo mọi văn bản đến đều được xử lý đúng quy định, có sự phân công trách nhiệm rõ ràng và theo dõi chặt chẽ từ khi tiếp nhận đến khi hoàn tất.
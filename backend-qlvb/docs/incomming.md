I'll help you understand how to manage a scanned incoming document using our document management system API. Let me explain the process step-by-step and identify any missing features that might be needed for your use case.

## Quy trình xử lý văn bản đến từ bản giấy đã scan

### Bước 1: Tạo văn bản đến mới

Đầu tiên, bạn cần tạo một bản ghi văn bản đến trong hệ thống:

```
POST /api/documents/incoming
```

Dữ liệu gửi lên (JSON):
```json
{
  "title": "Tên văn bản đến",
  "referenceNumber": "Số hiệu văn bản",
  "issuingAuthority": "Cơ quan phát hành",
  "urgencyLevel": "NORMAL", // hoặc "HIGH", "URGENT"
  "signingDate": "2025-04-20", // Ngày ký văn bản
  "sendingDepartmentName": "Tên phòng/ban gửi"
}
```

### Bước 2: Tải lên file scan văn bản

Sau khi văn bản được tạo, bạn cần tải lên file đã scan:

```
POST /api/documents/incoming/{id}/attachment
```

Đây là một yêu cầu multipart/form-data. Bạn cần gửi file scan dưới dạng form field có tên "file".

Hoặc có thể sử dụng API thống nhất:

```
POST /api/documents/unified/{id}/attachments
```

### Bước 3: Đăng ký văn bản vào hệ thống (Văn thư)

Sau khi tạo và tải lên scan, văn thư cần đăng ký chính thức văn bản này:

```
PUT /api/workflow/{documentId}/register
```

Dữ liệu gửi lên:
```json
{
  "comments": "Văn bản đến được scan và đăng ký vào hệ thống",
  "actorId": 123 // ID của người đăng ký (văn thư)
}
```

### Bước 4: Phân phối văn bản đến phòng/ban liên quan

```
PUT /api/workflow/{documentId}/distribute
```

Dữ liệu gửi lên:
```json
{
  "comments": "Chuyển văn bản đến phòng XYZ để xử lý",
  "actorId": 123 // ID của người phân phối
}
```

### Bước 5: Trưởng phòng phân công xử lý

Trưởng phòng sẽ phân công nhiệm vụ xử lý cho chuyên viên:

```
POST /api/workflow/{documentId}/assign-specialist
```

Dữ liệu gửi lên:
```json
{
  "assignedToId": 456, // ID của chuyên viên được phân công
  "comments": "Giao chuyên viên ABC nghiên cứu và xử lý văn bản",
  "actorId": 789 // ID của trưởng phòng
}
```

### Bước 6: Chuyên viên xử lý văn bản

Chuyên viên bắt đầu xử lý:

```
PUT /api/workflow/{documentId}/start-processing
```

Dữ liệu gửi lên:
```json
{
  "comments": "Đã nhận và bắt đầu xử lý văn bản",
  "actorId": 456 // ID của chuyên viên
}
```

### Bước 7: Chuyên viên gửi kết quả lên lãnh đạo

```
PUT /api/workflow/{documentId}/submit
```

Dữ liệu gửi lên:
```json
{
  "comments": "Đã xử lý xong, trình lãnh đạo phê duyệt",
  "actorId": 456 // ID của chuyên viên
}
```

### Bước 8: Lãnh đạo xem xét văn bản

```
PUT /api/workflow/{documentId}/start-reviewing
```

Dữ liệu gửi lên:
```json
{
  "comments": "Đang xem xét văn bản",
  "actorId": 999 // ID của lãnh đạo
}
```

### Bước 9: Lãnh đạo phê duyệt hoặc góp ý

Phê duyệt:
```
PUT /api/workflow/{documentId}/approve
```

Hoặc góp ý:
```
PUT /api/workflow/{documentId}/provide-feedback
```

Dữ liệu gửi lên:
```json
{
  "comments": "Phê duyệt văn bản đã xử lý" | "Cần chỉnh sửa lại một số nội dung",
  "actorId": 999 // ID của lãnh đạo
}
```

### Bước 10: Theo dõi quá trình xử lý văn bản

Để xem trạng thái hiện tại:
```
GET /api/workflow/{documentId}/status
```

Để xem toàn bộ lịch sử xử lý:
```
GET /api/workflow/{documentId}/history
```

Hoặc sử dụng API thống nhất:
```
GET /api/documents/unified/{documentId}/workflow/status
GET /api/documents/unified/{documentId}/workflow/history
```

## API bổ sung cần thiết

Sau khi phân tích quy trình của bạn, tôi thấy còn một số API cần bổ sung để phục vụ tốt hơn cho quy trình xử lý văn bản scan:

### 1. API Nhận dạng và trích xuất thông tin từ văn bản scan (OCR)

Khi bạn scan một văn bản giấy, việc nhập thủ công thông tin có thể mất thời gian và dễ sai sót. Một API OCR (Optical Character Recognition) sẽ giúp tự động trích xuất thông tin từ file scan.

```java
@PostMapping("/api/documents/incoming/extract-from-scan")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'CLERK')")
public ResponseEntity<?> extractDocumentInfoFromScan(
        @RequestPart("file") MultipartFile scanFile) {
    try {
        Map<String, Object> extractedInfo = documentOcrService.extractInformation(scanFile);
        return ResponseEntity.ok(extractedInfo);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Không thể trích xuất thông tin: " + e.getMessage());
    }
}
```

Lý do bổ sung: API này giúp tự động hóa việc nhập liệu từ văn bản scan, tiết kiệm thời gian và giảm sai sót. Đặc biệt hữu ích khi phải xử lý nhiều văn bản đến.

### 2. API Tải nhiều file đính kèm

Văn bản đến có thể có nhiều trang hoặc nhiều tệp đính kèm khác nhau. API hiện tại chỉ hỗ trợ một file đính kèm duy nhất cho mỗi văn bản.

```java
@PostMapping(value = "/api/documents/unified/{id}/multiple-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public ResponseEntity<?> uploadMultipleAttachments(
        @PathVariable Long id,
        @RequestPart("files") MultipartFile[] files) {
    
    // Kiểm tra văn bản tồn tại
    boolean documentExists = incomingDocumentService.findIncomingDocumentById(id).isPresent() || 
                           outgoingDocumentService.findOutgoingDocumentById(id).isPresent();
    if (!documentExists) {
        return ResponseEntity.notFound().build();
    }
    
    List<String> uploadedFiles = new ArrayList<>();
    List<String> failedFiles = new ArrayList<>();
    
    for (MultipartFile file : files) {
        try {
            // Lưu file và liên kết với văn bản
            documentAttachmentService.addAttachmentToDocument(id, file);
            uploadedFiles.add(file.getOriginalFilename());
        } catch (Exception e) {
            failedFiles.add(file.getOriginalFilename() + ": " + e.getMessage());
        }
    }
    
    Map<String, Object> result = new HashMap<>();
    result.put("uploadedFiles", uploadedFiles);
    result.put("failedFiles", failedFiles);
    
    return ResponseEntity.ok(result);
}
```

Lý do bổ sung: Văn bản scan thường có nhiều trang hoặc nhiều tài liệu đính kèm. API này cho phép tải lên nhiều file cùng một lúc, giúp quản lý đầy đủ hồ sơ văn bản.

### 3. API Tạo ghi chú và bình luận cho văn bản

Trong quá trình xử lý, các bên liên quan có thể cần trao đổi thông tin mà không cần thay đổi trạng thái workflow.

```java
@PostMapping("/api/documents/unified/{documentId}/comments")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public ResponseEntity<?> addDocumentComment(
        @PathVariable Long documentId,
        @RequestBody Map<String, Object> commentData) {
    
    String content = (String) commentData.get("content");
    Long userId = Long.valueOf(commentData.get("userId").toString());
    
    if (content == null || content.trim().isEmpty()) {
        return ResponseEntity.badRequest().body("Nội dung bình luận không được để trống");
    }
    
    try {
        // Lưu bình luận vào cơ sở dữ liệu
        DocumentComment savedComment = documentCommentService.addComment(documentId, userId, content);
        
        return ResponseEntity.ok(savedComment);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Không thể thêm bình luận: " + e.getMessage());
    }
}

@GetMapping("/api/documents/unified/{documentId}/comments")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public ResponseEntity<?> getDocumentComments(@PathVariable Long documentId) {
    List<DocumentComment> comments = documentCommentService.getCommentsByDocumentId(documentId);
    return ResponseEntity.ok(comments);
}
```

Lý do bổ sung: Trong quá trình xử lý văn bản, các bên liên quan cần có cơ chế trao đổi thông tin, góp ý, đánh dấu nội dung quan trọng mà không cần thay đổi trạng thái chính thức của văn bản.

### 4. API Thêm thẻ đánh dấu (Tags) cho văn bản

Việc phân loại văn bản bằng tag sẽ giúp tìm kiếm và phân loại dễ dàng hơn:

```java
@PostMapping("/api/documents/unified/{documentId}/tags")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public ResponseEntity<?> addDocumentTags(
        @PathVariable Long documentId,
        @RequestBody List<String> tags) {
    
    try {
        List<String> addedTags = documentTagService.addTagsToDocument(documentId, tags);
        return ResponseEntity.ok(addedTags);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Không thể thêm thẻ: " + e.getMessage());
    }
}

@GetMapping("/api/documents/unified/{documentId}/tags")
@PreAuthorize("hasAnyRole('ADMIN', 'USER')")
public ResponseEntity<?> getDocumentTags(@PathVariable Long documentId) {
    List<String> tags = documentTagService.getDocumentTags(documentId);
    return ResponseEntity.ok(tags);
}
```

Lý do bổ sung: Thẻ đánh dấu giúp phân loại văn bản theo nội dung, chủ đề, độ ưu tiên, v.v. Điều này đặc biệt hữu ích khi cần tìm kiếm nhanh các văn bản liên quan đến một chủ đề cụ thể.

### 5. API Tạo và xuất báo cáo xử lý văn bản

```java
@GetMapping("/api/reports/document-processing")
@PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
public ResponseEntity<?> generateDocumentProcessingReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @RequestParam(required = false) String outputFormat) {
    
    try {
        Resource reportFile = reportService.generateDocumentProcessingReport(startDate, endDate, outputFormat);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"document-processing-report." + 
                        (outputFormat != null ? outputFormat : "pdf") + "\"")
                .body(reportFile);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Không thể tạo báo cáo: " + e.getMessage());
    }
}
```

Lý do bổ sung: Báo cáo xử lý văn bản giúp lãnh đạo theo dõi hiệu quả công việc, thời gian xử lý trung bình, số lượng văn bản đã giải quyết và còn tồn đọng.

## Tổng kết

Với các API được đề xuất bổ sung, hệ thống quản lý văn bản của bạn sẽ hỗ trợ tốt hơn cho quy trình xử lý văn bản đến từ bản giấy đã scan. Những cải tiến này giúp:

1. Tự động hóa nhập liệu từ văn bản scan
2. Hỗ trợ nhiều tệp đính kèm cho một văn bản
3. Tạo cơ chế trao đổi thông tin thông qua bình luận
4. Phân loại văn bản dễ dàng bằng hệ thống thẻ đánh dấu
5. Tạo báo cáo để theo dõi hiệu quả xử lý

Để triển khai các API này, bạn cần bổ sung các service tương ứng như DocumentOcrService, DocumentAttachmentService, DocumentCommentService, DocumentTagService và ReportService, cùng với các repository và model cần thiết.
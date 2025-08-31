# Quy Trình Xử Lý Lưu Trữ công văn trong Hệ Thống Managementcontent

Dựa trên mã nguồn được cung cấp, hệ thống quản lý công văn có hai loại công văn chính: công văn đến (IncomingDocument) và công văn đi (OutgoingDocument). Dưới đây là quy trình xử lý và lưu trữ công văn thông qua các API:

## 1. Tạo công văn (Create)

### công văn đến:
- **API:** `POST /api/documents/incoming`
- **Controller:** `IncomingDocumentController.createIncomingDocument()`
- **Service:** `IncomingDocumentService.createIncomingDocument()`
- **Mô tả:** Tạo công văn đến mới với các thông tin như tiêu đề, số công văn, số tham chiếu, cơ quan phát hành, mức độ khẩn cấp, ngày ký, tình trạng xử lý, v.v.

### công văn đi:
- **API:** `POST /api/documents/outgoing`
- **Controller:** `OutgoingDocumentController.createOutgoingDocument()`
- **Service:** `OutgoingDocumentService.createOutgoingDocument()`
- **Mô tả:** Tạo công văn đi mới với các thông tin như tiêu đề, loại công văn, số công văn, số tham chiếu, người ký, phòng soạn thảo, v.v.

## 2. Quản Lý Tệp Đính Kèm

### Tải lên tệp đính kèm:
- **API công văn đến:** `POST /api/documents/incoming/{id}/attachment`
- **API công văn đi:** `POST /api/documents/outgoing/{id}/attachment`
- **Service:** `FileStorageService.storeFile()` xử lý lưu trữ tệp đính kèm
- **Mô tả:** Tải lên tệp đính kèm cho công văn, tạo đường dẫn lưu trữ và lưu tên tệp vào thông tin công văn

### Tải xuống tệp đính kèm:
- **API công văn đến:** `GET /api/documents/incoming/{id}/attachment`
- **API công văn đi:** `GET /api/documents/outgoing/{id}/attachment`
- **Service:** `FileStorageService.getFilePath()` để lấy đường dẫn tệp
- **Mô tả:** Tải xuống tệp đính kèm của công văn

## 3. Quy Trình Xử Lý công văn (Workflow)

### Thay đổi trạng thái công văn:
- **API:** `PUT /api/workflow/{documentId}/status`
- **Controller:** `DocumentWorkflowController.changeDocumentStatus()`
- **Service:** `DocumentWorkflowService.changeDocumentStatus()`
- **Mô tả:** Thay đổi trạng thái xử lý của công văn theo quy trình ISO, từ trạng thái ban đầu (DRAFT) qua các trạng thái trung gian (REGISTERED, ASSIGNED, PROCESSING, REVIEWING) đến trạng thái cuối cùng (COMPLETED, REJECTED, ARCHIVED)

### Phân công công văn:
- **API:** `POST /api/workflow/{documentId}/assign`
- **Controller:** `DocumentWorkflowController.assignDocument()`
- **Service:** `DocumentWorkflowService.assignDocument()`
- **Mô tả:** Phân công công văn cho người xử lý, ghi nhận vào lịch sử xử lý

### Xem lịch sử xử lý công văn:
- **API:** `GET /api/workflow/{documentId}/history`
- **Controller:** `DocumentWorkflowController.getDocumentHistory()`
- **Service:** `DocumentWorkflowService.getDocumentHistory()`
- **Mô tả:** Xem lịch sử thay đổi trạng thái và phân công xử lý công văn

## 4. Tìm Kiếm và Truy Xuất công văn

### Tìm kiếm công văn theo từ khóa:
- **API công văn đến:** `GET /api/documents/incoming/search`
- **API công văn đi:** `GET /api/documents/outgoing/search`
- **Mô tả:** Tìm kiếm công văn theo từ khóa trong tiêu đề, số tham chiếu, cơ quan phát hành

### Lọc theo loại công văn:
- **API công văn đi:** `GET /api/documents/outgoing/document-type`
- **Mô tả:** Lọc công văn theo loại công văn

### Lọc theo khoảng thời gian:
- **API công văn đến:** `GET /api/documents/incoming/date-range`
- **API công văn đi:** `GET /api/documents/outgoing/date-range`
- **Mô tả:** Lọc công văn theo khoảng thời gian

### Lọc theo mức độ khẩn cấp (chỉ áp dụng cho công văn đến):
- **API:** `GET /api/documents/incoming/urgency-level`
- **Mô tả:** Lọc công văn đến theo mức độ khẩn cấp

### Lọc theo trạng thái xử lý (chỉ áp dụng cho công văn đến):
- **API:** `GET /api/documents/incoming/processing-status`
- **Mô tả:** Lọc công văn đến theo trạng thái xử lý

## 5. Ghi Nhật Ký Hoạt Động

- **Service:** `ActivityLogService.logActivity()`
- **Mô tả:** Ghi lại các hoạt động liên quan đến công văn như tạo mới, cập nhật, thay đổi trạng thái, phân công xử lý
- **Repository:** `ActivityLogRepository` cung cấp các phương thức tìm kiếm và thống kê hoạt động

## 6. Thống Kê

- **API:** Các API trong `DashboardService` 
- **Mô tả:** Thống kê số lượng công văn theo loại, theo trạng thái, hoạt động người dùng theo thời gian

Quy trình này tuân theo mô hình ISO cho việc xử lý công văn, bắt đầu từ dự thảo, đăng ký, phân công, xử lý, kiểm duyệt, hoàn thành và cuối cùng là lưu trữ hoặc từ chối. Mỗi hoạt động được ghi lại trong lịch sử xử lý công văn để đảm bảo tính minh bạch và theo dõi.
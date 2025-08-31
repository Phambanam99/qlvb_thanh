# Quy Trình Xử Lý Lưu Trữ Văn Bản trong Hệ Thống Managementcontent

Dựa trên mã nguồn được cung cấp, hệ thống quản lý văn bản có hai loại văn bản chính: Văn bản đến (IncomingDocument) và Văn bản đi (OutgoingDocument). Dưới đây là quy trình xử lý và lưu trữ văn bản thông qua các API:

## 1. Tạo Văn Bản (Create)

### Văn bản đến:
- **API:** `POST /api/documents/incoming`
- **Controller:** `IncomingDocumentController.createIncomingDocument()`
- **Service:** `IncomingDocumentService.createIncomingDocument()`
- **Mô tả:** Tạo văn bản đến mới với các thông tin như tiêu đề, số văn bản, số tham chiếu, cơ quan phát hành, mức độ khẩn cấp, ngày ký, tình trạng xử lý, v.v.

### Văn bản đi:
- **API:** `POST /api/documents/outgoing`
- **Controller:** `OutgoingDocumentController.createOutgoingDocument()`
- **Service:** `OutgoingDocumentService.createOutgoingDocument()`
- **Mô tả:** Tạo văn bản đi mới với các thông tin như tiêu đề, loại văn bản, số văn bản, số tham chiếu, người ký, phòng soạn thảo, v.v.

## 2. Quản Lý Tệp Đính Kèm

### Tải lên tệp đính kèm:
- **API văn bản đến:** `POST /api/documents/incoming/{id}/attachment`
- **API văn bản đi:** `POST /api/documents/outgoing/{id}/attachment`
- **Service:** `FileStorageService.storeFile()` xử lý lưu trữ tệp đính kèm
- **Mô tả:** Tải lên tệp đính kèm cho văn bản, tạo đường dẫn lưu trữ và lưu tên tệp vào thông tin văn bản

### Tải xuống tệp đính kèm:
- **API văn bản đến:** `GET /api/documents/incoming/{id}/attachment`
- **API văn bản đi:** `GET /api/documents/outgoing/{id}/attachment`
- **Service:** `FileStorageService.getFilePath()` để lấy đường dẫn tệp
- **Mô tả:** Tải xuống tệp đính kèm của văn bản

## 3. Quy Trình Xử Lý Văn Bản (Workflow)

### Thay đổi trạng thái văn bản:
- **API:** `PUT /api/workflow/{documentId}/status`
- **Controller:** `DocumentWorkflowController.changeDocumentStatus()`
- **Service:** `DocumentWorkflowService.changeDocumentStatus()`
- **Mô tả:** Thay đổi trạng thái xử lý của văn bản theo quy trình ISO, từ trạng thái ban đầu (DRAFT) qua các trạng thái trung gian (REGISTERED, ASSIGNED, PROCESSING, REVIEWING) đến trạng thái cuối cùng (COMPLETED, REJECTED, ARCHIVED)

### Phân công văn bản:
- **API:** `POST /api/workflow/{documentId}/assign`
- **Controller:** `DocumentWorkflowController.assignDocument()`
- **Service:** `DocumentWorkflowService.assignDocument()`
- **Mô tả:** Phân công văn bản cho người xử lý, ghi nhận vào lịch sử xử lý

### Xem lịch sử xử lý văn bản:
- **API:** `GET /api/workflow/{documentId}/history`
- **Controller:** `DocumentWorkflowController.getDocumentHistory()`
- **Service:** `DocumentWorkflowService.getDocumentHistory()`
- **Mô tả:** Xem lịch sử thay đổi trạng thái và phân công xử lý văn bản

## 4. Tìm Kiếm và Truy Xuất Văn Bản

### Tìm kiếm văn bản theo từ khóa:
- **API văn bản đến:** `GET /api/documents/incoming/search`
- **API văn bản đi:** `GET /api/documents/outgoing/search`
- **Mô tả:** Tìm kiếm văn bản theo từ khóa trong tiêu đề, số tham chiếu, cơ quan phát hành

### Lọc theo loại văn bản:
- **API văn bản đi:** `GET /api/documents/outgoing/document-type`
- **Mô tả:** Lọc văn bản theo loại văn bản

### Lọc theo khoảng thời gian:
- **API văn bản đến:** `GET /api/documents/incoming/date-range`
- **API văn bản đi:** `GET /api/documents/outgoing/date-range`
- **Mô tả:** Lọc văn bản theo khoảng thời gian

### Lọc theo mức độ khẩn cấp (chỉ áp dụng cho văn bản đến):
- **API:** `GET /api/documents/incoming/urgency-level`
- **Mô tả:** Lọc văn bản đến theo mức độ khẩn cấp

### Lọc theo trạng thái xử lý (chỉ áp dụng cho văn bản đến):
- **API:** `GET /api/documents/incoming/processing-status`
- **Mô tả:** Lọc văn bản đến theo trạng thái xử lý

## 5. Ghi Nhật Ký Hoạt Động

- **Service:** `ActivityLogService.logActivity()`
- **Mô tả:** Ghi lại các hoạt động liên quan đến văn bản như tạo mới, cập nhật, thay đổi trạng thái, phân công xử lý
- **Repository:** `ActivityLogRepository` cung cấp các phương thức tìm kiếm và thống kê hoạt động

## 6. Thống Kê

- **API:** Các API trong `DashboardService` 
- **Mô tả:** Thống kê số lượng văn bản theo loại, theo trạng thái, hoạt động người dùng theo thời gian

Quy trình này tuân theo mô hình ISO cho việc xử lý văn bản, bắt đầu từ dự thảo, đăng ký, phân công, xử lý, kiểm duyệt, hoàn thành và cuối cùng là lưu trữ hoặc từ chối. Mỗi hoạt động được ghi lại trong lịch sử xử lý văn bản để đảm bảo tính minh bạch và theo dõi.
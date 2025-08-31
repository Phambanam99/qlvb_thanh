# Hướng dẫn tạo dữ liệu demo công văn nội bộ

## Tổng quan
Service này cho phép tạo 1000 công văn nội bộ demo với dữ liệu ngẫu nhiên nhưng thực tế để test hệ thống.

## API Endpoints

### 1. Tạo 1000 công văn demo
```
POST /api/internal-documents/demo/create
```

### 2. Kiểm tra số lượng công văn
```
GET /api/internal-documents/demo/count
```

### 3. Xóa dữ liệu demo (nếu cần)
```
DELETE /api/demo/internal-documents/clear
```

## Cách sử dụng

### Option 1: Sử dụng API trực tiếp
1. Khởi động ứng dụng Spring Boot
2. Truy cập Swagger UI: `http://localhost:8080/swagger-ui/index.html`
3. Tìm section "Internal Documents" 
4. Gọi endpoint `POST /api/internal-documents/demo/create`

### Option 2: Sử dụng curl
```bash
# Tạo 1000 công văn demo
curl -X POST http://localhost:8080/api/internal-documents/demo/create

# Kiểm tra số lượng công văn
curl -X GET http://localhost:8080/api/internal-documents/demo/count
```

### Option 3: Sử dụng Postman
1. Tạo POST request đến `http://localhost:8080/api/internal-documents/demo/create`
2. Không cần body
3. Send request

## Dữ liệu demo được tạo

Mỗi công văn demo sẽ có:

### Thông tin cơ bản
- **Số công văn**: CV-0001/2025, QD-0002/2025, etc.
- **Tiêu đề**: Ngẫu nhiên từ các template thực tế
- **Loại công văn**: Công văn, Quyết định, Chỉ thị, Thông báo, v.v.
- **Tóm tắt**: Nội dung mô tả ngắn gọn

### Thông tin người gửi/nhận
- **Người gửi**: Random từ danh sách users hiện có
- **Đơn vị soạn thảo**: Random từ danh sách departments
- **Người ký**: Random từ danh sách users
- **Người nhận**: 1-5 recipients (phòng ban hoặc cá nhân cụ thể)

### Thông tin thời gian
- **Ngày ký**: Ngẫu nhiên trong 2 năm gần đây
- **Hạn xử lý**: 7-30 ngày sau ngày ký
- **Ngày tạo**: Trước ngày ký 0-5 ngày

### Thông tin khác
- **Mức độ ưu tiên**: Hỏa tốc, Khẩn, Thường, v.v.
- **Trạng thái**: Draft, Pending, Completed, v.v.
- **Độ bảo mật**: Normal, Confidential, Secret, v.v.
- **Số bản phát hành**: 1-20 bản
- **Số trang**: 1-50 trang

## Lưu ý quan trọng

### Yêu cầu hệ thống
- **Cần có dữ liệu Users**: Ít nhất 1 user trong hệ thống
- **Cần có dữ liệu Departments**: Ít nhất 1 department trong hệ thống
- **Database connection**: Đảm bảo kết nối database hoạt động

### Performance
- Tạo 1000 công văn sẽ mất khoảng 30-60 giây tùy theo cấu hình hệ thống
- Process sẽ log tiến độ mỗi 100 công văn được tạo
- Sử dụng transaction nên nếu có lỗi sẽ rollback toàn bộ

### Dọn dẹp dữ liệu
- Các công văn demo có pattern số công văn: `XX-XXXX/2025`
- Có thể xóa bằng endpoint `/api/demo/internal-documents/clear`
- Hoặc xóa trực tiếp trong database với query:
```sql
DELETE FROM internal_document WHERE document_number LIKE '%/2025';
```

## Troubleshooting

### Lỗi "Không tìm thấy users hoặc departments"
- Kiểm tra database có dữ liệu users và departments không
- Chạy data migration hoặc tạo dữ liệu master trước

### Lỗi "Duplicate entry for key 'document_number'"
- Có thể đã tồn tại công văn với số tương tự
- Xóa dữ liệu demo cũ trước khi tạo mới

### Performance chậm
- Kiểm tra kết nối database
- Tăng memory heap cho JVM nếu cần
- Chạy vào thời điểm ít tải

## Code Structure

- **InternalDocumentDemoService**: Service chính tạo dữ liệu demo
- **InternalDocumentDemoController**: Controller riêng (optional)
- **InternalDocumentController**: Đã thêm endpoints vào controller hiện có

## Tích hợp vào hệ thống khác

Service này có thể được tích hợp vào:
- CI/CD pipeline để tạo dữ liệu test
- Development environment setup
- Performance testing scenarios
- Demo presentations

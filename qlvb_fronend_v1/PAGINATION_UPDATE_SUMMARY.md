# Cập nhật Phân trang cho Lịch công tác

Đã cập nhật hệ thống lịch công tác để hỗ trợ phân trang đầy đủ cho tất cả các bảng và danh sách.

## Các thay đổi chính

### 1. API Updates (lib/api/schedules.ts)
- ✅ Cập nhật interface `ScheduleDTO` để phù hợp với cấu trúc API thực tế
- ✅ Thêm interface `PaginatedScheduleResponse` cho dữ liệu phân trang
- ✅ Thêm interface `ScheduleListParams` cho các tham số query
- ✅ Cập nhật `getAllSchedules()` để hỗ trợ pagination parameters
- ✅ Sửa loại dữ liệu `participants` từ `string[]` thành `number[]`

### 2. Hook Updates (hooks/use-schedule-data.ts)
- ✅ Thêm state management cho pagination (currentPage, pageSize, totalElements, totalPages)
- ✅ Cập nhật `fetchSchedules()` để xử lý API pagination response
- ✅ Chuyển đổi filtering từ client-side sang server-side
- ✅ Thêm các handler functions: `handlePageChange`, `handlePageSizeChange`
- ✅ Tự động refetch khi page hoặc page size thay đổi

### 3. New Components

#### SchedulePagination (components/schedule/schedule-pagination.tsx)
- ✅ Component pagination tùy chỉnh với UI tiếng Việt
- ✅ Hiển thị thông tin "Hiển thị X đến Y trong tổng số Z mục"
- ✅ Dropdown để chọn số items per page (10, 20, 50, 100)
- ✅ Navigation buttons với text tiếng Việt ("Trước", "Sau")
- ✅ Smart page number generation với ellipsis

#### ScheduleTable (components/schedule/schedule-table.tsx)
- ✅ Component bảng đầy đủ với pagination tích hợp
- ✅ Columns: STT, Tiêu đề, Phòng ban, Kỳ, Trạng thái, Người tạo, Ngày tạo, Thao tác
- ✅ Dropdown menu cho actions (Xem, Sửa, Phê duyệt, Từ chối, Xóa)
- ✅ Loading skeleton states
- ✅ Empty state với link tạo mới
- ✅ Status badges với màu sắc phù hợp

### 4. Updated Components

#### ViewModeSelector (components/schedule/view-mode-selector.tsx)
- ✅ Thêm option "Bảng" với icon Table
- ✅ Cập nhật ViewMode type để bao gồm "table"

#### ScheduleTabs (components/schedule/schedule-tabs.tsx)
- ✅ Hỗ trợ table view mode
- ✅ Tích hợp ScheduleTable component
- ✅ Chỉ hiển thị pagination cho list view và table view
- ✅ Pass through pagination props

#### ScheduleSkeleton (components/schedule/schedule-skeleton.tsx)
- ✅ Cập nhật để handle table view (table tự xử lý loading state)

### 5. Main Page Updates (app/(authenticated)/lich-cong-tac/page.tsx)
- ✅ Import pagination properties từ hook
- ✅ Pass pagination props xuống ScheduleTabs
- ✅ Đặt default view mode thành "table"

## Tính năng Pagination

### Server-side Pagination
- ✅ API call với parameters: page, size, search, status, departmentId
- ✅ Response bao gồm: content[], totalElements, totalPages, number, size
- ✅ Filtering được thực hiện ở server để tối ưu performance

### Client-side Features
- ✅ Pagination controls với Previous/Next buttons
- ✅ Page size selector (10, 20, 50, 100 items per page)
- ✅ Page number buttons với smart ellipsis
- ✅ Status information hiển thị range và total
- ✅ Auto-reset về page 1 khi thay đổi filters

### View Modes với Pagination
1. **Table View**: Bảng đầy đủ với pagination - **MẶC ĐỊNH**
2. **List View**: Card-based layout với pagination  
3. **Week View**: Calendar view (không cần pagination)
4. **Month View**: Calendar view (không cần pagination)

## Tương thích ngược
- ✅ Tất cả view modes cũ vẫn hoạt động
- ✅ Filtering và search vẫn hoạt động
- ✅ Department permissions vẫn được tôn trọng
- ✅ API response structure được xử lý đúng

## UI/UX Improvements
- ✅ Text tiếng Việt cho tất cả pagination controls
- ✅ Responsive design cho mobile và desktop
- ✅ Loading states cho table rows
- ✅ Empty states với call-to-action
- ✅ Proper error handling

## Cách sử dụng

### Table View (Recommended)
1. Mở trang Lịch công tác
2. Table view sẽ được hiển thị mặc định
3. Sử dụng pagination controls ở dưới bảng
4. Thay đổi page size qua dropdown

### List View với Pagination
1. Chọn "Danh sách" trong view selector
2. Pagination controls sẽ xuất hiện dưới danh sách
3. Navigate qua các trang

### Integration với Filtering
- Mọi filter (search, status, department) sẽ reset về page 1
- Server sẽ xử lý filtering và trả về kết quả phân trang
- Performance được tối ưu cho datasets lớn

Tất cả các bảng trong lịch công tác giờ đã được phân trang đầy đủ và sẵn sàng để sử dụng.

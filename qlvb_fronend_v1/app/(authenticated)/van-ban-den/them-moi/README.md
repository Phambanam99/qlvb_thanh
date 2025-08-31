# Tái cấu trúc trang thêm văn bản đến mới

## Tổng quan
File `page.tsx` đã được tái cấu trúc để dễ bảo trì và ít lỗi hơn bằng cách chia nhỏ thành các component và utilities riêng biệt.

## Cấu trúc thư mục

```
them-moi/
├── components/
│   ├── document-info-form.tsx          # Form thông tin văn bản
│   ├── document-purpose-selector.tsx   # Selector mục đích văn bản  
│   ├── processing-section.tsx          # Section xử lý văn bản
│   ├── notification-section.tsx        # Section thông báo
│   ├── page-header.tsx                 # Header trang (mới)
│   └── department-selection.tsx        # Component chọn phòng ban (mới)
├── hooks/
│   └── use-add-document-form.ts        # Logic form chính (mới)
├── lib/
│   ├── constants.ts                    # Constants và types (mới)
│   ├── utils.ts                        # Helper functions (mới)
│   ├── validation.ts                   # Logic validation (mới)
│   ├── api-wrapper.ts                  # API wrapper với ResponseDto (mới)
│   └── form-submission.ts              # Logic submit form (mới)
└── page.tsx                            # Component chính đã được đơn giản hóa
```

## Các cải tiến chính

### 1. Tách constants và types
- `lib/constants.ts`: Chứa tất cả constants như leadership roles, role display names và types
- Dễ dàng maintain và update

### 2. Tách helper functions  
- `lib/utils.ts`: Các function tiện ích như `getRoleDisplayName`, `findUserById`, etc.
- Có thể reuse trong các component khác

### 3. Logic validation riêng biệt
- `lib/validation.ts`: Tất cả logic validation form
- Dễ test và modify validation rules

### 4. API wrapper cho ResponseDto
- `lib/api-wrapper.ts`: Wrapper cho tất cả API calls
- Xử lý ResponseDto format từ backend
- Unified error handling

### 5. Form submission logic
- `lib/form-submission.ts`: Logic chuẩn bị và submit data
- Tách biệt business logic khỏi UI

### 6. Custom hook cho form logic
- `hooks/use-add-document-form.ts`: Quản lý tất cả state và logic của form
- Tách biệt logic khỏi component chính

### 7. Component hierarchy
- `components/page-header.tsx`: Header với breadcrumb và buttons
- `components/department-selection.tsx`: Component chọn phòng ban đã tối ưu

## Lợi ích

### 1. Maintainability
- Code được tổ chức rõ ràng theo chức năng
- Dễ tìm và sửa lỗi
- Dễ thêm features mới

### 2. Reusability  
- Helper functions có thể sử dụng lại
- Components nhỏ có thể reuse
- API wrapper áp dụng cho toàn project

### 3. Testability
- Logic business tách biệt, dễ test
- Validation logic độc lập
- Mock API dễ dàng

### 4. Type Safety
- Định nghĩa rõ ràng types và interfaces
- Giảm lỗi runtime
- Better IDE support

### 5. Error Handling
- Centralized API error handling
- Consistent error messages
- ResponseDto format handling

## Cách sử dụng API Wrapper

```typescript
import { apiWrapper, handleApiResponse } from './lib/api-wrapper';

// Trong component
const { toast } = useToast();

// Wrap API call
const response = await apiWrapper(() => api.createDocument(data));

// Handle response
const result = handleApiResponse(response, toast, 'Tạo văn bản thành công');

if (result) {
  // Success case
  console.log('Created document:', result);
}
```

## Migration Notes

### Từ code cũ sang code mới:
1. Constants được move từ component sang `lib/constants.ts`
2. Helper functions được move sang `lib/utils.ts`  
3. Validation logic được move sang `lib/validation.ts`
4. Form logic được move sang custom hook
5. API calls sẽ được wrap bởi `apiWrapper`

### Breaking changes:
- ValidationErrors interface đã thay đổi
- Helper functions signatures có thể khác
- API response format cần tuân thủ ResponseDto

## TODO
- [ ] Áp dụng API wrapper cho tất cả API calls trong project
- [ ] Tạo unit tests cho validation logic
- [ ] Tạo integration tests cho form submission
- [ ] Document API ResponseDto format standard
- [ ] Tạo storybook cho các components mới

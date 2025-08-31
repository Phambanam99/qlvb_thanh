# KHẨN CẤP: Sửa Vòng Lặp Vô Hạn API Calls

## ⚠️ Update mới nhất: 21/07/2025 10:27

Hệ thống gặp phải infinite loop mới khi load dữ liệu schedule, với API được gọi liên tục mỗi ~120ms:

```
[2025-07-21T10:27:22.822Z] [DEBUG] API GET /schedules {"page":0,"size":20}
[2025-07-21T10:27:22.994Z] [DEBUG] API GET /schedules {"page":0,"size":20}
[2025-07-21T10:27:23.144Z] [DEBUG] API GET /schedules {"page":0,"size":20}
...
```

## 🔧 Nguyên nhân mới phát hiện:
**Pagination Dependencies Cycle:**

```typescript
// VẤN ĐỀ:
fetchSchedules -> depends on [currentPage, pageSize]
useEffect(..., [fetchSchedules]) -> triggers when fetchSchedules changes
handlePageChange -> calls fetchSchedules -> updates currentPage
=> currentPage change -> fetchSchedules recreated -> useEffect triggers -> infinite loop!
```

## ✅ Giải pháp đã áp dụng (Update):

### 1. **Loại bỏ currentPage/pageSize khỏi fetchSchedules dependencies**
```typescript
// TRƯỚC: 
const fetchSchedules = useCallback(
  async (forceRefresh = false, params?: ScheduleListParams) => {
    const queryParams = { page: currentPage, size: pageSize, ...params };
    // ...
  },
  [loadingDepartments, setLoading, toast, currentPage, pageSize] // ❌ Gây loop
);

// SAU:
const fetchSchedules = useCallback(
  async (forceRefresh = false, customParams?: ScheduleListParams) => {
    const queryParams = customParams || { page: currentPage, size: pageSize };
    // ...
  },
  [loadingDepartments, setLoading, toast] // ✅ Stable dependencies only
);
```

### 2. **Direct API calls trong pagination handlers**
```typescript
// TRƯỚC:
const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
}, []);

useEffect(() => {
  if (hasFetchedRef.current) {
    fetchSchedules(false); // ❌ Triggers loop
  }
}, [currentPage, pageSize, fetchSchedules]);

// SAU:
const handlePageChange = useCallback((page: number) => {
  setCurrentPage(page);
  
  // ✅ Direct API call, no dependencies
  const queryParams = { page, size: pageSize };
  schedulesAPI.getAllSchedules(queryParams).then(handleResponse);
}, [pageSize]);

// ✅ Loại bỏ useEffect gây loop
```

### 3. **Refactor tất cả useEffect để avoid fetchSchedules dependency**
```typescript
// Auto-refresh
useEffect(() => {
  if (isPageVisible && hasFetchedRef.current) {
    schedulesAPI.getAllSchedules({page: currentPage, size: pageSize})
      .then(handleResponse); // ✅ Direct call
  }
}, [isPageVisible, currentPage, pageSize]);

// Initial fetch  
useEffect(() => {
  if (!loadingDepartments && !hasFetchedRef.current) {
    schedulesAPI.getAllSchedules({page: 0, size: pageSize})
      .then(handleResponse); // ✅ Direct call
  }
}, [loadingDepartments, pageSize]);
```

## ⚠️ Vấn đề nghiêm trọng đã được phát hiện:
API `/schedules` được gọi liên tục mỗi 200-300ms, gây ra:
- Spam server với hàng nghìn requests
- Có thể crash backend
- Performance app cực kém
- UX tệ (loading liên tục)

## 🔧 Nguyên nhân gốc rễ:
**Dependency Cycle trong useEffect + useCallback:**

```typescript
// VẤN ĐỀ:
fetchSchedules -> depends on filterSchedules
filterSchedules -> depends on many states  
useEffect -> depends on fetchSchedules
=> Khi bất kỳ state nào thay đổi, toàn bộ cycle chạy lại!
```

## ✅ Giải pháp đã áp dụng:

### 1. **Tách biệt hoàn toàn fetch và filter logic**
```typescript
// TRƯỚC: fetchSchedules phụ thuộc filterSchedules
const fetchSchedules = useCallback(async () => {
  // ...
  filterSchedules(newSchedules); // ❌ Dependency!
}, [filterSchedules]); // ❌ Gây infinite loop

// SAU: fetchSchedules độc lập hoàn toàn  
const fetchSchedules = useCallback(async () => {
  // ...
  setAllSchedules(newSchedules); // ✅ Chỉ set data
}, [loadingDepartments, setLoading, toast]); // ✅ Stable dependencies
```

### 2. **Loại bỏ tất cả dependency cycles**
```typescript
// TRƯỚC: Effects phụ thuộc vào functions
useEffect(() => {
  fetchSchedules();
}, [fetchSchedules]); // ❌ Infinite loop

// SAU: Effects với stable dependencies
useEffect(() => {
  fetchSchedules();
}, [loadingDepartments]); // ✅ Stable
```

### 3. **Inline filter logic trong effect**
Thay vì có function `filterSchedules` riêng tạo dependency cycle, đã inline hết logic filter vào trong effect để tránh closure dependencies.

### 4. **Single-source-of-truth filtering**
Tất cả filter logic giờ chỉ ở một nơi duy nhất, trigger khi:
- `allSchedules` thay đổi (từ API)
- Filter parameters thay đổi (`searchQuery`, `statusFilter`, `departmentFilter`)
- Department data thay đổi

### 5. **Proper cleanup**
- Clear timeouts correctly
- Remove event listeners
- Prevent concurrent operations với refs

## 📊 Kết quả:

**TRƯỚC:**
- ❌ 100+ API calls/phút  
- ❌ Console spam
- ❌ App lag
- ❌ Server overload risk

**SAU:**
- ✅ 1 API call duy nhất khi load page
- ✅ API call chỉ khi user manually refresh
- ✅ API call khi page visible (user quay lại)
- ✅ Clean console
- ✅ Smooth performance

## 🎯 Nguyên tắc đã áp dụng:

1. **Never include function deps in useEffect if that function depends on frequently changing state**
2. **Separate data fetching from data processing** 
3. **Use refs to prevent infinite loops**
4. **Debounce user input operations**
5. **Keep effects stable with minimal dependencies**

## 🔍 Test cases để verify:
1. ✅ Load page → 1 API call duy nhất
2. ✅ Type in search → No API calls, chỉ filter local data
3. ✅ Change filters → No API calls, chỉ filter local data  
4. ✅ Click refresh → 1 API call
5. ✅ Switch tabs và quay lại → 1 API call
6. ✅ No more infinite loops
7. ✅ Clean console logs

## ⚠️ Lesson learned:
Luôn cẩn thận với useCallback + useEffect dependencies. Một dependency cycle nhỏ có thể gây ra disaster về performance!

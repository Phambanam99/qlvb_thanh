# Hướng dẫn tích hợp thông báo cho Văn bản nội bộ (Internal Documents)

## Tổng quan

Hệ thống thông báo cho văn bản nội bộ được thiết kế để thông báo real-time khi:
1. **Gửi văn bản**: Thông báo cho tất cả người nhận về văn bản mới
2. **Đọc văn bản**: Thông báo ngược lại cho người gửi khi có người đọc văn bản

## 1. Cấu trúc thông báo

### 1.1 Message Structure cho Internal Documents

```json
{
  "id": 123,
  "type": "INTERNAL_DOCUMENT_RECEIVED", // hoặc "INTERNAL_DOCUMENT_READ"
  "content": "Bạn đã nhận được văn bản nội bộ 'Thông báo họp' từ Nguyễn Văn A",
  "entityId": 456,
  "entityType": "internal_document",
  "createdAt": "2025-08-05T10:00:00Z",
  "read": false,
  "user": {
    "id": 789,
    "name": "user123",
    "fullName": "Trần Thị B"
  }
}
```

### 1.2 Các loại thông báo

| Loại thông báo | Mô tả | Người nhận | Nội dung mẫu |
|---|---|---|---|
| `INTERNAL_DOCUMENT_RECEIVED` | Thông báo khi nhận văn bản mới | Người nhận văn bản | "Bạn đã nhận được văn bản nội bộ '[Tiêu đề]' từ [Tên người gửi]" |
| `INTERNAL_DOCUMENT_READ` | Thông báo khi văn bản được đọc | Người gửi văn bản | "[Tên người đọc] đã đọc văn bản nội bộ '[Tiêu đề]' của bạn" |

## 2. WebSocket Connection

### 2.1 Kết nối WebSocket

```javascript
// Kết nối WebSocket sử dụng SockJS và STOMP
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function (frame) {
    console.log('Connected: ' + frame);
    
    // Subscribe to personal notification queue
    stompClient.subscribe('/user/queue/notifications', function (notification) {
        const notificationData = JSON.parse(notification.body);
        handleInternalDocumentNotification(notificationData);
    });
});
```

### 2.2 Xử lý thông báo theo loại

```javascript
function handleInternalDocumentNotification(notification) {
    const { type, entityType, content } = notification;
    
    // Chỉ xử lý thông báo của internal documents
    if (entityType !== 'internal_document') {
        return;
    }
    
    switch (type) {
        case 'INTERNAL_DOCUMENT_RECEIVED':
            handleNewInternalDocument(notification);
            break;
        case 'INTERNAL_DOCUMENT_READ':
            handleDocumentRead(notification);
            break;
        default:
            console.log('Unknown notification type:', type);
    }
}

function handleNewInternalDocument(notification) {
    // Hiển thị toast notification
    showToast({
        type: 'info',
        title: 'Văn bản mới',
        message: notification.content,
        duration: 5000
    });
    
    // Cập nhật counter số lượng văn bản chưa đọc
    updateUnreadCounter();
    
    // Thêm vào danh sách văn bản nhận được (nếu đang ở trang tương ứng)
    if (isOnReceivedDocumentsPage()) {
        refreshReceivedDocumentsList();
    }
}

function handleDocumentRead(notification) {
    // Hiển thị notification nhẹ hơn cho người gửi
    showToast({
        type: 'success',
        title: 'Đã đọc',
        message: notification.content,
        duration: 3000
    });
    
    // Cập nhật read status trong danh sách văn bản đã gửi
    if (isOnSentDocumentsPage()) {
        updateDocumentReadStatus(notification.entityId);
    }
}
```

## 3. API Endpoints

### 3.1 Gửi văn bản (Trigger thông báo RECEIVED)

```javascript
/**
 * Gửi văn bản nội bộ đến danh sách người nhận
 * Sẽ tự động tạo thông báo cho tất cả người nhận
 */
async function sendInternalDocument(documentId, recipientUserIds) {
    try {
        const response = await fetch(`/api/internal-documents/${documentId}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(recipientUserIds)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Document sent successfully:', result);
            
            // Thông báo sẽ được gửi tự động qua WebSocket
            // Frontend không cần làm gì thêm
            
            return result;
        } else {
            throw new Error('Failed to send document');
        }
    } catch (error) {
        console.error('Error sending document:', error);
        throw error;
    }
}
```

### 3.2 Đánh dấu đã đọc (Trigger thông báo READ)

```javascript
/**
 * Đánh dấu văn bản đã đọc
 * Sẽ tự động gửi thông báo ngược lại cho người gửi
 */
async function markAsRead(documentId) {
    try {
        const response = await fetch(`/api/internal-documents/${documentId}/mark-read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('Document marked as read:', result);
            
            // Thông báo sẽ được gửi tự động cho người gửi qua WebSocket
            // Frontend chỉ cần cập nhật UI local
            updateLocalReadStatus(documentId);
            
            return result;
        } else {
            throw new Error('Failed to mark as read');
        }
    } catch (error) {
        console.error('Error marking as read:', error);
        throw error;
    }
}
```

### 3.3 Lấy danh sách thông báo

```javascript
/**
 * Lấy danh sách thông báo (với phân trang)
 */
async function getNotifications(page = 0, size = 20) {
    try {
        const response = await fetch(`/api/notifications?page=${page}&size=${size}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.data; // Page<Notification>
        } else {
            throw new Error('Failed to fetch notifications');
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
}
```

## 4. Frontend Implementation Examples

### 4.1 Tích hợp trong Vue.js

```vue
<template>
  <div class="internal-documents">
    <!-- Toast notifications container -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" 
           :class="['toast', `toast-${toast.type}`]">
        <h4>{{ toast.title }}</h4>
        <p>{{ toast.message }}</p>
      </div>
    </div>
    
    <!-- Unread counter badge -->
    <div class="unread-badge" v-if="unreadCount > 0">
      {{ unreadCount }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import SockJS from 'sockjs-client'
import Stomp from 'stompjs'

export default {
  setup() {
    const stompClient = ref(null)
    const toasts = ref([])
    const unreadCount = ref(0)
    
    const connectWebSocket = () => {
      const socket = new SockJS('/ws')
      stompClient.value = Stomp.over(socket)
      
      stompClient.value.connect({}, (frame) => {
        console.log('Connected:', frame)
        
        stompClient.value.subscribe('/user/queue/notifications', (message) => {
          const notification = JSON.parse(message.body)
          handleNotification(notification)
        })
      })
    }
    
    const handleNotification = (notification) => {
      if (notification.entityType === 'internal_document') {
        showToast({
          type: notification.type === 'INTERNAL_DOCUMENT_RECEIVED' ? 'info' : 'success',
          title: notification.type === 'INTERNAL_DOCUMENT_RECEIVED' ? 'Văn bản mới' : 'Đã đọc',
          message: notification.content
        })
        
        if (notification.type === 'INTERNAL_DOCUMENT_RECEIVED') {
          unreadCount.value++
        }
      }
    }
    
    const showToast = (toast) => {
      const id = Date.now()
      toasts.value.push({ ...toast, id })
      
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, toast.duration || 5000)
    }
    
    onMounted(() => {
      connectWebSocket()
    })
    
    onUnmounted(() => {
      if (stompClient.value) {
        stompClient.value.disconnect()
      }
    })
    
    return {
      toasts,
      unreadCount
    }
  }
}
</script>
```

### 4.2 Tích hợp trong React

```jsx
import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const InternalDocumentsNotifications = () => {
  const [stompClient, setStompClient] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    
    client.connect({}, (frame) => {
      console.log('Connected:', frame);
      
      client.subscribe('/user/queue/notifications', (message) => {
        const notification = JSON.parse(message.body);
        handleNotification(notification);
      });
    });
    
    setStompClient(client);
    
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, []);

  const handleNotification = (notification) => {
    if (notification.entityType === 'internal_document') {
      const toastType = notification.type === 'INTERNAL_DOCUMENT_RECEIVED' ? 'info' : 'success';
      const title = notification.type === 'INTERNAL_DOCUMENT_RECEIVED' ? 'Văn bản mới' : 'Đã đọc';
      
      showToast({
        type: toastType,
        title: title,
        message: notification.content
      });
      
      if (notification.type === 'INTERNAL_DOCUMENT_RECEIVED') {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const showToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);
  };

  return (
    <div className="internal-documents">
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <h4>{toast.title}</h4>
            <p>{toast.message}</p>
          </div>
        ))}
      </div>
      
      {/* Unread counter */}
      {unreadCount > 0 && (
        <div className="unread-badge">
          {unreadCount}
        </div>
      )}
    </div>
  );
};

export default InternalDocumentsNotifications;
```

## 5. Error Handling

### 5.1 WebSocket Connection Errors

```javascript
const connectWithRetry = (retryCount = 0, maxRetries = 5) => {
  const socket = new SockJS('/ws');
  const client = Stomp.over(socket);
  
  client.connect({}, 
    // Success callback
    (frame) => {
      console.log('Connected:', frame);
      retryCount = 0; // Reset retry count on success
      
      client.subscribe('/user/queue/notifications', (message) => {
        try {
          const notification = JSON.parse(message.body);
          handleNotification(notification);
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      });
    },
    // Error callback
    (error) => {
      console.error('WebSocket connection error:', error);
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying connection in ${delay}ms...`);
        
        setTimeout(() => {
          connectWithRetry(retryCount + 1, maxRetries);
        }, delay);
      } else {
        console.error('Max retry attempts reached. Please refresh the page.');
        // Show user-friendly error message
        showErrorMessage('Mất kết nối. Vui lòng tải lại trang.');
      }
    }
  );
};
```

### 5.2 API Error Handling

```javascript
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        redirectToLogin();
        return;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    
    // Show user-friendly error message
    showErrorMessage(`Lỗi: ${error.message}`);
    throw error;
  }
};
```

## 6. Best Practices

### 6.1 Performance Optimization

- **Debounce notifications**: Tránh spam thông báo bằng cách nhóm các thông báo tương tự trong khoảng thời gian ngắn
- **Limit toast notifications**: Chỉ hiển thị tối đa 3-5 toast cùng lúc
- **Lazy loading**: Chỉ load danh sách thông báo khi cần thiết

### 6.2 User Experience

- **Clear visual indicators**: Sử dụng màu sắc và icon rõ ràng để phân biệt loại thông báo
- **Non-blocking UI**: Thông báo không được cản trở workflow chính của user
- **Accessible**: Đảm bảo thông báo có thể đọc được bởi screen reader

### 6.3 Security Considerations

- **Validate permissions**: Chỉ hiển thị thông báo mà user có quyền xem
- **Sanitize content**: Luôn escape HTML trong nội dung thông báo
- **Rate limiting**: Backend đã implement rate limiting cho việc gửi thông báo

## 7. Testing

### 7.1 Unit Tests

```javascript
// Test notification handling
describe('Internal Document Notifications', () => {
  test('should handle INTERNAL_DOCUMENT_RECEIVED notification', () => {
    const notification = {
      type: 'INTERNAL_DOCUMENT_RECEIVED',
      entityType: 'internal_document',
      content: 'Test notification',
      entityId: 123
    };
    
    const result = handleNotification(notification);
    
    expect(result).toBeTruthy();
    expect(unreadCount).toHaveBeenIncremented();
  });
  
  test('should handle INTERNAL_DOCUMENT_READ notification', () => {
    const notification = {
      type: 'INTERNAL_DOCUMENT_READ',
      entityType: 'internal_document',
      content: 'Document read notification',
      entityId: 123
    };
    
    const result = handleNotification(notification);
    
    expect(result).toBeTruthy();
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Đã đọc',
      message: 'Document read notification'
    });
  });
});
```

### 7.2 Integration Tests

```javascript
// Test WebSocket connection and message handling
describe('WebSocket Integration', () => {
  test('should connect and receive notifications', (done) => {
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    
    client.connect({}, () => {
      client.subscribe('/user/queue/notifications', (message) => {
        const notification = JSON.parse(message.body);
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('entityType');
        done();
      });
      
      // Trigger a test notification
      triggerTestNotification();
    });
  });
});
```

## 8. Troubleshooting

### 8.1 Common Issues

| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| Không nhận được thông báo | WebSocket chưa kết nối hoặc bị ngắt | Kiểm tra connection, implement retry logic |
| Thông báo trùng lặp | Multiple subscription hoặc reconnection issue | Unsubscribe trước khi subscribe lại |
| Token expired | Authentication token hết hạn | Refresh token hoặc redirect to login |
| Slow performance | Quá nhiều DOM updates | Implement virtual scrolling cho danh sách thông báo |

### 8.2 Debug Tools

```javascript
// Enable debug logging for STOMP
Stomp.setInterval = function(interval) {
  window.setInterval(interval);
};

// Debug WebSocket connection
const debugStompClient = Stomp.over(socket);
debugStompClient.debug = function(str) {
  console.log('STOMP Debug:', str);
};
```

---

## Kết luận

Hệ thống thông báo cho văn bản nội bộ đã được thiết kế để:
- **Đơn giản**: Chỉ 2 loại thông báo chính
- **Real-time**: Sử dụng WebSocket để thông báo ngay lập tức
- **Reliable**: Có error handling và retry mechanism
- **Scalable**: Có thể dễ dàng mở rộng thêm loại thông báo mới

Frontend developers chỉ cần tích hợp WebSocket connection và implement UI để hiển thị thông báo. Backend sẽ tự động gửi thông báo tại các thời điểm phù hợp trong quy trình xử lý văn bản nội bộ.

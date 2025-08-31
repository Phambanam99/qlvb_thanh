# Hướng dẫn triển khai thông báo realtime cho văn bản nội bộ - Frontend

## 🚀 Tổng quan

Backend đã được cấu hình đầy đủ để hỗ trợ thông báo realtime cho văn bản nội bộ thông qua WebSocket. Đây là hướng dẫn chi tiết để frontend tích hợp và nhận thông báo.

## 📋 Yêu cầu trước khi bắt đầu

1. **Backend đang chạy** trên `http://localhost:8080`
2. **WebSocket endpoint** đã được cấu hình tại `/ws`
3. **JWT token** để xác thực người dùng

## 🔧 Cài đặt Dependencies

```bash
# Nếu sử dụng React/Next.js
npm install @stomp/stompjs sockjs-client

# Nếu sử dụng Vue.js
npm install @stomp/stompjs sockjs-client

# Nếu sử dụng Angular
npm install @stomp/stompjs sockjs-client
```

## 🌐 1. Thiết lập WebSocket Connection

### React/Next.js Implementation

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class NotificationService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    // Tạo SockJS connection
    const socket = new SockJS('http://localhost:8080/ws');
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        console.log('STOMP Debug: ', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      console.log('Connected to WebSocket: ', frame);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to notifications
      this.subscribeToNotifications();
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      this.handleConnectionError();
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('WebSocket error: ', error);
      this.handleConnectionError();
    };

    this.stompClient.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.isConnected = false;
      this.handleReconnection(token);
    };

    // Activate the connection
    this.stompClient.activate();
  }

  subscribeToNotifications() {
    if (!this.stompClient || !this.isConnected) {
      console.error('WebSocket not connected');
      return;
    }

    // Subscribe to user-specific notification queue
    this.stompClient.subscribe('/user/queue/notifications', (message) => {
      try {
        const notification = JSON.parse(message.body);
        this.handleNotification(notification);
      } catch (error) {
        console.error('Error parsing notification: ', error);
      }
    });

    console.log('Subscribed to notification queue');
  }

  handleNotification(notification) {
    console.log('Received notification: ', notification);
    
    // Kiểm tra loại thông báo cho Internal Document
    if (notification.entityType === 'internal_document') {
      switch (notification.type) {
        case 'INTERNAL_DOCUMENT_RECEIVED':
          this.showNewDocumentNotification(notification);
          break;
        case 'INTERNAL_DOCUMENT_READ':
          this.showDocumentReadNotification(notification);
          break;
        case 'INTERNAL_DOCUMENT_SENT':
          this.showDocumentSentNotification(notification);
          break;
        default:
          this.showGenericNotification(notification);
      }
    }
  }

  showNewDocumentNotification(notification) {
    // Hiển thị toast notification
    this.showToast({
      type: 'info',
      title: 'Văn bản mới',
      message: notification.content,
      duration: 5000
    });

    // Cập nhật counter chưa đọc
    this.updateUnreadCounter();

    // Phát sự kiện để component khác có thể lắng nghe
    window.dispatchEvent(new CustomEvent('newInternalDocument', {
      detail: notification
    }));
  }

  showDocumentReadNotification(notification) {
    this.showToast({
      type: 'success',
      title: 'Văn bản đã được đọc',
      message: notification.content,
      duration: 3000
    });
  }

  showDocumentSentNotification(notification) {
    this.showToast({
      type: 'success',
      title: 'Đã gửi văn bản',
      message: notification.content,
      duration: 3000
    });
  }

  showGenericNotification(notification) {
    this.showToast({
      type: 'info',
      title: 'Thông báo',
      message: notification.content,
      duration: 4000
    });
  }

  showToast({ type, title, message, duration }) {
    // Tích hợp với toast library của bạn
    // Ví dụ với react-hot-toast:
    // toast[type](message, { duration });
    
    // Hoặc custom toast implementation
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
  }

  updateUnreadCounter() {
    // Gọi API để lấy số lượng thông báo chưa đọc mới nhất
    fetch('/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      // Cập nhật UI counter
      window.dispatchEvent(new CustomEvent('unreadCountUpdate', {
        detail: { count: data.count }
      }));
    })
    .catch(error => console.error('Error fetching unread count:', error));
  }

  handleConnectionError() {
    this.isConnected = false;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.handleReconnection();
    } else {
      console.error('Max reconnection attempts reached');
      this.showToast({
        type: 'error',
        title: 'Lỗi kết nối',
        message: 'Không thể kết nối đến server thông báo',
        duration: 5000
      });
    }
  }

  handleReconnection(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token || localStorage.getItem('token'));
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.isConnected = false;
      console.log('Manually disconnected from WebSocket');
    }
  }

  sendMessage(destination, body) {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(body)
      });
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
```

## 🎯 2. React Component Integration

```jsx
import React, { useEffect, useState } from 'react';
import { notificationService } from './NotificationService';

const NotificationProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Kết nối WebSocket
      notificationService.connect(token);
      
      // Lắng nghe sự kiện kết nối
      const checkConnection = setInterval(() => {
        setIsConnected(notificationService.isConnected);
      }, 1000);

      // Lắng nghe cập nhật counter
      const handleUnreadUpdate = (event) => {
        setUnreadCount(event.detail.count);
      };

      window.addEventListener('unreadCountUpdate', handleUnreadUpdate);

      // Cleanup
      return () => {
        clearInterval(checkConnection);
        window.removeEventListener('unreadCountUpdate', handleUnreadUpdate);
        notificationService.disconnect();
      };
    }
  }, []);

  return (
    <div>
      {/* Connection status indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Đã kết nối' : '🔴 Mất kết nối'}
      </div>
      
      {/* Unread notification badge */}
      {unreadCount > 0 && (
        <div className="notification-badge">
          {unreadCount} thông báo mới
        </div>
      )}
      
      {children}
    </div>
  );
};

export default NotificationProvider;
```

## 📱 3. Vue.js Implementation

```javascript
// composables/useNotification.js
import { ref, onMounted, onUnmounted } from 'vue';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useNotification() {
  const isConnected = ref(false);
  const unreadCount = ref(0);
  let stompClient = null;

  const connect = (token) => {
    const socket = new SockJS('http://localhost:8080/ws');
    
    stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });

    stompClient.onConnect = () => {
      isConnected.value = true;
      
      stompClient.subscribe('/user/queue/notifications', (message) => {
        const notification = JSON.parse(message.body);
        handleNotification(notification);
      });
    };

    stompClient.activate();
  };

  const handleNotification = (notification) => {
    if (notification.entityType === 'internal_document') {
      // Xử lý thông báo internal document
      console.log('Internal Document Notification:', notification);
      
      // Cập nhật UI
      updateUnreadCount();
    }
  };

  const updateUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      const data = await response.json();
      unreadCount.value = data.count;
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  onMounted(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connect(token);
    }
  });

  onUnmounted(() => {
    if (stompClient) {
      stompClient.deactivate();
    }
  });

  return {
    isConnected,
    unreadCount,
    connect
  };
}
```

## 🔄 4. Tích hợp với Document Actions

### Marking Document as Read

```javascript
const markDocumentAsRead = async (documentId) => {
  try {
    const response = await fetch(`/api/internal-documents/${documentId}/mark-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('Document marked as read');
      // Backend sẽ tự động gửi thông báo cho người gửi
    }
  } catch (error) {
    console.error('Error marking document as read:', error);
  }
};
```

### Sending New Document

```javascript
const sendDocument = async (documentData, files) => {
  const formData = new FormData();
  formData.append('document', JSON.stringify(documentData));
  
  files.forEach((file, index) => {
    formData.append('files', file);
    formData.append('descriptions', `File ${index + 1}`);
  });

  try {
    const response = await fetch('/api/internal-documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Document sent successfully:', result);
      // Backend sẽ tự động gửi thông báo cho người nhận
    }
  } catch (error) {
    console.error('Error sending document:', error);
  }
};
```

## 🎨 5. CSS Styling

```css
/* Connection Status */
.connection-status {
  position: fixed;
  top: 10px;
  right: 10px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  z-index: 1000;
}

.connection-status.connected {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Notification Badge */
.notification-badge {
  position: fixed;
  top: 50px;
  right: 10px;
  background-color: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  z-index: 1000;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1050;
}

.toast {
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  max-width: 350px;
  padding: 12px;
  animation: slideIn 0.3s ease-in-out;
}

.toast.info { border-left: 4px solid #17a2b8; }
.toast.success { border-left: 4px solid #28a745; }
.toast.error { border-left: 4px solid #dc3545; }

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## 🧪 6. Testing với HTML Demo

```html
<!DOCTYPE html>
<html>
<head>
    <title>Internal Document Notification Test</title>
    <script src="https://cdn.jsdelivr.net/npm/@stomp/stompjs@7.0.0/bundles/stomp.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js"></script>
</head>
<body>
    <h1>Test Internal Document Notifications</h1>
    
    <div>
        <label>JWT Token:</label>
        <input type="text" id="tokenInput" placeholder="Enter your JWT token" style="width: 400px;">
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
    </div>
    
    <div id="status">Disconnected</div>
    <div id="notifications"></div>

    <script>
        let stompClient = null;

        function connect() {
            const token = document.getElementById('tokenInput').value;
            
            if (!token) {
                alert('Please enter JWT token');
                return;
            }

            const socket = new SockJS('http://localhost:8080/ws');
            stompClient = StompJs.Stomp.over(socket);
            
            stompClient.connect({
                'Authorization': `Bearer ${token}`
            }, function (frame) {
                document.getElementById('status').innerHTML = 'Connected';
                console.log('Connected: ' + frame);
                
                stompClient.subscribe('/user/queue/notifications', function (message) {
                    const notification = JSON.parse(message.body);
                    showNotification(notification);
                });
            }, function (error) {
                document.getElementById('status').innerHTML = 'Error: ' + error;
                console.log('Error: ' + error);
            });
        }

        function disconnect() {
            if (stompClient !== null) {
                stompClient.disconnect();
                document.getElementById('status').innerHTML = 'Disconnected';
            }
        }

        function showNotification(notification) {
            const div = document.createElement('div');
            div.style.cssText = 'border: 1px solid #ccc; padding: 10px; margin: 10px 0; background: #f9f9f9;';
            div.innerHTML = `
                <strong>${notification.type}</strong><br>
                <em>Entity: ${notification.entityType}</em><br>
                ${notification.content}<br>
                <small>${new Date(notification.createdAt).toLocaleString()}</small>
            `;
            document.getElementById('notifications').appendChild(div);
        }
    </script>
</body>
</html>
```

## 📝 7. Troubleshooting

### Common Issues:

1. **403 Forbidden Error**: Đảm bảo JWT token hợp lệ và SecurityConfig đã được cấu hình đúng
2. **Connection Timeout**: Kiểm tra backend có đang chạy không
3. **No Notifications**: Xác minh đã subscribe đúng topic `/user/queue/notifications`
4. **CORS Issues**: Đảm bảo frontend origin được thêm vào CORS configuration

### Debug Commands:

```javascript
// Kiểm tra connection status
console.log('Connected:', notificationService.isConnected);

// Test gửi thông báo
notificationService.sendMessage('/app/test', { message: 'Hello' });

// Kiểm tra subscriptions
console.log('Subscriptions:', stompClient.subscriptions);
```

## 🎯 8. Best Practices

1. **Token Management**: Refresh token trước khi hết hạn
2. **Error Handling**: Implement retry logic với exponential backoff
3. **Performance**: Debounce notification updates
4. **UX**: Hiển thị connection status cho user
5. **Security**: Validate notifications trước khi hiển thị

## 🚀 Kết luận

Với hướng dẫn này, frontend có thể:
- ✅ Kết nối WebSocket với backend
- ✅ Nhận thông báo realtime cho văn bản nội bộ
- ✅ Xử lý các loại thông báo khác nhau
- ✅ Cập nhật UI một cách tự động
- ✅ Handle connection errors và reconnection

Backend đã sẵn sàng, chỉ cần frontend tích hợp theo hướng dẫn trên để có hệ thống thông báo realtime hoàn chỉnh!

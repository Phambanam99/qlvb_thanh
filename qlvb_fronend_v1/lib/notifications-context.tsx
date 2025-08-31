"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { notificationsRealtime, type RealTimeNotification } from "@/lib/api/notifications"
import { useAuth } from "@/lib/auth-context"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  createdAt: Date
  read: boolean
  link?: string
  documentId?: number
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotifications: () => void
  isConnected: boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  // Tải thông báo từ localStorage khi khởi động
  useEffect(() => {
    const storedNotifications = localStorage.getItem("notifications")
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications)
        // Chuyển đổi chuỗi ngày thành đối tượng Date
        const formattedNotifications = parsedNotifications.map((notification: any) => ({
          ...notification,
          createdAt: new Date(notification.createdAt),
        }))
        setNotifications(formattedNotifications)
      } catch (error) {
        console.error('Error loading notifications from localStorage:', error)
        localStorage.removeItem("notifications")
      }
    }
  }, [])

  // Lưu thông báo vào localStorage khi có thay đổi
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  // Kết nối WebSocket khi có user đăng nhập
  useEffect(() => {
    if (user) {
      console.log('🔗 Connecting to WebSocket for notifications...')
      
      // Lấy token từ localStorage (key được sử dụng trong auth-context)
      const token = localStorage.getItem('accessToken')
      
      if (token) {
        notificationsRealtime.connect(token)
        setIsConnected(true)

        // Handler để nhận realtime notifications
        const handleRealtimeNotification = (realtimeNotification: RealTimeNotification) => {
          console.log('📨 Context received realtime notification:', realtimeNotification)
          
          // Show toast notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(getNotificationTitle(realtimeNotification), {
              body: realtimeNotification.content,
              icon: '/favicon.ico'
            })
          }
          
          // Chuyển đổi realtime notification thành format của UI
          const notification: Notification = {
            id: realtimeNotification.id.toString(),
            title: getNotificationTitle(realtimeNotification),
            message: realtimeNotification.content,
            type: getNotificationType(realtimeNotification.type),
            createdAt: new Date(realtimeNotification.createdAt),
            read: realtimeNotification.read,
            link: getNotificationLink(realtimeNotification),
            documentId: realtimeNotification.entityId,
          }

          console.log('📝 Adding notification to context:', notification)

          // Thêm vào danh sách notifications
          setNotifications(prev => {
            // Kiểm tra không trùng lặp
            const exists = prev.find(n => n.id === notification.id)
            if (exists) {
              console.log('⚠️ Notification already exists:', notification.id)
              return prev
            }
            
            console.log('✅ Adding new notification to list')
            return [notification, ...prev]
          })
        }

        // Đăng ký handlers cho các loại thông báo
        notificationsRealtime.onMessage('INTERNAL_DOCUMENT_RECEIVED', handleRealtimeNotification)
        notificationsRealtime.onMessage('INTERNAL_DOCUMENT_READ', handleRealtimeNotification)
        notificationsRealtime.onMessage('INTERNAL_DOCUMENT_SENT', handleRealtimeNotification)
        notificationsRealtime.onMessage('INTERNAL_DOCUMENT_UPDATED', handleRealtimeNotification)
        notificationsRealtime.onMessage('EXTERNAL_DOCUMENT_RECEIVED', handleRealtimeNotification)
        notificationsRealtime.onMessage('EXTERNAL_DOCUMENT_UPDATED', handleRealtimeNotification)

        // Cleanup khi unmount
        return () => {
          console.log('🔌 Disconnecting WebSocket...')
          notificationsRealtime.disconnect()
          setIsConnected(false)
        }
      } else {
        console.warn('⚠️ No access token found for WebSocket connection')
        setIsConnected(false)
      }
    }
  }, [user])

  // Helper functions để chuyển đổi notification format
  const getNotificationTitle = (realtimeNotification: RealTimeNotification): string => {
    switch (realtimeNotification.type) {
      case 'INTERNAL_DOCUMENT_RECEIVED':
        return 'Văn bản nội bộ mới'
      case 'INTERNAL_DOCUMENT_READ':
        return 'Văn bản đã được đọc'
      case 'INTERNAL_DOCUMENT_SENT':
        return 'Văn bản đã được gửi'
      case 'INTERNAL_DOCUMENT_UPDATED':
        return 'Văn bản đã được cập nhật'
      case 'EXTERNAL_DOCUMENT_RECEIVED':
        return 'Văn bản đến mới'
      case 'EXTERNAL_DOCUMENT_UPDATED':
        return 'Văn bản đến đã được cập nhật'
      default:
        return 'Thông báo mới'
    }
  }

  const getNotificationType = (type: string): Notification["type"] => {
    switch (type) {
      case 'INTERNAL_DOCUMENT_RECEIVED':
      case 'EXTERNAL_DOCUMENT_RECEIVED':
        return 'info'
      case 'INTERNAL_DOCUMENT_SENT':
        return 'success'
      case 'INTERNAL_DOCUMENT_READ':
        return 'info'
      case 'INTERNAL_DOCUMENT_UPDATED':
      case 'EXTERNAL_DOCUMENT_UPDATED':
        return 'warning'
      default:
        return 'info'
    }
  }

  const getNotificationLink = (realtimeNotification: RealTimeNotification): string | undefined => {
    if (realtimeNotification.entityType === 'internal_document' && realtimeNotification.entityId) {
      return `/van-ban-den/noi-bo/${realtimeNotification.entityId}`
    }
    if (realtimeNotification.entityType === 'external_document' && realtimeNotification.entityId) {
      return `/van-ban-den/${realtimeNotification.entityId}`
    }
    return undefined
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        isConnected,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}

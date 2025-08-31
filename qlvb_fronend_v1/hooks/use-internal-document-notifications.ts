'use client'

import { useEffect, useCallback, useRef } from 'react'
import { notificationsRealtime, type InternalDocumentNotification, type InternalDocumentNotificationType } from '@/lib/api/notifications'
import { useToast } from '@/hooks/use-toast'
import { useNotifications } from '@/lib/notifications-context'

interface InternalDocumentNotificationCallbacks {
  onReceived?: (notification: InternalDocumentNotification) => void
  onRead?: (notification: InternalDocumentNotification) => void
  onSent?: (notification: InternalDocumentNotification) => void
  onUpdated?: (notification: InternalDocumentNotification) => void
}

export function useInternalDocumentNotifications(callbacks?: InternalDocumentNotificationCallbacks) {
  const { toast } = useToast()
  const { isConnected } = useNotifications()
  const callbacksRef = useRef(callbacks)
  
  // Update callbacks ref when callbacks change
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  const showNotificationToast = useCallback((notification: InternalDocumentNotification) => {
    const getToastConfig = (type: InternalDocumentNotificationType) => {
      switch (type) {
        case 'INTERNAL_DOCUMENT_RECEIVED':
          return {
            title: 'Văn bản mới',
            description: notification.content,
            variant: 'default' as const,
            duration: 5000, // 5 seconds
          }
        case 'INTERNAL_DOCUMENT_READ':
          return {
            title: 'Đã đọc',
            description: notification.content,
            variant: 'default' as const,
            duration: 3000, // 3 seconds  
          }
        case 'INTERNAL_DOCUMENT_SENT':
          return {
            title: 'Đã gửi',
            description: notification.content,
            variant: 'default' as const,
            duration: 3000, // 3 seconds
          }
        case 'INTERNAL_DOCUMENT_UPDATED':
          return {
            title: 'Đã cập nhật',
            description: notification.content,
            variant: 'default' as const,
            duration: 3000, // 3 seconds
          }
        default:
          return {
            title: 'Thông báo',
            description: notification.content,
            variant: 'default' as const,
            duration: 4000, // 4 seconds
          }
      }
    }

    const config = getToastConfig(notification.type)
    toast(config)
  }, [toast])

  const handleReceivedNotification = useCallback((notification: InternalDocumentNotification) => {
    console.log('RECEIVED notification in hook:', notification)
    showNotificationToast(notification)
    callbacksRef.current?.onReceived?.(notification)
  }, [showNotificationToast])

  const handleReadNotification = useCallback((notification: InternalDocumentNotification) => {
    console.log('READ notification in hook:', notification)
    showNotificationToast(notification)
    callbacksRef.current?.onRead?.(notification)
  }, [showNotificationToast])

  const handleSentNotification = useCallback((notification: InternalDocumentNotification) => {
    console.log('SENT notification in hook:', notification)
    showNotificationToast(notification)
    callbacksRef.current?.onSent?.(notification)
  }, [showNotificationToast])

  const handleUpdatedNotification = useCallback((notification: InternalDocumentNotification) => {
    console.log('UPDATED notification in hook:', notification)
    showNotificationToast(notification)
    callbacksRef.current?.onUpdated?.(notification)
  }, [showNotificationToast])

  useEffect(() => {
    if (!isConnected) {
      console.log('[Hook] WebSocket not connected, skipping subscription')
      return
    }

    console.log('[Hook] Setting up Internal Document notification subscriptions')
    
    // Subscribe to Internal Document notifications
    notificationsRealtime.subscribeToInternalDocumentUpdates({
      onReceived: handleReceivedNotification,
      onRead: handleReadNotification,
      onSent: handleSentNotification,
      onUpdated: handleUpdatedNotification,
    })

    console.log('[Hook] Internal Document subscriptions established')

    // Cleanup subscription on unmount
    return () => {
      console.log('[Hook] Cleaning up Internal Document notification subscriptions')
      notificationsRealtime.offInternalDocumentNotification('INTERNAL_DOCUMENT_RECEIVED', handleReceivedNotification)
      notificationsRealtime.offInternalDocumentNotification('INTERNAL_DOCUMENT_READ', handleReadNotification)
      notificationsRealtime.offInternalDocumentNotification('INTERNAL_DOCUMENT_SENT', handleSentNotification)
      notificationsRealtime.offInternalDocumentNotification('INTERNAL_DOCUMENT_UPDATED', handleUpdatedNotification)
    }
  }, [isConnected, handleReceivedNotification, handleReadNotification, handleSentNotification, handleUpdatedNotification])

  return {
    showNotificationToast,
    isConnected,
  }
}

export default useInternalDocumentNotifications

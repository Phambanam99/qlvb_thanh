'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { notificationsRealtime } from '@/lib/api/notifications'
import { useToast } from '@/hooks/use-toast'

interface NotificationContextType {
  isConnected: boolean
  connect: (token: string) => void
  disconnect: () => void
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotificationConnection() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationConnection phải được sử dụng trong NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
  token?: string // JWT token từ authentication
}

export function NotificationProvider({ children, token }: NotificationProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const { toast } = useToast()

  const connect = useCallback((authToken: string) => {
    setConnectionStatus('connecting')
    try {
      notificationsRealtime.connect(authToken)
      setConnectionStatus('connected')
      
      // Toast thông báo kết nối thành công (optional - có thể bỏ để tránh spam)
      // toast({
      //   title: "Đã kết nối",
      //   description: "Bạn sẽ nhận được thông báo realtime",
      //   variant: "default",
      //   duration: 3000,
      // })
    } catch (error) {
      console.error('Lỗi kết nối WebSocket:', error)
      setConnectionStatus('error')
      
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối để nhận thông báo realtime",
        variant: "destructive",
        duration: 5000,
      })
    }
  }, [toast])

  const disconnect = useCallback(() => {
    notificationsRealtime.disconnect()
    setConnectionStatus('disconnected')
  }, [])

  // Tự động kết nối khi có token
  useEffect(() => {
    if (token && connectionStatus === 'disconnected') {
      console.log('🔗 Auto-connecting to WebSocket with token...')
      connect(token)
    }
  }, [token, connectionStatus, connect])

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const value: NotificationContextType = {
    isConnected: connectionStatus === 'connected',
    connect,
    disconnect,
    connectionStatus,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationProvider

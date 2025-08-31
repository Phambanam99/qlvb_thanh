"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { notificationsAPI, type NotificationDTO } from "@/lib/api/notifications"
import { useInternalDocumentNotifications } from "@/hooks/use-internal-document-notifications"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Check, FileText, Info, AlertTriangle, AlertCircle, Trash2, RefreshCw, Wifi, WifiOff, Settings } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { NotificationDebugPanel } from "@/components/notification-debug-panel"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const { toast } = useToast()

  // Tích hợp realtime notifications
  const { isConnected } = useInternalDocumentNotifications({
    onReceived: (notification) => {
      console.log('📨 New notification received on thong-bao page:', notification)
      
      // Show toast
      toast({
        title: "📨 Thông báo mới",
        description: notification.content,
        duration: 5000,
      })
      
      // Thêm notification mới vào đầu danh sách
      setNotifications(prev => {
        const newNotification: NotificationDTO = {
          id: notification.id,
          userId: notification.user?.id || 0,
          title: 'công văn mới',
          message: notification.content,
          content: notification.content,
          type: notification.type,
          read: false,
          createdAt: notification.createdAt,
          entityId: notification.entityId,
          entityType: notification.entityType,
          user: notification.user,
        }
        
        // Kiểm tra trùng lặp
        const exists = prev.find(n => n.id === newNotification.id)
        if (exists) return prev
        
        // Thêm vào đầu và sắp xếp theo thời gian mới nhất
        return [newNotification, ...prev].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    },
    onRead: (notification) => {
      console.log('👁️ Document read notification:', notification)
      
      // Thêm notification đã đọc
      setNotifications(prev => {
        const newNotification: NotificationDTO = {
          id: notification.id,
          userId: notification.user?.id || 0,
          title: 'Đã đọc',
          message: notification.content,
          content: notification.content,
          type: notification.type,
          read: true,
          createdAt: notification.createdAt,
          entityId: notification.entityId,
          entityType: notification.entityType,
          user: notification.user,
        }
        
        // Kiểm tra trùng lặp
        const exists = prev.find(n => n.id === newNotification.id)
        if (exists) return prev
        
        // Thêm vào đầu và sắp xếp theo thời gian mới nhất
        return [newNotification, ...prev].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    },
    onSent: (notification) => {
      console.log('📤 Document sent notification:', notification)
      
      toast({
        title: "📤 Đã gửi công văn",
        description: notification.content,
        duration: 3000,
      })
    },
    onUpdated: (notification) => {
      console.log('📝 Document updated notification:', notification)
      
      toast({
        title: "📝 công văn đã cập nhật", 
        description: notification.content,
        duration: 3000,
      })
    }
  })

  // Load notifications từ API
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getAllNotifications(0, 50)
      console.log('Loaded notifications:', response)
      
      // Sắp xếp theo thời gian mới nhất trước
      const sortedNotifications = (response.content || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      setNotifications(sortedNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thông báo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Refresh notifications
  const refreshNotifications = async () => {
    try {
      setRefreshing(true)
      await loadNotifications()
      toast({
        title: "Đã cập nhật",
        description: "Danh sách thông báo đã được cập nhật",
        variant: "default",
      })
    } catch (error) {
      // Error handled in loadNotifications
    } finally {
      setRefreshing(false)
    }
  }

  // Mark notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking as read:', error)
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu thông báo đã đọc",
        variant: "destructive",
      })
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )
      toast({
        title: "Thành công",
        description: "Đã đánh dấu tất cả thông báo đã đọc",
        variant: "default",
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu tất cả thông báo đã đọc",
        variant: "destructive",
      })
    }
  }

  // Delete all notifications
  const handleClearNotifications = async () => {
    try {
      await notificationsAPI.deleteAllNotifications()
      setNotifications([])
      toast({
        title: "Thành công",
        description: "Đã xóa tất cả thông báo",
        variant: "default",
      })
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast({
        title: "Lỗi",
        description: "Không thể xóa thông báo",
        variant: "destructive",
      })
    }
  }

  // Load notifications on mount
  useEffect(() => {
    loadNotifications()
  }, [])

  const unreadNotifications = notifications.filter((notification) => !notification.read)
  const readNotifications = notifications.filter((notification) => notification.read)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "INTERNAL_DOCUMENT_RECEIVED":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "INTERNAL_DOCUMENT_READ":
        return <Check className="h-5 w-5 text-green-500" />
      case "INTERNAL_DOCUMENT_SENT":
        return <Info className="h-5 w-5 text-blue-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <Check className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Thông báo</h1>
            <p className="text-muted-foreground">Quản lý các thông báo của bạn</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Realtime
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshNotifications}
              disabled={refreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1", refreshing && "animate-spin")} />
              Làm mới
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugPanel(!showDebugPanel)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Debug
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="mb-6">
          <NotificationDebugPanel />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Đang tải thông báo...</span>
        </div>
      ) : (
        <Tabs defaultValue="unread">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="unread">
                Chưa đọc <span className="ml-1 text-xs">({unreadNotifications.length})</span>
              </TabsTrigger>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
            </TabsList>
            <div className="flex space-x-2">
              {unreadNotifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  Đánh dấu tất cả đã đọc
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" className="text-red-500" onClick={handleClearNotifications}>
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa tất cả
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="unread" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông báo chưa đọc</CardTitle>
                <CardDescription>Danh sách các thông báo bạn chưa đọc</CardDescription>
              </CardHeader>
              <CardContent>
                {unreadNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Check className="mb-2 h-12 w-12 text-green-500/50" />
                    <p className="text-muted-foreground">Bạn đã đọc tất cả thông báo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-accent/50",
                          !notification.read && "bg-primary/5",
                        )}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="mr-4 mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{notification.title || 'Thông báo'}</h3>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.content || notification.message}</p>
                          {notification.link && (
                            <div className="mt-2">
                              <Link
                                href={notification.link}
                                className="text-sm font-medium text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          )}
                          {notification.entityType === 'internal_document' && notification.entityId && (
                            <div className="mt-2">
                              <Link
                                href={`/van-ban-den/noi-bo/${notification.entityId}`}
                                className="text-sm font-medium text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Xem công văn
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tất cả thông báo</CardTitle>
                <CardDescription>Danh sách tất cả các thông báo của bạn</CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="mb-2 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex cursor-pointer items-start rounded-lg border p-4 transition-colors hover:bg-accent/50",
                          !notification.read && "bg-primary/5",
                        )}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="mr-4 mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{notification.title || 'Thông báo'}</h3>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{notification.content || notification.message}</p>
                          {notification.link && (
                            <div className="mt-2">
                              <Link
                                href={notification.link}
                                className="text-sm font-medium text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          )}
                          {notification.entityType === 'internal_document' && notification.entityId && (
                            <div className="mt-2">
                              <Link
                                href={`/van-ban-den/noi-bo/${notification.entityId}`}
                                className="text-sm font-medium text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Xem công văn
                              </Link>
                            </div>
                          )}
                        </div>
                        {!notification.read && <div className="ml-2 h-2 w-2 rounded-full bg-primary"></div>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

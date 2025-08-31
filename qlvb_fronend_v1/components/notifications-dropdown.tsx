"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Check, FileText, Info, AlertTriangle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useNotifications, type Notification } from "@/lib/notifications-context"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import Link from "next/link"

export default function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    setOpen(false)
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "success":
        return <Check className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-primary" />
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Thông báo</span>
            {isConnected && (
              <div className="h-2 w-2 rounded-full bg-green-500" title="Kết nối realtime" />
            )}
            {!isConnected && (
              <div className="h-2 w-2 rounded-full bg-red-500" title="Không kết nối realtime" />
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleMarkAllAsRead}>
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          <DropdownMenuGroup>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn("flex cursor-pointer flex-col items-start p-3", !notification.read && "bg-primary/5")}
                  onClick={() => handleNotificationClick(notification)}
                  asChild
                >
                  <Link href={notification.link || "#"}>
                    <div className="flex w-full items-start gap-2">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {format(notification.createdAt, "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>
                      {!notification.read && <div className="ml-2 h-2 w-2 rounded-full bg-primary"></div>}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/thong-bao" className="flex w-full justify-center text-center text-sm font-medium text-primary">
            Xem tất cả thông báo
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

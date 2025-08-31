"use client"

import React from "react"
import { useNotifications } from "../../lib/notifications-context"

import { createContext, useContext, useState } from "react"

interface Toast {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  variant?: "default" | "destructive" | "success"
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ ...props }: Omit<Toast, "id">) => {
    const id = String(Math.random())
    setToasts((prev) => [...prev, { id, ...props }])

    setTimeout(() => dismiss(id), props.duration || 3000)
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return <ToastContext.Provider value={{ toasts, toast, dismiss }}>{children}</ToastContext.Provider>
}


// Use this helper function to call the global function
export const addNotification = ({
  title,
  message,
  type = "info",
  link,
}: {
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  link?: string
}) => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if (window.addNotification) {
      // @ts-ignore
      window.addNotification({
        title,
        message,
        type,
        link,
      })
    }
  }
}
// Create a React component to use notifications
export function NotificationHandler() {
  const { addNotification: contextAddNotification } = useNotifications()
  
  // Expose the function globally if needed
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.addNotification = (notification) => contextAddNotification(notification)
  }
  
  return null
}
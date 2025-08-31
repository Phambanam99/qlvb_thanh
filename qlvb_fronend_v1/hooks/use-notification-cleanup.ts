'use client'

import { useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export function useNotificationCleanup() {
  const { dismiss } = useToast()

  // Auto cleanup toasts khi user không active
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Cleanup toasts khi user switch tab/minimize window
      setTimeout(() => {
        dismiss() // Clear all toasts
      }, 30000) // After 30 seconds of inactivity
    }
  }, [dismiss])

  // Clear notifications khi page unload
  const handleBeforeUnload = useCallback(() => {
    dismiss() // Clear all toasts before page unload
  }, [dismiss])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleVisibilityChange, handleBeforeUnload])

  // Manual cleanup function
  const clearAllNotifications = useCallback(() => {
    dismiss()
  }, [dismiss])

  return {
    clearAllNotifications,
  }
}

export default useNotificationCleanup

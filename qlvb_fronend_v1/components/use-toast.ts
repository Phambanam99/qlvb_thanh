"use client"

import { useToast } from "@/components/ui/toast"

export const addNotification = ({
  title,
  description,
  variant,
  duration,
}: {
  title: string
  description?: string
  variant?: "default" | "destructive" | undefined
  duration?: number
}) => {
  useToast().toast({
    title,
    description,
    variant,
    duration,
  })
}

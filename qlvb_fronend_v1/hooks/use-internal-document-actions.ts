'use client'

import { useState, useCallback } from 'react'
import { internalDocumentsAPI, type InternalDocumentSendResponse, type MarkAsReadResponse } from '@/lib/api/internal-documents'
import { useToast } from '@/hooks/use-toast'

export function useInternalDocumentActions() {
  const [sendingDocument, setSendingDocument] = useState<number | null>(null)
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null)
  const { toast } = useToast()

  const sendDocument = useCallback(async (documentId: number, recipientUserIds: number[]): Promise<InternalDocumentSendResponse | null> => {
    if (sendingDocument) return null

    setSendingDocument(documentId)
    try {
      const result = await internalDocumentsAPI.sendDocument(documentId, recipientUserIds)
      
      toast({
        title: 'Gửi văn bản thành công',
        description: `Đã gửi văn bản đến ${result.sentTo} người nhận`,
        variant: 'default',
      })

      return result
    } catch (error) {
      console.error('Error sending document:', error)
      toast({
        title: 'Lỗi gửi văn bản',
        description: 'Không thể gửi văn bản. Vui lòng thử lại.',
        variant: 'destructive',
      })
      return null
    } finally {
      setSendingDocument(null)
    }
  }, [sendingDocument, toast])

  const markAsRead = useCallback(async (documentId: number): Promise<MarkAsReadResponse | null> => {
    if (markingAsRead) return null

    setMarkingAsRead(documentId)
    try {
      const result = await internalDocumentsAPI.markAsRead(documentId)
      
      // Usually no toast needed for mark as read as it's automatic
      // toast({
      //   title: 'Đã đánh dấu đã đọc',
      //   description: 'Văn bản đã được đánh dấu là đã đọc',
      //   variant: 'default',
      // })

      return result
    } catch (error) {
      console.error('Error marking as read:', error)
      toast({
        title: 'Lỗi đánh dấu đã đọc',
        description: 'Không thể đánh dấu văn bản đã đọc.',
        variant: 'destructive',
      })
      return null
    } finally {
      setMarkingAsRead(null)
    }
  }, [markingAsRead, toast])

  return {
    sendDocument,
    markAsRead,
    sendingDocument,
    markingAsRead,
    isSending: (documentId: number) => sendingDocument === documentId,
    isMarkingAsRead: (documentId: number) => markingAsRead === documentId,
  }
}

export default useInternalDocumentActions

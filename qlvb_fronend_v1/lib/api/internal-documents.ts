import api from "./config"

// ===== Internal Document Management API =====

export interface InternalDocumentSendRequest {
  recipientUserIds: number[]
}

export interface InternalDocumentSendResponse {
  success: boolean
  message: string
  sentTo: number
}

export interface MarkAsReadResponse {
  success: boolean
  message: string
  readAt: string
}

export const internalDocumentsAPI = {
  /**
   * Send internal document to recipients
   * This will trigger INTERNAL_DOCUMENT_RECEIVED notifications for recipients
   * @param documentId Internal document ID
   * @param recipientUserIds Array of user IDs to send the document to
   * @returns Send result
   */
  sendDocument: async (documentId: number, recipientUserIds: number[]): Promise<InternalDocumentSendResponse> => {
    const response = await api.post(`/internal-documents/${documentId}/send`, recipientUserIds)
    return response.data
  },

  /**
   * Mark internal document as read
   * This will trigger INTERNAL_DOCUMENT_READ notification for the sender
   * @param documentId Internal document ID
   * @returns Mark as read result
   */
  markAsRead: async (documentId: number): Promise<MarkAsReadResponse> => {
    const response = await api.post(`/internal-documents/${documentId}/mark-read`)
    return response.data
  },

  /**
   * Get document details by ID
   * @param documentId Internal document ID
   * @returns Document details
   */
  getDocumentById: async (documentId: number) => {
    const response = await api.get(`/internal-documents/${documentId}`)
    return response.data
  },

  /**
   * Get received documents for current user
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of received documents
   */
  getReceivedDocuments: async (page = 0, size = 10) => {
    const response = await api.get('/internal-documents/received', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Get sent documents for current user
   * @param page Page number
   * @param size Page size  
   * @returns Paginated list of sent documents
   */
  getSentDocuments: async (page = 0, size = 10) => {
    const response = await api.get('/internal-documents/sent', {
      params: { page, size }
    })
    return response.data
  },

  /**
   * Get read status for a document (for senders to see who has read)
   * @param documentId Internal document ID
   * @returns List of users who have read the document
   */
  getReadStatus: async (documentId: number) => {
    const response = await api.get(`/internal-documents/${documentId}/read-status`)
    return response.data
  },
}

export default internalDocumentsAPI

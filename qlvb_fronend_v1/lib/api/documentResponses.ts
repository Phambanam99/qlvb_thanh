import api from "./config"
import type { PageResponse } from "./types"

export interface DocumentResponseDTO {
  id: number
  documentId: number
  documentTitle: string
  responderId: number
  responderName: string
  content: string
  status: string
  createdAt: string
  updatedAt: string
  attachments?: {
    id: number
    name: string
    size: number
    type: string
    url?: string
  }[]
  reviewerId?: number
  reviewerName?: string
  reviewedAt?: string
  reviewComments?: string
  approverId?: number
  approverName?: string
  approvedAt?: string
  approveComments?: string
}

export const documentResponsesAPI = {
  /**
   * Get all document responses
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of document responses
   */
  getAllResponses: async (page = 0, size = 10): Promise<PageResponse<DocumentResponseDTO>> => {
    const response = await api.get("/document-responses", {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Get document responses by document ID
   * @param documentId Document ID
   * @returns List of responses for the document
   */
  getResponsesByDocumentId: async (documentId: string | number): Promise<DocumentResponseDTO[]> => {
    const response = await api.get(`/documents/${documentId}/responses`)
    return response.data
  },

  /**
   * Get document response by ID
   * @param id Response ID
   * @returns Response data
   */
  getResponseById: async (id: string | number): Promise<DocumentResponseDTO> => {
    const response = await api.get(`/document-responses/${id}`)
    return response.data
  },

  /**
   * Create new document response
   * @param responseData Response data
   * @returns Created response data
   */
  createResponse: async (responseData: Partial<DocumentResponseDTO>) => {
    const response = await api.post("/document-responses", responseData)
    return response.data
  },

  /**
   * Update document response
   * @param id Response ID
   * @param responseData Response data to update
   * @returns Updated response data
   */
  updateResponse: async (id: string | number, responseData: Partial<DocumentResponseDTO>) => {
    const response = await api.put(`/document-responses/${id}`, responseData)
    return response.data
  },

  /**
   * Delete document response
   * @param id Response ID
   * @returns Success message
   */
  deleteResponse: async (id: string | number) => {
    const response = await api.delete(`/document-responses/${id}`)
    return response.data
  },

  /**
   * Submit response for review
   * @param id Response ID
   * @returns Updated response data
   */
  submitForReview: async (id: string | number) => {
    const response = await api.put(`/document-responses/${id}/submit`)
    return response.data
  },

  /**
   * Review document response
   * @param id Response ID
   * @param reviewData Review data
   * @returns Updated response data
   */
  reviewResponse: async (id: string | number, reviewData: { approved: boolean; comments?: string }) => {
    const response = await api.put(`/document-responses/${id}/review`, reviewData)
    return response.data
  },

  /**
   * Approve document response
   * @param id Response ID
   * @param approveData Approval data
   * @returns Updated response data
   */
  approveResponse: async (id: string | number, approveData: { approved: boolean; comments?: string }) => {
    const response = await api.put(`/document-responses/${id}/approve`, approveData)
    return response.data
  },

  /**
   * Upload attachment to response
   * @param id Response ID
   * @param file File to upload
   * @returns Updated response data
   */
  uploadAttachment: async (id: string | number, file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await api.post(`/document-responses/${id}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    return response.data
  },

  /**
   * Delete attachment from response
   * @param responseId Response ID
   * @param attachmentId Attachment ID
   * @returns Success message
   */
  deleteAttachment: async (responseId: string | number, attachmentId: string | number) => {
    const response = await api.delete(`/document-responses/${responseId}/attachments/${attachmentId}`)
    return response.data
  },
}

import api from "./config";

export type DocumentType =
  | "INCOMING_EXTERNAL"
  | "INCOMING_INTERNAL"
  | "OUTGOING_INTERNAL"
  | "OUTGOING_EXTERNAL";

export interface ReadStatusResponse {
  message: string;
  data: {
    isRead: boolean;
  };
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface BatchReadStatusResponse {
  [documentId: string]: boolean;
}

export interface DocumentReaderDTO {
  userId: number;
  userName: string;
  username: string;
  email: string;
  position: string;
  departmentId: number | null;
  departmentName: string | null;
  roles: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  phoneNumber: string | null;
  isActive: boolean;
}

export interface DocumentReadStatistics {
  totalUsers: number;
  readUsers: number;
  unreadUsers: number;
  readPercentage: number;
}

/**
 * API functions for managing document read status across all document types
 */
export const documentReadStatusAPI = {
  /**
   * Mark a document as read
   */
  markAsRead: async (
    documentId: number,
    documentType: DocumentType
  ): Promise<{ message: string }> => {
    const response = await api.post(
      `/documents/read-status/${documentId}/mark-read`,
      null,
      { params: { documentType } }
    );
    // Backend returns ResponseDTO<String>, extract the message
    return response.data.data ? { message: response.data.data } : response.data;
  },

  /**
   * Mark a document as unread
   */
  markAsUnread: async (
    documentId: number,
    documentType: DocumentType
  ): Promise<{ message: string }> => {
    const response = await api.post(
      `/documents/read-status/${documentId}/mark-unread`,
      null,
      { params: { documentType } }
    );
    // Backend returns ResponseDTO<String>, extract the message
    return response.data.data ? { message: response.data.data } : response.data;
  },

  /**
   * Check if a document is read
   */
  isDocumentRead: async (
    documentId: number,
    documentType: DocumentType
  ): Promise<ReadStatusResponse> => {
    const response = await api.get(
      `/documents/read-status/${documentId}/is-read`,
      { params: { documentType } }
    );
    return response.data;
  },

  /**
   * Get read status for multiple documents
   */
  getBatchReadStatus: async (
    documentIds: number[],
    documentType: DocumentType
  ): Promise<BatchReadStatusResponse> => {
    console.log("🔍 getBatchReadStatus called with:", { documentIds, documentType });
    
    try {
      // Try GET method with query params first (might be what backend expects)
      const response = await api.get(
        `/documents/read-status/batch-status`,
        { 
          params: { 
            documentType,
            documentIds: documentIds.join(',') // Send as comma-separated string
          }
        }
      );
      console.log("✅ getBatchReadStatus response:", response.data);
      
      // Backend returns ResponseDTO<Map<Long, Boolean>>, so we need response.data.data
      const result = response.data.data || response.data;
      return result;
    } catch (error: any) {
      console.error("❌ getBatchReadStatus GET error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        params: error.config?.params
      });
      
      // Fallback to POST method if GET fails
      try {
        console.log("🔄 Trying POST method as fallback...");
        const response = await api.post(
          `/documents/read-status/batch-status`,
          { documentIds }, // Wrap in object
          { params: { documentType } }
        );
        console.log("✅ getBatchReadStatus POST response:", response.data);
        
        const result = response.data.data || response.data;
        return result;
      } catch (postError: any) {
        console.error("❌ getBatchReadStatus POST error:", {
          status: postError.response?.status,
          statusText: postError.response?.statusText,
          data: postError.response?.data,
          url: postError.config?.url,
          params: postError.config?.params,
          requestData: postError.config?.data
        });
        throw postError;
      }
    }
  },

  /**
   * Count unread documents
   */
  countUnreadDocuments: async (
    documentType: DocumentType
  ): Promise<UnreadCountResponse> => {
    const response = await api.get(`/documents/read-status/unread/count`, {
      params: { documentType },
    });
    return response.data;
  },

  /**
   * Get unread document IDs
   */
  getUnreadDocumentIds: async (
    documentType: DocumentType
  ): Promise<number[]> => {
    const response = await api.get(`/documents/read-status/unread/ids`, {
      params: { documentType },
    });
    return response.data;
  },

  /**
   * Get list of all users who should read the document with their read status
   */
  getDocumentReaders: async (
    documentId: number,
    documentType: DocumentType
  ): Promise<DocumentReaderDTO[]> => {
    const response = await api.get(
      `/documents/read-status/${documentId}/readers`,
      { params: { documentType } }
    );
    return response.data;
  },

  /**
   * Get list of users who have actually read the document
   */
  getDocumentReadersOnly: async (
    documentId: number,
    documentType: DocumentType
  ): Promise<DocumentReaderDTO[]> => {
    const response = await api.get(
      `/documents/read-status/${documentId}/readers/read-only`,
      { params: { documentType } }
    );
    return response.data;
  },

  /**
   * Get read statistics for a document
   */
  getDocumentReadStatistics: async (
    documentId: number,
    documentType: DocumentType
  ): Promise<DocumentReadStatistics> => {
    const response = await api.get(
      `/documents/read-status/${documentId}/statistics`,
      { params: { documentType } }
    );
    return response.data;
  },
};

/**
 * Helper functions for specific document types
 */
export const incomingExternalReadStatus = {
  markAsRead: (documentId: number) =>
    documentReadStatusAPI.markAsRead(documentId, "INCOMING_EXTERNAL"),
  markAsUnread: (documentId: number) =>
    documentReadStatusAPI.markAsUnread(documentId, "INCOMING_EXTERNAL"),
  isRead: (documentId: number) =>
    documentReadStatusAPI.isDocumentRead(documentId, "INCOMING_EXTERNAL"),
  getBatchStatus: (documentIds: number[]) =>
    documentReadStatusAPI.getBatchReadStatus(documentIds, "INCOMING_EXTERNAL"),
  countUnread: () =>
    documentReadStatusAPI.countUnreadDocuments("INCOMING_EXTERNAL"),
  getUnreadIds: () =>
    documentReadStatusAPI.getUnreadDocumentIds("INCOMING_EXTERNAL"),
  getReaders: (documentId: number) =>
    documentReadStatusAPI.getDocumentReaders(documentId, "INCOMING_EXTERNAL"),
  getReadersOnly: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadersOnly(
      documentId,
      "INCOMING_EXTERNAL"
    ),
  getStatistics: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadStatistics(
      documentId,
      "INCOMING_EXTERNAL"
    ),
};

export const incomingInternalReadStatus = {
  markAsRead: (documentId: number) =>
    documentReadStatusAPI.markAsRead(documentId, "INCOMING_INTERNAL"),
  markAsUnread: (documentId: number) =>
    documentReadStatusAPI.markAsUnread(documentId, "INCOMING_INTERNAL"),
  isRead: (documentId: number) =>
    documentReadStatusAPI.isDocumentRead(documentId, "INCOMING_INTERNAL"),
  getBatchStatus: (documentIds: number[]) =>
    documentReadStatusAPI.getBatchReadStatus(documentIds, "INCOMING_INTERNAL"),
  countUnread: () =>
    documentReadStatusAPI.countUnreadDocuments("INCOMING_INTERNAL"),
  getUnreadIds: () =>
    documentReadStatusAPI.getUnreadDocumentIds("INCOMING_INTERNAL"),
  getReaders: (documentId: number) =>
    documentReadStatusAPI.getDocumentReaders(documentId, "INCOMING_INTERNAL"),
  getReadersOnly: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadersOnly(
      documentId,
      "INCOMING_INTERNAL"
    ),
  getStatistics: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadStatistics(
      documentId,
      "INCOMING_INTERNAL"
    ),
};

export const outgoingInternalReadStatus = {
  markAsRead: (documentId: number) =>
    documentReadStatusAPI.markAsRead(documentId, "OUTGOING_INTERNAL"),
  markAsUnread: (documentId: number) =>
    documentReadStatusAPI.markAsUnread(documentId, "OUTGOING_INTERNAL"),
  isRead: (documentId: number) =>
    documentReadStatusAPI.isDocumentRead(documentId, "OUTGOING_INTERNAL"),
  getBatchStatus: (documentIds: number[]) =>
    documentReadStatusAPI.getBatchReadStatus(documentIds, "OUTGOING_INTERNAL"),
  countUnread: () =>
    documentReadStatusAPI.countUnreadDocuments("OUTGOING_INTERNAL"),
  getUnreadIds: () =>
    documentReadStatusAPI.getUnreadDocumentIds("OUTGOING_INTERNAL"),
  getReaders: (documentId: number) =>
    documentReadStatusAPI.getDocumentReaders(documentId, "OUTGOING_INTERNAL"),
  getReadersOnly: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadersOnly(
      documentId,
      "OUTGOING_INTERNAL"
    ),
  getStatistics: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadStatistics(
      documentId,
      "OUTGOING_INTERNAL"
    ),
};

export const outgoingExternalReadStatus = {
  markAsRead: (documentId: number) =>
    documentReadStatusAPI.markAsRead(documentId, "OUTGOING_EXTERNAL"),
  markAsUnread: (documentId: number) =>
    documentReadStatusAPI.markAsUnread(documentId, "OUTGOING_EXTERNAL"),
  isRead: (documentId: number) =>
    documentReadStatusAPI.isDocumentRead(documentId, "OUTGOING_EXTERNAL"),
  getBatchStatus: (documentIds: number[]) =>
    documentReadStatusAPI.getBatchReadStatus(documentIds, "OUTGOING_EXTERNAL"),
  countUnread: () =>
    documentReadStatusAPI.countUnreadDocuments("OUTGOING_EXTERNAL"),
  getUnreadIds: () =>
    documentReadStatusAPI.getUnreadDocumentIds("OUTGOING_EXTERNAL"),
  getReaders: (documentId: number) =>
    documentReadStatusAPI.getDocumentReaders(documentId, "OUTGOING_EXTERNAL"),
  getReadersOnly: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadersOnly(
      documentId,
      "OUTGOING_EXTERNAL"
    ),
  getStatistics: (documentId: number) =>
    documentReadStatusAPI.getDocumentReadStatistics(
      documentId,
      "OUTGOING_EXTERNAL"
    ),
};

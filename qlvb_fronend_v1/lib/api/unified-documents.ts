import api from "./config";
import type {
  PageResponse,
  DocumentAttachmentDTO,
  DocumentCommentDTO,
} from "./types";

export interface UnifiedDocumentDTO {
  id: number;
  title: string;
  documentNumber: string;
  documentType: string;
  status: string;
  createdDate: string;
  lastModifiedDate: string;
  createdBy: string;
  assignedTo?: string;
  department?: string;
  priority?: string;
  deadline?: string;
  attachments?: any[];
}

export const unifiedDocumentsAPI = {
  /**
   * Get unified document by ID
   * @param documentId Document ID
   * @returns Document data
   */
  getUnifiedDocumentById: async (documentId: string | number) => {
    const response = await api.get(`/documents/unified/${documentId}`);
    return response.data;
  },

  /**
   * Get unified documents with pagination
   * @param page Page number
   * @param size Page size
   * @param filters Optional filters
   * @returns Paginated list of documents
   */
  getUnifiedDocuments: async (page = 0, size = 10, filters: any = {}) => {
    const response = await api.get("/documents/unified", {
      params: { page, size, ...filters },
    });
    return response.data;
  },

  /**
   * Search unified documents
   * @param query Search query
   * @param page Page number
   * @param size Page size
   * @returns Search results
   */
  searchUnifiedDocuments: async (query: string, page = 0, size = 10) => {
    const response = await api.get("/documents/unified/search", {
      params: { q: query, page, size },
    });
    return response.data;
  },

  /**
   * Get documents by status
   * @param status Document status
   * @param page Page number
   * @param size Page size
   * @returns Documents with specified status
   */
  getDocumentsByStatus: async (status: string, page = 0, size = 10) => {
    const response = await api.get(`/documents/unified/status/${status}`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Get documents by type
   * @param type Document type
   * @param page Page number
   * @param size Page size
   * @returns Documents with specified type
   */
  getDocumentsByType: async (type: string, page = 0, size = 10) => {
    const response = await api.get(`/documents/unified/type/${type}`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Get documents by department
   * @param departmentId Department ID
   * @param page Page number
   * @param size Page size
   * @returns Documents from specified department
   */
  getDocumentsByDepartment: async (
    departmentId: string | number,
    page = 0,
    size = 10
  ) => {
    const response = await api.get(
      `/documents/unified/department/${departmentId}`,
      {
        params: { page, size },
      }
    );
    return response.data;
  },

  /**
   * Get documents assigned to user
   * @param userId User ID
   * @param page Page number
   * @param size Page size
   * @returns Documents assigned to specified user
   */
  getDocumentsAssignedToUser: async (
    userId: string | number,
    page = 0,
    size = 10
  ) => {
    const response = await api.get(`/documents/unified/assigned/${userId}`, {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Download document attachment
   * @param documentId Document ID
   * @returns File blob
   */
  downloadDocumentAttachment: async (documentId: string | number) => {
    const response = await api.get(
      `/documents/unified/${documentId}/attachments`,
      {
        responseType: "blob",
      }
    );
    return response;
  },

  /**
   * Upload document attachment
   * @param documentId Document ID
   * @param file File to upload
   * @returns Upload result
   */
  uploadDocumentAttachment: async (documentId: string | number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/documents/unified/${documentId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Upload multiple document attachments
   * @param documentId Document ID
   * @param files Files to upload
   * @returns Upload result
   */
  uploadMultipleAttachments: async (
    documentId: string | number,
    files: File[]
  ) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(
      `/documents/unified/${documentId}/multiple-attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get document workflow status
   * @param documentId Document ID
   * @returns Document workflow status
   */
  getDocumentWorkflowStatus: async (documentId: string | number) => {
    const response = await api.get(
      `/documents/unified/${documentId}/workflow/status`
    );
    return response.data;
  },

  /**
   * Change document workflow status
   * @param documentId Document ID
   * @param statusData Status change details
   * @returns Updated status data
   */
  changeDocumentWorkflowStatus: async (
    documentId: string | number,
    statusData: any
  ) => {
    const response = await api.post(
      `/documents/unified/${documentId}/workflow/status`,
      statusData
    );
    return response.data;
  },

  /**
   * Assign document to user
   * @param documentId Document ID
   * @param assignmentData Assignment details
   * @returns Updated assignment data
   */
  assignDocumentToUser: async (
    documentId: string | number,
    assignmentData: any
  ) => {
    const response = await api.post(
      `/documents/unified/${documentId}/workflow/assign`,
      assignmentData
    );
    return response.data;
  },

  /**
   * Get document workflow history
   * @param documentId Document ID
   * @returns Document workflow history
   */
  getDocumentWorkflowHistory: async (documentId: string | number) => {
    const response = await api.get(
      `/documents/unified/${documentId}/workflow/history`
    );
    return response.data;
  },
};

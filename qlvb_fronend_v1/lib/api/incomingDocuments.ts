import api from "./config";
import type { DocumentAttachmentDTO } from "./types";
import { UserDTO } from "./users";

// src/constants/document-status.ts

export const DocumentProcessingStatus = {
  // Initial statuses
  DRAFT: { code: "draft", displayName: "Dự thảo" },
  REGISTERED: { code: "registered", displayName: "Đã đăng ký" },

  // 2. Văn thư phân phối statuses
  DISTRIBUTED: { code: "distributed", displayName: "Đã phân phối" },

  // 3. Trưởng phòng statuses
  DEPT_ASSIGNED: { code: "dept_assigned", displayName: "Phòng đã phân công" },
  PENDING_APPROVAL: { code: "pending_approval", displayName: "Chờ phê duyệt" },

  // 4. TL/NV statuses
  SPECIALIST_PROCESSING: {
    code: "specialist_processing",
    displayName: "TL/NV đang xử lý",
  },
  SPECIALIST_SUBMITTED: {
    code: "specialist_submitted",
    displayName: "TL/NV đã trình",
  },

  // 5. Thử trưởng statuses
  LEADER_REVIEWING: {
    code: "leader_reviewing",
    displayName: "Thủ trưởng đang xem xét",
  },
  LEADER_APPROVED: {
    code: "leader_approved",
    displayName: "Thủ trưởng đã phê duyệt",
  },
  LEADER_COMMENTED: {
    code: "leader_commented",
    displayName: "Thủ trưởng đã cho ý kiến",
  },

  // Final statuses
  PUBLISHED: { code: "published", displayName: "Đã ban hành" },
  COMPLETED: { code: "completed", displayName: "Hoàn thành" },
  REJECTED: { code: "rejected", displayName: "Từ chối" },
  ARCHIVED: { code: "archived", displayName: "Lưu trữ" },
  HEADER_DEPARTMENT_REVIEWING: {
    code: "department_reviewing",
    displayName: "Chỉ  huy đang xem xét",
  },
  HEADER_DEPARTMENT_APPROVED: {
    code: "department_approved",
    displayName: "Chỉ huy đã phê duyệt",
  },

  HEADER_DEPARTMENT_COMMENTED: {
    code: "department_commented",
    displayName: "Chỉ huy đã cho ý kiến",
  },
} as const;

// ------------------
// 🔥 Type Definitions
// ------------------
export type StatusCode =
  (typeof DocumentProcessingStatus)[keyof typeof DocumentProcessingStatus]["code"];
export type StatusDisplayName =
  (typeof DocumentProcessingStatus)[keyof typeof DocumentProcessingStatus]["displayName"];

export interface Status {
  code: StatusCode;
  displayName: StatusDisplayName;
}

// ------------------
// 🔥 Helper functions
// ------------------

export const getStatusByCode = (code: string): Status | undefined => {
  return Object.values(DocumentProcessingStatus).find(
    (status) => status.code === code
  );
};

export const getStatusByDisplayName = (
  displayName: string
): Status | undefined => {
  return Object.values(DocumentProcessingStatus).find(
    (status) => status.displayName === displayName
  );
};

export const getAllStatuses = (): Status[] =>
  Object.values(DocumentProcessingStatus);

// Document Classification API Response
export interface DocumentClassificationResponse {
  statusDescription: string;
  documentId: number;
  userName: string;
  userId: number;
  status: string;
}

export interface IncomingDocumentDTO {
  id?: number;
  title: string;
  documentType: string;
  documentNumber: string;
  referenceNumber?: string;
  issuingAuthority: string;
  urgencyLevel: string;
  securityLevel: string;
  summary: string;
  notes?: string;
  displayStatus?: string;
  signingDate: string;
  receivedDate: Date;
  closureDeadline?: Date;
  processingStatus: string;
  closureRequest: boolean;
  sendingDepartmentName: string;
  emailSource?: string;
  primaryProcessorId?: number;
  created?: string;
  changed?: string;
  trackingStatus?: string;
  trackingStatusDisplayName?: string;
  attachmentFilename?: string; // Legacy single file
  storageLocation?: string;
  primaryProcessDepartmentId?: number;
  userPrimaryProcessor?: UserDTO,
  attachments?: DocumentAttachmentDTO[]; // New multiple files
}

export const incomingDocumentsAPI = {
  /**
   * Get all incoming documents
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of incoming documents
   */
  getAllDocuments: async (
    page = 0,
    size = 10
  ): Promise<{ content: IncomingDocumentDTO[]; page: any }> => {
    try {
      const response = await api.get("/documents/incoming", {
        params: { page, size },
      });
      if (response.data.success === false) {
        throw new Error(response.data.message);
      }
      // Map backend response to frontend expected format
      const documents = response.data.data.content.map( 
        (doc: IncomingDocumentDTO) => ({
          ...doc,
          // Add empty arrays for frontend compatibility
          attachments: [],
          relatedDocuments: [],
          responses: [],
        })
      );
        return {
        content: documents,
        page: {
          totalPages: response.data.data.totalPages,
          totalElements: response.data.data.totalElements,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get incoming document by ID
   * @param id Document ID
   * @returns Document data
   */
  getIncomingDocumentById: async (
    id: string | number
  ): Promise<{ data: IncomingDocumentDTO }> => {
    try {
      const response = await api.get(`/documents/incoming/${id}`);
      // console.log("response cc", response.data);
      // Map backend response to frontend expected format
      const document = {
        ...response.data,
        number: response.data.documentNumber,
        sender: response.data.sendingDepartmentName,
        content: response.data.summary,
        status: response.data.processingStatus,
        // Add empty arrays for frontend compatibility
        attachments: [],
        relatedDocuments: [],
        responses: [],
      };

      return { data: document };
    } catch (error) {
      console.error("Error fetching incoming document:", error);
      throw error;
    }
  },

  /**
   * Create new incoming document
   * @param documentData Document data
   * @returns Created document data
   */
  createIncomingDocument: async (
    documentData: any
  ): Promise<{ data: IncomingDocumentDTO }> => {
    const response = await api.post("/documents/incoming", documentData);
    const document = {
      ...response.data,
      number: response.data.documentNumber,
      sender: response.data.sendingDepartmentName,
      content: response.data.summary,
      status: response.data.processingStatus,
      // Add empty arrays for frontend compatibility
      attachments: response.data.attachments || [],
      relatedDocuments: response.data.relatedDocuments || [],
      responses: [],
    };

    return { data: document };
  },
  getDepartmentDocuments: async (
    departmentId: string | number,
    page = 0,
    size = 10
  ) => {
    const response = await api.get(
      `/documents/incoming/department/${departmentId}`,
      {
        params: { page, size },
      }
    );
    // console.log("response", response.data.content);

    return response.data;
  },
  /**
   * Update incoming document
   * @param id Document ID
   * @param documentData Document data to update
   * @returns Updated document data
   */
  updateIncomingDocument: async (id: string | number, documentData: any) => {
    const response = await api.put(`/documents/incoming/${id}`, documentData);
    return response.data;
  },
  getDepartmentsByDocumentId: async (id: string | number) => {
    const response = await api.get(`/documents/incoming/${id}/departments`);
    return response.data;
  },
  /**
   * Delete incoming document
   * @param id Document ID
   * @returns Success message
   */
  deleteIncomingDocument: async (id: string | number) => {
    const response = await api.delete(`/documents/incoming/${id}`);
    return response.data;
  },
  /**
   * Get all Departments with document ID
   * @param id Document ID
   * @returns List of departments
   */
  getAllDepartments: async (id: string | number) => {
    const response = await api.get(`/documents/incoming/${id}/departments`);
    return response.data;
  },
  /**
   * Upload document attachment
   * @param id Document ID
   * @param file File to upload
   * @returns Updated document data
   */
  uploadAttachment: async (id: string | number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/documents/incoming/${id}/attachment`,
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
   * @param id Document ID
   * @param files Files to upload
   * @returns Success message
   */
  uploadMultipleAttachments: async (id: string | number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post(
      `/documents/incoming/${id}/attachments`,
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
   * Search incoming documents
   * @param keyword Keyword to search for
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of matching documents
   */
  searchDocuments: async (keyword: string, page = 0, size = 10) => {
    const response = await api.get("/documents/incoming/search", {
      params: { keyword, page, size },
    });
    return response.data;
  },
  /**
   * Get document attachments
   * @param id Document ID
   * @returns List of document attachments
   */
  getDocumentAttachments: async (
    id: number
  ): Promise<DocumentAttachmentDTO[]> => {
    try {
      const response = await api.get(`/documents/incoming/${id}/attachments`);
      return response.data || [];
    } catch (error) {
      console.error(`Error getting attachments for document ${id}:`, error);
      // Return empty array if endpoint doesn't exist yet
      return [];
    }
  },

  /**
   * Get document classification status for current user
   * @param documentId Document ID
   * @returns Document classification status
   */
  getDocumentClassification: async (
    documentId: number
  ): Promise<DocumentClassificationResponse> => {
    try {
      const response = await api.get(
        `/documents/classification/${documentId}`,
        {
          headers: {
            Accept: "application/hal+json",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      // Don't log 404 errors as errors since they're expected for documents without classification
      if (error?.response?.status === 404) {
        throw error; // Re-throw but don't log as error
      }
      
      console.error(
        `Error getting document classification for document ${documentId}:`,
        error
      );
      throw error;
    }
  },

  downloadIncomingAttachment: async (id: number): Promise<Blob> => {
    try {
      const response = await api.get(`/documents/incoming/${id}/attachment`, {
        responseType: "blob",
        headers: {
          Accept: "application/hal+json",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error downloading attachment for incoming document ${id}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Download specific attachment by attachment ID
   * @param documentId Document ID
   * @param attachmentId Attachment ID
   * @returns Blob data for download
   */
  downloadSpecificAttachment: async (
    documentId: number,
    attachmentId: number
  ): Promise<Blob> => {
    try {
      const response = await api.get(
        `/documents/incoming/${documentId}/attachments/${attachmentId}`,
        {
          responseType: "blob",
          headers: {
            Accept: "application/hal+json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error downloading specific attachment ${attachmentId} for document ${documentId}:`,
        error
      );
      throw error;
    }
  },
};

import api from "./config";
import type { DocumentAttachmentDTO } from "./types";

export interface OutgoingDocumentDTO {
  id?: number;
  title: string;
  documentType: string;
  documentNumber: string;
  referenceNumber?: string;
  signerId?: number;
  signerName?: string;
  signingDate?: Date;
  draftingDepartment?: number;
  relatedDocuments?: string;
  storageLocation?: number;
  documentVolume?: string;
  emailAddress?: string;
  receivingDepartmentText?: string;
  created?: string;
  changed?: string;
  attachmentFilename?: string;

  // Frontend compatibility fields
  number?: string;
  recipient?: string;
  summary?: string;
  status?: string;
  sentDate?: string;
  creator?: any;
  approver?: any;
  submittedAt?: string;
  draftingDepartmentId?: string;
  attachments?: DocumentAttachmentDTO[];
  history?: any[];
}

export const outgoingDocumentsAPI = {
  /**
   * Get all outgoing documents
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of outgoing documents
   */
  getAllDocuments: async (
    page = 0,
    size = 10
  ): Promise<{ documents: OutgoingDocumentDTO[] }> => {
    try {
      const response = await api.get("/documents/outgoing", {
        params: { page, size },
      });

      // Map backend response to frontend expected format
      const documents = response.data.data.content.map(
        (doc: OutgoingDocumentDTO) => ({
          ...doc,
          number: doc.documentNumber.toString(),
          recipient: doc.receivingDepartmentText || "N/A",
          sentDate: doc.signingDate,
          attachments: [],
          history: [],
        })
      );

      return { documents };
    } catch (error) {
      console.error("Error fetching outgoing documents:", error);
      throw error;
    }
  },

  /**
   * Get outgoing document by ID
   * @param id Document ID
   * @returns Document data
   */
  getOutgoingDocumentById: async (
    id: string | number
  ): Promise<{ data: OutgoingDocumentDTO }> => {
    try {
      const response = await api.get(`/documents/outgoing/${id}`);

      // Map backend response to frontend expected format
      const document = {
        ...response.data,
        number: response.data.documentNumber.toString(),
        recipient: response.data.receivingDepartmentText || "N/A",
        sentDate: response.data.signingDate,
        attachments: [],
        history: [],
      };
      // console.log(document);
      return { data: document };
    } catch (error) {
      console.error("Error fetching outgoing document:", error);
      throw error;
    }
  },

  /**
   * Create new outgoing document
   * @param documentData Document data
   * @returns Created document data
   */
  createOutgoingDocument: async (documentData: any) => {
    const response = await api.post("/documents/outgoing", documentData);
    return response.data;
  },

  /**
   * Update outgoing document
   * @param id Document ID
   * @param documentData Document data to update
   * @returns Updated document data
   */
  updateOutgoingDocument: async (id: string | number, documentData: any) => {
    const response = await api.put(`/documents/outgoing/${id}`, documentData);
    return response.data;
  },

  /**
   * Delete outgoing document
   * @param id Document ID
   * @returns Success message
   */
  deleteOutgoingDocument: async (id: string | number) => {
    const response = await api.delete(`/documents/outgoing/${id}`);
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
      `/documents/outgoing/${id}/attachment`,
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
      `/documents/outgoing/${id}/attachments`,
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
   * Submit document for approval
   * @param id Document ID
   * @returns Updated document data
   */
  submitForApproval: async (id: string | number) => {
    const response = await api.put(`/workflow/${id}/submit`, {
      documentId: id,
      status: "pending_approval",
    });
    return response.data;
  },

  /**
   * Approve outgoing document
   * @param id Document ID
   * @param data Approval data
   * @returns Updated document data
   */
  approveOutgoingDocument: async (
    id: string | number,
    data: { comment?: string }
  ) => {
    const response = await api.put(`/workflow/${id}/approve`, {
      documentId: id,
      status: "approved",
      comments: data.comment,
    });
    return response.data;
  },

  /**
   * Reject outgoing document
   * @param id Document ID
   * @param data Rejection data
   * @returns Updated document data
   */
  rejectOutgoingDocument: async (
    id: string | number,
    data: { comment?: string }
  ) => {
    try {
      // Try the primary endpoint first
      const response = await api.put(`/workflow/${id}/provide-feedback`, {
        documentId: id,
        status: "draft",
        comments: data.comment,
      });
      return response.data;
    } catch (error: any) {
      // console.log("Primary endpoint failed, trying alternative...", error);

      // Try alternative endpoint if primary fails
      try {
        const response = await api.put(`/workflow/${id}/reject`, {
          documentId: id,
          status: "rejected",
          comments: data.comment,
        });
        return response.data;
      } catch (altError: any) {
        // console.log(
        //   "Alternative endpoint also failed, trying workflow comment...",
        //   altError
        // );

        // Try workflow comment endpoint as last resort
        const response = await api.put(`/workflow/${id}/comment`, {
          documentId: id,
          comments: data.comment,
          action: "reject",
        });
        return response.data;
      }
    }
  },

  /**
   * Issue document (publish)
   * @param id Document ID
   * @returns Updated document data
   */
  issueDocument: async (id: string | number) => {
    const response = await api.put(`/workflow/${id}/publish`, {
      documentId: id,
      status: "sent",
    });
    return response.data;
  },

  /**
   * Search outgoing documents
   * @param keyword Keyword to search for
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of matching documents
   */
  searchDocuments: async (keyword: string, page = 0, size = 10) => {
    const response = await api.get("/documents/outgoing/search", {
      params: { keyword, page, size },
    });
    return response.data;
  },
  downloadAttachmentDocument: async (documentId: number) => {
    const response = await api.get(
      `/documents/outgoing/${documentId}/attachment`,
      {
        responseType: "blob",
        headers: {
          Accept: "application/hal+json",
        },
      }
    );
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
      const response = await api.get(`/documents/outgoing/${id}/attachments`);
      return response.data || [];
    } catch (error) {
    
      // Return empty array if endpoint doesn't exist yet
      return [];
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
        `/documents/outgoing/${documentId}/attachments/${attachmentId}`,
        {
          responseType: "blob",
          headers: {
            Accept: "application/hal+json",
          },
        }
      );
      return response.data;
    } catch (error) {
     
      throw error;
    }
  },
};

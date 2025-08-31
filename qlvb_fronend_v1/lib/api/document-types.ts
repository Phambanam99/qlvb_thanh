import api from "./config";
import type { PageResponse } from "./types";

/**
 * Document Type data transfer object
 */
export interface DocumentTypeDTO {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * API module for document types operations
 */
export const documentTypesAPI = {
  /**
   * Get all document types
   * @returns List of all document types
   */
  getAllDocumentTypes: async (): Promise<DocumentTypeDTO[]> => {
    try {
      const response = await api.get("/document-types");
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get document type by ID
   * @param id Document type ID
   * @returns Document type data
   */
  getDocumentTypeById: async (
    id: string | number
  ): Promise<DocumentTypeDTO> => {
    try {
      const response = await api.get(`/document-types/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create new document type
   * @param documentTypeData Document type data
   * @returns Created document type data
   */
  createDocumentType: async (
    documentTypeData: Partial<DocumentTypeDTO>
  ): Promise<DocumentTypeDTO> => {
    try {
        // console.log("response createDocumentType", 0);
      const response = await api.post("/document-types", documentTypeData);
      // console.log("response createDocumentType", response);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update document type
   * @param id Document type ID
   * @param documentTypeData Document type data to update
   * @returns Updated document type data
   */
  updateDocumentType: async (
    id: string | number,
    documentTypeData: Partial<DocumentTypeDTO>
  ): Promise<DocumentTypeDTO> => {
    try {
      const response = await api.put(`/document-types/${id}`, documentTypeData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete document type
   * @param id Document type ID
   * @returns Success message
   */
  deleteDocumentType: async (
    id: string | number
  ): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/document-types/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get active document types
   * @returns List of active document types
   */
  getActiveDocumentTypes: async (): Promise<DocumentTypeDTO[]> => {
    try {
      const response = await api.get("/document-types", {
        params: { active: true },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

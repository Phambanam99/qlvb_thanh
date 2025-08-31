import api from "./config";
import type { PageResponse } from "./types";

export interface GuideFileDTO {
  id: number;
  name: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById?: number;
  createdByName?: string;
}

export interface CreateGuideFileDTO {
  name: string;
  description: string;
  category: string;
  isActive?: boolean;
}

export interface UpdateGuideFileDTO {
  name?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

export const guideFilesAPI = {
  /**
   * Get all guide files
   * @returns List of all guide files
   */
  getAllGuideFiles: async (): Promise<GuideFileDTO[]> => {
    try {
      const response = await api.get("/guide-files");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get active guide files (for public view)
   * @returns List of active guide files
   */
  getActiveGuideFiles: async (): Promise<GuideFileDTO[]> => {
    try {
      const response = await api.get("/guide-files/active");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get guide files with pagination
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of guide files
   */
  getGuideFilesPaginated: async (
    page = 0,
    size = 10
  ): Promise<PageResponse<GuideFileDTO>> => {
    try {
      const response = await api.get("/guide-files/paginated", {
        params: { page, size },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get guide file by ID
   * @param id Guide file ID
   * @returns Guide file data
   */
  getGuideFileById: async (id: string | number): Promise<GuideFileDTO> => {
    try {
      const response = await api.get(`/guide-files/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Upload new guide file
   * @param fileData Guide file metadata
   * @param file File to upload
   * @returns Created guide file data
   */
  uploadGuideFile: async (
    fileData: CreateGuideFileDTO,
    file: File
  ): Promise<GuideFileDTO> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", fileData.name);
      formData.append("description", fileData.description);
      formData.append("category", fileData.category);
      formData.append("isActive", String(fileData.isActive ?? true));

      const response = await api.post("/guide-files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update guide file metadata
   * @param id Guide file ID
   * @param fileData Guide file data to update
   * @returns Updated guide file data
   */
  updateGuideFile: async (
    id: string | number,
    fileData: UpdateGuideFileDTO
  ): Promise<GuideFileDTO> => {
    try {
      const response = await api.put(`/guide-files/${id}`, fileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Replace guide file
   * @param id Guide file ID
   * @param file New file to upload
   * @returns Updated guide file data
   */
  replaceGuideFile: async (
    id: string | number,
    file: File
  ): Promise<GuideFileDTO> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.put(`/guide-files/${id}/file`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete guide file
   * @param id Guide file ID
   * @returns Success message
   */
  deleteGuideFile: async (
    id: string | number
  ): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/guide-files/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Download guide file
   * @param id Guide file ID
   * @returns File blob
   */
  downloadGuideFile: async (id: string | number): Promise<Blob> => {
    try {
      const response = await api.get(`/guide-files/${id}/download`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

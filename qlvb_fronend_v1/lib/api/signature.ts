import api from "./config";
import { SignatureDTO } from "../types/signature";
import { ResponseDTO } from "../types/common"; // Keep for response typing

/**
 * API module for Signature-related operations
 */
export const signatureApi = {
    /**
     * Get all signatures for the current user
     * @returns Promise with list of all signatures
     */
    getSignatures: async (): Promise<SignatureDTO[]> => {
        try {
            // The backend returns a ResponseDTO, so we type it accordingly
            const response = await api.get<ResponseDTO<SignatureDTO[]>>('/signatures');
            // We assume if the request is successful, the data is what we need.
            // The interceptor will handle non-2xx responses.
            if (response.data && response.data.data) {
                 return response.data.data;
            }
            // Handle cases where the response is 200 OK but data is not as expected
            throw new Error(response.data.message || 'Failed to get signatures');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Create a new signature
     * @param file The signature image file
     * @param password The password to protect the signature
     * @returns Promise with the created signature DTO
     */
    createSignature: async (file: File, password: string): Promise<SignatureDTO> => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("password", password);
            
            const response = await api.post<ResponseDTO<SignatureDTO>>('/signatures', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data && response.data.data) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create signature');
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete a signature by its ID
     * @param id The ID of the signature to delete
     * @param password The password for the signature
     * @returns Promise that resolves on successful deletion
     */
    deleteSignature: async (id: number, password: string): Promise<void> => {
        try {
            const params = new URLSearchParams({ password });
            await api.delete(`/signatures/${id}?${params.toString()}`);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get signature image data
     * @param id The ID of the signature
     * @param password The password for the signature
     * @returns Promise with the signature image blob
     */
    getSignatureImage: async (id: number, password: string): Promise<Blob> => {
        try {
            const response = await api.post<Blob>(`/signatures/${id}/image`, password, {
                responseType: 'blob',
                headers: { 'Content-Type': 'text/plain' },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
}; 
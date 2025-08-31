import api from './config';

// SenderDTO interface matching the Java backend model
export interface SenderDTO {
  id?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * API module for Sender-related operations
 */
export const senderApi = {
  /**
   * Get all senders
   * @returns Promise with list of all senders
   */
  getAllSenders: async (): Promise<SenderDTO[]> => {
    try {
      const response = await api.get('/senders');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get sender by ID
   * @param id Sender ID
   * @returns Promise with sender details
   */
  getSenderById: async (id: number): Promise<SenderDTO> => {
    try {
      const response = await api.get(`/senders/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new sender
   * @param senderData Sender data to be created
   * @returns Promise with the created sender
   */
  createSender: async (senderData: SenderDTO): Promise<SenderDTO> => {
    try {
      const response = await api.post('/senders', senderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an existing sender
   * @param id Sender ID to update
   * @param senderData Updated sender data
   * @returns Promise with updated sender
   */
  updateSender: async (id: number, senderData: Partial<SenderDTO>): Promise<SenderDTO> => {
    try {
      const response = await api.put(`/senders/${id}`, senderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a sender
   * @param id Sender ID to delete
   * @returns Promise with void result
   */
  deleteSender: async (id: number): Promise<void> => {
    try {
      await api.delete(`/senders/${id}`);
    } catch (error) {
      throw error;
    }
  },
};


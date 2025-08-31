import api from "./config"
import type { PageResponse } from "./types"

export interface AuditLogDTO {
  id: number
  userId: number
  username: string
  action: string
  entityType: string
  entityId: string
  details: string
  ipAddress: string
  userAgent: string
  timestamp: string
}

export const auditAPI = {
  /**
   * Get all audit logs
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of audit logs
   */
  getAllAuditLogs: async (page = 0, size = 10): Promise<PageResponse<AuditLogDTO>> => {
    const response = await api.get("/audit", {
      params: { page, size },
    })
 
    return response.data
  },

  /**
   * Get audit log by ID
   * @param id Audit log ID
   * @returns Audit log data
   */
  getAuditLogById: async (id: string | number): Promise<AuditLogDTO> => {
    const response = await api.get(`/audit/${id}`)
    return response.data
  },

  /**
   * Get audit logs by user ID
   * @param userId User ID
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of audit logs for the specified user
   */
  getAuditLogsByUserId: async (userId: string | number, page = 0, size = 10): Promise<PageResponse<AuditLogDTO>> => {
    const response = await api.get(`/audit/user/${userId}`, {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Get audit logs by entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of audit logs for the specified entity
   */
  getAuditLogsByEntity: async (
    entityType: string,
    entityId: string | number,
    page = 0,
    size = 10,
  ): Promise<PageResponse<AuditLogDTO>> => {
    const response = await api.get(`/audit/entity/${entityType}/${entityId}`, {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Get audit logs by date range
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of audit logs within the date range
   */
  getAuditLogsByDateRange: async (
    startDate: string,
    endDate: string,
    page = 0,
    size = 10,
  ): Promise<PageResponse<AuditLogDTO>> => {
    const response = await api.get("/audit/date-range", {
      params: {
        start: startDate,
        end: endDate,
        page,
        size,
      },
    })
    return response.data
  },

  /**
   * Get audit logs by action type
   * @param action Action type
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of audit logs for the specified action type
   */
  getAuditLogsByAction: async (action: string, page = 0, size = 10): Promise<PageResponse<AuditLogDTO>> => {
    const response = await api.get(`/audit/action/${action}`, {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Export audit logs to CSV
   * @param filters Filter parameters
   * @returns CSV file blob
   */
  exportAuditLogs: async (filters: Record<string, any>): Promise<Blob> => {
    const response = await api.get("/audit/export", {
      params: filters,
      responseType: "blob",
    })
    return response.data
  },
}

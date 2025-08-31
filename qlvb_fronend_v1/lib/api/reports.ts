import api from "./config"

export interface ReportDTO {
  id: number
  name: string
  description?: string
  type: string
  parameters?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ReportResultDTO {
  id: number
  reportId: number
  data: any
  format: string
  createdAt: string
  updatedAt: string
}

export const reportsAPI = {
  /**
   * Get all reports
   * @returns List of all reports
   */
  getAllReports: async (): Promise<ReportDTO[]> => {
    const response = await api.get("/reports")
    return response.data
  },

  /**
   * Get report by ID
   * @param id Report ID
   * @returns Report data
   */
  getReportById: async (id: string | number): Promise<ReportDTO> => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  /**
   * Generate report
   * @param id Report ID
   * @param parameters Report parameters
   * @returns Generated report result
   */
  generateReport: async (id: string | number, parameters?: Record<string, any>): Promise<ReportResultDTO> => {
    const response = await api.post(`/reports/${id}/generate`, { parameters })
    return response.data
  },

  /**
   * Get document statistics report
   * @param startDate Start date
   * @param endDate End date
   * @returns Document statistics report
   */
  getDocumentStatisticsReport: async (startDate: string, endDate: string): Promise<any> => {
    const response = await api.get("/reports/document-statistics", {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * Get user activity report
   * @param startDate Start date
   * @param endDate End date
   * @returns User activity report
   */
  getUserActivityReport: async (startDate: string, endDate: string): Promise<any> => {
    const response = await api.get("/reports/user-activity", {
      params: { startDate, endDate },
    })
    return response.data
  },

  /**
   * Get department performance report
   * @param startDate Start date
   * @param endDate End date
   * @returns Department performance report
   */
  getDepartmentPerformanceReport: async (startDate: string, endDate: string): Promise<any> => {
    const response = await api.get("/reports/department-performance", {
      params: { startDate, endDate },
    })
    return response.data
  },

  // Thêm các phương thức mới để tương thích với code hiện tại
  getReportData: async (params: { timeRange: string; department: string }): Promise<any> => {
    const response = await api.get("/reports/data", { params });
    return response.data;
  },

  exportReport: async (params: { timeRange: string; department: string }): Promise<any> => {
    const response = await api.post("/reports/export", params);
    return response.data;
  }
}

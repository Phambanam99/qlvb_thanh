import api from "./config"
import type { PageResponse } from "./types"

export interface WorkCaseDTO {
  id: number
  title: string
  caseCode: string
  description: string
  status: string
  priority: string
  deadline: string
  createdDate: string
  lastModifiedDate: string
  createdById: number
  createdByName: string
  assignedToId?: number
  assignedToName?: string
  progress: number
  tags?: string
  documentIds: number[]
}

export const casesAPI = {
  /**
   * Get all work cases
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of work cases
   */
  getAllWorkCases: async (page = 0, size = 10): Promise<PageResponse<WorkCaseDTO>> => {
    const response = await api.get("/cases", {
      params: { page, size },
    })
    return response.data
  },

  /**
   * Get work case by ID
   * @param id Work case ID
   * @returns Work case data
   */
  getWorkCaseById: async (id: string | number): Promise<WorkCaseDTO> => {
    const response = await api.get(`/cases/${id}`)
    return response.data
  },

  /**
   * Create new work case
   * @param caseData Work case data
   * @returns Created work case data
   */
  createWorkCase: async (caseData: Partial<WorkCaseDTO>) => {
    const response = await api.post("/cases", caseData)
    return response.data
  },

  /**
   * Update work case
   * @param id Work case ID
   * @param caseData Work case data to update
   * @returns Updated work case data
   */
  updateWorkCase: async (id: string | number, caseData: Partial<WorkCaseDTO>) => {
    const response = await api.put(`/cases/${id}`, caseData)
    return response.data
  },

  /**
   * Delete work case
   * @param id Work case ID
   * @returns Success message
   */
  deleteWorkCase: async (id: string | number) => {
    const response = await api.delete(`/cases/${id}`)
    return response.data
  },

  /**
   * Add document to work case
   * @param caseId Work case ID
   * @param documentId Document ID
   * @returns Updated work case data
   */
  addDocumentToCase: async (caseId: string | number, documentId: string | number) => {
    const response = await api.post(`/cases/${caseId}/documents/${documentId}`)
    return response.data
  },

  /**
   * Remove document from work case
   * @param caseId Work case ID
   * @param documentId Document ID
   * @returns Updated work case data
   */
  removeDocumentFromCase: async (caseId: string | number, documentId: string | number) => {
    const response = await api.delete(`/cases/${caseId}/documents/${documentId}`)
    return response.data
  },

  /**
   * Get work cases by status
   * @param status Status to filter by
   * @returns List of work cases with the specified status
   */
  getWorkCasesByStatus: async (status: string): Promise<WorkCaseDTO[]> => {
    const response = await api.get(`/cases/status/${status}`)
    return response.data
  },

  /**
   * Search work cases
   * @param keyword Keyword to search for
   * @param page Page number
   * @param size Page size
   * @returns Paginated list of matching work cases
   */
  searchWorkCases: async (keyword: string, page = 0, size = 10) => {
    const response = await api.get("/cases/search", {
      params: { keyword, page, size },
    })
    return response.data
  },

  /**
   * Get work cases by priority
   * @param priority Priority to filter by
   * @returns List of work cases with the specified priority
   */
  getWorkCasesByPriority: async (priority: string): Promise<WorkCaseDTO[]> => {
    const response = await api.get(`/cases/priority/${priority}`)
    return response.data
  },

  /**
   * Get overdue cases
   * @returns List of overdue work cases
   */
  getOverdueCases: async (): Promise<WorkCaseDTO[]> => {
    const response = await api.get("/cases/overdue")
    return response.data
  },
}

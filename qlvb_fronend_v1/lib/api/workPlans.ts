import { api } from "./config";

export interface WorkPlanTaskDTO {
  id?: number;
  title: string;
  description: string;
  assigneeId?: number;
  assigneeName?: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkPlanDTO {
  id: number;
  title: string;
  description: string;
  department: string;
  startDate: string;
  endDate: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tasks?: WorkPlanTaskDTO[]; // Make optional since it might not always be present
  // Thêm các trường có thể có từ backend response
  trangThaiPheDuyet?: string;
  assignedCt?: any; // For assigned CT information
  // Thêm trường documents để tương thích với code hiện tại
  documents?: { name: string; url?: string }[];
}

export const workPlansAPI = {
  /**
   * Get all work plans
   * @returns List of all work plans
   */
  getAllWorkPlans: async (params?: any): Promise<WorkPlanDTO[]> => {
    const response = await api.get("/work-plans", { params });
    // Check if response has wrapped structure
    return response.data.data || response.data;
  },

  /**
   * Get all work plans with pagination
   * @param params Query parameters including page, size, departmentId, status, etc.
   * @returns Paginated work plans response
   */
  getAllWorkPlansWithPagination: async (params?: {
    page?: number;
    size?: number;
    departmentId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get("/work-plans/paged", { params });
    // API trả về trực tiếp pagination object, không có wrapper
    return response.data.data;
  },

  /**
   * Get work plans by week
   * @param year Year (e.g., 2024, 2025)
   * @param week Week number (1-53)
   * @param params Query parameters
   * @returns Paginated work plans for the week
   */
  getWorkPlansByWeek: async (
    year: number,
    week: number,
    params?: { page?: number; size?: number }
  ): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get(`/work-plans/week/${year}/${week}`, { params });
    return response.data.data;
  },

  /**
   * Get work plans by month
   * @param year Year (e.g., 2024, 2025)
   * @param month Month (1-12)
   * @param params Query parameters
   * @returns Paginated work plans for the month
   */
  getWorkPlansByMonth: async (
    year: number,
    month: number,
    params?: { page?: number; size?: number }
  ): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get(`/work-plans/month/${year}/${month}`, { params });
    return response.data.data;
  },

  /**
   * Get work plans by year
   * @param year Year (e.g., 2024, 2025)
   * @param params Query parameters
   * @returns Paginated work plans for the year
   */
  getWorkPlansByYear: async (
    year: number,
    params?: { page?: number; size?: number }
  ): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get(`/work-plans/year/${year}`, { params });
    return response.data.data;
  },

  /**
   * Get work plans by department and week
   * @param departmentId Department ID
   * @param year Year (e.g., 2024, 2025)
   * @param week Week number (1-53)
   * @param params Query parameters
   * @returns Paginated work plans for the department and week
   */
  getWorkPlansByDepartmentAndWeek: async (
    departmentId: number,
    year: number,
    week: number,
    params?: { page?: number; size?: number }
  ): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get(`/work-plans/department/${departmentId}/week/${year}/${week}`, { params });
    return response.data.data;
  },

  /**
   * Get work plans by department and month
   * @param departmentId Department ID
   * @param year Year (e.g., 2024, 2025)
   * @param month Month (1-12)
   * @param params Query parameters
   * @returns Paginated work plans for the department and month
   */
  getWorkPlansByDepartmentAndMonth: async (
    departmentId: number,
    year: number,
    month: number,
    params?: { page?: number; size?: number }
  ): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get(`/work-plans/department/${departmentId}/month/${year}/${month}`, { params });
    return response.data.data;
  },

  /**
   * Get work plans by department and year
   * @param departmentId Department ID
   * @param year Year (e.g., 2024, 2025)
   * @param params Query parameters
   * @returns Paginated work plans for the department and year
   */
  getWorkPlansByDepartmentAndYear: async (
    departmentId: number,
    year: number,
    params?: { page?: number; size?: number }
  ): Promise<{
    content: WorkPlanDTO[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }> => {
    const response = await api.get(`/work-plans/department/${departmentId}/year/${year}`, { params });
    return response.data.data;
  },

  /**
   * Get work plan by ID
   * @param id Work plan ID
   * @returns Work plan data
   */
  getWorkPlanById: async (id: string | number): Promise<WorkPlanDTO> => {
    const response = await api.get(`/work-plans/${id}`);
    return  response.data;
  },

  /**
   * Create new work plan
   * @param workPlanData Work plan data
   * @returns Created work plan data
   */
  createWorkPlan: async (
    workPlanData: Partial<WorkPlanDTO>
  ): Promise<WorkPlanDTO> => {
    const response = await api.post("/work-plans", workPlanData);
    return  response.data;
  },

  /**
   * Update work plan
   * @param id Work plan ID
   * @param workPlanData Work plan data to update
   * @returns Updated work plan data
   */
  updateWorkPlan: async (
    id: string | number,
    workPlanData: Partial<WorkPlanDTO>
  ): Promise<WorkPlanDTO> => {
    const response = await api.put(`/work-plans/${id}`, workPlanData);
    return response.data.data || response.data;
  },

  /**
   * Submit work plan for approval
   * @param id Work plan ID
   * @returns Updated work plan data
   */
  submitWorkPlan: async (id: string | number): Promise<WorkPlanDTO> => {
    const response = await api.patch(`/work-plans/${id}/submit`);
    return  response.data;
  },

  /**
   * Approve or reject work plan
   * @param id Work plan ID
   * @param data Approval data with approved flag and comments
   * @returns Updated work plan data
   */
  approveWorkPlan: async (
    id: number | string,
    data: { approved: boolean; comments?: string }
  ): Promise<WorkPlanDTO> => {
    const response = await api.patch(`/work-plans/${id}/approve`, data);
    return response.data;
  },

  /**
   * Start work plan execution (move from approved to in_progress)
   * @param id Work plan ID
   * @returns Updated work plan data
   */
  startWorkPlan: async (id: number | string): Promise<WorkPlanDTO> => {
    const response = await api.patch(`/work-plans/${id}/start`);
    return response.data.data || response.data;
  },

  /**
   * Complete work plan (move from in_progress to completed)
   * @param id Work plan ID
   * @returns Updated work plan data
   */
  completeWorkPlan: async (id: number | string): Promise<WorkPlanDTO> => {
    const response = await api.patch(`/work-plans/${id}/complete`);
    return response.data.data || response.data;
  },

  /**
   * Force update all work plan statuses (admin only)
   * @returns Success message
   */
  forceUpdateAllStatuses: async (): Promise<{ message: string }> => {
    const response = await api.post("/work-plans/force-update-statuses");
    return response.data.data || response.data;
  },

  /**
   * Update task status and progress
   * @param workPlanId Work plan ID
   * @param taskId Task ID
   * @param data Status update data
   * @returns Updated task data
   */
  updateTaskStatus: async (
    workPlanId: string | number,
    taskId: string | number,
    data: { status?: string; progress?: number; comments?: string }
  ): Promise<WorkPlanTaskDTO> => {
    const response = await api.patch(
      `/work-plans/${workPlanId}/tasks/${taskId}/status`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete work plan
   * @param id Work plan ID
   * @returns Success message
   */
  deleteWorkPlan: async (id: string | number): Promise<{ message: string }> => {
    const response = await api.delete(`/work-plans/${id}`);
    return response.data.data || response.data;
  },
};

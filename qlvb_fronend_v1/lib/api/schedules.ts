import { ResponseDTO } from "./types";
import api from "./config";
import { logger } from "../utils/logger";

export interface ScheduleEventDTO {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  description?: string;
  participants: number[];
  participantNames: string[];
  scheduleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDTO {
  id: number;
  title: string;
  description?: string;
  departmentId: number;
  departmentName: string;
  period: string;
  status: string;
  createdById: number;
  createdByName: string;
  approvedById?: number;
  approvedByName?: string;
  approvalDate?: string;
  approvalComments?: string;
  createdAt: string;
  updatedAt: string;
  events?: ScheduleEventDTO[];
}

export interface PaginatedScheduleResponse {
  content: ScheduleDTO[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: any[];
    offset: number;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: any[];
  numberOfElements: number;
}

export interface ScheduleEventParams {
  date?: string;
  excludeId?: string;
  departmentId?: string;
}

export interface ScheduleListParams {
  page?: number;
  size?: number;
  sort?: string[];
  search?: string;
  status?: string;
  departmentId?: number;
  // Date filtering parameters - backend uses fromDate/toDate
  fromDate?: string; // format: YYYY-MM-DD
  toDate?: string;   // format: YYYY-MM-DD
}

export const schedulesAPI = {
  /**
   * Get all schedules
   * @param params Query parameters for pagination and filtering
   * @returns Paginated list of schedules
   */
  getAllSchedules: async (
    params?: ScheduleListParams
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", "/schedules", params);
    const response = await api.get("/schedules", { params });
    logger.debug("getAllSchedules response", {
      count: response.data?.data?.content?.length,
      totalElements: response.data?.data?.totalElements,
      currentPage: response.data?.data?.number,
    });
    return response.data;
  },

  /**
   * Get schedules by week
   * @param year Year (e.g., 2024, 2025)
   * @param week Week number (1-53)
   * @param params Query parameters
   * @returns Paginated list of schedules for the week
   */
  getSchedulesByWeek: async (
    year: number,
    week: number,
    params?: { page?: number; size?: number }
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", `/schedules/week/${year}/${week}`, params);
    const response = await api.get(`/schedules/week/${year}/${week}`, { params });
    return response.data;
  },

  /**
   * Get schedules by month
   * @param year Year (e.g., 2024, 2025)
   * @param month Month (1-12)
   * @param params Query parameters
   * @returns Paginated list of schedules for the month
   */
  getSchedulesByMonth: async (
    year: number,
    month: number,
    params?: { page?: number; size?: number }
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", `/schedules/month/${year}/${month}`, params);
    const response = await api.get(`/schedules/month/${year}/${month}`, { params });
    return response.data;
  },

  /**
   * Get schedules by year
   * @param year Year (e.g., 2024, 2025)
   * @param params Query parameters
   * @returns Paginated list of schedules for the year
   */
  getSchedulesByYear: async (
    year: number,
    params?: { page?: number; size?: number }
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", `/schedules/year/${year}`, params);
    const response = await api.get(`/schedules/year/${year}`, { params });
    return response.data;
  },

  /**
   * Get schedules by department and week
   * @param departmentId Department ID
   * @param year Year (e.g., 2024, 2025)
   * @param week Week number (1-53)
   * @param params Query parameters
   * @returns Paginated list of schedules for the department and week
   */
  getSchedulesByDepartmentAndWeek: async (
    departmentId: number,
    year: number,
    week: number,
    params?: { page?: number; size?: number }
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", `/schedules/department/${departmentId}/week/${year}/${week}`, params);
    const response = await api.get(`/schedules/department/${departmentId}/week/${year}/${week}`, { params });
    return response.data;
  },

  /**
   * Get schedules by department and month
   * @param departmentId Department ID
   * @param year Year (e.g., 2024, 2025)
   * @param month Month (1-12)
   * @param params Query parameters
   * @returns Paginated list of schedules for the department and month
   */
  getSchedulesByDepartmentAndMonth: async (
    departmentId: number,
    year: number,
    month: number,
    params?: { page?: number; size?: number }
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", `/schedules/department/${departmentId}/month/${year}/${month}`, params);
    const response = await api.get(`/schedules/department/${departmentId}/month/${year}/${month}`, { params });
    return response.data;
  },

  /**
   * Get schedules by department and year
   * @param departmentId Department ID
   * @param year Year (e.g., 2024, 2025)
   * @param params Query parameters
   * @returns Paginated list of schedules for the department and year
   */
  getSchedulesByDepartmentAndYear: async (
    departmentId: number,
    year: number,
    params?: { page?: number; size?: number }
  ): Promise<ResponseDTO<PaginatedScheduleResponse>> => {
    logger.api("GET", `/schedules/department/${departmentId}/year/${year}`, params);
    const response = await api.get(`/schedules/department/${departmentId}/year/${year}`, { params });
    return response.data;
  },

  /**
   * Get schedule by ID
   * @param id Schedule ID
   * @returns Schedule data
   */
  getScheduleById: async (
    id: string | number
  ): Promise<ResponseDTO<ScheduleDTO>> => {
    logger.api("GET", `/schedules/${id}`);
    const response = await api.get(`/schedules/${id}`);
    logger.debug("getScheduleById response", {
      id,
      title: response.data?.title,
    });
    return response.data;
  },

  /**
   * Get schedules by department ID - try multiple possible endpoints
   * @param departmentId Department ID
   * @returns List of schedules for the department
   */
  getSchedulesByDepartmentId: async (
    departmentId: number
  ): Promise<ResponseDTO<ScheduleDTO[]>> => {
    // Try different possible endpoint paths
    const possiblePaths = [
      `/schedules/department/${departmentId}`,
      `/schedule/department/${departmentId}`,
      `/schedules/${departmentId}/department`,
    ];

    logger.api("GET", `trying multiple paths for department ${departmentId}`);

    for (const path of possiblePaths) {
      try {
        logger.api("GET", path);
        const response = await api.get(path);
        logger.debug("getSchedulesByDepartmentId success", {
          departmentId,
          path,
          count: response.data?.data?.length || response.data?.length,
        });
        return response.data;
      } catch (error: any) {
        logger.debug("getSchedulesByDepartmentId failed", {
          departmentId,
          path,
          status: error.response?.status,
          error: error.message,
        });

        // If this is the last path and still failing, throw the error
        if (path === possiblePaths[possiblePaths.length - 1]) {
          throw error;
        }
        // Otherwise, continue to next path
      }
    }

    // This should never be reached, but TypeScript requires it
    throw new Error("All department endpoint paths failed");
  },

  /**
   * Get schedule events
   * @param params Query parameters
   * @returns List of schedule events
   */
  getScheduleEvents: async (
    params: ScheduleEventParams
  ): Promise<ScheduleEventDTO[]> => {
    logger.api("GET", "/schedules/events", params);
    const response = await api.get("/schedules/events", { params });
    logger.debug("getScheduleEvents response", {
      count: response.data?.length,
    });
    return response.data;
  },

  /**
   * Get event by ID
   * @param id Event ID
   * @returns Event data
   */
  getEventById: async (id: string | number): Promise<ScheduleEventDTO> => {
    logger.api("GET", `/schedules/events/${id}`);
    const response = await api.get(`/schedules/events/${id}`);
    logger.debug("getEventById response", { id, title: response.data?.title });
    return response.data;
  },

  /**
   * Create new schedule
   * @param scheduleData Schedule data
   * @returns Created schedule data
   */
  createSchedule: async (scheduleData: any): Promise<ScheduleDTO> => {
    logger.api("POST", "/schedules", { title: scheduleData?.title });
    const response = await api.post("/schedules", scheduleData);
    logger.info("Schedule created successfully", {
      id: response.data?.id,
      title: response.data?.title,
    });
    return response.data;
  },

  /**
   * Update schedule
   * @param id Schedule ID
   * @param scheduleData Schedule data to update
   * @returns Updated schedule data
   */
  updateSchedule: async (
    id: string | number,
    scheduleData: any
  ): Promise<ScheduleDTO> => {
    logger.api("PUT", `/schedules/${id}`, { title: scheduleData?.title });
    const response = await api.put(`/schedules/${id}`, scheduleData);
    logger.info("Schedule updated successfully", {
      id,
      title: response.data?.title,
    });
    return response.data;
  },

  /**
   * Delete schedule
   * @param id Schedule ID
   * @returns Success message
   */
  deleteSchedule: async (id: string | number): Promise<{ message: string }> => {
    logger.api("DELETE", `/schedules/${id}`);
    const response = await api.delete(`/schedules/${id}`);
    logger.info("Schedule deleted successfully", { id });
    return response.data;
  },

  /**
   * Approve schedule
   * @param id Schedule ID
   * @param data Approval data
   * @returns Updated schedule data
   */
  approveSchedule: async (
    id: string | number,
    data: { comments?: string }
  ): Promise<ScheduleDTO> => {
    logger.api("POST", `/schedules/${id}/approve`, data);
    const response = await api.post(`/schedules/${id}/approve`, data);
    logger.info("Schedule approved successfully", { id });
    return response.data;
  },

  /**
   * Reject schedule
   * @param id Schedule ID
   * @param data Rejection data
   * @returns Updated schedule data
   */
  rejectSchedule: async (
    id: string | number,
    data: { comments?: string }
  ): Promise<ScheduleDTO> => {
    logger.api("POST", `/schedules/${id}/reject`, data);
    const response = await api.post(`/schedules/${id}/reject`, data);
    logger.info("Schedule rejected", { id, comments: data.comments });
    return response.data;
  },

  /**
   * Get related schedules
   * @param id Schedule ID
   * @returns List of related schedules
   */
  getRelatedSchedules: async (id: string | number): Promise<ScheduleDTO[]> => {
    logger.api("GET", `/schedules/${id}/related`);
    const response = await api.get(`/schedules/${id}/related`);
    logger.debug("getRelatedSchedules response", {
      count: response.data?.length,
    });
    return response.data;
  },
};

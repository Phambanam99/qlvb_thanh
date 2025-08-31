import { de } from "date-fns/locale";
import api from "./config";
import type { ActivityLogDTO } from "./types";

export interface DashboardDTO {
  // Các trường từ API
  totalDocuments?: number;
  incomingDocumentCount?: number;
  outgoingDocumentCount?: number;
  pendingDocuments?: DocumentSummaryDTO[];
  documentsByStatus?: Record<string, number>;
  documentsByMonth?: Record<string, number>;
  pendingDocumentCount?: number;
  upcomingDeadlines?: DocumentSummaryDTO[];
  overdueDocuments?: DocumentSummaryDTO[];
  overdueDocumentCount?: number;
  activeWorkPlans?: WorkPlanSummaryDTO[];
  unreadNotifications?: number;
  performanceMetrics?: Record<string, any>;

  // Các trường cũ (giữ lại để tương thích ngược)
  incomingDocuments?: number;
  outgoingDocuments?: number;
  workCaseCount?: number;
  scheduleCount?: number;
  todayScheduleCount?: number;
  documentCountsByType?: Record<string, number>;
  documentCountsByMonth?: Record<string, number>;
  processingTimeStatistics?: Record<string, number>;
  departmentPerformance?: Record<string, any>;
  topActiveUsers?: UserActivityDTO[];
  recentDocuments?: any[];
}

export interface DocumentSummaryDTO {
  id: number;
  title: string;
  documentNumber: string;
  documentType: string;
  status: string;
  deadline?: string;
  assignedTo?: string;
  department?: string;
}

export interface WorkPlanSummaryDTO {
  id: number;
  title: string;
  department: string;
  period: string;
  status: string;
  completedTasks: number;
  totalTasks: number;
  progress: string;
}

export interface UserActivityDTO {
  userId: number;
  userName: string;
  documentsProcessed: number;
  averageProcessingTime: number;
  currentAssignments: number;
}

// Comprehensive dashboard stats interface based on backend API
export interface ComprehensiveDashboardStats {
  generatedAt: string;
  userId: number;
  userRole: string;
  departmentName: string;
  incomingDocuments: {
    total: number;
    internal: number;
    external: number;
    notProcessed: number;
    inProcess: number;
    processed: number;
  };
  outgoingDocuments: {
    total: number;
    internal: number;
    external: number;
    draft: number;
    pending: number;
    published: number;
  };
  internalDocuments: {
    total: number;
    sent: number;
    received: number;
    unread: number;
    urgent: number;
    // Detailed breakdown for internal documents
    sentTotal?: number;
    sentSent?: number;
    sentDraft?: number;
    receivedTotal?: number;
    receivedRead?: number;
    receivedUnread?: number;
  };
  overallStats: {
    totalDocuments: number;
    totalUnread: number;
    totalPendingApproval: number;
    totalUrgent: number;
    todayDocuments: number;
    thisWeekDocuments: number;
    thisMonthDocuments: number;
  };
  periodStats: {
    todayCount: number;
    yesterdayCount: number;
    thisWeekCount: number;
    lastWeekCount: number;
    thisMonthCount: number;
    lastMonthCount: number;
    weekGrowthPercent: number;
    monthGrowthPercent: number;
  };
  recentDocuments: any[];
}

export const dashboardAPI = {
  /**
   * Get system dashboard statistics
   * @returns Dashboard statistics
   */
  getSystemDashboardStatistics: async (): Promise<DashboardDTO> => {
    const response = await api.get("/dashboard");
    return response.data.data || response.data;
  },

  /**
   * Get current user's dashboard statistics
   * @returns Dashboard statistics for the current authenticated user
   */
  getCurrentUserDashboardStatistics: async (): Promise<DashboardDTO> => {
    const response = await api.get("/dashboard/me");
    return response.data.data || response.data;
  },

  /**
   * Get dashboard statistics for a specific department
   * @param departmentId Department ID
   * @returns Dashboard statistics for the department
   */
  getDepartmentDashboardStatistics: async (
    departmentId: number
  ): Promise<DashboardDTO> => {
    const response = await api.get(`/dashboard/department/${departmentId}`);
    return response.data.data || response.data;
  },

  /**
   * Get dashboard statistics for a specific user
   * @param userId User ID
   * @returns Dashboard statistics for the user
   */
  getUserDashboardStatistics: async (userId: number): Promise<DashboardDTO> => {
    const response = await api.get(`/dashboard/user/${userId}`);
    return response.data.data || response.data;
  },

  /**
   * Get comprehensive dashboard stats - MAIN API ENDPOINT
   * @returns Comprehensive dashboard stats object based on user role
   */
  getDashboardStats: async (): Promise<ComprehensiveDashboardStats> => {
    const response = await api.get("/dashboard/stats");
    return response.data.data || response.data;
  },

  /**
   * Get status breakdown
   * @returns Status breakdown object
   */
  getStatusBreakdown: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/status-breakdown");
    return response.data.data || response.data;
  },

  /**
   * Get quick metrics
   * @returns Quick metrics object
   */
  getQuickMetrics: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/quick-metrics");
    return response.data.data || response.data;
  },

  /**
   * Get period stats
   * @returns Period stats object
   */
  getPeriodStats: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/period-stats");
    return response.data.data || response.data;
  },

  /**
   * Get overall stats
   * @returns Overall stats object
   */
  getOverallStats: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/overall-stats");
    return response.data.data || response.data;
  },

  /**
   * Get incoming document stats
   * @returns Incoming document stats object
   */
  getIncomingDocumentStats: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/incoming-stats");
    return response.data.data || response.data;
  },

  /**
   * Get outgoing document stats
   * @returns Outgoing document stats object
   */
  getOutgoingDocumentStats: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/outgoing-stats");
    return response.data.data || response.data;
  },

  /**
   * Get internal document stats
   * @returns Internal document stats object
   */
  getInternalDocumentStats: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/internal-stats");
    return response.data.data || response.data;
  },

  /**
   * Get recent documents
   * @returns Recent documents object
   */
  getRecentDocuments: async (): Promise<any> => {
    const response = await api.get("/dashboard/recent-documents");
    return response.data.data || response.data;
  },

  /**
   * Get today's schedule events
   * @param date Optional date parameter (yyyy-MM-dd)
   * @returns List of schedule events for today or specified date
   */
  getTodayScheduleEvents: async (date?: string): Promise<any[]> => {
    const params = date
      ? { date }
      : { date: new Date().toISOString().split("T")[0] };
    const response = await api.get("/dashboard/schedules/today", { params });
    // Fix: Backend returns ResponseDTO<List<ScheduleEventDTO>>, so we need .data.data
    return response.data.data || response.data || [];
  },

  // Legacy methods (kept for backward compatibility)
  /**
   * @deprecated Use getSystemDashboardStatistics instead
   */
  getDashboardStatistics: async (): Promise<DashboardDTO> => {
    return dashboardAPI.getSystemDashboardStatistics();
  },

  /**
   * Get recent activity logs
   * @param page Page number
   * @param size Page size
   * @returns Recent activity logs
   */
  getRecentActivities: async (
    page = 0,
    size = 20
  ): Promise<ActivityLogDTO[]> => {
    const response = await api.get("/dashboard/recent-activities", {
      params: { page, size },
    });
    return response.data;
  },

  /**
   * Get top active users
   * @param limit Number of users to return
   * @returns Top active users with statistics
   */
  getTopActiveUsers: async (limit = 10): Promise<UserActivityDTO[]> => {
    const response = await api.get("/dashboard/top-users", {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get document counts by type
   * @returns Document counts grouped by type
   */
  getDocumentCountsByType: async (): Promise<Record<string, number>> => {
    const response = await api.get("/dashboard/document-types");
    return response.data;
  },

  /**
   * Get document counts by month
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @returns Document counts grouped by month
   */
  getDocumentCountsByMonth: async (
    startDate: string,
    endDate: string
  ): Promise<Record<string, number>> => {
    const response = await api.get("/dashboard/document-counts-by-month", {
      params: {
        start: startDate,
        end: endDate,
      },
    });
    return response.data;
  },

  /**
   * Get document processing time statistics
   * @returns Statistics about document processing times
   */
  getProcessingTimeStatistics: async (): Promise<Record<string, number>> => {
    const response = await api.get("/dashboard/processing-times");
    return response.data;
  },

  /**
   * Get document volume report
   * @param startDate Start date (ISO format)
   * @param endDate End date (ISO format)
   * @returns Document volume report
   */
  getDocumentVolumeReport: async (
    startDate: string,
    endDate: string
  ): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/reports/document-volume", {
      params: {
        start: startDate,
        end: endDate,
      },
    });
    return response.data;
  },

  /**
   * Get department performance report
   * @returns Department performance metrics
   */
  getDepartmentPerformanceReport: async (): Promise<Record<string, any>> => {
    const response = await api.get("/dashboard/reports/department-performance");
    return response.data;
  },
};

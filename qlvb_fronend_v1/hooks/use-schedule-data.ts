import { useEffect, useState, useRef, useCallback } from "react";
import {
  ResponseDTO,
  ScheduleDTO,
  schedulesAPI,
  ScheduleListParams,
  PaginatedScheduleResponse,
} from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useSchedules } from "@/lib/store";
import { useHierarchicalDepartments } from "@/hooks/use-hierarchical-departments";
import { usePageVisibility } from "@/hooks/use-page-visibility";

export function useScheduleData() {
  const { toast } = useToast();
  const { schedules, loading, setSchedules, setLoading } = useSchedules();
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Helper để lấy tuần hiện tại
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  const getCurrentYear = () => new Date().getFullYear().toString();

  // Add state for current filters to pass to API - mặc định tuần hiện tại
  const [currentFilters, setCurrentFilters] = useState<{
    weekFilter?: string;
    monthFilter?: string;
    yearFilter?: string;
    statusFilter?: string;
    departmentFilter?: string;
  }>({
    weekFilter: getCurrentWeek().toString(),
    monthFilter: "all",
    yearFilter: getCurrentYear(),
    statusFilter: "all",
    departmentFilter: "all",
  });

  // Refs to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const isFilteringRef = useRef(false);
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiCallInProgressRef = useRef(false); // New ref to track API calls
  const apiDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const {
    visibleDepartments,
    userDepartmentIds,
    loading: loadingDepartments,
    hasFullAccess,
    error: departmentsError,
    allDepartments,
  } = useHierarchicalDepartments();

  const isPageVisible = usePageVisibility();

  // Debug visibleDepartments to see if they're loading
  useEffect(() => {
  

    if (departmentsError) {
    }
  }, [
    visibleDepartments,
    loadingDepartments,
    departmentsError,
    allDepartments,
    hasFullAccess,
  ]);

  // Helper function to get simplified status
  const getSimplifiedStatus = useCallback((status: string) => {
    if (
      ["draft", "pending", "submitted", "rejected", "chua_dien_ra"].includes(
        status
      )
    ) {
      return "chua_dien_ra";
    } else if (["approved", "dang_thuc_hien"].includes(status)) {
      return "dang_thuc_hien";
    } else if (["completed", "da_thuc_hien"].includes(status)) {
      return "da_thuc_hien";
    }
    return "chua_dien_ra";
  }, []);

  // SINGLE CENTRALIZED API CALL FUNCTION - all API calls must go through this
  const fetchSchedulesWithDebounce = useCallback(
    (params: ScheduleListParams, showToast = false) => {
      // Clear any existing timer
      if (apiDebounceTimerRef.current) {
        clearTimeout(apiDebounceTimerRef.current);
      }

      // If an API call is already in progress, don't start another one
      if (apiCallInProgressRef.current) {
        return;
      }

      // Set a timer to make the actual API call
      apiDebounceTimerRef.current = setTimeout(() => {
        // Mark that an API call is in progress
        apiCallInProgressRef.current = true;
        setLoading(true);


        schedulesAPI
          .getAllSchedules(params)
          .then((response) => {
            if (response.message === "Success" && response.data) {
              const paginatedData = response.data;
              const newSchedules: ScheduleDTO[] = paginatedData.content || [];

              setAllSchedules(newSchedules);
              setSchedules(newSchedules);
              setTotalElements(paginatedData.totalElements);
              setTotalPages(paginatedData.totalPages);

              // Only update page/size if they match the request
              if (params.page !== undefined) {
                setCurrentPage(params.page);
              }

              if (params.size !== undefined) {
                setPageSize(params.size);
              }

              if (showToast) {
                toast({
                  title: "Thành công",
                  description: "Đã cập nhật danh sách lịch công tác",
                });
              }
            }
          })
          .catch((error) => {
            if (showToast) {
              toast({
                title: "Lỗi",
                description:
                  "Không thể tải lịch công tác. Vui lòng thử lại sau.",
                variant: "destructive",
              });
            }
          })
          .finally(() => {
            setLoading(false);
            setRefreshing(false);
            // Reset the API call flag after a short delay
            setTimeout(() => {
              apiCallInProgressRef.current = false;
            }, 500);
          });
      }, 300); // Debounce by 300ms
    },
    [setLoading, setSchedules, toast]
  );

  // Note: Initial fetch is now handled by filters auto-applying default values

  // Significantly simplified filter logic - now called manually via button
  const applyFilters = useCallback(
    (filters: {
      weekFilter?: string;
      monthFilter?: string;
      yearFilter?: string;
      statusFilter?: string;
      departmentFilter?: string;
    }) => {
      // Store current filters for pagination
      setCurrentFilters(filters);
      
      // Reset to first page
      setCurrentPage(0);

      // Build API parameters
      const params: ScheduleListParams = {
        page: 0,
        size: pageSize,
      };

      console.log("Schedule filters received:", filters);

      // Helper functions để convert date filters thành date ranges
      const getWeekDateRange = (year: number, week: number) => {
        const startOfYear = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7 - startOfYear.getDay();
        const startOfWeek = new Date(startOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        return {
          fromDate: startOfWeek.toISOString().split('T')[0], // YYYY-MM-DD
          toDate: endOfWeek.toISOString().split('T')[0]
        };
      };

      const getMonthDateRange = (year: number, month: number) => {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0); // Last day of month
        
        return {
          fromDate: startOfMonth.toISOString().split('T')[0],
          toDate: endOfMonth.toISOString().split('T')[0]
        };
      };

      const getYearDateRange = (year: number) => {
        return {
          fromDate: `${year}-01-01`,
          toDate: `${year}-12-31`
        };
      };

      // Determine which API endpoint to call based on date filters
      // Priority: Week > Month > Year > General (tuần có ưu tiên cao nhất)
      // Convert date filters to fromDate/toDate format that backend expects
      
      // Apply date filters to params
      if (filters?.weekFilter && filters.weekFilter !== "all" && 
          filters?.yearFilter && filters.yearFilter !== "all") {
        // Add week range to params
        const year = parseInt(filters.yearFilter);
        const week = parseInt(filters.weekFilter);
        const { fromDate, toDate } = getWeekDateRange(year, week);
        params.fromDate = fromDate;
        params.toDate = toDate;
        console.log("Applied week filter:", week, "year:", year, "range:", fromDate, "to", toDate);
      } else if (filters?.monthFilter && filters.monthFilter !== "all" && 
                 filters?.yearFilter && filters.yearFilter !== "all") {
        // Add month range to params
        const year = parseInt(filters.yearFilter);
        const month = parseInt(filters.monthFilter);
        const { fromDate, toDate } = getMonthDateRange(year, month);
        params.fromDate = fromDate;
        params.toDate = toDate;
        console.log("Applied month filter:", month, "year:", year, "range:", fromDate, "to", toDate);
      } else if (filters?.yearFilter && filters.yearFilter !== "all") {
        // Add year range to params
        const year = parseInt(filters.yearFilter);
        const { fromDate, toDate } = getYearDateRange(year);
        params.fromDate = fromDate;
        params.toDate = toDate;
        console.log("Applied year filter:", year, "range:", fromDate, "to", toDate);
      }

      // Apply status filter
      if (filters?.statusFilter && filters.statusFilter !== "all") {
        params.status = filters.statusFilter;
      }

      // Apply department filter with same logic as work plans
      if (filters?.departmentFilter && filters.departmentFilter !== "all") {
        params.departmentId = parseInt(filters.departmentFilter);
      } else if (!hasFullAccess && userDepartmentIds.length > 0) {
        // If "all" selected but user doesn't have full access, use user's department
        params.departmentId = userDepartmentIds[0];
      }

      console.log("Final schedule params:", params);
      fetchSchedulesWithDebounce(params);
    },
    [
      fetchSchedulesWithDebounce,
      pageSize,
      hasFullAccess,
      userDepartmentIds,
    ]
  );

  // Simplified page change handler
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      
      // Build params with current filters and new page
      const params: ScheduleListParams = {
        page,
        size: pageSize,
      };

      // Helper functions để convert date filters thành date ranges (same as applyFilters)
      const getWeekDateRange = (year: number, week: number) => {
        const startOfYear = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7 - startOfYear.getDay();
        const startOfWeek = new Date(startOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        return {
          fromDate: startOfWeek.toISOString().split('T')[0],
          toDate: endOfWeek.toISOString().split('T')[0]
        };
      };

      const getMonthDateRange = (year: number, month: number) => {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        
        return {
          fromDate: startOfMonth.toISOString().split('T')[0],
          toDate: endOfMonth.toISOString().split('T')[0]
        };
      };

      const getYearDateRange = (year: number) => {
        return {
          fromDate: `${year}-01-01`,
          toDate: `${year}-12-31`
        };
      };

      // Apply current date filters
      if (currentFilters?.weekFilter && currentFilters.weekFilter !== "all" && 
          currentFilters?.yearFilter && currentFilters.yearFilter !== "all") {
        const year = parseInt(currentFilters.yearFilter);
        const week = parseInt(currentFilters.weekFilter);
        const { fromDate, toDate } = getWeekDateRange(year, week);
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else if (currentFilters?.monthFilter && currentFilters.monthFilter !== "all" && 
                 currentFilters?.yearFilter && currentFilters.yearFilter !== "all") {
        const year = parseInt(currentFilters.yearFilter);
        const month = parseInt(currentFilters.monthFilter);
        const { fromDate, toDate } = getMonthDateRange(year, month);
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else if (currentFilters?.yearFilter && currentFilters.yearFilter !== "all") {
        const year = parseInt(currentFilters.yearFilter);
        const { fromDate, toDate } = getYearDateRange(year);
        params.fromDate = fromDate;
        params.toDate = toDate;
      }

      // Apply current filters
      if (currentFilters?.statusFilter && currentFilters.statusFilter !== "all") {
        params.status = currentFilters.statusFilter;
      }

      if (currentFilters?.departmentFilter && currentFilters.departmentFilter !== "all") {
        params.departmentId = parseInt(currentFilters.departmentFilter);
      } else if (!hasFullAccess && userDepartmentIds.length > 0) {
        params.departmentId = userDepartmentIds[0];
      }

      fetchSchedulesWithDebounce(params);
    },
    [pageSize, fetchSchedulesWithDebounce, currentFilters, hasFullAccess, userDepartmentIds]
  );

  // Simplified page size change handler
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(0);
      
      // Build params with current filters and new page size
      const params: ScheduleListParams = {
        page: 0,
        size,
      };

      // Helper functions để convert date filters thành date ranges (same as applyFilters)
      const getWeekDateRange = (year: number, week: number) => {
        const startOfYear = new Date(year, 0, 1);
        const daysToAdd = (week - 1) * 7 - startOfYear.getDay();
        const startOfWeek = new Date(startOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        return {
          fromDate: startOfWeek.toISOString().split('T')[0],
          toDate: endOfWeek.toISOString().split('T')[0]
        };
      };

      const getMonthDateRange = (year: number, month: number) => {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);
        
        return {
          fromDate: startOfMonth.toISOString().split('T')[0],
          toDate: endOfMonth.toISOString().split('T')[0]
        };
      };

      const getYearDateRange = (year: number) => {
        return {
          fromDate: `${year}-01-01`,
          toDate: `${year}-12-31`
        };
      };

      // Apply current date filters
      if (currentFilters?.weekFilter && currentFilters.weekFilter !== "all" && 
          currentFilters?.yearFilter && currentFilters.yearFilter !== "all") {
        const year = parseInt(currentFilters.yearFilter);
        const week = parseInt(currentFilters.weekFilter);
        const { fromDate, toDate } = getWeekDateRange(year, week);
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else if (currentFilters?.monthFilter && currentFilters.monthFilter !== "all" && 
                 currentFilters?.yearFilter && currentFilters.yearFilter !== "all") {
        const year = parseInt(currentFilters.yearFilter);
        const month = parseInt(currentFilters.monthFilter);
        const { fromDate, toDate } = getMonthDateRange(year, month);
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else if (currentFilters?.yearFilter && currentFilters.yearFilter !== "all") {
        const year = parseInt(currentFilters.yearFilter);
        const { fromDate, toDate } = getYearDateRange(year);
        params.fromDate = fromDate;
        params.toDate = toDate;
      }

      // Apply current filters
      if (currentFilters?.statusFilter && currentFilters.statusFilter !== "all") {
        params.status = currentFilters.statusFilter;
      }

      if (currentFilters?.departmentFilter && currentFilters.departmentFilter !== "all") {
        params.departmentId = parseInt(currentFilters.departmentFilter);
      } else if (!hasFullAccess && userDepartmentIds.length > 0) {
        params.departmentId = userDepartmentIds[0];
      }

      fetchSchedulesWithDebounce(params);
    },
    [fetchSchedulesWithDebounce, currentFilters, hasFullAccess, userDepartmentIds]
  );

  // Simplified force refresh
  const handleForceRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSchedulesWithDebounce({ page: currentPage, size: pageSize }, true);
  }, [currentPage, pageSize, fetchSchedulesWithDebounce]);

  return {
    schedules,
    loading: loading || loadingDepartments,
    refreshing,
    visibleDepartments,
    loadingDepartments,
    departmentsError,
    allSchedules,
    applyFilters,
    handleForceRefresh,
    getSimplifiedStatus,
    filterTimeoutRef,
    // Pagination properties
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
  };
}

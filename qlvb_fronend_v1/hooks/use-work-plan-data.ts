"use client";

import { useState, useEffect, useRef } from "react";
import { workPlansAPI } from "@/lib/api/workPlans";
import { useToast } from "@/components/ui/use-toast";
import { useHierarchicalDepartments } from "@/hooks/use-hierarchical-departments";
import type { WorkPlanDTO } from "@/lib/api/workPlans";

export function useWorkPlanData() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isForceUpdating, setIsForceUpdating] = useState(false);
  const [workPlans, setWorkPlans] = useState<WorkPlanDTO[]>([]);
  const [allWorkPlans, setAllWorkPlans] = useState<WorkPlanDTO[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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
    activeTab?: string;
  }>({
    weekFilter: getCurrentWeek().toString(),
    monthFilter: "all",
    yearFilter: getCurrentYear(),
    statusFilter: "all",
    departmentFilter: "all",
    activeTab: "all",
  });
  
  const hasFetchedWorkPlansRef = useRef(false);
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const {
    visibleDepartments,
    userDepartmentIds,
    loading: loadingDepartments,
    hasFullAccess,
  } = useHierarchicalDepartments();

  const userDepartmentIdsRef = useRef(userDepartmentIds);
  useEffect(() => {
    userDepartmentIdsRef.current = userDepartmentIds;
  }, [userDepartmentIds]);

  // Helper function to calculate overall progress from tasks
  const calculateOverallProgress = (tasks: any[] | undefined) => {
    if (!tasks || tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  // Helper function to map status to simplified status based on both status and actual progress
  const getSimplifiedStatus = (workPlan: WorkPlanDTO) => {
    const progress = calculateOverallProgress(workPlan.tasks);
    
    // If progress is 100%, it should be "completed" regardless of backend status
    if (progress >= 100) {
      return "da_thuc_hien";
    }
    
    // If progress > 0, it should be "in progress" regardless of backend status (unless completed)
    if (progress > 0 && progress < 100) {
      return "dang_thuc_hien";
    }

    // Otherwise, use the backend status for classification
    const status = workPlan.status;
    if (["draft", "pending", "approved", "rejected", "chua_dien_ra"].includes(status)) {
      return "chua_dien_ra";
    } else if (["in_progress", "dang_thuc_hien"].includes(status)) {
      return "dang_thuc_hien";
    } else if (["completed", "da_thuc_hien"].includes(status)) {
      return "da_thuc_hien";
    }
    return "chua_dien_ra"; // default
  };

  const fetchWorkPlans = async (forceRefresh = false, filters?: {
    weekFilter?: string;
    monthFilter?: string;
    yearFilter?: string;
    statusFilter?: string;
    departmentFilter?: string;
    activeTab?: string;
  }, customPage?: number) => {
    if (!forceRefresh && hasFetchedWorkPlansRef.current && allWorkPlans && allWorkPlans.length > 0 && !filters) {
      return;
    }

    try {
      setIsLoading(true);
          
      // Build API parameters - use customPage if provided, otherwise currentPage
      const pageToUse = customPage !== undefined ? customPage : currentPage;
      const params: any = {
        page: pageToUse - 1, // Backend usually uses 0-based indexing
        size: pageSize,
      };

      console.log("Fetching work plans with filters:", filters);
      console.log("Using page params:", params);
      console.log("Current filters state:", currentFilters);

      // Use passed filters or current filters from state
      const activeFilters = filters || currentFilters;

      let response;
      
      // Determine which API endpoint to call based on filters
      // Priority: Week > Month > Year > General
      // Tuần có ưu tiên cao nhất
      if (activeFilters?.weekFilter && activeFilters.weekFilter !== "all" && 
          activeFilters?.yearFilter && activeFilters.yearFilter !== "all") {
        // Call week endpoint
        const year = parseInt(activeFilters.yearFilter);
        const week = parseInt(activeFilters.weekFilter);
        
        // Determine department - if "all" selected, use user's department if no full access
        let departmentId = null;
        if (activeFilters?.departmentFilter && activeFilters.departmentFilter !== "all") {
          departmentId = parseInt(activeFilters.departmentFilter);
        } else if (!hasFullAccess && userDepartmentIdsRef.current.length > 0) {
          departmentId = userDepartmentIdsRef.current[0];
        }
        
        if (departmentId) {
          response = await workPlansAPI.getWorkPlansByDepartmentAndWeek(departmentId, year, week, params);
        } else {
          response = await workPlansAPI.getWorkPlansByWeek(year, week, params);
        }
      } else if (activeFilters?.monthFilter && activeFilters.monthFilter !== "all" && 
                 activeFilters?.yearFilter && activeFilters.yearFilter !== "all") {
        // Call month endpoint
        const year = parseInt(activeFilters.yearFilter);
        const month = parseInt(activeFilters.monthFilter);
        
        // Determine department - if "all" selected, use user's department if no full access
        let departmentId = null;
        if (activeFilters?.departmentFilter && activeFilters.departmentFilter !== "all") {
          departmentId = parseInt(activeFilters.departmentFilter);
        } else if (!hasFullAccess && userDepartmentIdsRef.current.length > 0) {
          departmentId = userDepartmentIdsRef.current[0];
        }
        
        if (departmentId) {
          response = await workPlansAPI.getWorkPlansByDepartmentAndMonth(departmentId, year, month, params);
        } else {
          response = await workPlansAPI.getWorkPlansByMonth(year, month, params);
        }
      } else if (activeFilters?.yearFilter && activeFilters.yearFilter !== "all") {
        // Call year endpoint
        const year = parseInt(activeFilters.yearFilter);
        
        // Determine department - if "all" selected, use user's department if no full access
        let departmentId = null;
        if (activeFilters?.departmentFilter && activeFilters.departmentFilter !== "all") {
          departmentId = parseInt(activeFilters.departmentFilter);
        } else if (!hasFullAccess && userDepartmentIdsRef.current.length > 0) {
          departmentId = userDepartmentIdsRef.current[0];
        }
        
        if (departmentId) {
          response = await workPlansAPI.getWorkPlansByDepartmentAndYear(departmentId, year, params);
        } else {
          response = await workPlansAPI.getWorkPlansByYear(year, params);
        }
      } else {
        // Call regular paginated endpoint with filters
        if (activeFilters?.statusFilter && activeFilters.statusFilter !== "all") {
          params.status = activeFilters.statusFilter;
        }

        // For regular endpoint, always apply department filter logic
        if (activeFilters?.departmentFilter && activeFilters.departmentFilter !== "all") {
          params.departmentId = activeFilters.departmentFilter;
        } else if (!hasFullAccess && userDepartmentIdsRef.current.length > 0) {
          // If "all" selected but user doesn't have full access, use user's department
          params.departmentId = userDepartmentIdsRef.current[0];
        }

        response = await workPlansAPI.getAllWorkPlansWithPagination(params);
      }

      console.log("Fetching work plans with filters:", filters);
      console.log("Fetched work plans response:", response);
      
      // Handle paginated response from API
      const { content, totalElements, totalPages, number } = response;
      setAllWorkPlans(content);
      setWorkPlans(content); // No client-side filtering needed
      setTotalElements(totalElements);
      setTotalPages(totalPages);
      // Sync currentPage with actual backend page (convert from 0-based to 1-based)
      setCurrentPage(number + 1);

      hasFetchedWorkPlansRef.current = true;
    } catch (error) {
      console.error("Error fetching work plans:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách kế hoạch. Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setWorkPlans([]);
      setAllWorkPlans([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (filters: {
    weekFilter?: string;
    monthFilter?: string;
    yearFilter?: string;
    statusFilter?: string;
    departmentFilter?: string;
    activeTab?: string;
  }) => {
    // Store current filters
    setCurrentFilters(filters);
    
    // Reset to first page and fetch from backend with filters
    setCurrentPage(1);
    hasFetchedWorkPlansRef.current = false;
    
    // Fetch data from backend with filters
    fetchWorkPlans(true, filters);
  };

  const handleForceRefresh = async () => {
    try {
      setIsForceUpdating(true);
      await workPlansAPI.forceUpdateAllStatuses();
      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái kế hoạch thành công.",
      });
      // Refresh data
      hasFetchedWorkPlansRef.current = false;
      setAllWorkPlans([]);
      await fetchWorkPlans(true);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái kế hoạch.",
        variant: "destructive",
      });
    } finally {
      setIsForceUpdating(false);
    }
  };

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
    // Force refresh with current filters but new page
    hasFetchedWorkPlansRef.current = false;
    await fetchWorkPlans(true, currentFilters, page);
  };

  const handlePageSizeChange = async (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    // Force refresh with current filters but new page size
    hasFetchedWorkPlansRef.current = false;
    await fetchWorkPlans(true, currentFilters);
  };

  const getWorkPlansByStatus = (status: string) => {
    return (workPlans || []).filter(
      (plan: WorkPlanDTO) => getSimplifiedStatus(plan) === status
    );
  };

  // Note: Initial fetch is now handled by filters auto-applying default values

  return {
    workPlans,
    allWorkPlans,
    isLoading,
    isForceUpdating,
    visibleDepartments,
    loadingDepartments,
    hasFullAccess,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    applyFilters,
    handleForceRefresh,
    getSimplifiedStatus,
    getWorkPlansByStatus,
    filterTimeoutRef,
  };
}

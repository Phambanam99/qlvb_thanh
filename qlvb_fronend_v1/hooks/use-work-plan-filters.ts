"use client";

import { useState, useEffect } from "react";
import type { WorkPlanDTO } from "@/lib/api/workPlans";

interface UseWorkPlanFiltersProps {
  applyFilters: (filters: {
    weekFilter?: string;
    monthFilter?: string;
    yearFilter?: string;
    statusFilter?: string;
    departmentFilter?: string;
    activeTab?: string;
  }) => void;
  filterTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | undefined>;
  allWorkPlans?: WorkPlanDTO[]; // Make optional to handle undefined
  loadingDepartments: boolean;
}

export function useWorkPlanFilters({
  applyFilters,
  filterTimeoutRef,
  allWorkPlans,
  loadingDepartments,
}: UseWorkPlanFiltersProps) {
  // Helper function để lấy tuần hiện tại
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  const getCurrentYear = () => new Date().getFullYear().toString();
  const getCurrentMonth = () => (new Date().getMonth() + 1).toString();

  // Date filters - mặc định tuần hiện tại
  const [weekFilter, setWeekFilter] = useState(getCurrentWeek().toString());
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(getCurrentYear());
  
  // Existing filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isFiltering, setIsFiltering] = useState(false);

  // Helper functions để handle mutual exclusion
  const handleWeekChange = (value: string) => {
    setWeekFilter(value);
    // Nếu chọn tuần (khác "all"), reset tháng về "all"
    if (value !== "all" && monthFilter !== "all") {
      setMonthFilter("all");
    }
  };

  const handleMonthChange = (value: string) => {
    setMonthFilter(value);
    // Nếu chọn tháng (khác "all"), reset tuần về "all"
    if (value !== "all" && weekFilter !== "all") {
      setWeekFilter("all");
    }
  };

  const handleApplyFilters = () => {
    setIsFiltering(true);
    
    applyFilters({
      weekFilter,
      monthFilter,
      yearFilter,
      statusFilter,
      departmentFilter,
      activeTab,
    });

    setTimeout(() => {
      setIsFiltering(false);
    }, 500);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    applyFilters({
      weekFilter,
      monthFilter,
      yearFilter,
      statusFilter,
      departmentFilter,
      activeTab: value,
    });
  };

  // Auto-apply filters khi component mount với tuần hiện tại
  useEffect(() => {
    if (!loadingDepartments) {
      applyFilters({
        weekFilter,
        monthFilter,
        yearFilter,
        statusFilter,
        departmentFilter,
        activeTab,
      });
    }
  }, [loadingDepartments]); // Chỉ chạy khi departments đã load xong

  // Note: With server-side filtering, auto-applying filters is handled 
  // by manual user interactions (filter dropdown changes, tab changes)
  // No automatic useEffect needed to prevent infinite loops

  return {
    // Date filters
    weekFilter,
    monthFilter,
    yearFilter,
    setWeekFilter: handleWeekChange,
    setMonthFilter: handleMonthChange,
    setYearFilter,
    
    // Existing filters
    statusFilter,
    departmentFilter,
    activeTab,
    isFiltering,
    setStatusFilter,
    setDepartmentFilter,
    handleApplyFilters,
    handleTabChange,
  };
}

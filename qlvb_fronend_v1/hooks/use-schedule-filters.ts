import { useState, useCallback, useEffect } from "react";

interface UseScheduleFiltersProps {
  applyFilters: (filters: {
    weekFilter?: string;
    monthFilter?: string;
    yearFilter?: string;
    statusFilter?: string;
    departmentFilter?: string;
  }) => void;
  filterTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  allSchedules: any[];
  loadingDepartments: boolean;
}

export function useScheduleFilters({
  applyFilters,
  filterTimeoutRef,
  allSchedules,
  loadingDepartments,
}: UseScheduleFiltersProps) {
  // Helper functions để lấy tuần hiện tại
  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  const getCurrentYear = () => new Date().getFullYear().toString();

  // Date filters - mặc định tuần hiện tại
  const [weekFilter, setWeekFilter] = useState(getCurrentWeek().toString());
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(getCurrentYear());
  
  // Existing filters
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFiltering, setIsFiltering] = useState(false);

  // Helper functions để handle mutual exclusion
  const handleWeekChange = useCallback((value: string) => {
    setWeekFilter(value);
    // Nếu chọn tuần (khác "all"), reset tháng về "all"
    if (value !== "all" && monthFilter !== "all") {
      setMonthFilter("all");
    }
  }, [monthFilter]);

  const handleMonthChange = useCallback((value: string) => {
    setMonthFilter(value);
    // Nếu chọn tháng (khác "all"), reset tuần về "all"
    if (value !== "all" && weekFilter !== "all") {
      setWeekFilter("all");
    }
  }, [weekFilter]);

  // Manual filter application function
  const handleApplyFilters = useCallback(() => {
    setIsFiltering(true);

    // Clear existing timeout
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Apply filters after a short delay to show loading state
    filterTimeoutRef.current = setTimeout(() => {
      applyFilters({
        weekFilter,
        monthFilter,
        yearFilter,
        statusFilter,
        departmentFilter,
      });
      setIsFiltering(false);
    }, 100);
  }, [
    weekFilter,
    monthFilter,
    yearFilter,
    statusFilter,
    departmentFilter,
    applyFilters,
    filterTimeoutRef,
  ]);

  // Auto-apply filters khi component mount với tuần hiện tại
  useEffect(() => {
    if (!loadingDepartments) {
      applyFilters({
        weekFilter,
        monthFilter,
        yearFilter,
        statusFilter,
        departmentFilter,
      });
    }
  }, [loadingDepartments]); // Chỉ chạy khi departments đã load xong

  return {
    // Date filters
    weekFilter,
    setWeekFilter: handleWeekChange,
    monthFilter,
    setMonthFilter: handleMonthChange,
    yearFilter,
    setYearFilter,
    
    // Existing filters
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    handleApplyFilters,
    isFiltering,
  };
}

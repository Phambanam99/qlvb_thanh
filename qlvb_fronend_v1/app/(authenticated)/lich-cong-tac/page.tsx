"use client";

import { Badge } from "@/components/ui/badge";
import { useScheduleData } from "@/hooks/use-schedule-data";
import { useScheduleFilters } from "@/hooks/use-schedule-filters";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import { ScheduleFilters } from "@/components/schedule/schedule-filters";
import { ScheduleTabs } from "@/components/schedule/schedule-tabs";

export default function SchedulesPage() {
  // Custom hooks for data management
  const {
    schedules,
    loading,
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
  } = useScheduleData();

  // Custom hooks for filter management
  const {
    // Date filters
    weekFilter,
    setWeekFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    
    // Existing filters
    departmentFilter,
    statusFilter,
    setStatusFilter,
    setDepartmentFilter,
    handleApplyFilters,
    isFiltering,
  } = useScheduleFilters({
    applyFilters,
    filterTimeoutRef,
    allSchedules,
    loadingDepartments,
  });

  // Helper functions
  const getStatusBadge = (status: string) => {
    const simplifiedStatus = getSimplifiedStatus(status);

    switch (simplifiedStatus) {
      case "chua_dien_ra":
        return <Badge variant="secondary">Chưa diễn ra</Badge>;
      case "dang_thuc_hien":
        return <Badge variant="default">Đang thực hiện</Badge>;
      case "da_thuc_hien":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Đã thực hiện
          </Badge>
        );
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  const getSchedulesByStatus = (status: string) => {
    return schedules.filter(
      (schedule) => getSimplifiedStatus(schedule.status) === status
    );
  };

  return (
    <div className="space-y-6">
      <ScheduleHeader
        refreshing={refreshing}
        onForceRefresh={handleForceRefresh}
      />

      {departmentsError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">
            <strong>Lỗi tải đơn vị:</strong> {departmentsError}
          </p>
        </div>
      )}

      <ScheduleFilters
        // Date filters
        weekFilter={weekFilter}
        onWeekFilterChange={setWeekFilter}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        yearFilter={yearFilter}
        onYearFilterChange={setYearFilter}
        
        // Existing filters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        visibleDepartments={visibleDepartments}
        loadingDepartments={loadingDepartments}
        onApplyFilters={handleApplyFilters}
        isFiltering={isFiltering}
      />

      {/* Chỉ sử dụng bảng - không cần ViewModeSelector */}
      <ScheduleTabs
        schedules={schedules}
        isLoading={loading}
        viewMode="table"
        departmentFilter={departmentFilter}
        getSchedulesByStatus={getSchedulesByStatus}
        currentPage={currentPage}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

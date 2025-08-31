"use client";

import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { workPlansAPI } from "@/lib/api/workPlans";
import type { WorkPlanDTO } from "@/lib/api/workPlans";
import { WorkPlanHeader } from "@/components/work-plans/work-plan-header";
import { WorkPlanFilters } from "@/components/work-plans/work-plan-filters";
import { WorkPlanTabs } from "@/components/work-plans/work-plan-tabs";
import { useWorkPlanData } from "@/hooks/use-work-plan-data";
import { useWorkPlanFilters } from "@/hooks/use-work-plan-filters";

export default function WorkPlansPage() {
  const { toast } = useToast();
  const { hasRole } = useAuth();

  // Custom hooks for data management
  const {
    workPlans,
    allWorkPlans,
    isLoading,
    isForceUpdating,
    visibleDepartments,
    loadingDepartments,
    currentPage,
    pageSize,
    totalElements,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    applyFilters,
    handleForceRefresh,
    getWorkPlansByStatus,
    filterTimeoutRef,
  } = useWorkPlanData();

  // Custom hooks for filter management
  const {
    // Date filters - thay thế search
    weekFilter,
    monthFilter,
    yearFilter,
    setWeekFilter,
    setMonthFilter,
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
  } = useWorkPlanFilters({
    applyFilters,
    filterTimeoutRef,
    allWorkPlans,
    loadingDepartments,
  });

  const handleStartWorkPlan = async (workPlan: WorkPlanDTO) => {
    try {
      await workPlansAPI.startWorkPlan(workPlan.id);
      toast({
        title: "Thành công",
        description: "Đã bắt đầu thực hiện kế hoạch",
      });
      // Refresh data by applying current filters
      applyFilters({
        weekFilter,
        monthFilter,
        yearFilter,
        statusFilter,
        departmentFilter,
        activeTab,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể bắt đầu kế hoạch",
        variant: "destructive",
      });
    }
  };

  const handleCompleteWorkPlan = async (workPlan: WorkPlanDTO) => {
    try {
      await workPlansAPI.completeWorkPlan(workPlan.id);
      toast({
        title: "Thành công",
        description: "Đã hoàn thành kế hoạch",
      });
      // Refresh data by applying current filters
      applyFilters({
        weekFilter,
        monthFilter,
        yearFilter,
        statusFilter,
        departmentFilter,
        activeTab,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể hoàn thành kế hoạch",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <WorkPlanHeader
        refreshing={isForceUpdating}
        onForceRefresh={handleForceRefresh}
      />

      <WorkPlanFilters
        weekFilter={weekFilter}
        onWeekFilterChange={setWeekFilter}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
        yearFilter={yearFilter}
        onYearFilterChange={setYearFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        visibleDepartments={visibleDepartments}
        loadingDepartments={loadingDepartments}
        onApplyFilters={handleApplyFilters}
        isFiltering={isFiltering}
      />

      <WorkPlanTabs
        workPlans={workPlans}
        isLoading={isLoading}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        getWorkPlansByStatus={getWorkPlansByStatus}
        currentPage={currentPage}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onStart={handleStartWorkPlan}
        onComplete={handleCompleteWorkPlan}
      />
    </div>
  );
}

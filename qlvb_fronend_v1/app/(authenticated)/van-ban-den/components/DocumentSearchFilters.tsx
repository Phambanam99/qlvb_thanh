/**
 * Document Search and Filters Component
 * Handles all filtering logic for documents
 */

import { Search, Filter, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentSearchFiltersProps {
  // Search state
  searchQuery: string;
  onSearchChange: (value: string) => void;

  // Filter states
  statusFilter: string;
  departmentFilter: string;
  startDate: string;
  endDate: string;
  issuingAuthorityFilter: string;

  // Filter handlers
  onStatusFilterChange: (value: string) => void;
  onDepartmentFilterChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onIssuingAuthorityChange: (value: string) => void;

  // Data
  visibleDepartments: any[];
  availableAuthorities: string[];

  // State
  activeTab: "internal" | "external";
  hasFullAccess: boolean;
  hasVanThuRole: boolean;
  isAddLoading: boolean;

  // Actions
  onRefresh: () => void;
  onResetFilters: () => void;
  onAddDocument: () => void;
}

const SIMPLIFIED_STATUS_GROUPS = {
  pending: { code: "pending", displayName: "Đang xử lý" },
  completed: { code: "completed", displayName: "Đã xử lý" },
  not_processed: { code: "not_processed", displayName: "Chưa xử lý" },
};

export function DocumentSearchFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  departmentFilter,
  startDate,
  endDate,
  issuingAuthorityFilter,
  onStatusFilterChange,
  onDepartmentFilterChange,
  onStartDateChange,
  onEndDateChange,
  onIssuingAuthorityChange,
  visibleDepartments,
  availableAuthorities,
  activeTab,
  hasFullAccess,
  hasVanThuRole,
  isAddLoading,
  onRefresh,
  onResetFilters,
  onAddDocument,
}: DocumentSearchFiltersProps) {
  const hasActiveFilters =
    searchQuery ||
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    startDate ||
    endDate ||
    issuingAuthorityFilter !== "all";

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      {/* Left side - Search and Department Filter */}
      <div className="flex w-full sm:w-auto items-center space-x-2">
        {/* Search Input */}
        <div className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm văn bản..."
            className="pl-10 w-full border-primary/20 focus:border-primary"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Department Filter - Only for external tab with full access */}
        {hasFullAccess && activeTab === "external" && (
          <Select
            value={departmentFilter}
            onValueChange={onDepartmentFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[220px] border-primary/20">
              <SelectValue placeholder="Phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {visibleDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.level > 0 ? "\u00A0".repeat(dept.level * 2) + "└ " : ""}
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Right side - Filters and Actions */}
      <div className="flex w-full sm:w-auto items-center space-x-3">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px] border-primary/20">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {activeTab === "internal" ? (
              <>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="SENT">Đã gửi</SelectItem>
                <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
              </>
            ) : (
              Object.entries(SIMPLIFIED_STATUS_GROUPS).map(([key, group]) => (
                <SelectItem key={key} value={key}>
                  {group.displayName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Date Range Filters */}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full sm:w-[150px] border-primary/20"
          title={activeTab === "external" ? "Từ ngày nhận" : "Từ ngày ký"}
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full sm:w-[150px] border-primary/20"
          title={activeTab === "external" ? "Đến ngày nhận" : "Đến ngày ký"}
        />

        {/* Issuing Authority Filter - Only for external tab */}
        {activeTab === "external" && availableAuthorities.length > 0 && (
          <Select
            value={issuingAuthorityFilter}
            onValueChange={onIssuingAuthorityChange}
          >
            <SelectTrigger className="w-full sm:w-[200px] border-primary/20">
              <SelectValue placeholder="Đơn vị gửi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đơn vị</SelectItem>
              {availableAuthorities.map((authority) => (
                <SelectItem key={authority} value={authority}>
                  {authority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Action Buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          title="Làm mới danh sách"
          className="border-primary/20 hover:bg-primary/10 hover:text-primary"
        >
          <Filter className="h-4 w-4" />
        </Button>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
          >
            Xóa lọc
          </Button>
        )}

        {/* Add Document Button - Only for Van Thu role on external tab */}
        {hasVanThuRole && activeTab === "external" && (
          <Button
            onClick={onAddDocument}
            disabled={isAddLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isAddLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Thêm mới
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

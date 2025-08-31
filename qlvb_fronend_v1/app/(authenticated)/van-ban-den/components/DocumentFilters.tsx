/**
 * Document filters component for văn bản đến
 * Modular, reusable filtering interface
 */

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, RotateCcw } from "lucide-react";
import { DocumentFilters, UserPermissions } from "../types";
import { getStatusFilterOptions } from "../utils/status-utils";
import { getAvailableDocumentSources } from "../utils/permission-utils";

interface DocumentFiltersProps {
  filters: DocumentFilters;
  onFiltersChange: (filters: Partial<DocumentFilters>) => void;
  onResetFilters: () => void;
  userPermissions: UserPermissions;
  visibleDepartments?: Array<{ id: number; name: string; children?: any[] }>;
  availableAuthorities?: string[];
  isLoading?: boolean;
}

export const DocumentFiltersComponent: React.FC<DocumentFiltersProps> = ({
  filters,
  onFiltersChange,
  onResetFilters,
  userPermissions,
  visibleDepartments = [],
  availableAuthorities = [],
  isLoading = false,
}) => {
  const statusOptions = getStatusFilterOptions();
  const sourceOptions = getAvailableDocumentSources(userPermissions);

  const handleFilterChange = (key: keyof DocumentFilters, value: string) => {
    onFiltersChange({ [key]: value });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.statusFilter !== "all" ||
    filters.departmentFilter !== "all" ||
    filters.issuingAuthorityFilter !== "all" ||
    filters.startDate ||
    filters.endDate;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm văn bản..."
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Select
              value={filters.statusFilter}
              onValueChange={(value) =>
                handleFilterChange("statusFilter", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Source Filter (for privileged users) */}
          {sourceOptions.length > 1 && (
            <div>
              <Select
                value={userPermissions.documentSource}
                onValueChange={(value) =>
                  handleFilterChange("departmentFilter", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nguồn văn bản" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department Filter */}
          {visibleDepartments.length > 0 && (
            <div>
              <Select
                value={filters.departmentFilter}
                onValueChange={(value) =>
                  handleFilterChange("departmentFilter", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {visibleDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Issuing Authority Filter */}
          {availableAuthorities.length > 0 && (
            <div>
              <Select
                value={filters.issuingAuthorityFilter}
                onValueChange={(value) =>
                  handleFilterChange("issuingAuthorityFilter", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
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
            </div>
          )}
        </div>

        {/* Date Range Filters */}
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div>
            <Input
              type="date"
              placeholder="Từ ngày"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="Đến ngày"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              disabled={!hasActiveFilters || isLoading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Filter className="h-4 w-4" />
              <span>Đang áp dụng bộ lọc</span>
              {filters.searchQuery && (
                <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                  "{filters.searchQuery}"
                </span>
              )}
              {filters.statusFilter !== "all" && (
                <span className="bg-blue-100 px-2 py-1 rounded text-xs">
                  {
                    statusOptions.find(
                      (opt) => opt.value === filters.statusFilter
                    )?.label
                  }
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

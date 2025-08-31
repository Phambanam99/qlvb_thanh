/**
 * Search Filters Component for văn bản đến
 * Reusable search and filter component với manual search button và year/month filter cho internal documents
 */

import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFiltersProps {
  // Search state
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeSearchQuery: string;

  // Year/month filter states for internal documents
  yearFilter?: number;
  monthFilter?: number;

  // Filter states  
  departmentFilter: string;
  dateFromFilter: string;
  dateToFilter: string;
  statusFilter: string;
  issuingAuthorityFilter: string;
  activeTab: "internal" | "external";

  // Data
  hasFullAccess: boolean;
  visibleDepartments: any[];
  availableAuthorities: string[];

  // Actions
  onSearch: () => void;
  onClearSearch: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent) => void;
  onYearFilterChange?: (year: number) => void;
  onMonthFilterChange?: (month: number | undefined) => void;
  onApplyFilters?: () => void;
  onDepartmentFilterChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onIssuingAuthorityChange: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  onTabChange?: (value: string) => void;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  activeSearchQuery,
  yearFilter,
  monthFilter,
  departmentFilter,
  dateFromFilter,
  dateToFilter,
  statusFilter,
  issuingAuthorityFilter,
  activeTab,
  hasFullAccess,
  visibleDepartments,
  availableAuthorities,
  onSearch,
  onClearSearch,
  onSearchKeyPress,
  onYearFilterChange,
  onMonthFilterChange,
  onApplyFilters,
  onDepartmentFilterChange,
  onDateFromChange,
  onDateToChange,
  onStatusFilterChange,
  onIssuingAuthorityChange,
  onClearFilters,
  onRefresh,
}: SearchFiltersProps) {
  // Dynamic placeholder based on active tab
  const searchPlaceholder = activeTab === "internal" 
    ? "Tìm kiếm văn bản nội bộ..."
    : "Tìm kiếm văn bản bên ngoài...";

  // Generate years list from 2019 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2018 }, (_, i) => 2019 + i);

  // Generate months list
  const months = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Section with Year/Month filters for Internal Documents */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Left side: Search and filters */}
        <div className="flex w-full lg:w-auto items-center space-x-2 flex-wrap gap-y-2">
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 w-full border-primary/20 focus:border-primary"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyPress={onSearchKeyPress}
            />
          </div>
          
          <Button
            onClick={onSearch}
            variant="default"
            size="sm"
            className="whitespace-nowrap bg-primary hover:bg-primary/90 text-white"
            disabled={!searchQuery.trim()}
          >
            <Search className="h-4 w-4 mr-1" />
            Tìm kiếm
          </Button>
          
          {activeSearchQuery && (
            <Button
              onClick={onClearSearch}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              Xóa tìm kiếm
            </Button>
          )}

          {/* Year/Month Filter for Internal Documents - on same row */}
          {activeTab === "internal" && (
            <>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium whitespace-nowrap">Năm:</span>
                <Select
                  value={yearFilter?.toString() || ""}
                  onValueChange={(value: string) => onYearFilterChange?.(value ? Number(value) : currentYear)}
                >
                  <SelectTrigger className="w-[120px] border-primary/20 focus:border-primary">
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium whitespace-nowrap">Tháng:</span>
                <Select
                  value={monthFilter?.toString() || "all"}
                  onValueChange={(value: string) => onMonthFilterChange?.(value === "all" ? undefined : Number(value))}
                >
                  <SelectTrigger className="w-[130px] border-primary/20 focus:border-primary">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tháng</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={onApplyFilters}
                variant="default"
                size="sm"
                className="whitespace-nowrap bg-primary hover:bg-primary/90"
              >
                <Filter className="h-4 w-4 mr-1" />
                Áp dụng
              </Button>
            </>
          )}
        </div>

        {/* Right side: Clear filters button */}
        <div className="flex w-full sm:w-auto items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="border-primary/20 hover:bg-primary/10"
          >
            <X className="h-4 w-4 mr-2" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* Search Status Indicator */}
      {activeSearchQuery && (
        <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          <strong>Đang tìm:</strong> "{activeSearchQuery}"
        </div>
      )}
    </div>
  );
}

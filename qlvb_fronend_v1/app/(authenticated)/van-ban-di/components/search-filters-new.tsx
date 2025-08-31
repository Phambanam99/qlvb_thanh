"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Plus } from "lucide-react";
import Link from "next/link";

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeSearchQuery: string;
  departmentFilter: string;
  yearFilter?: number;
  monthFilter?: number;
  statusFilter: string;
  activeTab: string;
  hasFullAccess: boolean;
  visibleDepartments: any[];
  onSearch: () => void;
  onClearSearch: () => void;
  onSearchKeyPress: (e: React.KeyboardEvent) => void;
  onDepartmentFilterChange: (value: string) => void;
  onYearFilterChange?: (value: number) => void;
  onMonthFilterChange?: (value: number | undefined) => void;
  onStatusFilterChange: (value: string) => void;
  onClearFilters: () => void;
  onTabChange?: (tab: string) => void;
}

export function SearchFilters({
  searchQuery,
  setSearchQuery,
  activeSearchQuery,
  departmentFilter,
  yearFilter,
  monthFilter,
  statusFilter,
  activeTab,
  hasFullAccess,
  visibleDepartments,
  onSearch,
  onClearSearch,
  onSearchKeyPress,
  onDepartmentFilterChange,
  onYearFilterChange,
  onMonthFilterChange,
  onStatusFilterChange,
  onClearFilters,
}: SearchFiltersProps) {
  // Tạo danh sách năm từ 2020 đến năm hiện tại + 2
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2018 }, (_, i) => 2019 + i);

  // Danh sách tháng
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
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
      {/* Search section - Tối ưu cho từng tab */}
      <div className="flex w-full lg:w-auto items-center space-x-2 flex-wrap gap-y-2">
        <div className="flex items-center space-x-2">
          {/* Search input với placeholder động theo tab */}
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "internal" 
                  ? "Tìm kiếm văn bản nội bộ..." 
                  : "Tìm kiếm văn bản bên ngoài..."
              }
              className="pl-10 w-full border-primary/20 focus:border-primary"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyPress={onSearchKeyPress}
            />
          </div>
          {/* Search button - rõ ràng và nổi bật */}
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
          {/* Clear search button */}
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
        </div>

        {/* Search status indicator */}
        {activeSearchQuery && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-md">
            <Search className="h-3 w-3 text-blue-600" />
            <span className="text-xs text-blue-600">
              Đang tìm kiếm: "{activeSearchQuery}"
            </span>
          </div>
        )}

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
              {visibleDepartments.map((dept: any) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.level > 0
                    ? "\u00A0".repeat(dept.level * 2) + "└ "
                    : ""}
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex w-full sm:w-auto items-center space-x-3 flex-wrap gap-y-2">
        {/* Filter theo tháng-năm chỉ cho internal documents */}
        {activeTab === "internal" && (
          <>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium whitespace-nowrap">Năm:</span>
              <Select
                value={yearFilter?.toString() || ""}
                onValueChange={(value) => onYearFilterChange?.(value ? Number(value) : currentYear)}
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
                value={monthFilter?.toString() || ""}
                onValueChange={(value) => onMonthFilterChange?.(value ? Number(value) : undefined)}
              >
                <SelectTrigger className="w-[130px] border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả tháng</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary"
          onClick={onClearFilters}
          title="Xóa bộ lọc"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link
            href={
              activeTab === "internal"
                ? "/van-ban-di/them-moi/noi-bo/tao-moi"
                : "/van-ban-di/them-moi/ben-ngoai/tao-moi"
            }
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" /> Thêm mới
          </Link>
        </Button>
      </div>
    </div>
  );
}

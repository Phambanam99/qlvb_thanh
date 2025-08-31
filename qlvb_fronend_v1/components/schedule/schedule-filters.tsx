import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface ScheduleFiltersProps {
  // Date filters - thay thế search
  weekFilter: string;
  onWeekFilterChange: (value: string) => void;
  monthFilter: string;
  onMonthFilterChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  
  // Existing filters
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  visibleDepartments: any[];
  loadingDepartments: boolean;
  onApplyFilters: () => void;
  isFiltering: boolean;
}

export function ScheduleFilters({
  weekFilter,
  onWeekFilterChange,
  monthFilter,
  onMonthFilterChange,
  yearFilter,
  onYearFilterChange,
  statusFilter,
  onStatusFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  visibleDepartments,
  loadingDepartments,
  onApplyFilters,
  isFiltering,
}: ScheduleFiltersProps) {
  // Generate years list (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Generate months list
  const months = [
    { value: "1", label: "Tháng 1" },
    { value: "2", label: "Tháng 2" },
    { value: "3", label: "Tháng 3" },
    { value: "4", label: "Tháng 4" },
    { value: "5", label: "Tháng 5" },
    { value: "6", label: "Tháng 6" },
    { value: "7", label: "Tháng 7" },
    { value: "8", label: "Tháng 8" },
    { value: "9", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" },
  ];

  // Generate weeks list
  const weeks = Array.from({ length: 53 }, (_, i) => ({
    value: String(i + 1),
    label: `Tuần ${i + 1}`,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Date filters - thay thế search */}
      <Select value={yearFilter} onValueChange={onYearFilterChange}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Năm" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả năm</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={String(year)}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={monthFilter} 
        onValueChange={(value: string) => {
          onMonthFilterChange(value);
          // Nếu chọn tháng (khác "all"), reset tuần về "all"
          if (value !== "all" && weekFilter !== "all") {
            onWeekFilterChange("all");
          }
        }}
      >
        <SelectTrigger 
          className="w-full sm:w-[140px]"
          disabled={weekFilter !== "all"} // Disable khi đã chọn tuần
        >
          <SelectValue placeholder="Tháng" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả tháng</SelectItem>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        value={weekFilter} 
        onValueChange={(value: string) => {
          onWeekFilterChange(value);
          // Nếu chọn tuần (khác "all"), reset tháng về "all"
          if (value !== "all" && monthFilter !== "all") {
            onMonthFilterChange("all");
          }
        }}
      >
        <SelectTrigger 
          className="w-full sm:w-[140px]"
          disabled={monthFilter !== "all"} // Disable khi đã chọn tháng
        >
          <SelectValue placeholder="Tuần" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả tuần</SelectItem>
          {weeks.map((week) => (
            <SelectItem key={week.value} value={week.value}>
              {week.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem>
          <SelectItem value="chua_dien_ra">Chưa diễn ra</SelectItem>
          <SelectItem value="dang_thuc_hien">Đang thực hiện</SelectItem>
          <SelectItem value="da_thuc_hien">Đã thực hiện</SelectItem>
        </SelectContent>
      </Select>

      <Select value={departmentFilter} onValueChange={onDepartmentFilterChange}>
        <SelectTrigger
          className="w-full sm:w-[300px]"
          disabled={loadingDepartments}
        >
          <SelectValue
            placeholder={loadingDepartments ? "Đang tải..." : "Chọn đơn vị"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {!loadingDepartments && visibleDepartments && visibleDepartments.length <= 1 
              ? "Đơn vị hiện tại" 
              : "Tất cả đơn vị"}
          </SelectItem>
          {!loadingDepartments &&
          visibleDepartments &&
          visibleDepartments.length > 0
            ? visibleDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.level > 0 ? "\u00A0".repeat(dept.level * 2) + "└ " : ""}
                  {dept.name}
                </SelectItem>
              ))
            : !loadingDepartments && (
                <SelectItem value="no-departments" disabled>
                  Không có đơn vị nào
                </SelectItem>
              )}
        </SelectContent>
      </Select>

      {/* Filter button */}
      <Button
        onClick={onApplyFilters}
        disabled={isFiltering || loadingDepartments}
        className="w-full sm:w-auto"
      >
        <Filter className="h-4 w-4 mr-2" />
        {isFiltering ? "Đang lọc..." : "Lọc"}
      </Button>
    </div>
  );
}

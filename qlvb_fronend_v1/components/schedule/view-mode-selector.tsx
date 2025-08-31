import { Button } from "@/components/ui/button";
import {
  List,
  Calendar as CalendarIcon,
  CalendarDays,
  Table,
} from "lucide-react";

type ViewMode = "week" | "month" | "list" | "table";

interface ViewModeSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({
  viewMode,
  onViewModeChange,
}: ViewModeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Button
        variant={viewMode === "week" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("week")}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        Tuần
      </Button>
      <Button
        variant={viewMode === "month" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("month")}
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        Tháng
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("list")}
      >
        <List className="mr-2 h-4 w-4" />
        Danh sách
      </Button>
      <Button
        variant={viewMode === "table" ? "default" : "outline"}
        size="sm"
        onClick={() => onViewModeChange("table")}
      >
        <Table className="mr-2 h-4 w-4" />
        Bảng
      </Button>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

interface ScheduleHeaderProps {
  refreshing: boolean;
  onForceRefresh: () => void;
}

export function ScheduleHeader({
  refreshing,
  onForceRefresh,
}: ScheduleHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Lịch công tác</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onForceRefresh}
          disabled={refreshing}
          className="border-primary/20 hover:bg-primary/10 hover:text-primary"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Đang tải..." : "Làm mới"}
        </Button>
        <Button asChild>
          <Link href="/lich-cong-tac/tao-moi">
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch mới
          </Link>
        </Button>
      </div>
    </div>
  );
}

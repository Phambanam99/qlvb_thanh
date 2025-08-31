"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface WorkPlanHeaderProps {
  refreshing?: boolean;
  onForceRefresh?: () => void;
}

export function WorkPlanHeader({
  refreshing = false,
  onForceRefresh,
}: WorkPlanHeaderProps) {
  const { hasRole } = useAuth();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight">Kế hoạch công tác</h1>
      <div className="flex gap-2">
        {hasRole(["admin"]) && onForceRefresh && (
          <Button
            variant="outline"
            onClick={onForceRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
          </Button>
        )}
        <Button asChild>
          <Link href="/ke-hoach/tao-moi">
            <Plus className="mr-2 h-4 w-4" />
            Tạo kế hoạch mới
          </Link>
        </Button>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <p className="text-muted-foreground mb-4">
        Không tìm thấy lịch công tác nào phù hợp
      </p>
      <Button asChild>
        <Link href="/lich-cong-tac/tao-moi">
          <Plus className="mr-2 h-4 w-4" />
          Tạo lịch mới
        </Link>
      </Button>
    </div>
  );
}

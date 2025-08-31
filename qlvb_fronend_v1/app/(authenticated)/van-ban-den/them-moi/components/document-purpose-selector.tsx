"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DocumentPurposeSelectorProps {
  documentPurpose: "PROCESS" | "NOTIFICATION";
  onPurposeChange: (purpose: "PROCESS" | "NOTIFICATION") => void;
}

export function DocumentPurposeSelector({
  documentPurpose,
  onPurposeChange,
}: DocumentPurposeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Mục đích văn bản</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className={cn(
            "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors",
            documentPurpose === "PROCESS"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border"
          )}
          onClick={() => onPurposeChange("PROCESS")}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  documentPurpose === "PROCESS"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {documentPurpose === "PROCESS" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Cần xử lý</div>
              <div className="text-xs text-muted-foreground">
                Văn bản cần phòng ban xử lý cụ thể và có phản hồi
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors",
            documentPurpose === "NOTIFICATION"
              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
              : "border-border"
          )}
          onClick={() => onPurposeChange("NOTIFICATION")}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  documentPurpose === "NOTIFICATION"
                    ? "border-blue-500 bg-blue-500"
                    : "border-muted-foreground"
                )}
              >
                {documentPurpose === "NOTIFICATION" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Chỉ thông báo</div>
              <div className="text-xs text-muted-foreground">
                Văn bản chỉ cần thông báo, không cần xử lý cụ thể
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

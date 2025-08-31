"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Building2, Globe } from "lucide-react";

interface DocumentTypeSelectorProps {
  documentScope: "INTERNAL" | "EXTERNAL";
  onScopeChange: (scope: "INTERNAL" | "EXTERNAL") => void;
}

export function DocumentTypeSelector({
  documentScope,
  onScopeChange,
}: DocumentTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Phạm vi văn bản</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className={cn(
            "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors",
            documentScope === "INTERNAL"
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border"
          )}
          onClick={() => onScopeChange("INTERNAL")}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  documentScope === "INTERNAL"
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {documentScope === "INTERNAL" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <div className="text-sm font-medium">Văn bản nội bộ</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Văn bản gửi trong nội bộ đơn vị, không cần phê duyệt
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative flex cursor-pointer rounded-lg border p-4 hover:bg-accent/50 transition-colors",
            documentScope === "EXTERNAL"
              ? "border-green-500 bg-green-50 ring-1 ring-green-500"
              : "border-border"
          )}
          onClick={() => onScopeChange("EXTERNAL")}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2",
                  documentScope === "EXTERNAL"
                    ? "border-green-500 bg-green-500"
                    : "border-muted-foreground"
                )}
              >
                {documentScope === "EXTERNAL" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium">Văn bản bên ngoài</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Văn bản gửi ra bên ngoài đơn vị, cần phê duyệt
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface ProcessingSectionProps {
  primaryDepartment: number | null;
  secondaryDepartments: number[];
  validationErrors: Record<string, string>;
  findDepartmentById: (id: number) => any;
  onRemovePrimaryDepartment: () => void;
  onRemoveSecondaryDepartment: (deptId: number | string) => void;
  onClearSelection: () => void;
}

export function ProcessingSection({
  primaryDepartment,
  secondaryDepartments,
  validationErrors,
  findDepartmentById,
  onRemovePrimaryDepartment,
  onRemoveSecondaryDepartment,
  onClearSelection,
}: ProcessingSectionProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
        <Label className="text-base font-medium text-primary">
          Chuyển xử lý
        </Label>
      </div>

      {/* Primary Department Display */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-red-500 font-medium">
            Phòng ban xử lý chính <span className="text-red-500">*</span>
          </Label>
          {primaryDepartment && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-red-500"
              onClick={onRemovePrimaryDepartment}
              type="button"
            >
              Bỏ chọn
            </Button>
          )}
        </div>
        <div
          className={`min-h-[60px] p-2 border rounded-md bg-accent/50 mt-2 ${
            validationErrors.primaryDepartment ? "border-red-500" : ""
          }`}
        >
          {!primaryDepartment ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Chưa chọn phòng ban xử lý chính
            </div>
          ) : (
            (() => {
              const dept = findDepartmentById(primaryDepartment);
              if (!dept)
                return (
                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                    Không tìm thấy thông tin phòng ban
                  </div>
                );

              return (
                <Badge
                  key={dept.id}
                  variant="outline"
                  className="pl-2 pr-1 py-1.5 flex items-center gap-1 border-red-500 bg-red-50 text-red-700"
                >
                  <span>{dept.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full text-red-700 hover:bg-red-100"
                    onClick={onRemovePrimaryDepartment}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })()
          )}
        </div>
        {validationErrors.primaryDepartment && (
          <p className="text-sm text-red-500 mt-1">
            {validationErrors.primaryDepartment}
          </p>
        )}
      </div>

      {/* Secondary Departments Display */}
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-blue-600 font-medium">
            Phòng ban phối hợp ({secondaryDepartments.length})
          </Label>
          {secondaryDepartments.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-blue-600"
              onClick={onClearSelection}
              type="button"
            >
              Bỏ chọn tất cả
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 min-h-[60px] p-2 border rounded-md bg-accent/50 mt-2">
          {secondaryDepartments.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Chưa chọn phòng ban phối hợp
            </div>
          ) : (
            secondaryDepartments.map((deptId) => {
              const dept = findDepartmentById(deptId as number);
              if (!dept) return null;

              return (
                <Badge
                  key={deptId}
                  variant="outline"
                  className="pl-2 pr-1 py-1.5 flex items-center gap-1 border-blue-500 bg-blue-50 text-blue-700"
                >
                  <span>{dept.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 rounded-full text-blue-700 hover:bg-blue-100"
                    onClick={() => onRemoveSecondaryDepartment(deptId)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

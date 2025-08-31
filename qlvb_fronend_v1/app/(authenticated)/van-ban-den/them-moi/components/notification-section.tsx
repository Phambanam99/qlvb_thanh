"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Building, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationSectionProps {
  notificationScope: "ALL_UNITS" | "SPECIFIC_UNITS";
  secondaryDepartments: (number | string)[];
  findDepartmentById: (id: number) => any;
  findUserById?: (deptId: number, userId: number) => any;
  getLeadershipRole?: (user: any) => string | null;
  getRoleDisplayName?: (role: string) => string;
  onScopeChange: (scope: "ALL_UNITS" | "SPECIFIC_UNITS") => void;
  onRemoveSecondaryDepartment: (deptId: number | string) => void;
  onClearSelection: () => void;
}

export function NotificationSection({
  notificationScope,
  secondaryDepartments,
  findDepartmentById,
  findUserById,
  getLeadershipRole,
  getRoleDisplayName,
  onScopeChange,
  onRemoveSecondaryDepartment,
  onClearSelection,
}: NotificationSectionProps) {
  // Parse recipients info for display
  const getRecipientsInfo = () => {
    return secondaryDepartments
      .map((recipientId) => {
        if (typeof recipientId === "string" && recipientId.includes("-")) {
          // Composite ID: "departmentId-userId"
          const [deptId, userId] = recipientId.split("-").map(Number);
          const dept = findDepartmentById(deptId);
          const user = findUserById?.(deptId, userId);

          if (dept && user) {
            const role = getLeadershipRole?.(user);
            return {
              id: recipientId,
              type: "user",
              department: dept,
              user: user,
              role: role ? getRoleDisplayName?.(role) : null,
            };
          }
        } else {
          // Department ID only
          const dept = findDepartmentById(Number(recipientId));
          if (dept) {
            return {
              id: recipientId,
              type: "department",
              department: dept,
              user: null,
              role: null,
            };
          }
        }
        return null;
      })
      .filter(Boolean);
  };

  const recipientsInfo = getRecipientsInfo();

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
        <Label className="text-base font-medium text-blue-600">
          Thông báo đến
        </Label>
      </div>

      {/* Notification Scope */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Phạm vi thông báo</Label>

        <div className="grid grid-cols-1 gap-3">
          <div
            className={cn(
              "flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-accent/50",
              notificationScope === "ALL_UNITS"
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-border hover:border-blue-200"
            )}
            onClick={() => {
              onScopeChange("ALL_UNITS");
              onClearSelection();
            }}
          >
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border-2",
                  notificationScope === "ALL_UNITS"
                    ? "border-blue-500 bg-blue-500"
                    : "border-muted-foreground"
                )}
              >
                {notificationScope === "ALL_UNITS" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <label className="flex-1 text-sm cursor-pointer">
              <div className="font-medium">Toàn đơn vị</div>
              <div className="text-xs text-muted-foreground">
                Thông báo đến tất cả phòng ban và cá nhân
              </div>
            </label>
          </div>

          <div
            className={cn(
              "flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-colors hover:bg-accent/50",
              notificationScope === "SPECIFIC_UNITS"
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-border hover:border-blue-200"
            )}
            onClick={() => onScopeChange("SPECIFIC_UNITS")}
          >
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border-2",
                  notificationScope === "SPECIFIC_UNITS"
                    ? "border-blue-500 bg-blue-500"
                    : "border-muted-foreground"
                )}
              >
                {notificationScope === "SPECIFIC_UNITS" && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
            </div>
            <label className="flex-1 text-sm cursor-pointer">
              <div className="font-medium">Phòng ban cụ thể</div>
              <div className="text-xs text-muted-foreground">
                Chọn các phòng ban cần thông báo
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Selected Notification Departments - Only show for SPECIFIC_UNITS */}
      {notificationScope === "SPECIFIC_UNITS" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-blue-600 font-medium">
              Phòng ban nhận thông báo ({secondaryDepartments.length})
            </Label>
            {secondaryDepartments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-100"
                onClick={onClearSelection}
                type="button"
              >
                Bỏ chọn tất cả
              </Button>
            )}
          </div>

          <div className="min-h-[80px] border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/30">
            {secondaryDepartments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-4 px-3">
                <Building className="h-8 w-8 text-blue-300 mb-2" />
                <div className="text-sm text-blue-600 font-medium">
                  Chưa chọn phòng ban nào
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  Chọn từ danh sách bên dưới
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-48 p-3">
                <div className="flex flex-wrap gap-2 pr-4">
                  {recipientsInfo.map((recipient) => {
                    if (!recipient) return null;
                    const { id, type, department, user, role } =
                      recipient as any;
                    return (
                      <Badge
                        key={id}
                        variant="outline"
                        className="pl-3 pr-2 py-2 flex items-center gap-2 border-blue-500 bg-white text-blue-700 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {type === "department" ? (
                          <Building className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        <span className="font-medium">{department.name}</span>
                        {role && (
                          <Badge
                            variant="outline"
                            className="pl-2 pr-2 py-1 text-xs text-blue-700"
                          >
                            {role}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full text-blue-700 hover:bg-blue-100 ml-1"
                          onClick={() => onRemoveSecondaryDepartment(id)}
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      )}

      {/* Info message for ALL_UNITS */}
      {notificationScope === "ALL_UNITS" && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex-shrink-0 mt-0.5">
            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-blue-800">
              Thông báo toàn đơn vị
            </div>
            <div className="text-xs text-blue-700 mt-1">
              Văn bản sẽ được thông báo đến tất cả phòng ban và cán bộ trong đơn
              vị. Không cần chọn phòng ban cụ thể.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

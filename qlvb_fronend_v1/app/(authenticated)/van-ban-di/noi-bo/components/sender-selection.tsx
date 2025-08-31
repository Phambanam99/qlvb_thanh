"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DepartmentTree } from "@/components/department-tree";
import { X, Building, Users } from "lucide-react";
import { DepartmentNode } from "@/hooks/use-department-selection";
import { UserDTO } from "@/lib/api";

interface SenderSelectionProps {
  departments: DepartmentNode[];
  expandedDepartments: Set<number>;
  toggleDepartment: (deptId: number) => void;
  selectedSender: number | string | null;
  onSelectSender: (senderId: number | string) => void;
  departmentUsers: Record<number, UserDTO[]>;
  isLoadingUsers: Record<number, boolean>;
  onDepartmentExpand: (deptId: number) => void;
  getLeadershipRole: (user: UserDTO) => string | null;
  getRoleDisplayName: (role: string) => string;
  findDepartmentById: (id: number) => any;
  findUserById: (deptId: number, userId: number) => UserDTO | null;
  onClearSender: () => void;
  selectedRecipients?: (number | string)[];
  onSelectRecipient?: (recipientId: number | string) => void;
  onRemoveRecipient?: (recipientId: number | string) => void;
  onClearAllRecipients?: () => void;
  isMultiSelect?: boolean;
}

export function SenderSelection({
  departments,
  expandedDepartments,
  toggleDepartment,
  selectedSender,
  onSelectSender,
  departmentUsers,
  isLoadingUsers,
  onDepartmentExpand,
  getLeadershipRole,
  getRoleDisplayName,
  findDepartmentById,
  findUserById,
  onClearSender,
  selectedRecipients,
  onSelectRecipient,
  onRemoveRecipient,
  onClearAllRecipients,
  isMultiSelect,
}: SenderSelectionProps) {
  // Parse sender info for single selection
  const getSenderInfo = () => {
    if (!selectedSender) return null;

    if (typeof selectedSender === "string" && selectedSender.includes("-")) {
      // Composite ID: "departmentId-userId"
      const [deptId, userId] = selectedSender.split("-").map(Number);
      const dept = findDepartmentById(deptId);
      const user = findUserById(deptId, userId);

      if (dept && user) {
        const role = getLeadershipRole(user);
        return {
          type: "user",
          department: dept,
          user: user,
          role: role ? getRoleDisplayName(role) : null,
        };
      }
    } else {
      // Department ID only
      const dept = findDepartmentById(Number(selectedSender));
      if (dept) {
        return {
          type: "department",
          department: dept,
          user: null,
          role: null,
        };
      }
    }

    return null;
  };

  // Parse recipients info for multi-selection
  const getRecipientsInfo = () => {
    if (!selectedRecipients || selectedRecipients.length === 0) return [];

    return selectedRecipients
      .map((recipientId) => {
        if (typeof recipientId === "string" && recipientId.includes("-")) {
          // Composite ID: "departmentId-userId"
          const [deptId, userId] = recipientId.split("-").map(Number);
          const dept = findDepartmentById(deptId);
          const user = findUserById(deptId, userId);

          if (dept && user) {
            const role = getLeadershipRole(user);
            return {
              id: recipientId,
              type: "user",
              department: dept,
              user: user,
              role: role ? getRoleDisplayName(role) : null,
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

  const senderInfo = getSenderInfo();
  const recipientsInfo = getRecipientsInfo();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Phòng ban/Cán bộ nhận <span className="text-red-500">*</span>
        </Label>
        {((isMultiSelect &&
          selectedRecipients &&
          selectedRecipients.length > 0) ||
          (!isMultiSelect && selectedSender)) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={isMultiSelect ? onClearAllRecipients : onClearSender}
            type="button"
          >
            {isMultiSelect ? "Bỏ chọn tất cả" : "Bỏ chọn"}
          </Button>
        )}
      </div>

      {/* Selected Recipients Display */}
      <div className="min-h-[60px] p-3 border rounded-md bg-accent/50">
        {isMultiSelect ? (
          // Multi-selection display
          recipientsInfo.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
              Chưa chọn phòng ban/cán bộ nhận
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">
                Đã chọn {recipientsInfo.length} người nhận:
              </div>
              <div className="flex flex-wrap gap-2">
                {recipientsInfo.map((recipient: any) => (
                  <Badge
                    key={recipient.id}
                    variant="outline"
                    className="pl-3 pr-2 py-2 flex items-center gap-2 border-primary bg-primary/10 text-primary"
                  >
                    {recipient.type === "user" ? (
                      <Users className="h-3 w-3" />
                    ) : (
                      <Building className="h-3 w-3" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">
                        {recipient.type === "user"
                          ? recipient.user?.fullName
                          : recipient.department.name}
                      </div>
                      {recipient.type === "user" && (
                        <div className="text-xs opacity-80">
                          {recipient.role} - {recipient.department.name}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 rounded-full text-primary hover:bg-primary/20 ml-1"
                      onClick={() => onRemoveRecipient?.(recipient.id)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )
        ) : // Single selection display
        !selectedSender ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Chưa chọn phòng ban/cán bộ nhận
          </div>
        ) : senderInfo ? (
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="pl-3 pr-2 py-2 flex items-center gap-2 border-primary bg-primary/10 text-primary"
            >
              {senderInfo.type === "user" ? (
                <Users className="h-3 w-3" />
              ) : (
                <Building className="h-3 w-3" />
              )}
              <div className="text-left">
                <div className="font-medium">
                  {senderInfo.type === "user"
                    ? senderInfo.user?.fullName
                    : senderInfo.department.name}
                </div>
                {senderInfo.type === "user" && (
                  <div className="text-xs opacity-80">
                    {senderInfo.role} - {senderInfo.department.name}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full text-primary hover:bg-primary/20 ml-1"
                onClick={onClearSender}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Không tìm thấy thông tin người nhận
          </div>
        )}
      </div>

      {/* Department Tree for Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Chọn từ danh sách phòng ban
        </Label>
        <div className="border rounded-md overflow-hidden">
          <div className="bg-primary/5 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">
              Danh sách phòng ban và cán bộ
            </span>
          </div>

          <DepartmentTree
            departments={departments}
            expandedDepartments={expandedDepartments}
            toggleDepartment={toggleDepartment}
            onSelectPrimaryDepartment={
              isMultiSelect ? undefined : onSelectSender
            }
            onSelectSecondaryDepartment={
              isMultiSelect ? onSelectRecipient : undefined
            }
            primaryDepartment={isMultiSelect ? null : (selectedSender as any)}
            secondaryDepartments={
              isMultiSelect ? (selectedRecipients as any[]) || [] : []
            }
            departmentUsers={departmentUsers}
            isLoadingUsers={isLoadingUsers}
            onDepartmentExpand={onDepartmentExpand}
            getLeadershipRole={getLeadershipRole}
            getRoleDisplayName={getRoleDisplayName}
            selectionMode={isMultiSelect ? "secondary" : "primary"}
            maxHeight="300px"
            primaryButtonText="Chọn"
            secondaryButtonText="Chọn"
          />
        </div>

        <div className="flex items-center gap-4 text-xs mt-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border border-red-500 bg-white"></div>
            <span>Đã chọn</span>
          </div>
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-muted-foreground" />
            <span>Phòng ban</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>Cán bộ lãnh đạo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

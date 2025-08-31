import { Label } from "@/components/ui/label";
import { Building, Users } from "lucide-react";
import { DepartmentTree } from "@/components/department-tree";
import { RichTextEditor } from "@/components/ui";
import { Input } from "@/components/ui/input";
import type { DocumentPurpose, NotificationScope } from "../lib/constants";

interface DepartmentSelectionProps {
  documentPurpose: DocumentPurpose;
  notificationScope: NotificationScope;
  departments: any[];
  expandedDepartments: Set<number>;
  isLoadingDepartmentList: boolean;
  primaryDepartment: number | null;
  secondaryDepartments: (number | string)[];
  departmentUsers: Record<number, any[]>;
  isLoadingUsers: Record<number, boolean>;
  documentNotes: string;
  closureDeadline: string;
  findDepartmentById: (id: number) => any;
  getLeadershipRole: (user: any) => string | null;
  getRoleDisplayName: (role: string) => string;
  toggleDepartment: (id: number) => void;
  onSelectPrimaryDepartment: (id: number) => void;
  onSelectSecondaryDepartment: (id: number) => void;
  fetchDepartmentUsers: (id: number) => void;
  setDocumentNotes: (content: string) => void;
  setClosureDeadline: (deadline: string) => void;
}

export function DepartmentSelection({
  documentPurpose,
  notificationScope,
  departments,
  expandedDepartments,
  isLoadingDepartmentList,
  primaryDepartment,
  secondaryDepartments,
  departmentUsers,
  isLoadingUsers,
  documentNotes,
  closureDeadline,
  findDepartmentById,
  getLeadershipRole,
  getRoleDisplayName,
  toggleDepartment,
  onSelectPrimaryDepartment,
  onSelectSecondaryDepartment,
  fetchDepartmentUsers,
  setDocumentNotes,
  setClosureDeadline,
}: DepartmentSelectionProps) {
  const shouldShowDepartmentTree =
    documentPurpose === "PROCESS" ||
    (documentPurpose === "NOTIFICATION" &&
      notificationScope === "SPECIFIC_UNITS");

  if (!shouldShowDepartmentTree) {
    return null;
  }

  return (
    <>
      {/* Department Tree */}
      <div className="space-y-2">
        <Label>
          {documentPurpose === "PROCESS"
            ? "Danh sách phòng ban xử lý"
            : "Danh sách phòng ban nhận thông báo"}
        </Label>
        <div className="border rounded-md overflow-hidden">
          <div className="bg-primary/5 px-4 py-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">
              {documentPurpose === "PROCESS"
                ? "Chọn phòng ban xử lý văn bản"
                : "Chọn phòng ban nhận thông báo"}
            </span>
          </div>

          {isLoadingDepartmentList ? (
            <div className="flex items-center justify-center p-4">
              <p>Đang tải danh sách phòng ban...</p>
            </div>
          ) : (
            <DepartmentTree
              departments={departments}
              expandedDepartments={expandedDepartments}
              toggleDepartment={toggleDepartment}
              onSelectPrimaryDepartment={
                documentPurpose === "PROCESS"
                  ? onSelectPrimaryDepartment
                  : undefined
              }
              onSelectSecondaryDepartment={onSelectSecondaryDepartment}
              primaryDepartment={
                documentPurpose === "PROCESS" ? primaryDepartment : null
              }
              secondaryDepartments={secondaryDepartments as any}
              departmentUsers={departmentUsers}
              isLoadingUsers={isLoadingUsers}
              onDepartmentExpand={fetchDepartmentUsers}
              getLeadershipRole={getLeadershipRole}
              getRoleDisplayName={getRoleDisplayName}
              selectionMode={
                documentPurpose === "PROCESS" ? "both" : "secondary"
              }
              maxHeight="400px"
              primaryButtonText="Chính"
              secondaryButtonText="Phụ"
            />
          )}
        </div>

        <div className="flex items-center gap-4 text-xs mt-1">
          {documentPurpose === "PROCESS" && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border border-red-500 bg-white"></div>
              <span>Xử lý chính</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm border border-blue-500 bg-white"></div>
            <span>
              {documentPurpose === "PROCESS" ? "Phối hợp" : "Nhận thông báo"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3 text-muted-foreground" />
            <span>Đơn vị lớn</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>Đơn vị nhỏ</span>
          </div>
        </div>
      </div>

      {/* Notes/Content */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          {documentPurpose === "PROCESS" ? "Ghi chú" : "Nội dung thông báo"}
        </Label>
        <RichTextEditor
          content={documentNotes}
          onChange={setDocumentNotes}
          placeholder={
            documentPurpose === "PROCESS"
              ? "Nhập ghi chú cho phòng ban xử lý (nếu có)"
              : "Nhập nội dung thông báo (nếu có)"
          }
          minHeight="150px"
        />
      </div>

      {/* Deadline - Only for PROCESS */}
      {documentPurpose === "PROCESS" && (
        <div className="space-y-2">
          <Label htmlFor="deadline">Thời hạn xử lý</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            value={closureDeadline}
            onChange={(e) => setClosureDeadline(e.target.value)}
            placeholder="Chọn thời hạn xử lý"
          />
        </div>
      )}
    </>
  );
}

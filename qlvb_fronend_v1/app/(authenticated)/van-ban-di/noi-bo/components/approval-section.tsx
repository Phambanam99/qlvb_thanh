"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departmentsAPI, usersAPI } from "@/lib/api";
import { useNotifications } from "@/lib/notifications-context";
import { UserDTO } from "@/lib/api";
import { URGENCY_LEVELS } from "@/lib/types/urgency";

interface ApprovalSectionProps {
  user: UserDTO | null;
  formData: {
    approver: string;
    priority: string;
    note: string;
  };
  onSelectChange: (name: string, value: string) => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  leadershipRoleOrder: Record<string, number>;
}

export function ApprovalSection({
  user,
  formData,
  onSelectChange,
  onInputChange,
  leadershipRoleOrder,
}: ApprovalSectionProps) {
  const [approvers, setApprovers] = useState<any[]>([]);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(false);
  const { addNotification } = useNotifications();

  // Fetch approvers
  useEffect(() => {
    const fetchApprovers = async () => {
      if (!user || !user.id) {
        return;
      }

      try {
        setIsLoadingApprovers(true);

        // Use the same approach as in OutgoingDocumentForm.tsx
        // 1. Get users who can approve for the current user
        const leaderUsers_ = await usersAPI.getUserForApproval(user.id);
        const leaderUsers = leaderUsers_.data;
        // 2. Get senior leaders across all departments
        const seniorLeadersResponse =   await usersAPI.getUsersByRoleAndDepartment(
            ["ROLE_SENIOR_LEADER"],
            0 // 0 to get from all departments
          );
     ;
        // 3. Combine both lists
        const allApprovers = [...leaderUsers, ...seniorLeadersResponse];

        // 4. Remove duplicates if any (by ID)
        const uniqueApprovers = allApprovers.filter(
          (approver, index, self) =>
            index === self.findIndex((a) => a.id === approver.id)
        );

        setApprovers(uniqueApprovers);
      } catch (error) {
        addNotification({
          title: "Lỗi",
          message: "Không thể tải danh sách người phê duyệt",
          type: "error",
        });
      } finally {
        setIsLoadingApprovers(false);
      }
    };

    fetchApprovers();
  }, [user, addNotification]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Người soạn thảo</Label>
        <div className="rounded-md border p-3 bg-accent/30">
          <p className="font-medium">
            {user?.fullName || "Người dùng hiện tại"}
          </p>
          <p className="text-sm text-muted-foreground">
            {user?.position || "Chức vụ"} -{" "}
            {user?.departmentName || "Phòng ban"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approver">
          Người phê duyệt <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.approver}
          onValueChange={(value) => onSelectChange("approver", value)}
        >
          <SelectTrigger id="approver">
            <SelectValue placeholder="Chọn người phê duyệt" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingApprovers ? (
              <SelectItem value="loading" disabled>
                Đang tải danh sách...
              </SelectItem>
            ) : approvers.length === 0 ? (
              <SelectItem value="empty" disabled>
                Không tìm thấy người phê duyệt
              </SelectItem>
            ) : (
              approvers.map((approver) => (
                <SelectItem key={approver.id} value={String(approver.id)}>
                  {approver.fullName} - {approver.roleDisplayNames}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Độ ưu tiên</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => onSelectChange("priority", value)}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Chọn độ ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={URGENCY_LEVELS.KHAN}>Khẩn</SelectItem>
            <SelectItem value={URGENCY_LEVELS.THUONG_KHAN}>
              Thượng khẩn
            </SelectItem>
            <SelectItem value={URGENCY_LEVELS.HOA_TOC}>Hỏa tốc</SelectItem>
            <SelectItem value={URGENCY_LEVELS.HOA_TOC_HEN_GIO}>
              Hỏa tốc hẹn giờ
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Nhập ghi chú cho người phê duyệt (nếu có)"
          rows={4}
          value={formData.note}
          onChange={onInputChange}
        />
      </div>

      <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
        <p className="text-sm text-amber-800">
          <span className="font-medium">Lưu ý:</span> Sau khi gửi, công văn sẽ
          được chuyển đến người phê duyệt để xem xét trước khi ban hành chính
          thức.
        </p>
      </div>
    </div>
  );
}

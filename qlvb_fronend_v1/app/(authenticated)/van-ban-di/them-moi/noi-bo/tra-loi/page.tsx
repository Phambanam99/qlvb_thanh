"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Save,
  Send,
  X,
  Building,
  User,
  Users,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useToast } from "@/components/ui/use-toast";
import { UrgencyLevel, URGENCY_LEVELS } from "@/lib/types/urgency";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  workflowAPI,
  incomingDocumentsAPI,
  usersAPI,
  departmentsAPI,
} from "@/lib/api";
import { DepartmentTree } from "@/components/department-tree";
import { useDepartmentSelection } from "@/hooks/use-department-selection";
import { useDepartmentUsers } from "@/hooks/use-department-users";
import { ReplyDocumentInfo } from "../../components/reply-document-info";

// Leadership role configuration
const leadershipRoleOrder: Record<string, number> = {
  ROLE_CUC_TRUONG: 1,
  ROLE_CUC_PHO: 2,
  ROLE_CHINH_UY: 3,
  ROLE_PHO_CHINH_UY: 4,
  ROLE_TRUONG_PHONG: 5,
  ROLE_PHO_PHONG: 6,
  ROLE_TRAM_TRUONG: 7,
  ROLE_PHO_TRAM_TRUONG: 8,
  ROLE_CHINH_TRI_VIEN_TRAM: 9,
  ROLE_CUM_TRUONG: 10,
  ROLE_PHO_CUM_TRUONG: 11,
  ROLE_CHINH_TRI_VIEN_CUM: 12,
  ROLE_TRUONG_BAN: 13,
};

// Get role display name helper
const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case "ROLE_CUC_TRUONG":
      return "Cục trưởng";
    case "ROLE_CUC_PHO":
      return "Cục phó";
    case "ROLE_CHINH_UY":
      return "Chính ủy";
    case "ROLE_PHO_CHINH_UY":
      return "Phó Chính ủy";
    case "ROLE_TRUONG_PHONG":
      return "Trưởng phòng";
    case "ROLE_PHO_PHONG":
      return "Phó phòng";
    case "ROLE_TRAM_TRUONG":
      return "Trạm trưởng";
    case "ROLE_PHO_TRAM_TRUONG":
      return "Phó Trạm trưởng";
    case "ROLE_CHINH_TRI_VIEN_TRAM":
      return "Chính trị viên trạm";
    case "ROLE_CUM_TRUONG":
      return "Cụm trưởng";
    case "ROLE_PHO_CUM_TRUONG":
      return "Phó cụm trưởng";
    case "ROLE_CHINH_TRI_VIEN_CUM":
      return "Chính trị viên cụm";
    case "ROLE_TRUONG_BAN":
      return "Trưởng Ban";
    default:
      return role.replace("ROLE_", "").replace(/_/g, " ").toLowerCase();
  }
};

export default function ReplyInternalDocumentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const replyToId = searchParams.get("replyToId");
  const formRef = useRef<HTMLFormElement>(null);

  // Use custom hooks for department selection
  const {
    departments,
    expandedDepartments,
    isLoading: isLoadingDepartmentList,
    primaryDepartment,
    secondaryDepartments,
    toggleDepartment,
    selectPrimaryDepartment,
    selectSecondaryDepartment,
    clearSelection,
    findDepartmentById,
  } = useDepartmentSelection();

  const {
    departmentUsers,
    isLoadingUsers,
    fetchDepartmentUsers,
    getLeadershipRole,
  } = useDepartmentUsers(leadershipRoleOrder);

  // State for form data
  const [formData, setFormData] = useState({
    documentNumber: "",
    sentDate: new Date(),
    documentType: "",
    title: "",
    content: "",
    urgencyLevel: URGENCY_LEVELS.KHAN,
    note: "",
  });

  // State for file attachment and incoming document
  const [file, setFile] = useState<File | null>(null);
  const [incomingDocument, setIncomingDocument] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingIncomingDoc, setIsLoadingIncomingDoc] = useState(true);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Fetch incoming document if replyToId is provided
  useEffect(() => {
    const fetchIncomingDocument = async () => {
      if (!replyToId) {
        // Redirect back if no replyToId
        router.push("/van-ban-di/them-moi");
        return;
      }

      try {
        setIsLoadingIncomingDoc(true);
        const doc_ = await incomingDocumentsAPI.getIncomingDocumentById(
          replyToId
        );  
        const doc = doc_.data;
        setIncomingDocument(doc.data);

        const seniorLeadersResponse =  await usersAPI.getUsersByRoleAndDepartment(
            ["ROLE_SENIOR_LEADER"],
            0 // 0 to get from all departments
          );
      ;

        // Pre-fill some form fields
        setFormData((prev) => ({
          ...prev,
          title: `Trả lời: ${doc.data.title}`,
        }));

        // Try to extract sender department ID from incoming document
        // The property might be under different names depending on API structure
        const senderDeptId =
          (doc.data as any).senderDepartmentId ||
          (doc.data as any).senderDepartment?.id;

        if (senderDeptId) {
          selectSecondaryDepartment(senderDeptId);
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin văn bản đến",
          variant: "destructive",
        });
        router.push("/van-ban-di/them-moi");
      } finally {
        setIsLoadingIncomingDoc(false);
      }
    };

    fetchIncomingDocument();
  }, [replyToId, router, toast, selectSecondaryDepartment]);

  // Input change handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, sentDate: date }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Helper function to find user by ID
  const findUserById = (deptId: number, userId: number) => {
    const users = departmentUsers[deptId] || [];
    return users.find((user) => user.id === userId) || null;
  };

  // Handle secondary department selection
  const handleSelectSecondaryDepartment = (deptId: number | string) => {
    const id =
      typeof deptId === "string" && deptId.includes("-")
        ? deptId
        : Number(deptId);
    selectSecondaryDepartment(id as number);
  };

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.documentNumber.trim()) {
      errors.documentNumber = "Số văn bản là bắt buộc";
    }

    if (!formData.title.trim()) {
      errors.title = "Tiêu đề văn bản là bắt buộc";
    }

    if (secondaryDepartments.length === 0) {
      errors.recipients = "Vui lòng chọn ít nhất một người nhận";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Thiếu thông tin",
        description:
          "Vui lòng điền đầy đủ thông tin bắt buộc và chọn ít nhất một người nhận",
        variant: "destructive",
      });
      return;
    }

    if (!replyToId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy văn bản cần trả lời",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare document data - convert selected departments and users to the right format
      const recipients = secondaryDepartments.map((id: number | string) => {
        // Check if this is a composite ID (department-user)
        if (typeof id === "string" && id.includes("-")) {
          const [departmentId, userId] = id.split("-").map(Number);
          return { departmentId, userId };
        } else {
          // Just a department
          return { departmentId: Number(id) };
        }
      });

      // Prepare document data
      const documentData: any = {
        documentNumber: formData.documentNumber,
        title: formData.title,
        summary: formData.content,
        documentType: formData.documentType,
        signingDate: formData.sentDate,
        urgencyLevel: formData.urgencyLevel,
        notes: formData.note,
        recipients: recipients,
        status: "PENDING_APPROVAL", // Set status for submission (not draft)
        isInternal: true,
        incomingDocumentId: replyToId,
      };

      // Call API to create response document
      await workflowAPI.createInternalResponseDocument(
        documentData,
        file || undefined
      );

      // Show success notification
      toast({
        title: "Thành công",
        description: "Văn bản trả lời nội bộ đã được tạo và gửi",
      });

      addNotification({
        title: "Văn bản trả lời nội bộ mới",
        message: `Văn bản trả lời "${formData.title}" đã được tạo và gửi`,
        type: "success",
      });

      // Redirect to outgoing documents list
      router.push("/van-ban-di");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi tạo văn bản trả lời",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    // Validate minimal required fields
    if (!formData.documentNumber || !formData.title) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền ít nhất số văn bản và tiêu đề",
        variant: "destructive",
      });
      return;
    }

    if (!replyToId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy văn bản cần trả lời",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare document data - convert selected departments and users to the right format
      const recipients = secondaryDepartments.map((id: number | string) => {
        // Check if this is a composite ID (department-user)
        if (typeof id === "string" && id.includes("-")) {
          const [departmentId, userId] = id.split("-").map(Number);
          return { departmentId, userId };
        } else {
          // Just a department
          return { departmentId: Number(id) };
        }
      });

      // Prepare document data
      const documentData: any = {
        documentNumber: formData.documentNumber,
        title: formData.title,
        summary: formData.content,
        documentType: formData.documentType,
        signingDate: formData.sentDate,
        urgencyLevel: formData.urgencyLevel,
        notes: formData.note,
        recipients: recipients,
        status: "DRAFT", // Set status as draft
        isInternal: true,
        incomingDocumentId: replyToId,
      };

      // Call API to create response document as draft
      await workflowAPI.createInternalResponseDocument(
        documentData,
        file || undefined
      );

      // Show success notification
      toast({
        title: "Thành công",
        description: "Văn bản trả lời nội bộ đã được lưu nháp",
      });

      // Redirect to outgoing documents list
      router.push("/van-ban-di");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi lưu nháp văn bản trả lời",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a function that always returns null to show all users
  const showAllUsers = (user: any) => null;

  if (isLoadingIncomingDoc) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/van-ban-di/them-moi">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Trả lời văn bản đến - Nội bộ
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            form="reply-form"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu nháp
          </Button>
          <Button
            type="submit"
            form="reply-form"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Gửi văn bản
          </Button>
        </div>
      </div>

      {/* Reply Document Info */}
      {incomingDocument && (
        <div className="mb-8">
          <ReplyDocumentInfo incomingDocument={incomingDocument} />
        </div>
      )}

      <form ref={formRef} id="reply-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Document Information Card */}
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin văn bản trả lời</CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết của văn bản trả lời
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">
                    Số văn bản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="documentNumber"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    placeholder="Nhập số văn bản"
                    required
                    className={
                      validationErrors.documentNumber ? "border-red-500" : ""
                    }
                  />
                  {validationErrors.documentNumber && (
                    <p className="text-sm text-red-500">
                      {validationErrors.documentNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentDate">Ngày ban hành</Label>
                  <DatePicker
                    date={formData.sentDate}
                    setDate={handleDateChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">
                  Tiêu đề <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tiêu đề văn bản"
                  required
                  className={validationErrors.title ? "border-red-500" : ""}
                />
                {validationErrors.title && (
                  <p className="text-sm text-red-500">
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Nhập nội dung văn bản"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Loại văn bản</Label>
                <Input
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  placeholder="Nhập loại văn bản"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Độ ưu tiên</Label>
                <Select
                  value={formData.urgencyLevel}
                  onValueChange={(value) =>
                    handleSelectChange("urgencyLevel", value)
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={URGENCY_LEVELS.KHAN}>Khẩn</SelectItem>
                    <SelectItem value={URGENCY_LEVELS.THUONG_KHAN}>
                      Thượng khẩn
                    </SelectItem>
                    <SelectItem value={URGENCY_LEVELS.HOA_TOC}>
                      Hỏa tốc
                    </SelectItem>
                    <SelectItem value={URGENCY_LEVELS.HOA_TOC_HEN_GIO}>
                      Hỏa tốc hẹn giờ
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Tệp đính kèm</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  placeholder="Nhập ghi chú (nếu có)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recipients Card */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                {isLoadingDepartmentList ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Đang tải danh sách phòng ban...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Danh sách phòng ban và người dùng{" "}
                        {validationErrors.recipients && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-primary/5 px-4 py-2 border-b flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Chọn người nhận văn bản
                          </span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          <DepartmentTree
                            departments={departments}
                            expandedDepartments={new Set(expandedDepartments)}
                            toggleDepartment={toggleDepartment}
                            onSelectSecondaryDepartment={
                              handleSelectSecondaryDepartment
                            }
                            secondaryDepartments={secondaryDepartments as any}
                            departmentUsers={departmentUsers}
                            isLoadingUsers={isLoadingUsers}
                            onDepartmentExpand={fetchDepartmentUsers}
                            getLeadershipRole={showAllUsers}
                            getRoleDisplayName={getRoleDisplayName}
                            selectionMode="secondary"
                            maxHeight="400px"
                            secondaryButtonText="Chọn"
                          />
                        </div>
                      </div>
                      {validationErrors.recipients && (
                        <p className="text-sm text-red-500">
                          {validationErrors.recipients}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm border border-blue-500 bg-white"></div>
                        <span>Người nhận</span>
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
                )}
              </CardContent>
            </Card>

            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Lưu ý:</span> Văn bản nội bộ sẽ
                được gửi đến tất cả phòng ban và cá nhân được chọn. Văn bản được
                gửi đến phòng ban sẽ được chuyển đến trưởng phòng của phòng ban
                đó.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

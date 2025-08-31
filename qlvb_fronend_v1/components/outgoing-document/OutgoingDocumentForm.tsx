"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save, Trash, Send, Paperclip } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useToast } from "@/components/ui/use-toast";
import { UrgencyLevel, URGENCY_LEVELS } from "@/lib/types/urgency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  outgoingDocumentsAPI,
  departmentsAPI,
  usersAPI,
  workflowAPI,
} from "@/lib/api";

// Định nghĩa interface cho props
interface OutgoingDocumentFormProps {
  mode: "create" | "edit";
  documentId?: string;
  initialData?: any;
  replyToId?: string | null;
}

export default function OutgoingDocumentForm({
  mode,
  documentId,
  initialData,
  replyToId,
}: OutgoingDocumentFormProps) {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  // State cho form
  const [formData, setFormData] = useState({
    number: "",
    title: "",
    content: "",
    recipient: "",
    recipientDepartmentId: "",
    signer: "",
    signerPosition: "",
    sentDate: new Date(),
    isUrgent: false,
    isConfidential: false,
    notes: "",
    approverId: "", // Người phê duyệt
    urgencyLevel: URGENCY_LEVELS.KHAN, // Độ khẩn
  });

  // State khác
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<any | null>(
    null
  );
  const [departments, setDepartments] = useState<any[]>([]);
  const [approvers, setApprovers] = useState<
    Array<{ id: string; fullName: string; position: string }>
  >([]);
  const [isFromClerkReturn, setIsFromClerkReturn] = useState(false);

  // Hàm xử lý các sự kiện input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, sentDate: date }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const removeExistingAttachment = () => {
    setExistingAttachment(null);
  };

  // Hàm kiểm tra quyền chỉnh sửa văn bản (chỉ sử dụng trong chế độ edit)
  const checkEditPermission = (documentData: any) => {
    // Nếu không có dữ liệu văn bản
    if (!documentData || !documentData.data) return false;

    const doc = documentData.data;

    // Nếu là người tạo văn bản và văn bản đang ở trạng thái nháp hoặc đã bị từ chối
    if (
      hasRole(["ROLE_DRAF", "ROLE_TRO_LY"]) &&
      (doc.status === "draft" || doc.status === "leader_commented")
    ) {
      return true;
    }

    // Kiểm tra xem văn bản có bị từ chối không
    const wasRejected = doc.history?.some(
      (item: any) =>
        item.newStatus === "leader_commented" ||
        (item.comments && item.comments.toLowerCase().includes("từ chối")) ||
        (item.description && item.description.toLowerCase().includes("từ chối"))
    );

    // Kiểm tra xem văn bản có bị văn thư trả lại không
    const wasReturnedByClerk = doc.history?.some(
      (item: any) =>
        (item.newStatus === "specialist_processing" &&
          item.previousStatus === "leader_approved") ||
        (item.comments && item.comments.toLowerCase().includes("trả lại")) ||
        (item.description &&
          item.description.toLowerCase().includes("trả lại để chỉnh sửa"))
    );

    // Nếu văn bản bị văn thư trả lại, đánh dấu là văn bản từ văn thư
    if (wasReturnedByClerk && hasRole("ROLE_TRO_LY")) {
      setIsFromClerkReturn(true);
      return true;
    }

    // Nếu là trợ lý và văn bản đã bị từ chối
    if (hasRole("ROLE_TRO_LY") && wasRejected) {
      return true;
    }

    // Nếu là văn thư và văn bản đã được phê duyệt bởi thủ trưởng
    if (
      hasRole("ROLE_VAN_THU") &&
      (doc.status === "approved" || doc.status === "leader_approved")
    ) {
      return true;
    }

    // Mặc định không có quyền chỉnh sửa
    return false;
  };

  // Fetch dữ liệu ban đầu
  useEffect(() => {
    // Biến để kiểm tra component còn mounted hay không
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 1. Lấy danh sách phòng ban
        const departmentsData_ = await departmentsAPI.getAllDepartments();
        const departmentsData = departmentsData_.data;
        if (isMounted) {
          setDepartments(departmentsData.content || []);
        }
        // console.log("oke");
        // 2. Lấy danh sách người phê duyệt
        if (user?.departmentId) {
          try {
            const department_ = await departmentsAPI.getDepartmentById(
              user.departmentId
            );
            const department = department_.data;

            // Lấy danh sách người dùng có vai trò lãnh đạo trong phòng ban
            const usersResponse_ = await usersAPI.getUserForApproval(
              user.id || 0
            );
            const usersResponse = usersResponse_.data;

            // console.log("check", usersResponse);
            const leaderUsers = usersResponse;

            // Lấy danh sách người dùng có vai trò lãnh đạo cấp cao
            const seniorLeadersResponse_ =
              await usersAPI.getUsersByRoleAndDepartment(
                ["ROLE_SENIOR_LEADER"],
                0 // 0 để lấy tất cả phòng ban
              );
            const seniorLeadersResponse = seniorLeadersResponse_.data;
            // Kết hợp hai danh sách
            const allApprovers = [...leaderUsers, ...seniorLeadersResponse];

            if (isMounted) {
              setApprovers(
                allApprovers.map((u: any) => ({
                  id: u.id,
                  fullName: u.fullName,
                  position: u.position,
                }))
              );
            }
          } catch (error) {
          }
        }

        // 3. Nếu là chế độ chỉnh sửa, lấy dữ liệu văn bản
        if (mode === "edit" && documentId) {
          const [documentData_, history_] = await Promise.all([
            outgoingDocumentsAPI.getOutgoingDocumentById(documentId),
            workflowAPI.getDocumentHistory(documentId),
          ]);
          const documentData = documentData_.data;
          const history = history_.data;
          if (!isMounted) return;

          // Tạo document mới với cả dữ liệu và history
          const documentWithHistory = {
            ...documentData,
            history: history,
          };

          // Kiểm tra quyền truy cập
          const hasEditPermission = checkEditPermission(documentWithHistory);

          if (!hasEditPermission) {
            toast({
              title: "Không có quyền chỉnh sửa",
              description: "Bạn không có quyền chỉnh sửa văn bản này.",
              variant: "destructive",
            });
            router.push(`/van-ban-di/${documentId}`);
            return;
          }

          // Cập nhật form data từ document
          const doc = documentData.data;
          setFormData({
            number: doc.number || "",
            title: doc.title || "",
            content: doc.summary || "",
            recipient: doc.recipient || "",
            recipientDepartmentId: doc.receivingDepartmentText || "",
            signer: doc.signerName || "",
            signerPosition: doc.signerPosition || "", // Có thể cần điều chỉnh tên trường
            sentDate: doc.signingDate ? new Date(doc.signingDate) : new Date(),
            isUrgent: doc.urgent || false, // Điều chỉnh tên trường
            isConfidential: doc.confidential || false, // Điều chỉnh tên trường
            notes: doc.notes || "", // Có thể cần điều chỉnh tên trường
            approverId: doc.approver?.id || "", // Điều chỉnh tên trường
            urgencyLevel: doc.urgencyLevel || URGENCY_LEVELS.KHAN, // Có thể cần điều chỉnh tên trường
          });

          // Lấy tệp đính kèm hiện có
          if (
            documentData.data.attachments &&
            documentData.data.attachments.length > 0
          ) {
            setExistingAttachment(documentData.data.attachments[0]);
          }
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin. Vui lòng thử lại sau.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function để tránh cập nhật state khi component đã unmounted
    return () => {
      isMounted = false;
    };
  }, [mode, documentId, user, router, toast, hasRole]);

  // Xử lý gửi form khi submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Chuẩn bị dữ liệu form
      const formDataToSubmit = new FormData();

      // Thêm các trường dữ liệu vào FormData
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("content", formData.content);
      formDataToSubmit.append("recipient", formData.recipient);
      formDataToSubmit.append(
        "recipientDepartmentId",
        formData.recipientDepartmentId
      );
      formDataToSubmit.append("signer", formData.signer);
      formDataToSubmit.append("signerPosition", formData.signerPosition);
      formDataToSubmit.append("sentDate", formData.sentDate.toISOString());
      formDataToSubmit.append("isUrgent", formData.isUrgent.toString());
      formDataToSubmit.append(
        "isConfidential",
        formData.isConfidential.toString()
      );
      formDataToSubmit.append("notes", formData.notes);

      // Thêm approverId - Nếu văn bản từ văn thư trả lại, sẽ không cần approverId
      // vì sẽ gửi thẳng cho văn thư
      if (!isFromClerkReturn) {
        formDataToSubmit.append("approverId", formData.approverId);
      }

      formDataToSubmit.append("urgencyLevel", formData.urgencyLevel);

      // Thêm replyToId nếu có
      if (replyToId) {
        formDataToSubmit.append("replyToId", replyToId);
      }

      // Thêm trạng thái văn bản - Với văn bản từ văn thư trả lại, đánh dấu status là leader_approved
      // để chỉ rõ văn bản này đã được thủ trưởng phê duyệt và gửi thẳng cho văn thư
      if (isFromClerkReturn) {
        formDataToSubmit.append("status", "leader_approved");
        formDataToSubmit.append("skipDepartmentApproval", "true");
      }

      // Thêm tệp đính kèm
      if (attachment) {
        formDataToSubmit.append("file", attachment);
      }

      // Nếu là chế độ chỉnh sửa
      if (mode === "edit" && documentId) {
        // Thêm danh sách ID tệp đính kèm bị xóa
        const removedAttachmentIds = initialData?.data?.attachments
          ?.filter((att: any) => existingAttachment?.id !== att.id)
          .map((att: any) => att.id);

        if (removedAttachmentIds && removedAttachmentIds.length > 0) {
          formDataToSubmit.append(
            "removedAttachmentIds",
            JSON.stringify(removedAttachmentIds)
          );
        }

        // Gọi API cập nhật văn bản
        await outgoingDocumentsAPI.updateOutgoingDocument(
          documentId,
          formDataToSubmit
        );

        toast({
          title: "Thành công",
          description: isFromClerkReturn
            ? "Văn bản đã được chỉnh sửa và gửi thẳng cho văn thư xem xét"
            : "Văn bản đã được cập nhật thành công",
        });

        // Thông báo đến văn thư nếu là văn bản bị trả lại
        if (isFromClerkReturn) {
          addNotification({
            title: "Văn bản đã chỉnh sửa theo yêu cầu",
            message: `Văn bản "${formData.title}" đã được chỉnh sửa theo yêu cầu và gửi đến văn thư để xem xét`,
            type: "success",
            recipientRoles: ["ROLE_VAN_THU"],
          });
        }

        // Chuyển hướng về trang chi tiết văn bản
        router.push(`/van-ban-di/${documentId}`);
      } else {
        // Gọi API tạo văn bản mới
        const response_ = await outgoingDocumentsAPI.createOutgoingDocument(
          formDataToSubmit
        );
        const response = response_.data;
        toast({
          title: "Thành công",
          description: "Văn bản đã được tạo và gửi phê duyệt",
        });

        // Thêm thông báo
        addNotification({
          title: "Văn bản mới",
          message: `Văn bản "${formData.title}" đã được tạo và gửi phê duyệt`,
          type: "success",
        });

        // Chuyển hướng về trang danh sách văn bản
        router.push("/van-ban-di");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể gửi văn bản. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý lưu nháp
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);

      // Chuẩn bị dữ liệu form
      const draftData = {
        ...formData,
        status: "draft",
        sentDate: formData.sentDate.toISOString(),
      };

      // Nếu là chế độ chỉnh sửa
      if (mode === "edit" && documentId) {
        // Thêm danh sách ID tệp đính kèm bị xóa
        const removedAttachmentIds = initialData?.data?.attachments
          ?.filter((att: any) => existingAttachment?.id !== att.id)
          .map((att: any) => att.id);

        await outgoingDocumentsAPI.updateOutgoingDocument(documentId, {
          ...draftData,
          removedAttachmentIds,
        });

        // Upload tệp đính kèm mới nếu có
        if (attachment) {
          const formData = new FormData();
          formData.append("file", attachment);

          await outgoingDocumentsAPI.updateOutgoingDocument(
            documentId,
            formData
          );
        }

        toast({
          title: "Thành công",
          description: "Văn bản đã được lưu nháp",
        });

        // Chuyển hướng về trang chi tiết văn bản
        router.push(`/van-ban-di/${documentId}`);
      } else {
        // Tạo FormData để gửi cả file và dữ liệu
        const formDataToSubmit = new FormData();

        // Thêm các trường dữ liệu vào FormData
        Object.entries(draftData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formDataToSubmit.append(key, value.toString());
          }
        });

        // Thêm status=draft
        formDataToSubmit.append("status", "draft");

        // Thêm replyToId nếu có
        if (replyToId) {
          formDataToSubmit.append("replyToId", replyToId);
        }

        // Thêm tệp đính kèm
        if (attachment) {
          formDataToSubmit.append("file", attachment);
        }

        // Gọi API tạo văn bản nháp
        const response_ = await outgoingDocumentsAPI.createOutgoingDocument(
          formDataToSubmit
        );
        const response = response_.data;
        toast({
          title: "Thành công",
          description: "Văn bản đã được lưu nháp",
        });

        // Chuyển hướng về trang danh sách văn bản
        router.push("/van-ban-di");
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể lưu nháp văn bản. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Xử lý xóa văn bản (chỉ có trong chế độ edit)
  const handleDelete = async () => {
    if (!documentId) return;

    try {
      setIsDeleting(true);
      await outgoingDocumentsAPI.deleteOutgoingDocument(documentId);

      toast({
        title: "Thành công",
        description: "Văn bản đã được xóa thành công",
      });

      // Chuyển hướng về trang danh sách văn bản
      router.push("/van-ban-di");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa văn bản. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Hiển thị loading khi đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render giao diện form
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/van-ban-di">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "Tạo văn bản đi mới" : "Chỉnh sửa văn bản đi"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin văn bản</CardTitle>
                <CardDescription>
                  Nhập các thông tin cơ bản của văn bản
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="number">Số văn bản</Label>
                    <Input
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      placeholder="Số hiệu văn bản"
                      disabled={mode === "edit"}
                    />
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
                  <Label htmlFor="title">Trích yếu</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập trích yếu văn bản"
                    required
                  />
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
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Nơi nhận</Label>
                    <Input
                      id="recipient"
                      name="recipient"
                      value={formData.recipient}
                      onChange={handleInputChange}
                      placeholder="Nhập nơi nhận văn bản"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientDepartmentId">
                      Phòng ban nhận
                    </Label>
                    <Select
                      value={formData.recipientDepartmentId}
                      onValueChange={(value) =>
                        handleSelectChange("recipientDepartmentId", value)
                      }
                    >
                      <SelectTrigger id="recipientDepartmentId">
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id.toString()}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signer">Người ký</Label>
                    <Input
                      id="signer"
                      name="signer"
                      value={formData.signer}
                      onChange={handleInputChange}
                      placeholder="Nhập tên người ký"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signerPosition">Chức vụ người ký</Label>
                    <Input
                      id="signerPosition"
                      name="signerPosition"
                      value={formData.signerPosition}
                      onChange={handleInputChange}
                      placeholder="Nhập chức vụ người ký"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isUrgent"
                      checked={formData.isUrgent}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("isUrgent", checked as boolean)
                      }
                    />
                    <Label htmlFor="isUrgent">Văn bản khẩn</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isConfidential"
                      checked={formData.isConfidential}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(
                          "isConfidential",
                          checked as boolean
                        )
                      }
                    />
                    <Label htmlFor="isConfidential">Văn bản mật</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tệp đính kèm</CardTitle>
                <CardDescription>
                  Quản lý tệp đính kèm của văn bản
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attachment">Thêm tệp đính kèm mới</Label>
                  <Input
                    id="attachment"
                    type="file"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>

                {attachment && (
                  <div className="space-y-2">
                    <Label>Tệp mới</Label>
                    <div className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{attachment.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                        className="h-8 w-8 p-0 text-muted-foreground"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "edit" && existingAttachment && (
                  <div className="space-y-2">
                    <Label>Tệp hiện có</Label>
                    <div className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">{existingAttachment.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeExistingAttachment}
                        className="h-8 w-8 p-0 text-muted-foreground"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin phê duyệt</CardTitle>
                <CardDescription>
                  Thông tin về người soạn thảo và phê duyệt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label>Người soạn thảo</Label>
                  <div className="rounded-md border p-3 bg-accent/30">
                    <p className="font-medium">
                      {user?.name || "Người dùng hiện tại"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.roleDisplayNames || "Chức vụ"} -{" "}
                      {user?.departmentName || "Phòng ban"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approverId">Người phê duyệt</Label>
                  <Select
                    value={formData.approverId}
                    onValueChange={(value) =>
                      handleSelectChange("approverId", value)
                    }
                  >
                    <SelectTrigger id="approverId">
                      <SelectValue placeholder="Chọn người phê duyệt" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvers.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Không tìm thấy người phê duyệt
                        </SelectItem>
                      ) : (
                        approvers.map((approver) => (
                          <SelectItem key={approver.id} value={approver.id}>
                            {approver.fullName} - {approver.position}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Nhập ghi chú cho người phê duyệt (nếu có)"
                    rows={4}
                  />
                </div>

                <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Lưu ý:</span> Sau khi gửi, văn
                    bản sẽ được chuyển đến người phê duyệt để xem xét trước khi
                    ban hành chính thức.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "\u0110ang x\u1eed l\u00fd..."
                  ) : isFromClerkReturn ? (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Gửi lại văn thư
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Gửi phê duyệt
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    "\u0110ang l\u01b0u..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu nháp
                    </>
                  )}
                </Button>

                {mode === "edit" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Xóa văn bản
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận xóa văn bản
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa văn bản này? Hành động này
                          không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground"
                        >
                          {isDeleting
                            ? "\u0110ang x\u00f3a..."
                            : "Xác nhận x\u00f3a"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

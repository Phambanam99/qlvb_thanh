// app/(authenticated)/van-ban-di/[id]/chinh-sua/page.tsx
"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Save,
  Trash,
} from "lucide-react";
import Link from "next/link";
import {
  outgoingDocumentsAPI,
  workflowAPI,
  OutgoingDocumentDTO,
  DocumentWorkflowDTO,
} from "@/lib/api/";
import { departmentsAPI } from "@/lib/api/departments";
import { useToast } from "@/components/ui/use-toast";
import { UrgencyLevel, URGENCY_LEVELS } from "@/lib/types/urgency";
import { useAuth } from "@/lib/auth-context";
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

// Define the component as a regular named function
function EditOutgoingDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { hasRole, user } = useAuth();
  const documentId = params.id as string;

  const [_document, setDocument] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [canEdit, setCanEdit] = useState(true); // State để lưu kết quả kiểm tra quyền

  // Form state
  const [formData, setFormData] = useState({
    documentNumber: "",
    title: "",
    content: "",
    recipient: "",
    signer: "",
    signerPosition: "",
    sentDate: new Date(),
    documentType: "official",
    urgencyLevel: URGENCY_LEVELS.KHAN,
    notes: "",
  });
  const handleDownloadAttachment = async () => {
    if (!_document?.data?.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để tải",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob_ = await outgoingDocumentsAPI.downloadAttachmentDocument(
        Number(documentId)
      );
      const blob = blob_.data;

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;

      const filename =
        _document.data.attachmentFilename.split("/").pop() || "document.pdf";
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Thành công",
        description: "Đang tải tệp xuống",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải tệp đính kèm. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };
  // Hàm kiểm tra quyền chỉnh sửa công văn
  const checkEditPermission = (documentData: any) => {
    // Nếu không có dữ liệu công văn
    if (!documentData || !documentData.data) return false;

    const doc = documentData.data;

    // Nếu là người tạo công văn và công văn đang ở trạng thái nháp hoặc đã bị từ chối
    if (
      hasRole(["ROLE_DRAF", "ROLE_TRO_LY"]) &&
      (doc.status === "draft" || doc.status === "leader_commented")
    ) {
      return true;
    }

    // Kiểm tra xem công văn có bị từ chối không
    const wasRejected = doc.history?.some(
      (item: any) =>
        item.newStatus === "leader_commented" ||
        (item.comments && item.comments.toLowerCase().includes("từ chối")) ||
        (item.description && item.description.toLowerCase().includes("từ chối"))
    );

    // Sử dụng documentData.history thay vì _document.history
    const wasReturnedByClerk = documentData.history?.some(
      (item: any) =>
        (item.newStatus === "format_correction" &&
          item.previousStatus === "LEADER_APPROVED") ||
        (item.comments &&
          (item.comments.toLowerCase().includes("trả lại") ||
            item.comments.toLowerCase().includes("chỉnh sửa thể thức"))) ||
        (item.description &&
          (item.description.toLowerCase().includes("trả lại") ||
            item.description.toLowerCase().includes("chỉnh sửa thể thức")))
    );

    // Nếu là trợ lý và công văn đã bị từ chối
    if (hasRole("ROLE_TRO_LY") && (wasRejected || wasReturnedByClerk)) {
      return true;
    }

    // Nếu là văn thư và công văn đã được phê duyệt bởi thủ trưởng
    if (
      hasRole("ROLE_VAN_THU") &&
      (doc.status === "approved" || doc.status === "leader_approved")
    ) {
      return true;
    }

    // Mặc định không có quyền chỉnh sửa
    return false;
  };

  useEffect(() => {
    // Biến để kiểm tra component còn mounted hay không
    let isMounted = true;

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch document details và history cùng lúc để tránh render nhiều lần
        const [documentData_, history_] = await Promise.all([
          outgoingDocumentsAPI.getOutgoingDocumentById(documentId),
          workflowAPI.getDocumentHistory(documentId),
        ]);
        const documentData = documentData_.data;
        const history = history_.data;

        // Kiểm tra component còn mounted không trước khi cập nhật state
        if (!isMounted) return;

        // Tạo document mới với cả dữ liệu và history
        const documentWithHistory = {
          ...documentData,
          history: history,
        };

        // Cập nhật state
        setDocument(documentWithHistory);

        // Kiểm tra quyền truy cập sử dụng dữ liệu mới
        const hasEditPermission = checkEditPermission(documentWithHistory);

        // Cập nhật state canEdit
        setCanEdit(hasEditPermission);

        if (!hasEditPermission) {
          toast({
            title: "Không có quyền chỉnh sửa",
            description: "Bạn không có quyền chỉnh sửa công văn này.",
            variant: "destructive",
          });
          router.push(`/van-ban-di/${documentId}`);
          return;
        }

        // Set form data from document
        // Đảm bảo các trường dữ liệu được định dạng đúng
        const doc = documentData.data as any;
        setFormData({
          documentNumber: doc.number || doc.documentNumber || "",
          title: doc.title || "",
          content: doc.summary || "",
          recipient: doc.recipient || doc.receivingDepartmentText || "",
          signer: doc.signerName || "",
          signerPosition: doc.signerPosition || "",
          sentDate: doc.signingDate ? new Date(doc.signingDate) : new Date(),
          documentType: doc.documentType || "official",
          urgencyLevel: doc.urgencyLevel || URGENCY_LEVELS.KHAN,
          notes: doc.notes || "",
        });

        // Fetch existing attachments
        if (documentData.data.attachments) {
          setExistingAttachments(documentData.data.attachments);
        }
        // Check for single attachment format (attachmentFilename)
        else if (documentData.data.attachmentFilename) {
          // Create a single attachment object with the filename
          setExistingAttachments([
            {
              id: "single-attachment",
              name:
                documentData.data.attachmentFilename.split("/").pop() ||
                "Tài liệu đính kèm",
              filename: documentData.data.attachmentFilename,
            },
          ]);
        }

        // Fetch departments for dropdown
        const departmentsData_ = await departmentsAPI.getAllDepartments();
        const departmentsData = departmentsData_.data;
        // Sử dụng dữ liệu phòng ban từ API
        setDepartments(departmentsData.content as any);
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Lỗi",
            description:
              "Không thể tải thông tin công văn. Vui lòng thử lại sau.",
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
  }, [documentId, toast, router, hasRole]);

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
    if (e.target.files) {
      const newFile = e.target.files[0];
      setAttachment(newFile);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const removeExistingAttachment = () => {
    setExistingAttachments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Prepare form data for API
      let removedAttachmentIds: number[] = [];

      // Handle attachments removal logic
      if (_document.data.attachments && _document.data.attachments.length > 0) {
        // If we have an attachments array, check which ones were removed
        removedAttachmentIds = _document.data.attachments
          .filter(
            (att: any) => !existingAttachments.some((e) => e.id === att.id)
          )
          .map((att: any) => att.id);
      } else if (
        _document.data.attachmentFilename &&
        existingAttachments.length === 0
      ) {
        // If we had a single attachment and it was removed, mark it for removal
        // Note: We can't get the actual ID, but the backend should handle this with the empty list
        removedAttachmentIds = [0]; // Signal to the backend that the attachment was removed
      }

      const updateData = {
        ...formData,
        sentDate: formData.sentDate.toISOString(),
        removedAttachmentIds,
      };
      const documentObj: OutgoingDocumentDTO = {
        documentNumber: formData.documentNumber,
        receivingDepartmentText: formData.recipient,
        documentType: formData.documentType,
        title: formData.title,
        summary: formData.content,
        signerName: formData.signer,
      };
      var workflowData: DocumentWorkflowDTO;
      if (_document.data.status === "leader_approved") {
        workflowData = {
          status: "PUBLISHED",
          statusDisplayName: "Đã ban hành",
          comments: formData.notes,
        };
      } else {
        workflowData = {
          status: "REGISTERED",
          statusDisplayName: "Đã đăng ký",
          comments: formData.notes,
        };
      }

      // Tạo object dữ liệu từ FormData
      const documentData = {
        document: documentObj,
        workflow: workflowData,
      };

      // Update document metadata first
      await workflowAPI.updateOutgoingDocumentWorkflow(
        documentId,
        documentData
      );

      // Upload new attachment if any
      if (attachment) {
        // Use uploadAttachment instead of updateOutgoingDocument for file uploads
        await outgoingDocumentsAPI.uploadAttachment(documentId, attachment);
      }

      toast({
        title: "Thành công",
        description: "công văn đã được cập nhật thành công",
      });

      // Navigate back to document details
      router.push(`/van-ban-di/${documentId}`);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật công văn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await outgoingDocumentsAPI.deleteOutgoingDocument(documentId);

      toast({
        title: "Thành công",
        description: "công văn đã được xóa thành công",
      });

      // Navigate back to documents list
      router.push("/van-ban-di");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa công văn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!_document) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-2">
        <h2 className="text-xl font-semibold">Không tìm thấy công văn</h2>
        <p className="text-muted-foreground">
          công văn không tồn tại hoặc đã bị xóa
        </p>
        <Button variant="outline" asChild>
          <Link href="/van-ban-di">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-2">
        <h2 className="text-xl font-semibold">Không có quyền chỉnh sửa</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền chỉnh sửa công văn này hoặc công văn đã được gửi
        </p>
        <Button variant="outline" asChild>
          <Link href={`/van-ban-di/${documentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại chi tiết công văn
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/van-ban-di/${documentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Chỉnh sửa công văn đi
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card md:col-span-1">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin công văn</CardTitle>
              <CardDescription>Thông tin cơ bản của công văn đi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Số công văn</Label>
                  <Input
                    id="documentNumber"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    placeholder="Nhập số công văn"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentDate">Ngày ban hành</Label>
                  <DatePicker
                    date={formData.sentDate}
                    setDate={handleDateChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient">Nơi nhận</Label>
                  <Input
                    id="recipient"
                    name="recipient"
                    value={formData.recipient}
                    onChange={handleInputChange}
                    placeholder="Nhập tên đơn vị nhận"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documentType">Loại công văn</Label>
                  <Select
                    name="documentType"
                    value={formData.documentType}
                    onValueChange={(value) =>
                      handleSelectChange("documentType", value)
                    }
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue placeholder="Chọn loại công văn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="official">Công văn</SelectItem>
                      <SelectItem value="decision">Quyết định</SelectItem>
                      <SelectItem value="directive">Chỉ thị</SelectItem>
                      <SelectItem value="report">Báo cáo</SelectItem>
                      <SelectItem value="plan">Kế hoạch</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Trích yếu</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập trích yếu công văn"
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
                  placeholder="Nhập nội dung công văn"
                  rows={10}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attachments">Tệp đính kèm</Label>
                <div className="space-y-2">
                  {_document.data.attachmentFilename ? (
                    <div className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {_document.data.attachmentFilename.split("/").pop() ||
                            "Tài liệu đính kèm"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={handleDownloadAttachment}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : _document.attachments &&
                    _document.attachments.length > 0 ? (
                    _document.attachments.map((file: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {file.size}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleDownloadAttachment()}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Không có tệp đính kèm
                    </p>
                  )}
                </div>
                {existingAttachments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label>Tệp hiện có</Label>
                    <div className="space-y-2">
                      {existingAttachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm">{att.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleDownloadAttachment}
                              className="h-8 w-8 p-0 text-muted-foreground"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setExistingAttachments(
                                  existingAttachments.filter(
                                    (a) => a.id !== att.id
                                  )
                                );
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("attachments")?.click()
                    }
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Chọn tệp
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {attachment ? attachment.name : "Chưa có tệp nào được chọn"}
                  </span>
                </div>
                {attachment && (
                  <div className="mt-2">
                    <div className="text-sm">
                      {attachment.name} ({(attachment.size / 1024).toFixed(2)}{" "}
                      KB)
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card md:col-span-1">
            <CardHeader className="bg-primary/5 border-b">
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
                    {user?.fullName || "Người dùng hiện tại"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.position || "Chức vụ"} -{" "}
                    {user?.departmentId
                      ? `Phòng ${user.departmentId}`
                      : "Phòng ban"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signer">Người ký</Label>
                <Input
                  id="signer"
                  name="signer"
                  value={formData.signer}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người ký"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signerPosition">Chức vụ</Label>
                <Input
                  id="signerPosition"
                  name="signerPosition"
                  value={formData.signerPosition}
                  onChange={handleInputChange}
                  placeholder="Nhập chức vụ người ký"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Độ ưu tiên</Label>
                <Select
                  name="priority"
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
                  placeholder="Nhập ghi chú (nếu có)"
                  rows={4}
                />
              </div>

              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Lưu ý:</span> Sau khi lưu, văn
                  bản sẽ được cập nhật trong hệ thống.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={`/van-ban-di/${documentId}`}>Hủy</Link>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="mt-4" disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Xóa công văn
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa công văn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa công văn này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export the component as default
export default EditOutgoingDocumentPage;

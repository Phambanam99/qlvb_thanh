"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  FileText,
  User,
  Users,
  Paperclip,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useToast } from "@/components/ui/use-toast";
import { UrgencyLevel, URGENCY_LEVELS } from "@/lib/types/urgency";
import { UrgencySelect } from "@/components/urgency-select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import {
  workflowAPI,
  usersAPI,
  senderApi,
  SenderDTO,
  documentTypesAPI,
  DocumentTypeDTO,
} from "@/lib/api";

export default function CreateExternalOutgoingDocumentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  // State for form data
  const [formData, setFormData] = useState({
    documentNumber: "",
    sentDate: new Date(),
    recipient: "",
    documentType: "",
    title: "",
    content: "",
    approver: "",
    urgencyLevel: URGENCY_LEVELS.KHAN,
    note: "",
    // New fields for OutgoingDocument
    draftingDepartmentEntityId: user?.departmentId || "",
    securityLevel: "normal", // normal, confidential, secret, top_secret
    documentSignerId: "",
    isSecureTransmission: false,
    processingDeadline: null as Date | null,
    issuingAgency: "",
    distributionType: 1, // 1=regular, 2=confidential, 3=copy_book, 5=party, 10=steering_committee
    numberOfCopies: 1,
    numberOfPages: 1,
    noPaperCopy: false,
  });

  // State for file attachments (multiple files)
  const [files, setFiles] = useState<File[]>([]);

  // State for loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(false);
  const [approvers, setApprovers] = useState<any[]>([]);

  // State for recipients/senders
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipients, setRecipients] = useState<SenderDTO[]>([]);

  // State for document types
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);

  // Fetch approvers and recipients when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.id) {
        return;
      }

      try {
        // Fetch approvers
        setIsLoadingApprovers(true);
        const leaderUsers_ = await usersAPI.getUserForApproval(user.id);
        const leaderUsers = leaderUsers_.data;
        const seniorLeadersResponse =  await usersAPI.getUsersByRoleAndDepartment(
            ["ROLE_SENIOR_LEADER"],
            0 // 0 to get from all departments
          );
        const allApprovers = [...leaderUsers, ...seniorLeadersResponse];
        const uniqueApprovers = allApprovers.filter(
          (approver, index, self) =>
            index === self.findIndex((a) => a.id === approver.id)
        );
        setApprovers(uniqueApprovers);

        // Fetch recipients/senders
        setIsLoadingRecipients(true);
        const sendersData_ = await senderApi.getAllSenders();
        const sendersData = sendersData_.data;
        setRecipients(sendersData || []);

        // Fetch document types
        setIsLoadingDocumentTypes(true);
        const documentTypesData_ =   await documentTypesAPI.getActiveDocumentTypes();
        const documentTypesData = documentTypesData_.data;  
        setDocumentTypes(documentTypesData || []);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu",
          variant: "destructive",
        });
      } finally {
        setIsLoadingApprovers(false);
        setIsLoadingRecipients(false);
        setIsLoadingDocumentTypes(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Input change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRichTextChange = (name: string) => (html: string) => {
    setFormData((prev) => ({ ...prev, [name]: html }));
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
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submission handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (
      !formData.documentNumber ||
      !formData.title ||
      !formData.recipient ||
      !formData.approver
    ) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare document data
      const documentData: any = {
        documentNumber: formData.documentNumber,
        title: formData.title,
        summary: formData.content,
        documentType: formData.documentType,
        receivingDepartmentText: formData.recipient,
        signingDate: formData.sentDate,
        approverId: formData.approver,
        priority: formData.urgencyLevel,
        notes: formData.note,
        status: "PENDING_APPROVAL", // Set status for submission (not draft)
        // New fields
        draftingDepartmentEntityId: formData.draftingDepartmentEntityId,
        securityLevel: formData.securityLevel,
        documentSignerId: formData.documentSignerId,
        isSecureTransmission: formData.isSecureTransmission,
        processingDeadline: formData.processingDeadline,
        issuingAgency: formData.issuingAgency,
        distributionType: formData.distributionType,
        numberOfCopies: formData.numberOfCopies,
        numberOfPages: formData.numberOfPages,
        noPaperCopy: formData.noPaperCopy,
      };

      // Call API to create outgoing document
      await workflowAPI.createOugoingAlone(
        documentData,
        files.length > 0 ? files : null
      );

      // Show success notification
      toast({
        title: "Thành công",
        description: "Văn bản đã được tạo và gửi phê duyệt",
      });

      addNotification({
        title: "Văn bản mới",
        message: `Văn bản "${formData.title}" đã được tạo và gửi phê duyệt`,
        type: "success",
      });

      // Redirect to outgoing documents list
      router.push("/van-ban-di");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Có lỗi xảy ra khi tạo văn bản",
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

    try {
      setIsSubmitting(true);

      // Prepare document data
      const documentData: any = {
        documentNumber: formData.documentNumber,
        title: formData.title,
        summary: formData.content,
        documentType: formData.documentType,
        receivingDepartmentText: formData.recipient,
        signingDate: formData.sentDate,
        approverId: formData.approver,
        priority: formData.urgencyLevel,
        notes: formData.note,
        status: "DRAFT", // Set status as draft
        // New fields
        draftingDepartmentEntityId: formData.draftingDepartmentEntityId,
        securityLevel: formData.securityLevel,
        documentSignerId: formData.documentSignerId,
        isSecureTransmission: formData.isSecureTransmission,
        processingDeadline: formData.processingDeadline,
        issuingAgency: formData.issuingAgency,
        distributionType: formData.distributionType,
        numberOfCopies: formData.numberOfCopies,
        numberOfPages: formData.numberOfPages,
        noPaperCopy: formData.noPaperCopy,
      };

      // Call API to create outgoing document as draft
      await workflowAPI.createOugoingAlone(
        documentData,
        files.length > 0 ? files : null
      );

      // Show success notification
      toast({
        title: "Thành công",
        description: "Văn bản đã được lưu nháp",
      });

      // Redirect to outgoing documents list
      router.push("/van-ban-di");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Có lỗi xảy ra khi lưu nháp",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-6 max-w-5xl px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/van-ban-di/them-moi">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Tạo văn bản đi mới - Gửi bên ngoài
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="submit"
              form="document-form"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Gửi phê duyệt
            </Button>
          </div>
        </div>

        <form id="document-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Document Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
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
                  <Label htmlFor="documentType">Loại văn bản</Label>
                  <SearchableSelect
                    items={documentTypes.map((docType): SearchableSelectItem => ({
                      value: docType.name,
                      label: docType.name,
                    }))}
                    value={formData.documentType}
                    onValueChange={(value) =>
                      handleSelectChange("documentType", value)
                    }
                    placeholder="Chọn loại văn bản"
                    searchPlaceholder="Tìm kiếm loại văn bản..."
                    emptyMessage="Không tìm thấy loại văn bản phù hợp"
                    loading={isLoadingDocumentTypes}
                    loadingMessage="Đang tải danh sách..."
                    disabled={isLoadingDocumentTypes}
                  />
                </div>
              </div>

              {/* New fields for OutgoingDocument */}
              <div className="grid gap-6 md:grid-cols-3 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="securityLevel">Độ mật</Label>
                  <Select
                    value={formData.securityLevel}
                    onValueChange={(value) =>
                      handleSelectChange("securityLevel", value)
                    }
                  >
                    <SelectTrigger id="securityLevel">
                      <SelectValue placeholder="Chọn độ mật" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Bình thường</SelectItem>
                      <SelectItem value="confidential">Mật</SelectItem>
                      <SelectItem value="secret">Tối mật</SelectItem>
                      <SelectItem value="top_secret">Tuyệt mật</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distributionType">Khối phát hành</Label>
                  <Select
                    value={formData.distributionType.toString()}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, distributionType: parseInt(value) }))
                    }
                  >
                    <SelectTrigger id="distributionType">
                      <SelectValue placeholder="Chọn khối phát hành" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Đi thường</SelectItem>
                      <SelectItem value="2">Đi mật</SelectItem>
                      <SelectItem value="3">Sổ sao</SelectItem>
                      <SelectItem value="5">Đi đảng</SelectItem>
                      <SelectItem value="10">Đi ban chỉ đạo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuingAgency">Cơ quan ban hành</Label>
                  <Input
                    id="issuingAgency"
                    name="issuingAgency"
                    value={formData.issuingAgency}
                    onChange={handleInputChange}
                    placeholder="Nhập cơ quan ban hành"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="numberOfCopies">Số bản</Label>
                  <Input
                    id="numberOfCopies"
                    name="numberOfCopies"
                    type="number"
                    min="1"
                    value={formData.numberOfCopies}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfCopies: parseInt(e.target.value) || 1 }))}
                    placeholder="Số bản"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfPages">Số tờ</Label>
                  <Input
                    id="numberOfPages"
                    name="numberOfPages"
                    type="number"
                    min="1"
                    value={formData.numberOfPages}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfPages: parseInt(e.target.value) || 1 }))}
                    placeholder="Số tờ"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processingDeadline">Hạn xử lý</Label>
                  <Input
                    id="processingDeadline"
                    name="processingDeadline"
                    type="date"
                    value={formData.processingDeadline?.toISOString().split("T")[0] || ""}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      processingDeadline: e.target.value ? new Date(e.target.value) : null 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tùy chọn khác</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isSecureTransmission"
                        checked={formData.isSecureTransmission}
                        onChange={(e) => setFormData(prev => ({ ...prev, isSecureTransmission: e.target.checked }))}
                      />
                      <Label htmlFor="isSecureTransmission">Chuyển bằng điện mật</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="noPaperCopy"
                        checked={formData.noPaperCopy}
                        onChange={(e) => setFormData(prev => ({ ...prev, noPaperCopy: e.target.checked }))}
                      />
                      <Label htmlFor="noPaperCopy">Không gửi bản giấy</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mt-6">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient">
                    Nơi nhận <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.recipient}
                    onValueChange={(value) =>
                      handleSelectChange("recipient", value)
                    }
                  >
                    <SelectTrigger id="recipient">
                      <SelectValue placeholder="Chọn nơi nhận văn bản" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingRecipients ? (
                        <SelectItem value="loading" disabled>
                          Đang tải danh sách...
                        </SelectItem>
                      ) : recipients.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Chưa có nơi nhận nào
                        </SelectItem>
                      ) : (
                        recipients.map((recipient) => (
                          <SelectItem key={recipient.id} value={recipient.name}>
                            {recipient.name}
                            {recipient.description && (
                              <span className="text-xs text-muted-foreground ml-2">
                                - {recipient.description}
                              </span>
                            )}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>


            </CardContent>
          </Card>

          {/* Content and Approval */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Content Card - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardContent className="pt-6 h-full">
                  <div className="space-y-2 h-full flex flex-col">
                    <Label htmlFor="content">Nội dung văn bản</Label>
                    <div className="flex-1">
                      <RichTextEditor
                        content={formData.content}
                        onChange={handleRichTextChange("content")}
                        placeholder="Nhập nội dung văn bản"
                        minHeight="200px"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Approval Card - Takes 1 column */}
            <Card className="h-full">
             
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Người soạn thảo</Label>
                    <div className="rounded-md border p-3 bg-accent/30">
                      <p className="font-medium text-sm">
                        {user?.fullName || "Người dùng hiện tại"}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                      onValueChange={(value) =>
                        handleSelectChange("approver", value)
                      }
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
                            <SelectItem
                              key={approver.id}
                              value={String(approver.id)}
                            >
                              {approver.fullName} - {approver.roleDisplayNames}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <UrgencySelect
                    value={formData.urgencyLevel}
                    onValueChange={(value) =>
                      handleSelectChange("urgencyLevel", value)
                    }
                    label="Độ khẩn"
                    required
                  />


                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <Card>
          
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <RichTextEditor
                  content={formData.note}
                  onChange={handleRichTextChange("note")}
                  placeholder="Nhập ghi chú cho người phê duyệt (nếu có)"
                  minHeight="120px"
                />
              </div>
            </CardContent>
          </Card>

          {/* File Attachments Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="file">Tệp đính kèm</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    <Paperclip className="mr-2 h-4 w-4" />
                    Chọn tệp
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {files.length > 0
                      ? `Đã chọn ${files.length} tệp`
                      : "Chưa có tệp nào được chọn"}
                  </span>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info Note */}
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              <span className="font-medium">Lưu ý:</span> Sau khi gửi, văn bản
              sẽ được chuyển đến người phê duyệt để xem xét trước khi ban hành
              chính thức.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

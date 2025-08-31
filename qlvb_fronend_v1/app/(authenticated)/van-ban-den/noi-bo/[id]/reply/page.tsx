"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  UrgencyLevel,
  URGENCY_LEVELS,
  migrateFromOldUrgency,
  getUrgencyBadgeVariant,
  getUrgencyLabel,
} from "@/lib/types/urgency";
import { UrgencyBadge } from "@/components/urgency-badge";
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
  Building,
  Calendar,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useToast } from "@/components/ui/use-toast";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getDocumentById,
  replyToDocument,
  replyToDocumentWithAttachments,
} from "@/lib/api/internalDocumentApi";
import { documentTypesAPI, DocumentTypeDTO, usersAPI, departmentsAPI } from "@/lib/api";
import { UserDTO } from "@/lib/api/users";
import { DepartmentDTO } from "@/lib/api/departments";
import { Checkbox } from "@/components/ui/checkbox";

interface OriginalDocument {
  id: number;
  documentNumber: string;
  title: string;
  summary: string;
  documentType: string;
  signingDate: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  status: "DRAFT" | "SENT" | "APPROVED";
  senderId: number;
  senderName: string;
  senderDepartment: string;
  createdAt: string;
}

export default function ReplyInternalDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const originalDocumentId = params.id as string;

  // State for original document
  const [originalDocument, setOriginalDocument] =
    useState<OriginalDocument | null>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(true);

  // State for reply form data
  const [formData, setFormData] = useState({
    documentNumber: "",
    signingDate: new Date(),
    documentType: "",
    title: "",
    summary: "",
    urgencyLevel: URGENCY_LEVELS.KHAN as UrgencyLevel,
    notes: "",
    signer: "",
    draftingDepartmentId: user?.departmentId as number | undefined,
    securityLevel: 'NORMAL' as 'NORMAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET',
    documentSignerId: undefined as number | undefined,
    isSecureTransmission: false,
    processingDeadline: undefined as Date | undefined,
    issuingAgency: "",
    distributionType: 'REGULAR' as 'REGULAR' | 'CONFIDENTIAL' | 'COPY_BOOK' | 'PARTY' | 'STEERING_COMMITTEE',
    numberOfCopies: undefined as number | undefined,
    numberOfPages: undefined as number | undefined,
    noPaperCopy: false,
  });

  // State for file attachments (multiple files)
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // State for document types
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);

  // State for departments and users
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [leadershipUsers, setLeadershipUsers] = useState<UserDTO[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingLeadershipUsers, setIsLoadingLeadershipUsers] = useState(false);

  // Leadership roles for document signers
  const LEADERSHIP_ROLES = [
    "ROLE_CUC_TRUONG",
    "ROLE_CUC_PHO", 
    "ROLE_CHINH_UY",
    "ROLE_PHO_CHINH_UY",
    "ROLE_TRUONG_PHONG",
    "ROLE_PHO_PHONG",
    "ROLE_TRUONG_BAN",
    "ROLE_PHO_BAN",
    "ROLE_CUM_TRUONG",
    "ROLE_PHO_CUM_TRUONG",
    "ROLE_TRAM_TRUONG"
  ];

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

  // Load original document and document types
  useEffect(() => {
    let isCancelled = false; // Cleanup flag to prevent state updates after unmount
    
    const fetchData = async () => {
      if (isCancelled) return; // Exit early if component unmounted
      
      try {
        // Fetch original document
        setLoadingOriginal(true);
        const originalDoc_ = await getDocumentById(Number(originalDocumentId));
        const originalDoc = originalDoc_.data;
        setOriginalDocument(originalDoc);

        // Map old urgency levels to new ones
        const mapOldUrgencyToNew = (oldUrgency: string): UrgencyLevel => {
          switch (oldUrgency) {
            case 'NORMAL':
              return URGENCY_LEVELS.THUONG_KHAN;
            case 'HIGH':
              return URGENCY_LEVELS.KHAN;
            case 'URGENT':
              return URGENCY_LEVELS.HOA_TOC;
            default:
              return URGENCY_LEVELS.THUONG_KHAN;
          }
        };

        // Pre-fill reply form with related data
        setFormData((prev) => ({
          ...prev,
          title: `Trả lời: ${originalDoc.title}`,
          documentType: originalDoc.documentType,
          urgencyLevel: mapOldUrgencyToNew(originalDoc.priority),
          draftingDepartmentId: user?.departmentId,
        }));

        // Fetch document types
        setIsLoadingDocumentTypes(true);
        const types = await documentTypesAPI.getAllDocumentTypes();
       
        setDocumentTypes(types);

        // Fetch departments
        setIsLoadingDepartments(true);
        const depts_ = await departmentsAPI.getAllDepartments();
        const depts = depts_.data;
        setDepartments(depts.content || []);

        // Fetch leadership users for current user's department
        if (user?.departmentId) {
          setIsLoadingLeadershipUsers(true);
          const users_ = await usersAPI.getUsersByDepartmentId(user.departmentId);
          const users = users_.data;
          const leaders = users.filter(u => 
            u.roles?.some(role => LEADERSHIP_ROLES.includes(role))
          );
          setLeadershipUsers(leaders);
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description:
            "Không thể tải thông tin văn bản gốc. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoadingOriginal(false);
        setIsLoadingDocumentTypes(false);
        setIsLoadingDepartments(false);
        setIsLoadingLeadershipUsers(false);
      }
    };

    if (originalDocumentId) {
      fetchData();
    }
  }, [originalDocumentId, toast, user?.departmentId]);

  // Input change handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for RichTextEditor components
  const handleRichTextChange = (name: string) => (html: string) => {
    setFormData((prev) => ({ ...prev, [name]: html }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, signingDate: date }));
    }
  };

  const handleProcessingDeadlineChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, processingDeadline: date }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
  };

  const handleCheckboxChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("vi-VN");
    } catch {
      return dateString || "-";
    }
  };

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.documentNumber) {
      errors.documentNumber = "Vui lòng nhập số văn bản";
    }
    if (!formData.title) {
      errors.title = "Vui lòng nhập tiêu đề";
    }
    if (!formData.documentType) {
      errors.documentType = "Vui lòng chọn loại văn bản";
    }
    if (!formData.documentSignerId) {
      errors.documentSignerId = "Vui lòng chọn người ký";
    }
    if (!formData.draftingDepartmentId) {
      errors.draftingDepartmentId = "Không tìm thấy đơn vị soạn thảo";
    }

    return errors;
  };

  // Form submission handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !user?.departmentId) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
        variant: "destructive",
      });
      return;
    }

    const userId = user.id;
    const departmentId = user.departmentId;

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Additional validation for IDs
      if (!formData.documentSignerId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn người ký văn bản",
          variant: "destructive",
        });
        return;
      }

      if (!user?.departmentId) {
        toast({
          title: "Lỗi", 
          description: "Không tìm thấy thông tin phòng ban của người dùng",
          variant: "destructive",
        });
        return;
      }

      const formDataToSubmit = {
        ...formData,
        createdBy: Number(user?.id), // Ensure it's a number
        draftingDepartmentId: Number(user?.departmentId), // Ensure it's a number
        documentSignerId: Number(formData.documentSignerId), // Ensure it's a number
      };

      // Prepare reply document data
      const replyData = {
        ...formDataToSubmit,
        replyToId: Number(originalDocumentId),
        status: "SENT",
        recipients: [
          {
            departmentId: Number(user?.departmentId), // Use current user's department
            userId: originalDocument?.senderId || null, // Reply to the original sender
          },
        ],
      };

    

      // Submit the reply
      let result_;
      if (files.length > 0) {
        result_ = await replyToDocumentWithAttachments(Number(originalDocumentId), replyData, files);
      } else {
        result_ = await replyToDocument(Number(originalDocumentId), replyData);
      }


      // Check for errors in the response
      if (result_.success === false || (result_.message && result_.data === null)) {
        toast({
          title: "Lỗi",
          description: result_.message || "Có lỗi xảy ra khi gửi văn bản",
          variant: "destructive",
        });
        return; // Stop execution if there's an error
      }

      // Only show success if no errors
      if (result_.success !== false && result_.data !== null) {
        // Show success message
        toast({
          title: "Thành công",
          description: "Văn bản trả lời đã được gửi",
        });

        // Add notification
        addNotification({
          title: "Văn bản trả lời mới",
          message: `Văn bản trả lời "${formDataToSubmit.title}" đã được gửi`,
          type: "success",
        });

        // Navigate back to document list with internal tab
        router.push("/van-ban-den?tab=internal");
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

      const replyData = {
        documentNumber: formData.documentNumber,
        title: formData.title,
        summary: formData.summary,
        documentType: formData.documentType,
        signingDate: formData.signingDate,
        priority: formData.urgencyLevel.toUpperCase(),
        notes: formData.notes,
        signer: formData.signer,
        draftingDepartmentId: formData.draftingDepartmentId,
        securityLevel: formData.securityLevel,
        documentSignerId: formData.documentSignerId,
        isSecureTransmission: formData.isSecureTransmission,
        processingDeadline: formData.processingDeadline,
        issuingAgency: formData.issuingAgency,
        distributionType: formData.distributionType,
        numberOfCopies: formData.numberOfCopies,
        numberOfPages: formData.numberOfPages,
        noPaperCopy: formData.noPaperCopy,
        replyToId: Number(originalDocumentId),
        status: "DRAFT",
        isInternal: true,
        recipients: [
          {
            departmentId: Number(user?.departmentId),
            userId: originalDocument?.senderId || null,
          },
        ],
      };

      await replyToDocument(Number(originalDocumentId), replyData);

      toast({
        title: "Thành công",
        description: "Văn bản trả lời đã được lưu nháp",
      });

      router.push(`/van-ban-den/noi-bo/${originalDocumentId}`);
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

  if (loadingOriginal) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (!originalDocument) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy văn bản</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Không thể tải thông tin văn bản gốc để trả lời
          </p>
          <Button asChild className="mt-4">
            <Link href="/van-ban-den">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/van-ban-den/noi-bo/${originalDocumentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Trả lời văn bản nội bộ
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
            Gửi trả lời
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Original Document Card */}
        <Card>
          <CardHeader className="bg-secondary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Văn bản gốc
            </CardTitle>
            <CardDescription>Thông tin văn bản đang trả lời</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Số văn bản
                </label>
                <p className="font-medium">{originalDocument.documentNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày ký
                </label>
                <p className="font-medium">
                  {formatDate(originalDocument.signingDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Người gửi
                </label>
                <p className="font-medium">{originalDocument.senderName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Độ ưu tiên
                </label>
                <div className="mt-1">
                  {getUrgencyLabel(originalDocument.priority)}
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tiêu đề
              </label>
              <p className="font-medium text-lg">{originalDocument.title}</p>
            </div>
            {originalDocument.summary && (
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">
                  Nội dung
                </label>
                <p
                  className="whitespace-pre-wrap text-sm"
                  dangerouslySetInnerHTML={{ __html: originalDocument.summary }}
                ></p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reply Form */}
        <form ref={formRef} id="reply-form" onSubmit={handleSubmit}>
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin văn bản trả lời</CardTitle>
              <CardDescription>
                Nhập thông tin cho văn bản trả lời
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary border-b pb-2">
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">
                      Số văn bản <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="documentNumber"
                      name="documentNumber"
                      value={formData.documentNumber}
                      onChange={handleInputChange}
                      placeholder="Nhập số văn bản trả lời"
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
                    <Label htmlFor="signingDate">Ngày ký</Label>
                    <DatePicker
                      date={formData.signingDate}
                      setDate={handleDateChange}
                    />
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
              </div>

             

              {/* Document Classification Section */}
              <div className="space-y-4">
              
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">
                      Loại văn bản <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) =>
                        handleSelectChange("documentType", value)
                      }
                    >
                      <SelectTrigger 
                        id="documentType"
                        className={validationErrors.documentType ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Chọn loại văn bản" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingDocumentTypes ? (
                          <SelectItem value="loading" disabled>
                            Đang tải danh sách loại văn bản...
                          </SelectItem>
                        ) : documentTypes.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Chưa có loại văn bản nào
                          </SelectItem>
                        ) : (
                          documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.documentType && (
                      <p className="text-sm text-red-500">
                        {validationErrors.documentType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="urgencyLevel">Độ ưu tiên</Label>
                    <Select
                      value={formData.urgencyLevel}
                      onValueChange={(value) =>
                        handleSelectChange("urgencyLevel", value)
                      }
                    >
                      <SelectTrigger id="urgencyLevel">
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
                    <Label htmlFor="securityLevel">Mức độ bảo mật</Label>
                    <Select
                      value={formData.securityLevel}
                      onValueChange={(value) =>
                        handleSelectChange("securityLevel", value)
                      }
                    >
                      <SelectTrigger id="securityLevel">
                        <SelectValue placeholder="Chọn mức độ bảo mật" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMAL">Thường</SelectItem>
                        <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
                        <SelectItem value="SECRET">Tối mật</SelectItem>
                        <SelectItem value="TOP_SECRET">Tuyệt mật</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Signer and Department Section */}
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentSignerId">
                      Người ký <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.documentSignerId?.toString() || ""}
                      onValueChange={(value) =>
                        handleSelectChange("documentSignerId", value)
                      }
                    >
                      <SelectTrigger 
                        id="documentSignerId"
                        className={validationErrors.documentSignerId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Chọn người ký" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingLeadershipUsers ? (
                          <SelectItem value="loading" disabled>
                            Đang tải danh sách lãnh đạo...
                          </SelectItem>
                        ) : leadershipUsers.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Chưa có lãnh đạo nào
                          </SelectItem>
                        ) : (
                          leadershipUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.fullName} - {getRoleDisplayName(user.roles?.[0] || "")}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.documentSignerId && (
                      <p className="text-sm text-red-500">
                        {validationErrors.documentSignerId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 " >
                    <Label htmlFor="draftingDepartmentId">
                      Đơn vị soạn thảo <span className="text-red-500">*</span>
                    </Label>
                    <Select disabled={true} 
                      value={formData.draftingDepartmentId?.toString() || ""}
                      onValueChange={(value) =>
                        handleSelectChange("draftingDepartmentId", value)
                      }
                    >
                      <SelectTrigger 
                        id="draftingDepartmentId"
                        className={validationErrors.draftingDepartmentId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Chọn đơn vị soạn thảo" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingDepartments ? (
                          <SelectItem value="loading" disabled>
                            Đang tải danh sách đơn vị...
                          </SelectItem>
                        ) : departments.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Chưa có đơn vị nào
                          </SelectItem>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {validationErrors.draftingDepartmentId && (
                      <p className="text-sm text-red-500">
                        {validationErrors.draftingDepartmentId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Processing and Distribution Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="processingDeadline">Hạn xử lý</Label>
                    <DatePicker
                      date={formData.processingDeadline}
                      setDate={handleProcessingDeadlineChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distributionType">Khối phát hành</Label>
                    <Select
                      value={formData.distributionType}
                      onValueChange={(value) =>
                        handleSelectChange("distributionType", value)
                      }
                    >
                      <SelectTrigger id="distributionType">
                        <SelectValue placeholder="Chọn khối phát hành" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REGULAR">Thường</SelectItem>
                        <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
                        <SelectItem value="COPY_BOOK">Sao lưu</SelectItem>
                        <SelectItem value="PARTY">Đảng</SelectItem>
                        <SelectItem value="STEERING_COMMITTEE">Ban chỉ đạo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numberOfCopies">Số bản</Label>
                    <Input
                      id="numberOfCopies"
                      name="numberOfCopies"
                      type="number"
                      min="1"
                      value={formData.numberOfCopies || ""}
                      onChange={handleNumberInputChange}
                      placeholder="Nhập số bản"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfPages">Số trang</Label>
                    <Input
                      id="numberOfPages"
                      name="numberOfPages"
                      type="number"
                      min="1"
                      value={formData.numberOfPages || ""}
                      onChange={handleNumberInputChange}
                      placeholder="Nhập số trang"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isSecureTransmission"
                      checked={formData.isSecureTransmission}
                      onCheckedChange={handleCheckboxChange("isSecureTransmission")}
                    />
                    <Label htmlFor="isSecureTransmission">Chuyển bằng điện mật</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="noPaperCopy"
                      checked={formData.noPaperCopy}
                      onCheckedChange={handleCheckboxChange("noPaperCopy")}
                    />
                    <Label htmlFor="noPaperCopy">Không in bản giấy</Label>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="files">Tệp đính kèm</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                />
                <p className="text-sm text-muted-foreground">
                  Có thể chọn nhiều file. Định dạng hỗ trợ: PDF, Word, Excel,
                  PowerPoint, hình ảnh, văn bản.
                </p>

                {/* Display selected files */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Các file đã chọn:</Label>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            Xóa
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              
              </div>
               {/* Document Content Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Tiêu đề <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Nhập tiêu đề văn bản trả lời"
                    required
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-500">
                      {validationErrors.title}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">
                  Nội dung trả lời <span className="text-red-500">*</span>
                </Label>
                <RichTextEditor
                  content={formData.summary}
                  onChange={handleRichTextChange("summary")}
                  placeholder="Nhập nội dung trả lời"
                  className={validationErrors.summary ? "border-red-500" : ""}
                  minHeight="150px"
                />
                {validationErrors.summary && (
                  <p className="text-sm text-red-500">
                    {validationErrors.summary}
                  </p>
                )}
              </div>
              {/* Notes Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <RichTextEditor
                    content={formData.notes}
                    onChange={handleRichTextChange("notes")}
                    placeholder="Nhập ghi chú (nếu có)"
                    minHeight="100px"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </div>  
  );
}

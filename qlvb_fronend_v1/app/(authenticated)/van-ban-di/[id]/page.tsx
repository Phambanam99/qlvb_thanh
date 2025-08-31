"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  FileText,
  Send,
  Edit,
  Trash,
  CheckCircle,
  XCircle,
  Reply,
  Loader2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import PDFViewerModal from "@/components/ui/pdf-viewer-modal";
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
import { Textarea } from "@/components/ui/textarea";
import {
  OutgoingDocumentDTO,
  outgoingDocumentsAPI,
  workflowAPI,
  incomingDocumentsAPI,
  IncomingDocumentDTO,
  DocumentWorkflowDTO,
  DocumentAttachmentDTO,
} from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { getStatusBadgeInfo } from "@/lib/utils";
import { isPDFFile } from "@/lib/utils/pdf-viewer";
import { DocumentReadersDialog } from "@/components/document-readers-dialog";
import { DocumentReadStats } from "@/components/document-read-stats";
import { outgoingExternalReadStatus } from "@/lib/api/documentReadStatus";
// Remove unused import

export default function OutgoingDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const documentId = Number.parseInt(id);
  const { user, hasRole } = useAuth();
  const { addNotification } = useNotifications();
  const { toast } = useToast();
  const router = useRouter();

  const [_document, setDocument] = useState<OutgoingDocumentDTO>();
  const [relatedDocuments, setRelatedDocuments] =
    useState<IncomingDocumentDTO>();
  const [attachments, setAttachments] = useState<DocumentAttachmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // PDF Viewer states
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    fileName: string;
    title: string;
  } | null>(null);

  // Fetch attachments function
  const fetchAttachments = async () => {
    try {
      const attachmentsData_ = await outgoingDocumentsAPI.getDocumentAttachments(
        documentId
      );
      const attachmentsData = attachmentsData_.data;
      setAttachments(attachmentsData);
    } catch (error) {
      // Don't show error toast as this might be expected if API doesn't exist yet
    }
  };

  useEffect(() => {
    // Biến để kiểm tra component còn mounted hay không
    let isMounted = true;

    const fetchDocument = async () => {
      try {
        setIsLoading(true);

        // Gọi các API song song để tăng hiệu suất
        const [documentResponse_, history_] = await Promise.all([
          outgoingDocumentsAPI.getOutgoingDocumentById(documentId),
          workflowAPI.getDocumentHistory(documentId),
        ]);
        const documentResponse = documentResponse_.data;
        const history = history_.data;

        // Fetch attachments
        await fetchAttachments();

        // Kiểm tra component còn mounted không trước khi cập nhật state
        if (!isMounted) return;

        const documentData = documentResponse.data;
        
        setDocument({
          ...documentData,
          history: history,
        });

        setHistoryLoaded(true);

        // Nếu có văn bản liên quan (văn bản đến được trả lời)
        if (documentData.relatedDocuments) {
          try {
            const relatedIds = documentData.relatedDocuments;
            const relatedDocsData_ = await incomingDocumentsAPI.getIncomingDocumentById(relatedIds);
            const relatedDocsData = relatedDocsData_.data;
            // Kiểm tra component còn mounted không
            if (!isMounted) return;

            setRelatedDocuments(relatedDocsData.data);
          } catch (error) {
          }
        }

        setError(null);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Không thể tải thông tin văn bản");
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin văn bản",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDocument();

    // Cleanup function để tránh cập nhật state khi component đã unmounted
    return () => {
      isMounted = false;
    };
  }, [
    documentId,
    toast,
    router,
    hasRole,
    incomingDocumentsAPI,
    outgoingDocumentsAPI,
    workflowAPI,
  ]);

  const getStatusBadge = (status: string) => {
    const badgeInfo = getStatusBadgeInfo(status);
    return <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>;
  };

  // Hàm tải lịch sử xử lý khi click vào tab
  const loadDocumentHistory = async () => {
    try {
      // Nếu lịch sử đã được tải trước đó, không cần tải lại
      if (historyLoaded) {
        return;
      }

      if (_document) {
        setIsLoading(true);
        // Fetch document workflow history
        const history_ = await workflowAPI.getDocumentHistory(documentId);
        const history = history_.data;
        // Cập nhật document với history
        setDocument((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            history: history,
          };
        });

        setHistoryLoaded(true);
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch sử xử lý văn bản",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAttachment = async () => {
    if (!_document?.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để tải",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob_ = await outgoingDocumentsAPI.downloadAttachmentDocument(
        documentId
      );
      const blob = blob_.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        _document.attachmentFilename.split("/").pop() || "document.pdf";
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

  // Handle PDF preview
  const handlePreviewPDF = () => {
    if (!_document?.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để xem trước",
        variant: "destructive",
      });
      return;
    }

    const fileName =
      _document.attachmentFilename.split("/").pop() || "document.pdf";

    setSelectedFileForPreview({
      fileName,
      title: _document.title || "Tài liệu đính kèm",
    });
    setPdfViewerOpen(true);
  };

  // Download file for PDF viewer
  const handlePDFDownload = async () => {
    try {
      return (await outgoingDocumentsAPI.downloadAttachmentDocument(documentId)).data;
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải file PDF",
        variant: "destructive",
      });
      return null;
    }
  };

  // Handle download specific attachment
  const handleDownloadSpecificAttachment = async (
    file: DocumentAttachmentDTO
  ) => {
    try {
      const blob_ = await outgoingDocumentsAPI.downloadSpecificAttachment(
        documentId,
        file.id
      );
      const blob = blob_.data;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalFilename || "document";

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Thành công",
        description: `Đang tải ${file.originalFilename}`,
      });
    } catch (error) {
      // Fallback to generic download
      try {
        await handleDownloadAttachment();
      } catch (fallbackError) {
        toast({
          title: "Lỗi",
          description: "Không thể tải tệp đính kèm",
          variant: "destructive",
        });
      }
    }
  };

  // Handle preview specific PDF
  const handlePreviewSpecificPDF = (file: DocumentAttachmentDTO) => {
    setSelectedFileForPreview({
      fileName: file.originalFilename,
      title: `${_document?.title || "Tài liệu"} - ${file.originalFilename}`,
    });
    setPdfViewerOpen(true);
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await workflowAPI.headerDeparmentApprove(documentId, approvalComment);

      addNotification({
        title: "Văn bản đã được phê duyệt",
        message: "Văn bản đã được phê duyệt và chuyển cho văn thư để ban hành.",
        type: "success",
      });

      // Refresh document data
      const response_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
        documentId
      );
      const response = response_.data;
      setDocument(response.data);
      // Fetch document workflow history
      const history_ = await workflowAPI.getDocumentHistory(documentId);
      const history = history_.data;

      // Cập nhật document với history
      setDocument((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          history: history,
        };
      });
      toast({
        title: "Thành công",
        description: "Văn bản đã được phê duyệt thành công",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể phê duyệt văn bản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionComment) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await outgoingDocumentsAPI.rejectOutgoingDocument(documentId, {
        comment: rejectionComment,
      });

      // Thông báo chung
      addNotification({
        title: "Văn bản đã bị từ chối",
        message:
          "Văn bản đã bị từ chối và trả lại người soạn thảo để chỉnh sửa.",
        type: "warning",
      });

      // Refresh document data
      const response_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
        documentId
      );
      const response = response_.data;
      setDocument(response.data);

      // Fetch document workflow history
      const history_ = await workflowAPI.getDocumentHistory(documentId);
      const history = history_.data;

      // Cập nhật document với history
      setDocument((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          history: history,
        };
      });

      // Thông báo cho người tạo văn bản
      if (response.data.creator?.id) {
        // Gửi thông báo cho người tạo văn bản
        // Lưu ý: Nếu API thông báo không hỗ trợ gửi cho người dùng cụ thể,
        // có thể cần cập nhật API hoặc sử dụng cách khác để thông báo
        addNotification({
          title: "Văn bản bị từ chối",
          message: `Văn bản ${
            response.data.documentNumber || response.data.number
          } đã bị từ chối và cần được chỉnh sửa`,
          type: "warning",
          link: `/van-ban-di/${response.data.id}/chinh-sua`,
        });
      }

      // Hiển thị thông báo thành công
      toast({
        title: "Thành công",
        description: "Văn bản đã được gửi trả lại để chỉnh sửa",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể từ chối văn bản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleApproveResponse = async () => {
    setIsSubmitting(true);
    try {
      await workflowAPI.approveDocumentResponse(documentId, { comment: "" });

      // Refresh document data
      const response_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
        documentId
      );
      const response = response_.data;
      setDocument(response.data);
      // Fetch document workflow history
      const history_ = await workflowAPI.getDocumentHistory(documentId);
      const history = history_.data;
      // Cập nhật document với history
      setDocument((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          history: history,
        };
      });

      toast({
        title: "Thành công",
        description: "Đã chấp nhận văn bản trả lời",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể chấp nhận văn bản. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Hàm xử lý từ chối văn bản dành riêng cho chỉ huy đơn vị
  const handleDepartmentHeadReject = async () => {
    if (!rejectionComment) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await workflowAPI.headerDepartmentComment(documentId, rejectionComment);

      // Thông báo chung
      addNotification({
        title: "Văn bản đã bị từ chối",
        message:
          "Văn bản đã bị từ chối và trả lại người soạn thảo để chỉnh sửa.",
        type: "warning",
      });

      // Refresh document data
      const response_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
        documentId
      );
      const response = response_.data;
      setDocument(response.data);

      // Fetch document workflow history
      const history_ = await workflowAPI.getDocumentHistory(documentId);
      const history = history_.data;

      // Cập nhật document với history
      setDocument((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          history: history,
        };
      });

      toast({
        title: "Thành công",
        description: "Văn bản đã được gửi trả lại để chỉnh sửa",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể từ chối văn bản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị các nút hành động dựa trên vai trò người dùng và trạng thái văn bản
  const renderActionButtons = () => {
    if (!user || !_document) return null;

    // Kiểm tra xem văn bản có phải từ đơn vị con gửi lên không
    const isFromChildDepartment =
      _document.status === "department_approved" ||
      _document.status === "parent_dept_review" ||
      _document.history?.some(
        (item: any) =>
          item.newStatus === "child_dept_submitted" ||
          item.newStatus === "parent_dept_review"
      );

    // Kiểm tra nếu người dùng là trưởng phòng và văn bản đến từ đơn vị con
    if (
      hasRole([
        "ROLE_TRUONG_PHONG",
        "ROLE_PHO_PHONG",
        "ROLE_TRUONG_BAN",
        "ROLE_CUM_TRUONG",
        "ROLE_PHO_CUM_TRUONG",
      ]) &&
      isFromChildDepartment
    ) {
      return (
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href={`/van-ban-di/${_document.id}/xem-xet-tu-don-vi-con`}>
            <CheckCircle className="mr-2 h-4 w-4" /> Xem xét văn bản từ đơn vị
            con
          </Link>
        </Button>
      );
    }

    // Kiểm tra xem văn bản có bị từ chối không
    const wasRejected = _document.history?.some(
      (item: any) =>
        item.newStatus === "leader_commented" ||
        (item.comments && item.comments.toLowerCase().includes("từ chối")) ||
        (item.description && item.description.toLowerCase().includes("từ chối"))
    );

    // Kiểm tra xem văn bản có bị văn thư trả lại không
    const wasReturnedByClerk = _document.history?.some(
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
       if (
      hasRole(["ROLE_DRAF", "ROLE_TRO_LY", "ROLE_NHAN_VIEN"]) &&
      _document.status === "format_correction" &&
      wasReturnedByClerk
    ) {
      // Tìm comment của văn thư khi trả lại
      const clerkComment =
        _document.history?.find(
          (item: any) =>
            (item.newStatus === "format_correction" &&
              item.previousStatus === "LEADER_APPROVED") ||
            (item.comments &&
              (item.comments.toLowerCase().includes("trả lại") ||
                item.comments.toLowerCase().includes("chỉnh sửa thể thức")))
        )?.comments || "Văn thư yêu cầu chỉnh sửa thể thức văn bản";

      return (
        <>
          <div className="rounded-md bg-orange-50 p-2 border border-orange-200 mr-3">
            <div className="flex items-start">
              <ArrowLeft className="h-4 w-4 text-orange-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Văn bản bị văn thư trả lại yêu cầu chỉnh sửa
                </p>
                <p className="text-xs text-orange-700 mt-1">{clerkComment}</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/10 hover:text-primary mr-2"
            asChild
          >
            <Link href={`/van-ban-di/${_document.id}/chinh-sua`}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Link>
          </Button>

          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={async () => {
              try {
                setIsSubmitting(true);

                // Tạo dữ liệu để cập nhật trạng thái văn bản
                const workflowData: DocumentWorkflowDTO = {
                  documentId: documentId,
                  status: "leader_approved", // Chuyển về trạng thái phê duyệt để văn thư xử lý tiếp
                  comments: "Đã chỉnh sửa theo yêu cầu của văn thư",
                  // Đánh dấu bỏ qua bước phê duyệt của trưởng phòng
                };

                // Gọi API để gửi văn bản đến văn thư
                await workflowAPI.changeDocumentStatus(
                  documentId,
                  workflowData
                );

                // Thông báo cho văn thư
                addNotification({
                  title: "Văn bản đã được chỉnh sửa",
                  message: `Văn bản ${
                    _document.documentNumber || "#"
                  } đã được chỉnh sửa theo yêu cầu và gửi lại văn thư để xem xét`,
                  type: "success",
                  recipientRoles: ["ROLE_VAN_THU"],
                });

                // Refresh document data
                const response_ =
                  await outgoingDocumentsAPI.getOutgoingDocumentById(
                    documentId
                  );
                const response = response_.data;
                setDocument(response.data);

                // Fetch document workflow history
                const history_ = await workflowAPI.getDocumentHistory(
                  documentId
                );
                const history = history_.data;

                // Cập nhật document với history
                setDocument((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    history: history,
                  };
                });

                toast({
                  title: "Thành công",
                  description: "Văn bản đã được gửi lại cho văn thư xem xét",
                  variant: "success",
                });
              } catch (err: any) {
                toast({
                  title: "Lỗi",
                  description:
                    err.message || "Không thể gửi văn bản đến văn thư",
                  variant: "destructive",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Đang xử lý..." : "Gửi lại văn thư"}
          </Button>
        </>
      );
    }

    // Nếu là người soạn thảo và văn bản đang ở trạng thái nháp
    if (
      hasRole(["ROLE_DRAF", "ROLE_TRO_LY", "ROLE_NHAN_VIEN"]) &&
      (_document.status === "draft" || wasRejected)
    ) {
      return (
        <>
          {wasRejected && (
            <div className="rounded-md bg-red-50 p-2 border border-red-200 mr-3">
              <div className="flex items-start">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Văn bản đã bị từ chối
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    {_document.history?.find(
                      (item: any) =>
                        item.action === "REJECT_DOCUMENT" ||
                        (item.comments &&
                          item.comments.toLowerCase().includes("từ chối")) ||
                        (item.description &&
                          item.description.toLowerCase().includes("từ chối"))
                    )?.comments || "Vui lòng chỉnh sửa và gửi lại"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
            asChild
          >
            <Link href={`/van-ban-di/${_document.id}/chinh-sua`}>
              <Edit className="mr-2 h-4 w-4" />
              {wasRejected ? "Chỉnh sửa và gửi lại" : "Chỉnh sửa"}
            </Link>
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={async () => {
              try {
                setIsSubmitting(true);
                await outgoingDocumentsAPI.submitForApproval(
                  Number(_document.id)
                );

                // Refresh document data
                const response_ =
                  await outgoingDocumentsAPI.getOutgoingDocumentById(
                    documentId
                  );
                const response = response_.data;

                // Cập nhật document với dữ liệu mới
                const updatedDocument = response.data;

                // Đảm bảo cập nhật trạng thái thành "pending_approval"
                if (
                  updatedDocument &&
                  updatedDocument.status !== "pending_approval"
                ) {
                  updatedDocument.status = "specialist_submitted";
                }

                setDocument(updatedDocument);

                // Fetch document workflow history
                const history_ = await workflowAPI.getDocumentHistory(
                  documentId
                );
                const history = history_.data;

                // Cập nhật document với history
                setDocument((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    history: history,
                  };
                });

                toast({
                  title: "Thành công",
                  description: "Văn bản đã được gửi phê duyệt",
                  variant: "success",
                });
              } catch (err: any) {
                toast({
                  title: "Lỗi",
                  description:
                    err.message || "Không thể gửi văn bản để phê duyệt",
                  variant: "destructive",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Đang gửi..." : "Gửi phê duyệt"}
          </Button>
        </>
      );
    }

    // Nếu là trưởng phòng và văn bản đang chờ phê duyệt
    if (
      hasRole([
        "ROLE_TRUONG_PHONG",
        "ROLE_PHO_PHONG",
        "ROLE_TRAM_TRUONG",
        "ROLE_TRUONG_BAN",
        "ROLE_PHO_CUM_TRUONG",
        "ROLE_CUM_TRUONG",
      ]) &&
      _document.status === "specialist_submitted"
    ) {
      return (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Từ chối
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Từ chối văn bản</AlertDialogTitle>
                <AlertDialogDescription>
                  Vui lòng nhập lý do từ chối để người soạn thảo có thể chỉnh
                  sửa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReject}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Phê duyệt
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Phê duyệt văn bản</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có thể thêm ý kiến trước khi phê duyệt văn bản này.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Nhập ý kiến (không bắt buộc)..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận phê duyệt"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }

    // Nếu là thủ trưởng và văn bản đang chờ phê duyệt
    if (
      hasRole([
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
        "ROLE_CHINH_UY",
        "ROLE_PHO_CHINH_UY",
      ]) &&
      (_document.status === "pending_approval" ||
        _document.status === "department_approved")
    ) {
      return (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Từ chối
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Từ chối văn bản</AlertDialogTitle>
                <AlertDialogDescription>
                  Vui lòng nhập lý do từ chối để người soạn thảo có thể chỉnh
                  sửa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Nhập lý do từ chối..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReject}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Phê duyệt và ban hành
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Phê duyệt và ban hành văn bản
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Sau khi phê duyệt, văn bản sẽ được chuyển cho văn thư để ban
                  hành chính thức.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Nhập ý kiến (không bắt buộc)..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleApproveResponse}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận phê duyệt"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }

    // Nếu là văn thư và văn bản đã được phê duyệt
    if (hasRole("ROLE_VAN_THU") && _document.status === "leader_approved") {
      return (
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90"
          onClick={async () => {
            try {
              setIsSubmitting(true);
              await outgoingDocumentsAPI.issueDocument(Number(_document.id));

              // Refresh document data
              const response_ =
                await outgoingDocumentsAPI.getOutgoingDocumentById(documentId);
              const response = response_.data;
              setDocument(response.data);
              // Fetch document workflow history
              const history_ = await workflowAPI.getDocumentHistory(documentId);
              const history = history_.data;

              // Cập nhật document với history
              setDocument((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  history: history,
                };
              });
              toast({
                title: "Thành công",
                description: "Văn bản đã được ban hành thành công",
              });
            } catch (err: any) {
              toast({
                title: "Lỗi",
                description: err.message || "Không thể ban hành văn bản",
                variant: "destructive",
              });
            } finally {
              setIsSubmitting(false);
            }
          }}
          disabled={isSubmitting}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? "Đang xử lý..." : "Ban hành văn bản"}
        </Button>
      );
    }

    // Nếu là văn thư và văn bản đã được thủ trưởng phê duyệt nhưng chưa đạt thể thức yêu cầu
    if (hasRole("ROLE_VAN_THU") && _document.status === "leader_approved") {
      return (
        <>
          {/* Nút trả lại văn bản cho trợ lý */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 mr-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trả lại trợ lý
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Trả lại văn bản cho trợ lý</AlertDialogTitle>
                <AlertDialogDescription>
                  Vui lòng nhập lý do trả lại để trợ lý chỉnh sửa thể thức văn
                  bản.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Nhập lý do trả lại văn bản..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!rejectionComment.trim()) {
                      toast({
                        title: "Lỗi",
                        description: "Vui lòng nhập lý do trả lại văn bản",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      setIsSubmitting(true);
                      const rejectCom: DocumentWorkflowDTO = {
                        documentId: documentId,
                        status: "format_incorrection",
                        comments: rejectionComment,
                      };
                      // Gọi API để trả lại văn bản cho trợ lý
                      await workflowAPI.returnDocumentToSpecialist(
                        documentId,
                        rejectCom
                      );

                      // Tạo thông báo cho trợ lý
                      if (_document.creator?.id) {
                        addNotification({
                          title: "Văn bản cần chỉnh sửa thể thức",
                          message: `Văn bản ${
                            _document.documentNumber || "#"
                          } đã được văn thư trả lại để chỉnh sửa theo yêu cầu`,
                          type: "warning",
                          link: `/van-ban-di/${documentId}/chinh-sua`,
                        });
                      }

                      // Refresh document data
                      const response_ =  await outgoingDocumentsAPI.getOutgoingDocumentById(
                          documentId
                        );
                      const response = response_.data;
                      setDocument(response.data);

                      // Fetch document workflow history
                      const history_ = await workflowAPI.getDocumentHistory(
                        documentId
                      );
                      const history = history_.data;

                      // Cập nhật document với history
                      setDocument((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          history: history,
                        };
                      });

                      toast({
                        title: "Thành công",
                        description:
                          "Văn bản đã được trả lại trợ lý để chỉnh sửa thể thức",
                      });

                      setRejectionComment("");
                    } catch (err: any) {
                      toast({
                        title: "Lỗi",
                        description:
                          err.message || "Không thể trả lại văn bản cho trợ lý",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Xác nhận trả lại"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={async () => {
              try {
                setIsSubmitting(true);
                await outgoingDocumentsAPI.issueDocument(Number(_document.id));

                // Refresh document data
                const response_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
                    documentId
                  );
                const response = response_.data;
                setDocument(response.data);
                // Fetch document workflow history
                  const history_ = await workflowAPI.getDocumentHistory(
                  documentId  
                );
                const history = history_.data;

                // Cập nhật document với history
                setDocument((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    history: history,
                  };
                });
                toast({
                  title: "Thành công",
                  description: "Văn bản đã được ban hành thành công",
                });
              } catch (err: any) {
                toast({
                  title: "Lỗi",
                  description: err.message || "Không thể ban hành văn bản",
                  variant: "destructive",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Đang xử lý..." : "Ban hành văn bản"}
          </Button>
        </>
      );
    }

    // Mặc định hiển thị nút tải xuống
    return (
      <Button
        variant="outline"
        size="sm"
        className="border-primary/20 hover:bg-primary/10 hover:text-primary"
        onClick={handleDownloadAttachment}
      >
        <Download className="mr-2 h-4 w-4" />
        Tải xuống
      </Button>
    );
  };

  if (isLoading) {
    return <DocumentDetailSkeleton />;
  }

  if (error || !_document) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy văn bản"}</p>
        <Button asChild>
          <Link href="/van-ban-di">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="border-primary/20 hover:bg-primary/10"
            asChild
          >
            <Link href="/van-ban-di">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Chi tiết văn bản đi
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {/* Document Read Status */}
          <DocumentReadStats
            documentId={documentId}
            documentType="OUTGOING_EXTERNAL"
            onGetStatistics={outgoingExternalReadStatus.getStatistics}
            variant="compact"
            className="mr-4"
          />

          {/* Document Readers Dialog */}
          <DocumentReadersDialog
            documentId={documentId}
            documentType="OUTGOING_EXTERNAL"
            documentTitle={_document.title}
            onGetReaders={outgoingExternalReadStatus.getReaders}
            onGetStatistics={outgoingExternalReadStatus.getStatistics}
          />

          {renderActionButtons()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {_document.documentNumber || _document.number}
                </CardTitle>
                {getStatusBadge(_document.status || "")}
              </div>
              <CardDescription>{_document.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ngày ban hành
                  </p>
                  <p>
                    {_document.sentDate || _document.signingDate
                      ? new Date(
                          _document.sentDate || _document.signingDate
                        ).toLocaleDateString("vi-VN")
                      : "Chưa ban hành"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nơi nhận
                  </p>
                  <p>
                    {typeof _document.recipient === "object"
                      ? (_document.recipient as any)?.name
                      : typeof _document.receivingDepartmentText === "object"
                      ? (_document.receivingDepartmentText as any)?.name
                      : _document.recipient ||
                        _document.receivingDepartmentText ||
                        "Chưa xác định"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Người soạn thảo
                  </p>
                  <p>{_document.creator?.fullName || "Không xác định"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Người ký
                  </p>
                  <p>
                    {_document.approver?.name ||
                      _document.signerName ||
                      "Chưa phê duyệt"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Đơn vị soạn thảo
                  </p>
                  <p>{_document.draftingDepartment?.name || "Chưa xác định"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Độ mật
                  </p>
                  <Badge
                    variant={
                      _document.securityLevel === "SECRET"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {_document.securityLevel === "NORMAL"
                      ? "Thường"
                      : _document.securityLevel === "CONFIDENTIAL"
                      ? "Mật"
                      : _document.securityLevel === "SECRET"
                      ? "Tối mật"
                      : _document.securityLevel === "TOP_SECRET"
                      ? "Tuyệt mật"
                      : _document.securityLevel || "Thường"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Người ký duyệt
                  </p>
                  <p>{_document.signer?.fullName || "Chưa xác định"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Chuyển bằng điện mật
                  </p>
                  <Badge variant={_document.secureTransmission ? "default" : "outline"}>
                    {_document.secureTransmission ? "Có" : "Không"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Hạn xử lý
                  </p>
                  <p>
                    {_document.processingDeadline
                      ? new Date(_document.processingDeadline).toLocaleDateString("vi-VN")
                      : "Không có"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Cơ quan ban hành
                  </p>
                  <p>{_document.issuingAgency || "Chưa xác định"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Khối phân phối
                  </p>
                  <Badge variant="outline">
                    {_document.distributionTypeDisplayName}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Số bản sao
                  </p>
                  <p>{_document.numberOfCopies || "0"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Số trang
                  </p>
                  <p>{_document.numberOfPages || "0"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Không gửi bản giấy
                  </p>
                  <Badge variant={ "outline"}>
                    {_document.noPaperCopy ? "Đúng" : "Không"}
                  </Badge>
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Nội dung văn bản
                </p>
                <div
                  className="rounded-md border p-4 bg-accent/30 whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: _document.summary }}
                ></div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tệp đính kèm
                </p>
                <div className="space-y-2">
                  {attachments.length > 0 ? (
                    attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {file.originalFilename}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(file.fileSize / 1024)} KB
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isPDFFile(file.originalFilename) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handlePreviewSpecificPDF(file)}
                              title="Xem trước PDF"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() =>
                              handleDownloadSpecificAttachment(file)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : _document?.attachmentFilename ? (
                    <div className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {_document.attachmentFilename.split("/").pop() ||
                            "Tệp đính kèm"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isPDFFile("", _document.attachmentFilename) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={handlePreviewPDF}
                            title="Xem trước PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={handleDownloadAttachment}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Không có tệp đính kèm
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              if (value === "history") {
                loadDocumentHistory();
              }
            }}
          >
            <TabsList className="grid grid-cols-2 mb-2">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Chi tiết
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                Lịch sử xử lý
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="font-medium text-lg">Thông tin chi tiết</div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Ngày tạo:</div>
                    <div className="text-sm">
                      {_document?.created
                        ? new Date(_document.created).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Chưa có thông tin"}
                    </div>
                  </div>
                  {_document?.sentDate && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Ngày gửi:</div>
                      <div className="text-sm">
                        {new Date(_document.sentDate).toLocaleDateString(
                          "vi-VN"
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-6">
                      {isLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Đang tải lịch sử...</span>
                        </div>
                      ) : _document?.history && _document.history.length > 0 ? (
                        _document.history.map((item: any, index: number) => (
                          <div key={index} className="relative pl-8">
                            <div className="absolute left-0 top-2 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">
                                  {item.newStatusDisplayName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(item.timestamp).toLocaleString(
                                    "vi-VN"
                                  )}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.actorName || item.userFullName}
                              </p>
                              <p className="text-sm">
                                {item.description || item.comments}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Chưa có lịch sử xử lý
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Trạng thái
                </p>
                <div className="mt-1">
                  {getStatusBadge(String(_document.status))}
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Người soạn thảo
                </p>
                <div className="mt-1">
                  <p>{_document.creator?.fullName || "Không xác định"}</p>
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Người phê duyệt
                </p>
                <div className="mt-1">
                  <p>
                    {_document.approver?.name ||
                      _document.signerName ||
                      "Chưa phê duyệt"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {_document.approver?.position ||
                      _document.signerPosition ||
                      ""}
                  </p>
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ngày tạo
                </p>
                <p className="mt-1">
                  {_document.created
                    ? new Date(_document.created).toLocaleDateString("vi-VN")
                    : "Không xác định"}
                </p>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ngày gửi phê duyệt
                </p>
                <p className="mt-1">
                  {_document?.history &&
                  _document.history.length > 0 &&
                  _document.history[0]?.timestamp
                    ? new Date(
                        _document.history[0].timestamp
                      ).toLocaleDateString("vi-VN")
                    : "Chưa gửi phê duyệt"}
                </p>
              </div>
            </CardContent>
            {hasRole(["ROLE_TRO_LY", "ROLE_NHAN_VIEN"]) &&
              _document.status === "draft" && (
                <CardFooter className="bg-accent/30 border-t border-primary/10">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={async () => {
                      try {
                        setIsSubmitting(true);
                        await outgoingDocumentsAPI.deleteOutgoingDocument(
                          Number(_document.id)
                        );

                        toast({
                          title: "Thành công",
                          description: "Văn bản đã được xóa thành công",
                        });

                        // Redirect to list page
                        router.push("/van-ban-di");
                      } catch (err: any) {
                        toast({
                          title: "Lỗi",
                          description: err.message || "Không thể xóa văn bản",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <Trash className="mr-2 h-4 w-4" />{" "}
                    {isSubmitting ? "Đang xử lý..." : "Xóa văn bản"}
                  </Button>
                </CardFooter>
              )}
          </Card>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Văn bản liên quan</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {relatedDocuments ? (
                  <div
                    key={relatedDocuments.id}
                    className="rounded-md border border-primary/10 p-3 bg-accent/30"
                  >
                    <div className="flex justify-between">
                      <p className="font-medium text-primary">
                        {relatedDocuments.documentNumber}
                      </p>
                      <Badge variant="outline">Văn bản đến</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {relatedDocuments.title}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary"
                        asChild
                      >
                        <Link href={`/van-ban-den/${relatedDocuments.id}`}>
                          Xem
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có văn bản liên quan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          setSelectedFileForPreview(null);
        }}
        fileName={selectedFileForPreview?.fileName}
        title={selectedFileForPreview?.title}
        onDownload={handlePDFDownload}
        options={{
          allowDownload: true,
          allowPrint: true,
        }}
      />
    </div>
  );
}

function DocumentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-full" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex">
              <Skeleton className="h-10 w-full" />
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border p-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  <div className="mt-2 flex justify-end">
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full mt-2" />
                  <div className="mt-2 flex justify-end">
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

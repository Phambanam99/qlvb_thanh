"use client";

import { useEffect, useState } from "react";
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
  UserCheck,
  Eye,
} from "lucide-react";
import Link from "next/link";
import DocumentResponseForm from "@/components/document-response-form";
import DocumentResponseList from "@/components/document-response-list";
import DocumentProcessingHistory from "@/components/document-processing-history";
import PDFViewerModal from "@/components/ui/pdf-viewer-modal";
import {
  getStatusByCode,
  incomingDocumentsAPI,
} from "@/lib/api/incomingDocuments";
import { getStatusBadgeInfo } from "@/lib/utils";
import { workflowAPI } from "@/lib/api/workflow";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentDTO } from "@/lib/api";
import { de } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { downloadPdfWithWatermark, isPdfFile } from "@/lib/utils/pdf-watermark";
import { isPDFFile } from "@/lib/utils/pdf-viewer";
import { DocumentStatusBadge } from "@/components/document-status-badge";
import {
  UrgencyLevel,
  URGENCY_LEVELS,
  migrateFromOldUrgency,
} from "@/lib/types/urgency";
import { UrgencyBadge } from "@/components/urgency-badge";
import { useUserDepartmentInfo } from "@/hooks/use-user-department-info";
import type { DocumentAttachmentDTO } from "@/lib/api/types";
import { DocumentReadersDialog } from "@/components/document-readers-dialog";
import { DocumentReadStats } from "@/components/document-read-stats";
import { incomingExternalReadStatus } from "@/lib/api/documentReadStatus";

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  // Resolve params Promise
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const documentId = resolvedParams ? Number.parseInt(resolvedParams.id) : null;
  const { user, hasRole } = useAuth();
  const { departmentName } = useUserDepartmentInfo();
  const { toast } = useToast();
  const router = useRouter();

  const [_document, setDocument] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] =
    useState<string>("");
  const [attachments, setAttachments] = useState<DocumentAttachmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State để theo dõi trạng thái loading khi chuyển trang
  const [isNavigating, setIsNavigating] = useState(false);
  // fetch all departments with document id using useEffect

  // State để theo dõi trạng thái loading của nhiều loại dữ liệu
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Fetch departments for document
  const fetchDepartments = async () => {
    if (!documentId) return;

    try {
      const response_ = await incomingDocumentsAPI.getAllDepartments(documentId);
      const response = response_.data;
      setDepartments(response);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn vị",
        variant: "destructive",
      });
    }
  };

  // Fetch attachments for document
  const fetchAttachments = async () => {
    if (!documentId) return;

    try {
      const response_ = await incomingDocumentsAPI.getDocumentAttachments(
        Number(documentId)
      );
      const response = response_.data;
      setAttachments(response);
    } catch (error) {
      // Don't show toast error for attachments as it might not be supported yet
    }
  };

  // Tracking overall loading status
  useEffect(() => {
    // Chỉ đặt isLoading = false khi tất cả dữ liệu đã tải xong
    setLoading(
      isDocumentLoading || isWorkflowLoading || isHistoryLoading || !user
    );
  }, [isDocumentLoading, isWorkflowLoading, isHistoryLoading, user]);

  // Fetch document data
  useEffect(() => {
    if (!documentId) return;

    fetchDepartments();
    fetchAttachments();
  }, [documentId, toast]);

  // Fetch main document data
  useEffect(() => {
    if (!documentId || !user) return;

    fetchDocument();
  }, [documentId, user]);

  const fetchDocument = async () => {
    if (!documentId || !user) {
      return; // Tránh gọi API khi không có ID hoặc user
    }

    try {
     
      setIsDocumentLoading(true);
      setIsWorkflowLoading(true);
      setIsHistoryLoading(true);

      // Fetch document details
      const response_ = await incomingDocumentsAPI.getIncomingDocumentById(
        documentId
      );
      const response = response_.data;
      setIsDocumentLoading(false);

      // Fetch document workflow status
      const workflowStatus_ = await workflowAPI.getDocumentStatus(documentId);
      const workflowStatus = workflowStatus_.data;
      setIsWorkflowLoading(false);

      const history_ = await workflowAPI.getDocumentHistory(documentId);
      const history = history_.data;
      setIsHistoryLoading(false);

      const documentData = {
        ...response.data,
        status: workflowStatus.status,
        assignedToId: workflowStatus.assignedToId,
        assignedToName: workflowStatus.assignedToName,
        history: history,
        assignedToIds: workflowStatus.assignedToIds,
        assignedToNames: workflowStatus.assignedToNames,

        // Add empty arrays for frontend compatibility
        attachments: [],
        relatedDocuments: [],
        responses: [],
      };
    
      setDocument(documentData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin công văn");
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin công văn",
        variant: "destructive",
      });
    } finally {
      // Đảm bảo tất cả loại dữ liệu đều được đánh dấu là đã hoàn thành,
      // tránh kẹt ở trạng thái loading vĩnh viễn
      setIsDocumentLoading(false);
      setIsWorkflowLoading(false);
      setIsHistoryLoading(false);
    }
  };

  // REMOVED: getStatusBadge function - replaced by DocumentStatusBadge component

  // Download single attachment (legacy support)
  const handleDownloadAttachment = async () => {
    if (!_document.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để tải",
        variant: "destructive",
      });
      return;
    }

    if (!documentId) {
      toast({
        title: "Lỗi",
        description: "Không xác định được ID công văn",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob_ = await incomingDocumentsAPI.downloadIncomingAttachment(
        documentId
      );
      const blob = blob_.data;
      const filename =
        _document.attachmentFilename.split("/").pop() || "document.pdf";

      // Check if it's a PDF file and user has a name for watermark
      if (isPdfFile(filename) && user?.fullName && departmentName) {
        try {
          await downloadPdfWithWatermark(blob, filename, user.fullName, departmentName);
          toast({
            title: "Thành công",
            description: `Đã tải xuống file PDF với watermark và timestamp: ${filename}`,
          });
          return;
        } catch (watermarkError) {
         
          toast({
            title: "Cảnh báo",
            description: "Không thể thêm watermark, tải xuống file gốc",
            variant: "destructive",
          });
        }
      }

      // Regular download for non-PDF files or when watermark fails
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Thành công",
        description: `Đã tải xuống file ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải xuống file. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  // Download specific attachment from multiple files
  const handleDownloadSpecificAttachment = async (
    file: DocumentAttachmentDTO
  ) => {
    if (!documentId) {
      toast({
        title: "Lỗi",
        description: "Không xác định được ID công văn",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try to download specific attachment first, fallback to generic if not available
      let blob: Blob;
      if (file.id) {
        try {
          const blob_ = await incomingDocumentsAPI.downloadSpecificAttachment(
            documentId,
            file.id
          );
          blob = blob_.data;
        } catch (specificError) {
          
          const blob_ = await incomingDocumentsAPI.downloadIncomingAttachment(
            documentId
          );
          blob = blob_.data;
        }
      } else {
        const blob_ = await incomingDocumentsAPI.downloadIncomingAttachment(
          documentId
        );
        blob = blob_.data;
      }
      const filename = file.originalFilename;

      // Check if it's a PDF file and user has a name for watermark
      if (isPdfFile(filename) && user?.fullName && departmentName) {
        try {
          
          await downloadPdfWithWatermark(blob, filename, user.fullName, departmentName);
          toast({
            title: "Thành công",
            description: `Đã tải xuống file PDF với watermark và timestamp: ${filename}`,
          });
          return;
        } catch (watermarkError) {
          
          toast({
            title: "Cảnh báo",
            description: "Không thể thêm watermark, tải xuống file gốc",
            variant: "destructive",
          });
        }
      }

      // Regular download for non-PDF files or when watermark fails
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Thành công",
        description: `Đã tải xuống file ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải xuống file. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  // Handle PDF preview for single file (legacy)
  const handlePreviewPDF = () => {
    if (!_document.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để xem trước",
        variant: "destructive",
      });
      return;
    }

    const fileName =
      _document.attachmentFilename.split("/").pop() || "document.pdf";

    setSelectedFileForPreview(fileName);
    setPdfViewerOpen(true);
  };

  // Handle PDF preview for specific file from multiple attachments
  const handlePreviewSpecificPDF = (file: DocumentAttachmentDTO) => {
    setSelectedFileForPreview(file.originalFilename);
    setPdfViewerOpen(true);
  };

  // Download file for PDF viewer
  const handlePDFDownload = async () => {
    if (!documentId) return null;

    try {
      // Check if we're viewing a specific file from multiple attachments
      const currentFile = attachments.find(
        (file) => file.originalFilename === selectedFileForPreview
      );

      if (currentFile && currentFile.id) {
        // Try to download specific attachment
        try {
          const result_ = await incomingDocumentsAPI.downloadSpecificAttachment(
            documentId,
            currentFile.id
          );
          return result_.data;
        } catch (specificError) {
         
        }
      }

      // Fallback to generic download
      const result_ = await incomingDocumentsAPI.downloadIncomingAttachment(documentId);
      return result_.data;
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải file PDF",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleResponse = async () => {
    if (!_document || !user || !documentId) return;

    try {
      // First, check if there's an existing draft related to this document that was rejected
      const existingDraftsResponse_ = await workflowAPI.getDocumentResponses(
        documentId.toString()
      );
      const existingDraftsResponse = existingDraftsResponse_.data;

      // Look for a draft that was rejected (has status "draft" and was previously rejected in history)
      const existingDraft = existingDraftsResponse?.content?.find(
        (doc: any) =>
          doc.status === "registered" &&
          doc.history?.some(
            (item: any) =>
              item.description?.toLowerCase().includes("từ chối") ||
              item.comments?.toLowerCase().includes("từ chối") ||
              item.newStatus === "leader_commented"
          )
      );

      const documentStatus = _document.processingStatus;
      const isAssignedToCurrentUser = _document.assignedToIds?.includes(
        user.id
      );

      // Original flow continues for case with no existing rejected draft
      if (
        (documentStatus === "specialist_processing" ||
          documentStatus === "leader_reviewing") &&
        isAssignedToCurrentUser
      ) {
        router.push(`/van-ban-di/${_document.id}/chinh-sua`);
        return;
      }

      setLoading(true);
      await workflowAPI.startProcessingDocument(documentId, {
        documentId: documentId,
        status: "SPECIALIST_PROCESSING",
        statusDisplayName: "Chuyên viên đang xử lý",
        assignedToId: Number(user.id),
        comments: "Bắt đầu xử lý công văn",
      });

      toast({
        title: "Thành công",
        description: "Đã bắt đầu xử lý công văn",
      });

      router.push(`/van-ban-di/them-moi?replyToId=${_document.id}`);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể bắt đầu xử lý công văn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const hasDepartmentAccess =
    hasRole("ROLE_TRUONG_PHONG") ||
    hasRole("ROLE_PHO_PHONG") ||
    hasRole("ROLE_TRUONG_BAN") ||
    hasRole("ROLE_PHO_BAN") ||
    hasRole("ROLE_CUM_TRUONG") ||
    hasRole("ROLE_PHO_CUM_TRUONG") ||
    hasRole("ROLE_CHINH_TRI_VIEN_CUM") ||
    hasRole("ROLE_PHO_TRAM_TRUONG") ||
    hasRole("ROLE_TRAM_TRUONG");
  const renderActionButtons = () => {
    if (!user || !_document) return null;

    const isPendingProcessing = ["PENDING", "registered"].includes(
      _document.processingStatus
    );

    // Kiểm tra xem phòng ban hiện tại có được gán cho công văn này không
    const currentDeptId = Number(user?.departmentId);
    const isCurrentDepartmentAssigned =
      Array.isArray(departments) &&
      departments.some((dept) => dept.id === currentDeptId);

    // Kiểm tra công văn có được chuyển từ đơn vị con lên không
    const isForwardedFromChildDept =
      _document.sourceDepartmentId &&
      _document.processingStatus === "parent_dept_review";

   

    // Sử dụng tiếp cận đơn giản hơn: tạo key riêng để theo dõi xem phòng đã phân công chưa
    const processKey = `document_${_document.id}_dept_${currentDeptId}_assigned`;

    // Kiểm tra trong localStorage xem phòng đã phân công cho công văn này chưa
    const isDeptAssigned =
      typeof window !== "undefined"
        ? localStorage.getItem(processKey) === "true"
        : false;

    // Lưu thông tin phân công vào localStorage khi user đi đến trang phân công
    const markDeptAsAssigned = () => {
      if (typeof window !== "undefined") {
        localStorage.setItem(processKey, "true");
      }
    };

    // Phòng ban hiện tại có thể phân công nếu được giao xử lý công văn và chưa được đánh dấu là đã phân công
    const canAssignToUsers = isCurrentDepartmentAssigned && !isDeptAssigned;

    if (
      hasRole([
        "ROLE_ADMIN",
        "ROLE_VAN_THU",
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
      ]) &&
      isPendingProcessing
    ) {
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
            onClick={handleDownloadAttachment}
          >
            <Download className="mr-2 h-4 w-4" />
            Tải xuống
          </Button>

          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90"
            disabled={isNavigating}
            onClick={() => {
              setIsNavigating(true);
              router.push(`/van-ban-den/${_document.id}/chuyen-xu-ly`);
            }}
          >
            {isNavigating ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Đang chuyển trang...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Chuyển xử lý
              </>
            )}
          </Button>
        </>
      );
    }

    if (hasRole("clerk")) {
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
    }

    if (hasDepartmentAccess) {
      return (
        <>
          {/* Hiển thị nút Phân công nếu phòng ban được giao xử lý công văn và đang ở trạng thái phù hợp */}
          {canAssignToUsers &&
            [
              "PENDING",
              "DEPT_ASSIGNED",
              "registered",
              "dept_assigned",
              "distributed",
            ].includes(_document.processingStatus || _document.status) && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                disabled={isNavigating}
                onClick={() => {
                  setIsNavigating(true);
                  // Lưu trạng thái đã phân công vào localStorage
                  markDeptAsAssigned();
                  router.push(`/van-ban-den/${_document.id}/phan-cong`);
                }}
              >
                {isNavigating ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent"></span>
                    Đang chuyển trang...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Phân công
                  </>
                )}
              </Button>
            )}

          {/* Hiển thị nút Xem xét từ đơn vị con nếu công văn được chuyển từ đơn vị con lên */}
          {isForwardedFromChildDept && _document.latestResponseId && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              disabled={isNavigating}
              onClick={() => {
                setIsNavigating(true);
                router.push(
                  `/van-ban-den/${_document.id}/xem-xet-tu-don-vi-con/${_document.latestResponseId}`
                );
              }}
            >
              {isNavigating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent"></span>
                  Đang chuyển trang...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Xem xét từ đơn vị con
                </>
              )}
            </Button>
          )}

          {_document.responses &&
            _document.responses.length > 0 &&
            !isForwardedFromChildDept && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                disabled={isNavigating}
                onClick={() => {
                  setIsNavigating(true);
                  router.push(`/van-ban-den/${_document.id}/xem-xet/1`);
                }}
              >
                {isNavigating ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary/50 border-t-transparent"></span>
                    Đang chuyển trang...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Xem xét
                  </>
                )}
              </Button>
            )}
        </>
      );
    }

    if (hasRole(["ROLE_TRO_LY", "ROLE_NHAN_VIEN"])) {
      // Kiểm tra xem người dùng hiện tại có được phân công xử lý công văn này không
      const isAssignedToCurrentUser =
        _document.assignedToIds &&
        Array.isArray(_document.assignedToIds) &&
        _document.assignedToIds.includes(user.id);
      // kiểm tra xem người dùng đã trả lời công văn trong lịch sử chưa

      

      // Kiểm tra trong nhiều vị trí khác có thể chứa thông tin phân công
      const isUserAssigned =
        isAssignedToCurrentUser ||
        (_document.assignedToId && _document.assignedToId == user.id) ||
        (_document.workflowStatus &&
          _document.workflowStatus.assignedToId == user.id) ||
        (_document.primaryProcessor && _document.primaryProcessor == user.id);
      const isReply =
        _document.history.some((item: any) => {
          return item.newStatus === "specialist_submitted";
        }) && isUserAssigned;
      return (
        <>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:bg-primary/10 hover:text-primary"
            onClick={handleDownloadAttachment}
          >
            <Download className="mr-2 h-4 w-4" />
            Tải xuống
          </Button>

          {/* Chỉ hiển thị nút Trả lời khi người dùng được phân công xử lý */}
          {!isReply && isUserAssigned && (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={handleResponse}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Đang chuyển trang...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Trả lời
                </>
              )}
            </Button>
          )}
        </>
      );
    }

    if (hasRole("ROLE_PHE_DUYET")) {
      return (
        _document.responses &&
        _document.responses.length > 0 && (
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            disabled={isNavigating}
            onClick={() => {
              setIsNavigating(true);
              router.push(`/van-ban-den/${_document.id}/phe-duyet/1`);
            }}
          >
            {isNavigating ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Đang chuyển trang...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Phê duyệt
              </>
            )}
          </Button>
        )
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadAttachment}
        className="border-primary/20 hover:bg-primary/10 hover:text-primary"
      >
        <Download className="mr-2 h-4 w-4" />
        Tải xuống
      </Button>
    );
  };

  if (loading) {
    return <DocumentDetailSkeleton />;
  }

  if (error || !_document) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-red-500 mb-4">{error || "Không tìm thấy công văn"}</p>
        <Button asChild>
          <Link href="/van-ban-den">Quay lại danh sách</Link>
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
            <Link href="/van-ban-den">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Chi tiết công văn đến
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {/* Document Read Status */}
          <DocumentReadStats
            documentId={documentId!}
            documentType="INCOMING_EXTERNAL"
            onGetStatistics={incomingExternalReadStatus.getStatistics}
            variant="compact"
            className="mr-4"
          />

          {/* Document Readers Dialog */}
          <DocumentReadersDialog
            documentId={documentId!}
            documentType="INCOMING_EXTERNAL"
            documentTitle={_document.title}
            onGetReaders={incomingExternalReadStatus.getReaders}
            onGetStatistics={incomingExternalReadStatus.getStatistics}
          />

          {renderActionButtons()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{_document.documentNumber}</CardTitle>
                <DocumentStatusBadge
                  documentId={documentId!}
                  fallbackStatus={_document.status}
                  fallbackDisplayStatus={
                    getStatusByCode(_document.status)?.displayName
                  }
                />
              </div>
              <CardDescription>{_document.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Loại công văn
                  </p>
                  <p>{_document.documentType || "Chưa phân loại"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Số tham chiếu
                  </p>
                  <p>{_document.referenceNumber || "Không có"}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Ngày nhận
                  </p>
                  <p>
                    {new Date(_document.receivedDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Cơ quan ban hành
                  </p>
                  <p>{_document.issuingAuthority}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Đơn vị gửi
                  </p>
                  <p>
                    {_document.sendingDepartmentName ||
                      _document.issuingAuthority}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Độ khẩn
                  </p>
                  <UrgencyBadge
                    level={_document.urgencyLevel as UrgencyLevel}
                    size="sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Số thu
                  </p>
                  <p>{_document.receiptNumber || "Chưa có"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Cán bộ xử lý
                  </p>
                  <p>{_document.processingOfficer?.fullName || "Chưa phân công"}</p>
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
                      : _document.securityLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Đơn vị xử lý
                  </p>
                  <div className="flex space-x-2 gap-1">
                    {departments.length > 0 &&
                      departments.map((department) => (
                        <div
                          key={department.id}
                          className="flex items-center space-x-2"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                            {department.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </div>
                        </div>
                      ))}
                    {departments.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Chưa có đơn vị xử lý
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Trích yếu nội dung
                </p>
                <div className="text-sm bg-gray-50 p-3 rounded-md border">
                  {_document.summary}
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Ý kiến chỉ đạo của Thủ trưởng
                </p>
                <div
                  className="text-sm bg-blue-50 p-3 rounded-md border prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: _document.notes || "Chưa có ý kiến chỉ đạo",
                  }}
                ></div>
              </div>

              <Separator className="bg-primary/10" />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tệp đính kèm
                </p>
                <div className="space-y-2">
                  {/* First check if we have multiple attachments from API */}
                  {attachments.length > 0 ? (
                    attachments.map(
                      (file: DocumentAttachmentDTO, index: number) => (
                        <div
                          key={file.id || index}
                          className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {file.originalFilename}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {file.fileSize
                                ? `${(file.fileSize / 1024).toFixed(1)} KB`
                                : ""}
                            </span>
                            {isPDFFile("", file.originalFilename) && (
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
                              title="Tải xuống"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    )
                  ) : _document.attachmentFilename ? (
                    /* Fallback to single file if multiple attachments not available */
                    <div className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {_document.attachmentFilename.split("/").pop() ||
                            "Tài liệu đính kèm"}
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
                          title="Tải xuống"
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

          <Tabs defaultValue="responses">
            <TabsList className="grid w-full grid-cols-2 bg-primary/5">
              <TabsTrigger
                value="responses"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                công văn trả lời
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Lịch sử xử lý
              </TabsTrigger>
            </TabsList>
            <TabsContent value="responses" className="space-y-4 pt-4">
              <DocumentResponseList documentId={_document.id} />
              {/* {hasRole(["ROLE_TRO_LY", "ROLE_NHAN_VIEN"]) && (
                <DocumentResponseForm documentId={_document.id} />
              )} */}
            </TabsContent>
            <TabsContent value="history" className="pt-4">
              <DocumentProcessingHistory documentId={_document.id} />
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
                  <DocumentStatusBadge
                    documentId={documentId!}
                    fallbackStatus={_document.status}
                    fallbackDisplayStatus={
                      getStatusByCode(_document.status)?.displayName
                    }
                  />
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Đơn vị xử lý chính
                </p>
                <div className="flex items-center space-x-2">
                  {/* check if departments */}
                  {departments.length > 0 && (
                    <div
                      key={departments[0].id}
                      className="flex space-x-2 items-center"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {departments[0].name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </div>
                      <p className="mt-1">
                        {departments[0].name || "Chưa phân công"}
                      </p>
                    </div>
                  )}
                  {departments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Chưa có đơn vị xử lý chính
                    </p>
                  )}
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cán bộ được giao
                </p>
                <div className="mt-1">
                  {_document.assignedToIds && _document.assignedToNames ? (
                    _document.assignedToNames.map(
                      (name: string, indexName: number) => (
                        <div
                          key={indexName}
                          className="flex items-center space-x-2"
                        >
                          <div className="flex -space-x-2">
                            <div
                              key={indexName}
                              className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                            >
                              {name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </div>
                          </div>
                          <span className="text-sm">{name}</span>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có cán bộ được phân công
                    </p>
                  )}
                </div>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Thời hạn xử lý
                </p>
                <p className="mt-1">
                  {_document.closureDeadline
                    ? new Date(_document.closureDeadline).toLocaleDateString(
                        "vi-VN"
                      )
                    : "Chưa thiết lập thời hạn"}
                </p>
              </div>
              <Separator className="bg-primary/10" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Trạng thái theo dõi
                </p>
                <div className="mt-1">
                  {_document.trackingStatus ? (
                    <Badge variant="outline">
                      {_document.trackingStatusDisplayName ||
                        _document.trackingStatus}
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có trạng thái theo dõi
                    </p>
                  )}
                </div>
              </div>
              {_document.emailSource && (
                <>
                  <Separator className="bg-primary/10" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nguồn email
                    </p>
                    <p className="mt-1 text-sm">{_document.emailSource}</p>
                  </div>
                </>
              )}

              {(_document.created || _document.changed) && (
                <>
                  <Separator className="bg-primary/10" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Thông tin hệ thống
                    </p>
                    {_document.created && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Ngày tạo:</span>{" "}
                        {new Date(_document.created).toLocaleString("vi-VN")}
                      </div>
                    )}
                    {_document.changed && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Cập nhật cuối:</span>{" "}
                        {new Date(_document.changed).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="bg-accent/30 border-t border-primary/10">
              {hasRole(["ROLE_TRUONG_PHONG", "ROLE_PHO_PHONG"]) &&
                // Chỉ kiểm tra phân công trong phòng của trưởng phòng hiện tại
                (() => {
                  // Sử dụng trường hợp đơn giản nhất: kiểm tra xem phòng ban hiện tại có được liệt kê trong danh sách các phòng ban được phân công xử lý công văn này hay không
                  const currentDeptId = Number(user?.departmentId);

                  // Kiểm tra xem phòng ban hiện tại có trong danh sách các phòng ban xử lý công văn hay không
                  const hasAssignedToCurrentDepartment =
                    Array.isArray(departments) &&
                    departments.some((dept) => dept.id === currentDeptId);

                  // Kiểm tra bổ sung: có nhân viên nào trong phòng đã được giao trực tiếp không
                  const hasAssignedToUserInCurrentDept =
                    _document.assignedToIds &&
                    Array.isArray(_document.assignedToIds) &&
                    _document.assignedToIds.length > 0 &&
                    hasAssignedToCurrentDepartment; //_document Đã có phòng được phân công

                  // Nếu chưa có ai trong phòng được phân công hoặc công văn đang ở trạng thái chờ xử lý
                  if (
                    !hasAssignedToUserInCurrentDept &&
                    [
                      "PENDING",
                      "DEPT_ASSIGNED",
                      "registered",
                      "dept_assigned",
                      "distributed",
                    ].includes(_document.processingStatus || _document.status)
                  ) {
                    return (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isNavigating}
                        onClick={() => {
                          setIsNavigating(true);
                          router.push(`/van-ban-den/${_document.id}/phan-cong`);
                        }}
                      >
                        {isNavigating ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Đang chuyển trang...
                          </>
                        ) : (
                          "Cập nhật thông tin xử lý"
                        )}
                      </Button>
                    );
                  } else {
                    return (
                      <div className="w-full text-center text-amber-600 text-sm py-1">
                        công văn đã được phân công cho cán bộ của{" "}
                        {user?.departmentName} xử lý
                      </div>
                    );
                  }
                })()}
              {/* Chỉ hiển thị nút Cập nhật thông tin xử lý cho nhân viên/trợ lý được phân công xử lý */}
              {hasRole(["ROLE_TRO_LY", "ROLE_NHAN_VIEN"]) && (
                <>
                  {/* Kiểm tra người dùng có được phân công xử lý công văn này không */}
                  {(() => {
                    // Giống như cách kiểm tra ở nút Trả lời
                    const isAssignedToCurrentUser =
                      _document.assignedToIds &&
                      Array.isArray(_document.assignedToIds) &&
                      _document.assignedToIds.includes(user?.id);

                    // Kiểm tra trong nhiều vị trí khác có thể chứa thông tin phân công
                    const isUserAssigned =
                      isAssignedToCurrentUser ||
                      (_document.assignedToId &&
                        _document.assignedToId == user?.id) ||
                      (_document.workflowStatus &&
                        _document.workflowStatus.assignedToId == user?.id) ||
                      (_document.primaryProcessor &&
                        _document.primaryProcessor == user?.id);

                    

                    // Chỉ hiển thị nút nếu người dùng được phân công xử lý
                    if (isUserAssigned) {
                      return (
                        <Button
                          className="w-full bg-primary hover:bg-primary/90"
                          disabled={isNavigating}
                          onClick={() => {
                            setIsNavigating(true);
                            router.push(
                              `/van-ban-den/${_document.id}/cap-nhat-thong-tin`
                            );
                          }}
                        >
                          {isNavigating ? (
                            <>
                              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                              Đang chuyển trang...
                            </>
                          ) : (
                            "Cập nhật thông tin xử lý"
                          )}
                        </Button>
                      );
                    } else {
                      // Nếu không được phân công, không hiển thị nút
                      return null;
                    }
                  })()}
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          setSelectedFileForPreview("");
        }}
        fileName={selectedFileForPreview}
        title={_document.title || "Tài liệu đính kèm"}
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

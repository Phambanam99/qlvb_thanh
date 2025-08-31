"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  UrgencyLevel,
  URGENCY_LEVELS,
  migrateFromOldUrgency,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  FileText,
  Download,
  Users,
  Calendar,
  User,
  Building,
  Clock,
  MessageSquare,
  Paperclip,
  Eye,
  Send,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import {
  getDocumentById,
  downloadAttachment,
  getInternalDocumentHistory,
  getDocumentStats,
  getDocumentReplies,
  getDocumentReaders,
  getDocumentReadStatistics,
} from "@/lib/api/internalDocumentApi";
import { useDocumentReadStatus } from "@/hooks/use-document-read-status";
import { useAuth } from "@/lib/auth-context";
import { downloadPdfWithWatermark, isPdfFile } from "@/lib/utils/pdf-watermark";
import { useUserDepartmentInfo } from "@/hooks/use-user-department-info";
import { DocumentReadersDialog } from "@/components/document-readers-dialog";
import { DocumentReadStats } from "@/components/document-read-stats";
import { incomingInternalReadStatus } from "@/lib/api/documentReadStatus";
import { createPDFBlobUrl, cleanupBlobUrl } from "@/lib/utils/pdf-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InternalDocument, InternalDocumentDetail, DocumentHistory,
  DocumentStats,
} from "@/lib/api/internalDocumentApi";


export default function InternalDocumentReceivedDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { departmentName } = useUserDepartmentInfo();
  const [documentDetail, setDocumentDetail] =
    useState<InternalDocumentDetail | null>(null);
  const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([]);
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(
    null
  );
  const [documentReplies, setDocumentReplies] = useState<
    InternalDocumentDetail[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  
  // Add state for recipients visibility
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const RECIPIENTS_PREVIEW_COUNT = 5; // Show first 5 recipients by default
  
  // Add state for history visibility
  const [showAllHistory, setShowAllHistory] = useState(false);
  const HISTORY_PREVIEW_COUNT = 5; // Show first 5 history entries by default

  // PDF Preview state
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  // Cleanup PDF preview URL when dialog closes
  useEffect(() => {
    if (!pdfPreviewOpen && pdfPreviewUrl) {
      cleanupBlobUrl(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  }, [pdfPreviewOpen, pdfPreviewUrl]);

  const { markAsRead: globalMarkAsRead } = useDocumentReadStatus();

  const documentId = params.id as string;

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response_ = await getDocumentById(Number(documentId));
        const response = response_.data;
        

        if (response) {
          const documentWithAttachments = {
            ...response,
            attachments: response.attachments || [],
          };
          setDocumentDetail(documentWithAttachments);

          // Automatically mark as read if not already read
          if (!response.isRead) {
            try {
              await incomingInternalReadStatus.markAsRead(Number(documentId));
              // Update local state
              documentWithAttachments.isRead = true;
              documentWithAttachments.readAt = new Date().toISOString();
              setDocumentDetail(documentWithAttachments);

              // Update global state
              globalMarkAsRead(Number(documentId));

              // Trigger storage event to notify list page to refresh
              if (typeof window !== "undefined") {
                localStorage.setItem(
                  "documentReadStatusUpdate",
                  JSON.stringify({
                    documentId: Number(documentId),
                    documentType: "INCOMING_INTERNAL",
                    timestamp: Date.now()
                  })
                );
                // Remove the item immediately to allow future triggers
                setTimeout(() => {
                  localStorage.removeItem("documentReadStatusUpdate");
                }, 100);

                // Also dispatch custom event for same-tab communication
                window.dispatchEvent(new CustomEvent("documentReadStatusUpdate", {
                  detail: {
                    documentId: Number(documentId),
                    documentType: "INCOMING_INTERNAL",
                    timestamp: Date.now()
                  }
                }));
              }

            } catch (markError) {
            }
          } else {
            // Already read, just update global state
            globalMarkAsRead(Number(documentId));
          }
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin văn bản. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId, globalMarkAsRead]);

  useEffect(() => {
    const fetchHistoryAndStats = async () => {
      if (!documentId || !documentDetail) return;

      try {
        // Fetch history
        setLoadingHistory(true);
        const historyResponse_ = await getInternalDocumentHistory(
          Number(documentId)
        );
        // Handle ResponseDTO format: extract data from response
        const historyResponse = historyResponse_?.data?.data || historyResponse_?.data || [];
        setDocumentHistory(historyResponse || []);

        // Fetch stats
        setLoadingStats(true);
        const statsResponse_ = await getDocumentStats(Number(documentId));
        // Handle ResponseDTO format: extract data from response
        const statsResponse = statsResponse_?.data?.data || statsResponse_?.data || null;
        setDocumentStats(statsResponse);

        // Fetch replies
        const repliesResponse_ = await getDocumentReplies(Number(documentId));
        // Handle ResponseDTO format: extract data from response
        const repliesResponse = repliesResponse_?.data?.data || repliesResponse_?.data || [];
        setDocumentReplies(repliesResponse || []);
      } catch (error) {
        // Fallback to empty data if API not available
        setDocumentHistory([]);
        setDocumentStats(null);
        setDocumentReplies([]);
      } finally {
        setLoadingHistory(false);
        setLoadingStats(false);
      }
    };

    fetchHistoryAndStats();
  }, [documentId, documentDetail]);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "-";

      const date = new Date(dateString);

      // Check if date is valid and not the epoch (1970-01-01)
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
        return "Chưa xác định";
      }

      return date.toLocaleString("vi-VN");
    } catch {
      return "Chưa xác định";
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      if (!dateString) return "-";

      const date = new Date(dateString);

      // Check if date is valid and not the epoch (1970-01-01)
      if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
        return "Chưa xác định";
      }

      return date.toLocaleDateString("vi-VN");
    } catch {
      return "Chưa xác định";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: { variant: "outline" as const, text: "Bản nháp" },
      SENT: { variant: "default" as const, text: "Đã gửi" },
      APPROVED: { variant: "secondary" as const, text: "Đã phê duyệt" },
    };
    const info = variants[status as keyof typeof variants] || variants.SENT;
    return <Badge variant={info.variant}>{info.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      NORMAL: { variant: "outline" as const, text: "Bình thường" },
      HIGH: { variant: "secondary" as const, text: "Cao" },
      URGENT: { variant: "destructive" as const, text: "Khẩn" },
    };
    const info = variants[priority as keyof typeof variants] || variants.NORMAL;
    return <Badge variant={info.variant}>{info.text}</Badge>;
  };

  const handleDownloadAttachment = async (
    attachmentId: number,
    filename: string,
    contentType?: string
  ) => {
    try {
      const response_ = await downloadAttachment(
        Number(documentId),
        attachmentId
      );
      const response = response_.data;

      // response.data là Blob từ API
      const fileBlob = response;
      // Kiểm tra nếu là file PDF thì thêm watermark
      if (isPdfFile(filename, contentType) && user?.fullName && departmentName) {
        try {
          await downloadPdfWithWatermark(
            fileBlob, // Truyền blob trực tiếp
            filename,
            user.fullName,
            departmentName
          );

          toast({
            title: "Thành công",
            description: `Đã tải xuống file PDF với watermark: ${filename}`,
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

      // Tải xuống bình thường cho non-PDF hoặc khi watermark thất bại
      const url = window.URL.createObjectURL(fileBlob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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

  const handlePreviewPDF = async (
    attachmentId: number,
    filename: string,
    contentType?: string
  ) => {
    try {
      const response = await downloadAttachment(
        Number(documentId),
        attachmentId
      );

      if (!response || !response.data) {
        throw new Error("Invalid response data");
      }

      const blob = new Blob([response.data], { type: contentType || 'application/pdf' });
      const url = createPDFBlobUrl(blob);
      
      setSelectedFileName(filename);
      setPdfPreviewUrl(url);
      setPdfPreviewOpen(true);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xem trước file PDF. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async () => {
    if (!documentDetail) return;

    try {
      setMarkingAsRead(true);
      await incomingInternalReadStatus.markAsRead(documentDetail.id);
      setDocumentDetail({
        ...documentDetail,
        isRead: true,
        readAt: new Date().toISOString(),
      });

      globalMarkAsRead(documentDetail.id);

      // Trigger storage event to notify list page to refresh
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "documentReadStatusUpdate",
          JSON.stringify({
            documentId: documentDetail.id,
            documentType: "INCOMING_INTERNAL",
            timestamp: Date.now()
          })
        );
        // Remove the item immediately to allow future triggers
        setTimeout(() => {
          localStorage.removeItem("documentReadStatusUpdate");
        }, 100);

        // Also dispatch custom event for same-tab communication
        window.dispatchEvent(new CustomEvent("documentReadStatusUpdate", {
          detail: {
            documentId: documentDetail.id,
            documentType: "INCOMING_INTERNAL",
            timestamp: Date.now()
          }
        }));
      }

      toast({
        title: "Thành công",
        description: "Đã đánh dấu văn bản là đã đọc",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu văn bản đã đọc. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setMarkingAsRead(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATED":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "READ":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "REPLIED":
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "SENT":
        return <Send className="h-4 w-4 text-green-500" />;
      case "UPDATED":
        return <Edit className="h-4 w-4 text-orange-500" />;
      case "ATTACHMENT_ADDED":
        return <Paperclip className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionDisplayName = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATED":
        return "Tạo văn bản";
      case "READ":
        return "Đọc văn bản";
      case "REPLIED":
        return "Trả lời văn bản";
      case "SENT":
        return "Gửi văn bản";
      case "UPDATED":
        return "Cập nhật văn bản";
      case "ATTACHMENT_ADDED":
        return "Thêm file đính kèm";
      case "ATTACHMENT_REMOVED":
        return "Xóa file đính kèm";
      case "FORWARDED":
        return "Chuyển tiếp văn bản";
      default:
        return action;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (!documentDetail) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy văn bản</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Văn bản nội bộ không tồn tại hoặc đã bị xóa
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
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/van-ban-den">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Chi tiết văn bản nội bộ nhận được
            </h1>
            <p className="text-muted-foreground">
              Thông tin chi tiết của văn bản {documentDetail.documentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Document Read Status */}
          <DocumentReadStats
            documentId={Number(documentId)}
            documentType="OUTGOING_INTERNAL"
            onGetStatistics={(docId) =>
              getDocumentReadStatistics(docId)
            }
            variant="compact"
            className="mr-4"
          />

          {/* Document Readers Dialog */}
          <DocumentReadersDialog
            documentId={Number(documentId)}
            documentType="OUTGOING_INTERNAL"
            documentTitle={documentDetail.title}
            onGetReaders={(docId) =>
              getDocumentReaders(docId)
            }
            onGetStatistics={(docId) =>
              getDocumentReadStatistics(docId)
            }
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Thông tin văn bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Số văn bản
                  </label>
                  <p className="font-medium">{documentDetail.documentNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Loại văn bản
                  </label>
                  <p className="font-medium">{documentDetail.documentType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ngày ký
                  </label>
                  <p className="font-medium">
                    {formatDateOnly(documentDetail.signingDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Độ ưu tiên
                  </label>
                  <div className="mt-1">
                    {documentDetail.priority ? (
                      <UrgencyBadge
                        level={documentDetail.priority}
                        size="sm"
                      />
                    ) : (
                      <Badge variant="outline">Chưa xác định</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Đơn vị soạn thảo
                  </label>
                  <p className="font-medium">
                    {documentDetail.draftingDepartment?.name || "Chưa xác định"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Độ mật
                  </label>
                  <div>
                  <Badge
                    variant={
                      documentDetail.securityLevel === "SECRET"
                        ? "destructive"
                        : "outline"
                    }
                    >
                      
                    {documentDetail.securityLevel === "NORMAL"
                      ? "Thường"
                      : documentDetail.securityLevel === "CONFIDENTIAL"
                      ? "Mật"
                      : documentDetail.securityLevel === "SECRET"
                      ? "Tối mật"
                      : documentDetail.securityLevel === "TOP_SECRET"
                      ? "Tuyệt mật"
                      : documentDetail.securityLevel || "Thường"}
                    </Badge>
                    </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Người ký duyệt
                  </label>
                  <p className="font-medium">
                    {documentDetail.documentSigner?.fullName || "Chưa xác định"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Chuyển bằng điện mật
                  </label>
                 <div>
                  <Badge variant={documentDetail.isSecureTransmission ? "default" : "outline"}>
                    {documentDetail.isSecureTransmission ? "Có" : "Không"}
                  </Badge>
                 </div>
                </div>
                {documentDetail.processingDeadline && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Hạn xử lý
                    </label>
                    <p className="font-medium">
                      {formatDateOnly(documentDetail.processingDeadline)}
                    </p>
                  </div>
                )}
                {documentDetail.issuingAgency && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cơ quan ban hành
                    </label>
                    <p className="font-medium">{documentDetail.issuingAgency}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Khối phân phối
                  </label>
                 <div> <Badge variant="outline">
                    {documentDetail.distributionTypeDisplayName || "Chưa xác định"}
                  </Badge>
                    </div>
                </div>
                {(documentDetail.numberOfCopies || documentDetail.numberOfPages) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Số bản sao / Số trang
                    </label>
                    <p className="font-medium">
                      {documentDetail.numberOfCopies || 0} bản / {documentDetail.numberOfPages || 0} trang
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Không gửi bản giấy
                  </label>
                  <div>
                  <Badge variant={documentDetail.noPaperCopy ? "default" : "outline"}>
                    {documentDetail.noPaperCopy ? "Đúng" : "Không"}
                    </Badge>
                    </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tiêu đề
                </label>
                <p className="font-medium text-lg">{documentDetail.title}</p>
              </div>

              {documentDetail.summary && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tóm tắt nội dung
                  </label>
                  <p
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: documentDetail.summary }}
                  ></p>
                </div>
              )}

              {documentDetail.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ghi chú
                  </label>
                  <p
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: documentDetail.notes,
                    }}
                  ></p>
                </div>
              )}
            </CardContent>
          </Card>


          {/* Interaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Lịch sử tương tác
                  {documentStats ? (
                    <Badge variant="outline" className="ml-2">
                      {documentStats.historyCount} hoạt động
                    </Badge>
                  ) : documentHistory.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {documentHistory.length} hoạt động
                    </Badge>
                  )}
                </div>
                {documentHistory.length > HISTORY_PREVIEW_COUNT && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                  >
                    {showAllHistory ? "Thu gọn" : `Xem tất cả (${documentHistory.length})`}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Theo dõi các hoạt động và tương tác với văn bản
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Đang tải lịch sử...
                  </span>
                </div>
              ) : documentHistory.length > 0 ? (
                <div className="space-y-4">
                  {(showAllHistory 
                    ? documentHistory 
                    : documentHistory.slice(0, HISTORY_PREVIEW_COUNT)
                  ).map((entry, index) => (
                    <div
                      key={entry.id || index}
                      className="flex items-start space-x-3 border-l-2 border-gray-200 pl-4 pb-4 last:pb-0"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(entry.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.details}
                          </p>
                          <time className="text-sm text-gray-500">
                            {formatDate(entry.performedAt)}
                          </time>
                        </div>
                        <p className="text-sm text-gray-500">
                          Bởi: {entry.performedByName || "Hệ thống"}
                        </p>
                        {entry.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {entry.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có lịch sử tương tác nào</p>
                </div>
              )}
              
              {/* Show hidden count when collapsed */}
              {!showAllHistory && documentHistory.length > HISTORY_PREVIEW_COUNT && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllHistory(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    + {documentHistory.length - HISTORY_PREVIEW_COUNT} hoạt động khác
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Replies */}
          {documentReplies && documentReplies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Văn bản trả lời ({documentReplies.length})
                </CardTitle>
                <CardDescription>
                  Danh sách các văn bản trả lời cho văn bản này
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentReplies.map((reply) => (
                    <div
                      key={reply.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-sm">
                              {reply.documentNumber}
                            </h4>
                            {getPriorityBadge(reply.urgencyLevel)}
                            {getStatusBadge(reply.status)}
                          </div>
                          <h5 className="font-semibold text-base mb-2">
                            {reply.title}
                          </h5>
                          {reply.summary && (
                            <p
                              className="text-sm text-gray-600 mb-2 line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html: reply.summary,
                              }}
                            ></p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              <User className="h-3 w-3 inline mr-1" />
                              {reply.senderName}
                            </span>
                            <span>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/van-ban-den/noi-bo/${reply.id}`}>
                            Xem chi tiết
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                File đính kèm ({documentDetail.attachments?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentDetail.attachments &&
              documentDetail.attachments.length > 0 ? (
                <div className="space-y-3">
                  {documentDetail.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">{attachment.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(attachment.fileSize)} •{" "}
                            {attachment.contentType}
                          </p>
                          {attachment.description && (
                            <p className="text-sm text-muted-foreground">
                              {attachment.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePreviewPDF(
                              attachment.id,
                              attachment.filename,
                              attachment.contentType
                            )
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDownloadAttachment(
                              attachment.id,
                              attachment.filename,
                              attachment.contentType
                            )
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Tải xuống
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Paperclip className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Văn bản này không có file đính kèm
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trạng thái & Thông tin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Trạng thái đọc
                </label>
                <div className="mt-1">
                  <Badge
                    variant={documentDetail.isRead ? "default" : "outline"}
                  >
                    {documentDetail.isRead ? "Đã đọc" : "Chưa đọc"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Trạng thái văn bản
                </label>
                <div className="mt-1">
                  {getStatusBadge(documentDetail.status)}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Người gửi</p>
                    <p className="text-sm text-muted-foreground">
                      {documentDetail.senderName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Đơn vị gửi</p>
                    <p className="text-sm text-muted-foreground">
                      {documentDetail.senderDepartment}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Thời gian nhận</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(documentDetail.createdAt)}
                    </p>
                  </div>
                </div>

                {(documentDetail.readAt || documentStats?.readAt) && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Thời gian đọc</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(
                          documentDetail.readAt || documentStats?.readAt || ""
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {documentStats && documentStats.replyCount > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Số phản hồi</p>
                      <p className="text-sm text-muted-foreground">
                        {documentStats.replyCount} phản hồi
                      </p>
                    </div>
                  </div>
                )}

                {documentStats && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Hoạt động cuối</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(documentStats.lastActivity)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thao tác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!documentDetail.isRead && (
                <Button
                  className="w-full"
                  onClick={handleMarkAsRead}
                  disabled={markingAsRead}
                >
                  {markingAsRead ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Đánh dấu đã đọc
                    </>
                  )}
                </Button>
              )}

              {documentDetail.replyToId && (
                <Button className="w-full" variant="outline" asChild>
                  <Link
                    href={`/van-ban-den/noi-bo/${documentDetail.replyToId}`}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Xem văn bản gốc
                  </Link>
                </Button>
              )}

              <Button className="w-full" variant="outline" asChild>
                <Link href={`/van-ban-den/noi-bo/${documentDetail.id}/reply`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Trả lời văn bản
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Recipients Table */}
          {documentDetail.recipients &&
            documentDetail.recipients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Danh sách người nhận ({documentDetail.recipients.length})
                    </div>
                    {documentDetail.recipients.length > RECIPIENTS_PREVIEW_COUNT && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllRecipients(!showAllRecipients)}
                      >
                        {showAllRecipients ? "Thu gọn" : `Xem tất cả (${documentDetail.recipients.length})`}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Người nhận</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(showAllRecipients 
                        ? documentDetail.recipients 
                        : documentDetail.recipients.slice(0, RECIPIENTS_PREVIEW_COUNT)
                      ).map((recipient) => (
                        <TableRow key={recipient.id}>
                          <TableCell className="font-medium">
                            {recipient.departmentName}
                          </TableCell>
                          <TableCell>
                            {recipient.userName || "Toàn đơn vị"}
                          </TableCell>
                          
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Show hidden count when collapsed */}
                  {!showAllRecipients && documentDetail.recipients.length > RECIPIENTS_PREVIEW_COUNT && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllRecipients(true)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        + {documentDetail.recipients.length - RECIPIENTS_PREVIEW_COUNT} người nhận khác
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      {/* PDF Preview Dialog */}
      {pdfPreviewOpen && pdfPreviewUrl && (
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className="max-w-screen-xl h-[90vh] flex flex-col">
            {/* DialogHeader chỉ cao nhất là title */}
            <DialogHeader className="h-5">
              <DialogTitle className="text-lg font-semibold">
                Xem trước tài liệu: {selectedFileName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-1 flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full"
                  title={selectedFileName}
                />
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={() => setPdfPreviewOpen(false)}>
                  Đóng
                </Button>
                <Button onClick={() => {
                  const link = document.createElement("a");
                  link.href = pdfPreviewUrl;
                  link.download = selectedFileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setPdfPreviewOpen(false);
                }}>
                  Tải xuống
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Card,
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
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  getDocumentById,
  downloadAttachment,
  getInternalDocumentHistory,
  getDocumentStats,
  getDocumentReplies,
  getDocumentReaders,
  getDocumentReadStatistics,
  DocumentHistory,
  DocumentStats,
} from "@/lib/api/internalDocumentApi";
import { useDocumentReadStatus } from "@/hooks/use-document-read-status";
import { useUniversalReadStatus } from "@/hooks/use-universal-read-status";
import { downloadPdfWithWatermark, isPdfFile } from "@/lib/utils/pdf-watermark";
import { useUserDepartmentInfo } from "@/hooks/use-user-department-info";
import { createPDFBlobUrl, cleanupBlobUrl } from "@/lib/utils/pdf-viewer";
import { DocumentReadersDialog } from "@/components/document-readers-dialog";
import { DocumentReadStats } from "@/components/document-read-stats";
import { InternalDocumentDetail } from "@/lib/api/internalDocumentApi";
import { UrgencyBadge } from "@/components/urgency-badge";

export default function InternalDocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { departmentName } = useUserDepartmentInfo();
  const { markAsRead: globalMarkAsRead } = useDocumentReadStatus();
  const universalReadStatus = useUniversalReadStatus();
  const [_document, setDocument] = useState<InternalDocumentDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  
  // Add state for history, stats, and replies
  const [documentHistory, setDocumentHistory] = useState<DocumentHistory[]>([]);
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [documentReplies, setDocumentReplies] = useState<InternalDocumentDetail[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Add state for recipients visibility
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const RECIPIENTS_PREVIEW_COUNT = 5; // Show first 5 recipients by default
  
  // Add state for history visibility
  const [showAllHistory, setShowAllHistory] = useState(false);
  const HISTORY_PREVIEW_COUNT = 5; // Show first 5 history entries by default

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  
  // Cleanup PDF preview URL when dialog closes
  useEffect(() => {
    if (!pdfPreviewOpen && pdfPreviewUrl) {
      cleanupBlobUrl(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  }, [pdfPreviewOpen]);

  const documentId = params.id as string;

  // Memoize documentId to prevent unnecessary re-renders
  const memoizedDocumentId = useMemo(() => documentId, [documentId]);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const response_ = await getDocumentById(Number(memoizedDocumentId));
      const response = response_.data;
      setDocument(response);
  
      // Mark as read using universal read status for OUTGOING_INTERNAL
      try {
        await universalReadStatus.markAsRead(Number(memoizedDocumentId), "OUTGOING_INTERNAL");
        
        // Trigger cross-tab sync using storage event
        if (typeof window !== "undefined") {
          const eventData = {
            documentId: Number(memoizedDocumentId),
            documentType: "OUTGOING_INTERNAL",
            isRead: true,
            timestamp: Date.now(),
            source: 'detail-page-auto-read'
          };
          
          localStorage.setItem("universalReadStatusUpdate", JSON.stringify(eventData));
          setTimeout(() => {
            localStorage.removeItem("universalReadStatusUpdate");
          }, 100);
          
          // Also dispatch custom event for immediate sync
          window.dispatchEvent(new CustomEvent("documentReadStatusChanged", {
            detail: eventData
          }));
        }
      } catch (readError) {
        console.warn("Failed to mark document as read:", readError);
      }
    } catch (error: any) {
      // Don't show error toast for 404 - document might not exist
      if (error?.response?.status !== 404) {
        console.error("Failed to fetch document:", error);
        // Only show error for non-404 cases
      }
      console.error("Failed to fetch document:", error);
    } finally {
      setLoading(false);
    }
  }, [memoizedDocumentId, universalReadStatus]); // Removed toast dependency

  useEffect(() => {
    if (memoizedDocumentId) {
      fetchDocument();
    }
  }, [memoizedDocumentId]); // Removed fetchDocument dependency

  // Fetch history, stats, and replies data
  const fetchHistoryAndStats = useCallback(async () => {
    if (!memoizedDocumentId) return;

    try {
      // Fetch history
      setLoadingHistory(true);
      const historyResponse_ = await getInternalDocumentHistory(
        Number(memoizedDocumentId)
      );
      // Handle ResponseDTO format: extract data from response
      const historyResponse = historyResponse_?.data?.data || historyResponse_?.data || [];
      setDocumentHistory(historyResponse || []);

      // Fetch stats
      setLoadingStats(true);
      const statsResponse_ = await getDocumentStats(Number(memoizedDocumentId));
      // Handle ResponseDTO format: extract data from response
      const statsResponse = statsResponse_?.data?.data || statsResponse_?.data || null;
      setDocumentStats(statsResponse);

      // Fetch replies
      const repliesResponse_ = await getDocumentReplies(Number(memoizedDocumentId));
      // Handle ResponseDTO format: extract data from response
      const repliesResponse = repliesResponse_?.data?.data || repliesResponse_?.data || [];
      setDocumentReplies(repliesResponse || []);
    } catch (error) {
      setDocumentHistory([]);
      setDocumentStats(null);
      setDocumentReplies([]);
    } finally {
      setLoadingHistory(false);
      setLoadingStats(false);
    }
  }, [memoizedDocumentId]);

  useEffect(() => {
    // Only fetch if we have a valid documentId
    if (memoizedDocumentId) {
      fetchHistoryAndStats();
    }
  }, [memoizedDocumentId]); // Removed fetchHistoryAndStats dependency

  // Listen for cross-tab read status updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "universalReadStatusUpdate" && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          if (update.documentId === Number(memoizedDocumentId) && update.documentType === "OUTGOING_INTERNAL") {
            // Force re-render to update UI
            setDocument(prev => prev ? { ...prev, isRead: update.isRead } : prev);
          }
        } catch (error) {
          // Ignore invalid JSON
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const update = e.detail;
      if (update.documentId === Number(memoizedDocumentId) && update.documentType === "OUTGOING_INTERNAL") {
        // Force re-render to update UI
        setDocument(prev => prev ? { ...prev, isRead: update.isRead } : prev);
      }
    };

    // Listen for storage events (cross-tab)
    window.addEventListener("storage", handleStorageChange);
    
    // Listen for custom events (same tab)
    window.addEventListener("documentReadStatusChanged", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("documentReadStatusChanged", handleCustomEvent as EventListener);
    };
  }, [memoizedDocumentId]);

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
    const info = variants[status as keyof typeof variants] || variants.DRAFT;
    return <Badge variant={info.variant}>{info.text}</Badge>;
  };

  // Helper function to get unique recipients (remove duplicates)
  const getUniqueRecipients = (recipients: any[]) => {
    if (!recipients || !Array.isArray(recipients)) return [];
    
    const uniqueMap = new Map();
    
    recipients.forEach((recipient) => {
      if (recipient.userId) {
        // Individual user: use composite key (departmentId-userId)
        const key = `${recipient.departmentId}-${recipient.userId}`;
        uniqueMap.set(key, recipient);
      } else {
        // Department: use department ID as key
        const key = `dept-${recipient.departmentId}`;
        uniqueMap.set(key, recipient);
      }
    });
    
    return Array.from(uniqueMap.values());
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

  const handleDownloadAttachment = async (
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

      const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
      if (isPdfFile(filename, contentType) && user?.fullName && departmentName) {
        try {
          await downloadPdfWithWatermark(blob, filename, user.fullName, departmentName);

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

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

  // Helper functions for action icons and display names
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATED":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "REPLIED":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "READ":
        return <Eye className="h-4 w-4 text-gray-500" />;
      case "ATTACHMENT_ADDED":
        return <Paperclip className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionDisplayName = (action: string) => {
    switch (action) {
      case "CREATED":
        return "Tạo văn bản";
      case "REPLIED":
        return "Trả lời";
      case "READ":
        return "Đọc văn bản";
      case "ATTACHMENT_ADDED":
        return "Đính kèm file";
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

  if (!_document) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Không tìm thấy văn bản</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Văn bản nội bộ không tồn tại hoặc đã bị xóa
          </p>
          <Button asChild className="mt-4">
            <Link href="/van-ban-di">
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
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/van-ban-di">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách
            </Link>
          </Button>

          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Chi tiết văn bản nội bộ</h1>
          </div>
        </div>
        
        {/* Add Document Read Stats and Readers Dialog */}
        <div className="flex items-center gap-2">
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
            documentTitle={_document?.title}
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
                  <p className="font-medium">{_document.documentNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Loại văn bản
                  </label>
                  <p className="font-medium">{_document.documentType || "Chưa xác định"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ngày ký
                  </label>
                  <p className="font-medium">
                    {formatDateOnly(_document.signingDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Độ khẩn
                  </label>
                  <div className="mt-1">
                    {_document.priority ? (
                      <UrgencyBadge level={_document.priority} size="sm" />
                    )  : (
                      <Badge variant="outline">Chưa xác định</Badge>
                    )}
                  </div>
                </div>
              </div>

        

              {/* Debug Info - Remove after fixing */}
              {/* <div>
                <h4 className="text-lg font-semibold mb-4 text-red-600">Debug Info (Remove Later)</h4>
                <div className="bg-gray-100 p-4 rounded mb-4 text-xs">
                  <p><strong>draftingDepartment:</strong> {JSON.stringify(_document.draftingDepartment)}</p>
                  <p><strong>senderDepartment:</strong> {_document.senderDepartment}</p>
                  <p><strong>securityLevel:</strong> {_document.securityLevel}</p>
                  <p><strong>documentSigner:</strong> {JSON.stringify(_document.documentSigner)}</p>
                </div>
              </div> */}

              {/* Additional Information Section */}
              <div>
               
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Đơn vị soạn thảo
                    </label>
                    <p className="font-medium">
                      {_document.draftingDepartment?.name || _document.senderDepartment || "Chưa xác định"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Độ mật
                    </label>
                    <p className="font-medium">
                      {_document.securityLevel === 'NORMAL' && 'Thường'}
                      {_document.securityLevel === 'CONFIDENTIAL' && 'Mật'}
                      {_document.securityLevel === 'SECRET' && 'Tối mật'}
                      {_document.securityLevel === 'TOP_SECRET' && 'Tuyệt mật'}
                      {!_document.securityLevel && 'Chưa xác định'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Người ký duyệt
                    </label>
                    <p className="font-medium">{_document.documentSigner?.fullName || "Chưa xác định"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Hạn xử lý
                    </label>
                    <p className="font-medium">
                      {_document.processingDeadline ? formatDateOnly(_document.processingDeadline) : "Chưa xác định"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Cơ quan ban hành
                    </label>
                    <p className="font-medium">{_document.issuingAgency || "Chưa xác định"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Khối phân phối
                    </label>
                    <p className="font-medium">
                      {_document.distributionType === 'REGULAR' && 'Đi thường'}
                      {_document.distributionType === 'CONFIDENTIAL' && 'Đi mật'}
                      {_document.distributionType === 'COPY_BOOK' && 'Sổ sao'}
                      {_document.distributionType === 'PARTY' && 'Đi đảng'}
                      {_document.distributionType === 'STEERING_COMMITTEE' && 'Đi ban chỉ đạo'}
                      {!_document.distributionType && 'Chưa xác định'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Số bản sao
                    </label>
                    <p className="font-medium">{_document.numberOfCopies || "Chưa xác định"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Số trang
                    </label>
                    <p className="font-medium">{_document.numberOfPages || "Chưa xác định"}</p>
                  </div>
                </div>

                {/* Additional checkboxes info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Chuyển bằng điện mật
                    </label>
                    <div className="font-medium">
                      {_document.isSecureTransmission ? (
                        <Badge variant="default">Có</Badge>
                      ) : (
                        <Badge variant="outline">Không</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Không gửi bản giấy
                    </label>
                    <div className="font-medium">
                      {_document.noPaperCopy ? (
                        <Badge variant="default">Có</Badge>
                      ) : (
                        <Badge variant="outline">Không</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tiêu đề
                </label>
                <p className="font-medium text-lg">{_document.title}</p>
              </div>

              {_document.summary && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tóm tắt nội dung
                  </label>
                  <p
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: _document.summary }}
                  ></p>
                </div>
              )}

              {_document.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ghi chú
                  </label>
                  <p
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: _document.notes }}
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
                            {reply.priority && getPriorityBadge(reply.priority)}
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
                          <Link href={`/van-ban-di/noi-bo/${reply.id}`}>
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
          {_document.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  File đính kèm ({_document.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {_document.attachments.map((attachment) => (
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
              </CardContent>
            </Card>
          )}
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
                  Trạng thái hiện tại
                </label>
                <div className="mt-1">{getStatusBadge(_document.status)}</div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Người gửi</p>
                    <p className="text-sm text-muted-foreground">
                      {_document.senderName}
                    </p>
                  </div>
                </div>
                

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Đơn vị gửi</p>
                    <p className="text-sm text-muted-foreground">
                      {_document.senderDepartment}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Thời gian tạo</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(_document.createdAt)}
                    </p>
                  </div>
                </div>

                {_document.updatedAt !== _document.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cập nhật cuối</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(_document.updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {_document.replyCount > 0 && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Số phản hồi</p>
                      <p className="text-sm text-muted-foreground">
                        {_document.replyCount} phản hồi
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

         
          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Danh sách người nhận ({getUniqueRecipients(_document.recipients).length})
                </div>
                {getUniqueRecipients(_document.recipients).length > RECIPIENTS_PREVIEW_COUNT && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllRecipients(!showAllRecipients)}
                  >
                    {showAllRecipients ? "Thu gọn" : `Xem tất cả (${getUniqueRecipients(_document.recipients).length})`}
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
                    ? getUniqueRecipients(_document.recipients)
                    : getUniqueRecipients(_document.recipients).slice(0, RECIPIENTS_PREVIEW_COUNT)
                  ).map((recipient) => (
                    <TableRow key={`${recipient.departmentId}-${recipient.userId || 'dept'}-${recipient.id}`}>
                      <TableCell className="font-medium">
                        {recipient.departmentName}
                      </TableCell>
                      <TableCell>
                        {recipient.userName || "Toàn bộ đơn vị"}
                      </TableCell>
                   
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Show hidden count when collapsed */}
              {!showAllRecipients && getUniqueRecipients(_document.recipients).length > RECIPIENTS_PREVIEW_COUNT && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllRecipients(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    + {getUniqueRecipients(_document.recipients).length - RECIPIENTS_PREVIEW_COUNT} người nhận khác
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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

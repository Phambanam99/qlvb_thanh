"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  FileText,
  Download,
  Pencil,
  Trash,
  ThumbsUp,
  ThumbsDown,
  Send,
  Eye,
  ArrowLeftCircle,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { workflowAPI } from "@/lib/api/workflow";
import {
  outgoingDocumentsAPI,
  DocumentWorkflowDTO,
  DocumentResponseDTO,
} from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getStatusBadgeInfo } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-context";
import PDFViewerModal from "@/components/ui/pdf-viewer-modal";
import { isPDFFile } from "@/lib/utils/pdf-viewer";

// Định nghĩa kiểu dữ liệu cho Response
interface DocumentResponse {
  id: number;
  title: string;
  summary: string;
  draftingDepartment?: string;
  documentNumber?: string;
  created?: string;
  signerName?: string;
  creator: {
    id: number;
    fullName: string;
  };
  status: string;
  attachmentFilename?: string;
  managerComment?: string;
}

interface DocumentResponseListProps {
  documentId: number;
}

export default function DocumentResponseList({
  documentId,
}: DocumentResponseListProps) {
  // States và context
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const { addNotification } = useNotifications();
  const [responses, setResponses] = useState<DocumentResponse[]>([]);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [returnToSpecialistReason, setReturnToSpecialistReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF Viewer states
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<{
    fileName: string;
    title: string;
    responseId: number;
  } | null>(null);

  // Kiểm tra xem người dùng có quyền chấp nhận/từ chối hay không
  const canApproveReject =
    hasRole("ROLE_ADMIN") ||
    hasRole("ROLE_VAN_THU") ||
    hasRole("ROLE_CUC_TRUONG") ||
    hasRole("ROLE_CUC_PHO") ||
    hasRole("ROLE_CHINH_UY") ||
    hasRole("ROLE_PHO_CHINH_UY");
  const ruleDoc = [
    "leader_approved",
    "published",
    "completed",
    "leader_reviewing",
    "department_approved",
  ];
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        // console.log("documentId", documentId);
        const response_ = await workflowAPI.getDocumentResponses(
          String(documentId)
        );
        const response = response_.data;
        // console.log("response", response);
        const res = response.filter((item: any) =>
          ruleDoc.includes(item.status)
        );
        setResponses(res as DocumentResponse[]);
      } catch (error) {
      }
    };
    fetchResponses();
  }, [documentId]);

  const handleDownloadAttachment = async (responses: any) => {
    if (!responses.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để tải",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob_ = await outgoingDocumentsAPI.downloadAttachmentDocument(
        responses.id
      );
      const blob = blob_.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        responses.attachmentFilename.split("/").pop() || "document.pdf";
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
  const handlePreviewPDF = (response: DocumentResponse) => {
    if (!response.attachmentFilename) {
      toast({
        title: "Lỗi",
        description: "Không có tệp đính kèm để xem trước",
        variant: "destructive",
      });
      return;
    }

    const fileName =
      response.attachmentFilename.split("/").pop() || "document.pdf";

    setSelectedFileForPreview({
      fileName,
      title: response.title || "Tài liệu đính kèm",
      responseId: response.id,
    });
    setPdfViewerOpen(true);
  };

  // Download file for PDF viewer
  const handlePDFDownload = async () => {
    if (!selectedFileForPreview) return null;
    try {
      const result_ = await outgoingDocumentsAPI.downloadAttachmentDocument(
        selectedFileForPreview.responseId
      );
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

  const getStatusBadge = (status: string) => {
    const badgeInfo = getStatusBadgeInfo(status);
    return <Badge variant={badgeInfo.variant}>{badgeInfo.text}</Badge>;
  };

  const handleDelete = (id: number) => {
    setResponses(responses.filter((response) => response.id !== id));
  };

  const handleApproveResponse = async (responseId: number) => {
    setIsSubmitting(true);
    try {
      await workflowAPI.approveDocumentResponse(responseId, { comment: "" });

      toast({
        title: "Thành công",
        description: "Đã chấp nhận công văn trả lời",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể chấp nhận công văn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectResponse = async () => {
    if (!selectedResponseId) return;

    setIsSubmitting(true);
    try {
      await workflowAPI.rejectDocumentResponse(
        selectedResponseId,
        rejectionReason
      );

      // Cập nhật danh sách công văn
      setResponses(
        responses.map((response) => {
          if (response.id === selectedResponseId) {
            return {
              ...response,
              status: "rejected",
              managerComment: rejectionReason,
            };
          }
          return response;
        })
      );

      toast({
        title: "Thành công",
        description: "Đã từ chối công văn trả lời",
      });

      // Reset form
      setRejectionReason("");
      setSelectedResponseId(null);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối công văn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm mới: Văn thư trả lại công văn cho trợ lý khi chưa đạt thể thức yêu cầu
  const handleReturnToSpecialist = async () => {
    if (!selectedResponseId) return;

    setIsSubmitting(true);
    const cmt: DocumentWorkflowDTO = {
      documentId: selectedResponseId,
      status: "format_correction",
      statusDisplayName: "Cần chỉnh sửa thể thức",
      comments: returnToSpecialistReason,
    };
    try {
      // Gọi API để trả lại công văn cho trợ lý
      await workflowAPI.returnDocumentToSpecialist(selectedResponseId, cmt);

      // Cập nhật danh sách công văn với trạng thái mới
      setResponses(
        responses.map((response) => {
          if (response.id === selectedResponseId) {
            return {
              ...response,
              status: "specialist_processing",
              managerComment: returnToSpecialistReason,
            };
          }
          return response;
        })
      );

      // Thông báo cho người tạo công văn
      const selectedResponse = responses.find(
        (r) => r.id === selectedResponseId
      );
      if (selectedResponse?.creator?.id) {
        addNotification({
          title: "công văn cần chỉnh sửa thể thức",
          message: `công văn ${
            selectedResponse.documentNumber || "#"
          } đã được văn thư trả lại để chỉnh sửa theo yêu cầu`,
          type: "warning",
          link: `/van-ban-di/${selectedResponseId}/chinh-sua`,
        });
      }

      toast({
        title: "Thành công",
        description: "Đã trả lại công văn cho trợ lý để chỉnh sửa",
      });

      // Reset form
      setReturnToSpecialistReason("");
      setSelectedResponseId(null);
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          "Không thể trả lại công văn cho trợ lý. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishDocument = async (responseId: number) => {
    setIsSubmitting(true);
    try {
      // Gọi API để ban hành công văn
      await outgoingDocumentsAPI.issueDocument(responseId);

      const workflow: DocumentWorkflowDTO = {
        documentId: responseId,
        status: "completed",
        statusDisplayName: "Đã hoàn thành",
        comments: "công văn đã hoàn thành",
      };
      await workflowAPI.changeDocumentStatus(documentId, workflow);
      // Cập nhật danh sách công văn với trạng thái mới
      setResponses(
        responses.map((response) => {
          if (response.id === responseId) {
            return { ...response, status: "published" };
          }
          return response;
        })
      );

      // Hiển thị thông báo thành công
      addNotification({
        title: "công văn đã được ban hành",
        message: "công văn đã được ban hành thành công",
        type: "success",
      });

      toast({
        title: "Thành công",
        description: "công văn đã được ban hành thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể ban hành công văn. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {responses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground">Chưa có công văn trả lời nào</p>
          </CardContent>
        </Card>
      ) : (
        responses.map((response) => (
          <Card key={response.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  công văn trả lời {response.documentNumber}
                </CardTitle>
                {getStatusBadge(response.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>
                  <span className="text-muted-foreground">Người tạo:</span>{" "}
                  {response.creator.fullName}
                </span>
                <span>
                  <span className="text-muted-foreground">Ngày tạo:</span>{" "}
                  {response.created}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>
                  <span className="text-muted-foreground">Đơn vị:</span>{" "}
                  {response.draftingDepartment}
                </span>
                <span>
                  <span className="text-muted-foreground">
                    Người phê duyệt:
                  </span>{" "}
                  {response.signerName}
                </span>
              </div>
              <Separator />
              <div>
                <p className="whitespace-pre-line">{response.summary}</p>
              </div>
              {response.attachmentFilename && (
                <>
                  <div className="flex items-center justify-between rounded-md border border-primary/10 p-2 bg-accent/30">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">
                        {response.attachmentFilename.split("/").pop() ||
                          "Tài liệu đính kèm"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isPDFFile("", response.attachmentFilename) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handlePreviewPDF(response)}
                          title="Xem trước PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleDownloadAttachment(response)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {response.managerComment && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Phản hồi của người phê duyệt
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm italic text-amber-700">
                        {response.managerComment}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Buttons for Approve/Reject - Only visible to managers/admin */}
              {canApproveReject &&
                response.status === "department_approved" && (
                  <div className="flex justify-end space-x-2 mt-3">
                    {/* Approve Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 hover:bg-green-50 text-green-600"
                      onClick={() => handleApproveResponse(response.id)}
                      disabled={isSubmitting}
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Chấp nhận
                    </Button>

                    {/* Reject Button - Opens Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500 hover:bg-red-50 text-red-600"
                          onClick={() => setSelectedResponseId(response.id)}
                          disabled={isSubmitting}
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Từ chối
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Từ chối công văn trả lời</DialogTitle>
                          <DialogDescription>
                            Vui lòng nhập lý do từ chối công văn trả lời này.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Nhập lý do từ chối..."
                          className="min-h-[100px]"
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Hủy</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={handleRejectResponse}
                              disabled={!rejectionReason.trim() || isSubmitting}
                            >
                              Từ chối
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              {/* Nút Ban hành và Trả lại - Chỉ hiển thị cho văn thư khi công văn đã được phê duyệt */}
              {response.status === "leader_approved" &&
                hasRole("ROLE_VAN_THU") && (
                  <div className="flex justify-end space-x-2 mt-3">
                    {/* Dialog Trả lại */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-orange-500 hover:bg-orange-50 text-orange-600"
                          onClick={() => setSelectedResponseId(response.id)}
                        >
                          <ArrowLeftCircle className="mr-2 h-4 w-4" />
                          Trả lại trợ lý
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Trả lại công văn cho trợ lý</DialogTitle>
                          <DialogDescription>
                            công văn cần được chỉnh sửa thể thức để đạt yêu cầu
                            của Thủ trưởng cục. Vui lòng nêu rõ nội dung cần
                            chỉnh sửa.
                          </DialogDescription>
                        </DialogHeader>
                        <Textarea
                          value={returnToSpecialistReason}
                          onChange={(e) =>
                            setReturnToSpecialistReason(e.target.value)
                          }
                          placeholder="Nhập yêu cầu chỉnh sửa..."
                          className="min-h-[100px]"
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Hủy</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="primary"
                              onClick={handleReturnToSpecialist}
                              disabled={
                                !returnToSpecialistReason.trim() || isSubmitting
                              }
                            >
                              Trả lại để chỉnh sửa
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Link href={`/van-ban-di/${response.id}/chinh-sua`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-500 hover:bg-yellow-50 text-yellow-600"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Kiểm tra và chỉnh sửa
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500 hover:bg-blue-50 text-blue-600"
                      onClick={() => handlePublishDocument(response.id)}
                      disabled={isSubmitting}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Ban hành
                    </Button>
                  </div>
                )}
              <Separator />
              <div className="flex justify-end space-x-2">
                <Link href={`/van-ban-di/${response.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Button>
                </Link>
                {response.status === "rejected" && (
                  <Button variant="outline" size="sm">
                    <Pencil className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash className="mr-2 h-4 w-4" />
                      Xóa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa công văn phản hồi này không?
                        Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(response.id)}
                      >
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))
      )}

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

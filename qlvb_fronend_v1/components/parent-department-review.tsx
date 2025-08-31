"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowUpCircle, Loader2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";
import { workflowAPI, outgoingDocumentsAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface ParentDepartmentReviewProps {
  documentId: number;
  departmentId?: number;
}

export default function ParentDepartmentReview({
  documentId,
  departmentId,
}: ParentDepartmentReviewProps) {
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [parentDepartment, setParentDepartment] = useState<any>(null);
  const [checkingHierarchy, setCheckingHierarchy] = useState(true);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  // Fetch document data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const documentData_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
          documentId
        );
        const documentData = documentData_.data;
        setDocument(documentData);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu văn bản",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId, toast]);

  // Check if department has a parent
  useEffect(() => {
    const checkParentDepartment = async () => {
      try {
        setCheckingHierarchy(true);
        // Use current user's department if departmentId is not provided
        const deptId = departmentId || user?.departmentId;

        if (!deptId) {
          setCheckingHierarchy(false);
          return;
        }

        const parentDept_ = await workflowAPI.getParentDepartment(deptId);
        const parentDept = parentDept_.data;
        setParentDepartment(parentDept);
      } catch (error) {
      } finally {
        setCheckingHierarchy(false);
      }
    };

    checkParentDepartment();
  }, [departmentId, user, toast]);

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      if (parentDepartment) {
        // If there's a parent department, forward to parent for approval
        await workflowAPI.forwardToParentDepartment(
          documentId,
          null, // Không có responseId cho văn bản đi
          parentDepartment.id,
          {
            status: "parent_dept_review",
            statusDisplayName: "Chờ cấp trên phê duyệt",
            comments: comments || "Đã duyệt và chuyển lên cấp trên",
            documentId: documentId,
          }
        );

        toast({
          title: "Thành công",
          description: `Đã phê duyệt và chuyển lên ${parentDepartment.name} xem xét`,
        });
      } else {
        // If no parent department, forward to top leadership
        await workflowAPI.headerDeparmentApprove(
          documentId,
          comments || "Đã phê duyệt"
        );

        toast({
          title: "Thành công",
          description: "Đã phê duyệt và trình lên thủ trưởng",
        });
      }

      // Redirect back to document detail page
      router.push(`/van-ban-di/${documentId}`);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể phê duyệt văn bản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast({
        title: "Cảnh báo",
        description:
          "Vui lòng nhập ý kiến chỉ đạo trước khi yêu cầu chỉnh sửa!",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await workflowAPI.rejectOutgoingDocument(documentId, {
        comment: comments,
      });

      toast({
        title: "Thành công",
        description: "Đã gửi yêu cầu chỉnh sửa cho cán bộ",
      });

      // Redirect back to document detail page
      router.push(`/van-ban-di/${documentId}`);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi yêu cầu chỉnh sửa",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || checkingHierarchy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đang tải dữ liệu...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xem xét văn bản đi từ đơn vị con</CardTitle>
        {parentDepartment && (
          <CardDescription className="text-amber-600">
            Sau khi phê duyệt, văn bản sẽ được chuyển lên{" "}
            {parentDepartment.name} để tiếp tục xem xét.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {parentDepartment && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <ArrowUpCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle>Quy trình phê duyệt theo cấp</AlertTitle>
            <AlertDescription className="text-blue-700">
              Đơn vị của bạn thuộc {parentDepartment.name}. Sau khi bạn phê
              duyệt, văn bản sẽ được chuyển lên cấp trên để tiếp tục xem xét.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Thông tin văn bản</Label>
            <Badge variant="outline">Chờ phê duyệt</Badge>
          </div>
          <div className="rounded-md border p-4 bg-accent/30">
            <div className="flex justify-between text-sm mb-2">
              <span>
                <span className="text-muted-foreground">Người tạo:</span>{" "}
                {document?.creator?.fullName || document?.creatorName || ""}
              </span>
              <span>
                <span className="text-muted-foreground">Ngày tạo:</span>{" "}
                {document?.created
                  ? new Date(document.created).toLocaleDateString("vi-VN")
                  : ""}
              </span>
            </div>
            <p className="font-medium">{document?.title || ""}</p>
            <p className="whitespace-pre-line mt-2">
              {document?.summary || ""}
            </p>
            {document?.attachments && document.attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Tệp đính kèm
                </p>
                <div className="space-y-1">
                  {document.attachments.map((file: any, index: number) => (
                    <div key={index} className="text-sm">
                      {file.name} ({file.size})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Ý kiến chỉ đạo</Label>
          <Textarea
            id="comments"
            placeholder="Nhập ý kiến chỉ đạo hoặc yêu cầu chỉnh sửa..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              disabled={isSubmitting}
            >
              <XCircle className="mr-2 h-4 w-4" /> Yêu cầu chỉnh sửa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận yêu cầu chỉnh sửa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn yêu cầu cán bộ chỉnh sửa văn bản này? Hãy
                đảm bảo đã nhập đầy đủ ý kiến chỉ đạo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-700"
              >
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : parentDepartment ? (
            <>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Phê duyệt và chuyển lên {parentDepartment.name}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Phê duyệt và trình lên thủ trưởng
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

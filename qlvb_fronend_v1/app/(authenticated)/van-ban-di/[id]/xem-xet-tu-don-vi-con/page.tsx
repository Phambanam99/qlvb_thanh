"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ParentDepartmentReview from "@/components/parent-department-review";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { outgoingDocumentsAPI, workflowAPI } from "@/lib/api";
import { hasRoleInGroup } from "@/lib/role-utils";

// Danh sách các vai trò được phép xem xét công văn
const REVIEW_ROLES = [
  "ROLE_TRUONG_PHONG",
  "ROLE_PHO_PHONG",
  "ROLE_TRUONG_BAN",
  "ROLE_CUM_TRUONG",
  "ROLE_PHO_CUM_TRUONG",
  "ROLE_CUC_TRUONG",
  "ROLE_CUC_PHO",
  "ROLE_CHINH_UY",
  "ROLE_PHO_CHINH_UY",
];

export default function OutgoingDocumentReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const documentId = Number.parseInt(id);

  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Kiểm tra quyền xem xét
    const checkPermission = async () => {
      if (!user) return;

      const isReviewRole = hasRoleInGroup(user.roles || [], REVIEW_ROLES);

      if (!isReviewRole) {
        toast({
          title: "Không có quyền",
          description: "Bạn không có quyền xem xét công văn này",
          variant: "destructive",
        });
        router.push(`/van-ban-di/${documentId}`);
        return;
      }

      try {
        setLoading(true);
        // Tải thông tin công văn
        const documentData_ = await outgoingDocumentsAPI.getOutgoingDocumentById(
          documentId
        );
        
        const documentData = documentData_.data;
        setDocument(documentData.data);

        // Kiểm tra xem công văn có phải từ đơn vị con gửi lên không
        const isFromChildDepartment =
          documentData.data.status === "department_approved" ||
          documentData.data.status === "parent_dept_review";

        if (!isFromChildDepartment) {
          toast({
            title: "Không hợp lệ",
            description: "công văn này không phải từ đơn vị con cần xem xét",
            variant: "destructive",
          });
          router.push(`/van-ban-di/${documentId}`);
          return;
        }

        setHasPermission(true);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin công văn",
          variant: "destructive",
        });
        router.push(`/van-ban-di/${documentId}`);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user, documentId, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="space-y-4">
        <p className="text-center text-red-500">
          Bạn không có quyền truy cập trang này.
        </p>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/van-ban-di">Quay lại danh sách công văn đi</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="border-primary/20 hover:bg-primary/10"
          asChild
        >
          <Link href={`/van-ban-di/${documentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Xem xét công văn đi từ đơn vị con
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <ParentDepartmentReview documentId={documentId} />
        </div>
        <div className="md:col-span-3">
          <div className="bg-primary/5 border rounded-md p-4">
            <h3 className="font-medium mb-2">Hướng dẫn xem xét công văn</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  1
                </span>
                <span>Đọc kỹ nội dung công văn từ đơn vị con</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  2
                </span>
                <span>Nhập ý kiến chỉ đạo (nếu cần)</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  3
                </span>
                <span>
                  Chọn "Phê duyệt" để chuyển công văn lên cấp cao hơn hoặc "Yêu
                  cầu chỉnh sửa" để trả về đơn vị con
                </span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Lưu ý:</span> Khi phê duyệt, văn
                bản sẽ được trình lên cấp trên tiếp theo hoặc thủ trưởng xem
                xét. Khi yêu cầu chỉnh sửa, cán bộ sẽ nhận được thông báo và ý
                kiến chỉ đạo của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

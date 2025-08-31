"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";
import { useAuth } from "@/lib/auth-context";
import { incomingDocumentsAPI } from "@/lib/api/incomingDocuments";
import Link from "next/link";
import DepartmentHeadAssignment from "@/components/department-head-assignment";
import { ArrowLeft } from "lucide-react";

export default function DocumentAssignmentPage({
  params,
}: {
  params: { id: string };
}) {
  // const documentId = Number.parseInt(params.id)
  const { toast } = useToast();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { user } = useAuth();
  const documentId = Number.parseInt(id);
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const documentData_ =
          await incomingDocumentsAPI.getIncomingDocumentById(documentId);
        const documentData = documentData_.data;
        setDocument(documentData);
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

    fetchDocument();
  }, [documentId, toast]);

  if (loading) {
    return <DocumentAssignmentSkeleton />;
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy văn bản</h2>
        <p className="text-muted-foreground mb-4">
          Văn bản này không tồn tại hoặc đã bị xóa
        </p>
        <Button asChild>
          <Link href="/van-ban-den">Quay lại danh sách văn bản đến</Link>
        </Button>
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
          <Link href={`/van-ban-den/${documentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Phân công xử lý văn bản
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <DepartmentHeadAssignment
            documentId={documentId}
            departmentId={Number(user?.departmentId!)}
            closureDeadline={document.data.closureDeadline}
          />
        </div>
        <div className="md:col-span-3">
          <div className="bg-primary/5 border rounded-md p-4">
            <h3 className="font-medium mb-2">Hướng dẫn phân công xử lý</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  1
                </span>
                <span>Chọn cán bộ để phân công xử lý văn bản</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  2
                </span>
                <span>Thiết lập thời hạn xử lý văn bản</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  3
                </span>
                <span>
                  Nhập ý kiến chỉ đạo và yêu cầu cụ thể đối với cán bộ được phân
                  công
                </span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  4
                </span>
                <span>
                  Nhấn "Phân công" để hoàn tất việc phân công xử lý văn bản
                </span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Lưu ý:</span> Sau khi phân công,
                cán bộ được chọn sẽ nhận được thông báo và có thể bắt đầu xử lý
                văn bản.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentAssignmentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-48 mb-4" />

            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-24 w-full" />
              </div>

              <Skeleton className="h-10 w-32 mt-4" />
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-primary/5 border rounded-md p-4">
            <Skeleton className="h-6 w-48 mb-4" />

            <div className="space-y-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

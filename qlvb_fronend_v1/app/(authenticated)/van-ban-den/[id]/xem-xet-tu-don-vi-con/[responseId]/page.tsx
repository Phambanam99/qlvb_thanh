"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ParentDepartmentReview from "@/components/parent-department-review";
import { incomingDocumentsAPI, documentResponsesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

interface Document {
  id: number;
  title: string;
  documentNumber: string;
  referenceNumber?: string;
  status: string;
  processingStatus: string;
  urgencyLevel: string;
  securityLevel: string;
  createdAt: string;
  receivedDate: string;
  issuingAuthority: string;
  documentType: string;
  childDepartmentId?: number;
}

interface DocumentResponse {
  id: number;
  content: string;
  createdBy: string;
  createdAt: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  attachments: Array<{
    name: string;
    size: string;
  }>;
}

export default function ParentDepartmentReviewPage({
  params,
}: {
  params: { id: string; responseId: string };
}) {
  const documentId = Number.parseInt(params.id);
  const responseId = Number.parseInt(params.responseId);
  const { toast } = useToast();
  const [document, setDocument] = useState<Document | null>(null);
  const [response, setResponse] = useState<DocumentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [childDepartmentId, setChildDepartmentId] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch document and response data in parallel
        const [documentData_, responseData_] = await Promise.all([
          incomingDocumentsAPI.getIncomingDocumentById(params.id),
          documentResponsesAPI.getResponseById(params.responseId),
        ]);
        const documentData = documentData_.data;
        const responseData = responseData_.data;

        setDocument(documentData);
        setResponse(responseData);

        // If the document has a source department ID (from child department)
        if (documentData.sourceDepartmentId) {
          setChildDepartmentId(documentData.sourceDepartmentId);
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin công văn và phản hồi",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.responseId, toast]);

  // Loading state
  if (loading) {
    return <DocumentReviewSkeleton />;
  }

  // Error state
  if (!document || !response) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/van-ban-den/${documentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Xem xét công văn từ đơn vị con
          </h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Không thể tải thông tin công văn và phản hồi. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
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
          Xem xét công văn từ đơn vị con
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <ParentDepartmentReview
            documentId={documentId}
            responseId={responseId}
            childDepartmentId={childDepartmentId}
          />
        </div>
        <div className="md:col-span-3">
          <div className="bg-primary/5 border rounded-md p-4">
            <h3 className="font-medium mb-2">
              Hướng dẫn xem xét công văn từ đơn vị con
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  1
                </span>
                <span>
                  Xem xét nội dung công văn trả lời đã được đơn vị con phê duyệt
                </span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  2
                </span>
                <span>
                  Kiểm tra các tệp đính kèm và thông tin phê duyệt từ đơn vị con
                </span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  3
                </span>
                <span>Nhập ý kiến chỉ đạo hoặc lý do trả lại (nếu cần)</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  4
                </span>
                <span>
                  Chọn "Phê duyệt và chuyển lên" hoặc "Trả lại đơn vị con" tùy
                  theo đánh giá của bạn
                </span>
              </li>
            </ul>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Lưu ý:</span> Đây là bước trong
                quy trình phê duyệt theo cấp. Nếu đơn vị của bạn có đơn vị cha,
                sau khi phê duyệt, công văn sẽ được chuyển lên cấp trên tiếp theo
                để xem xét. Khi trả lại, đơn vị con sẽ nhận được thông báo và ý
                kiến chỉ đạo của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentReviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <div className="border rounded-md">
            <div className="p-6 border-b">
              <Skeleton className="h-6 w-56" />
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="rounded-md border p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full mt-1" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <div className="p-4 border-t flex justify-between">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="border rounded-md p-4">
            <Skeleton className="h-6 w-48 mb-4" />

            <div className="space-y-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
            </div>

            <div className="mt-4 p-3 border rounded-md">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

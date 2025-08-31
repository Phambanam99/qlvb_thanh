"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import ManagerApproval from "@/components/manager-approval"
import { incomingDocumentsAPI, documentResponsesAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Document {
  id: number
  title: string
  number: string
  issuedDate: string
  receivedDate: string
  sender: string
  type: string
  priority: string
  status: string
}

interface DocumentResponse {
  id: number
  documentId: number
  content: string
  attachments: any[]
  status: string
  createdBy: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewComments?: string
}

export default function DocumentApprovalPage({ params }: { params: { id: string; responseId: string } }) {
  const documentId = Number.parseInt(params.id)
  const responseId = Number.parseInt(params.responseId)
  const { toast } = useToast()
  const [document, setDocument] = useState<Document | null>(null)
  const [response, setResponse] = useState<DocumentResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch document and response data in parallel
        const [documentData_, responseData_] = await Promise.all([
          incomingDocumentsAPI.getIncomingDocumentById(params.id),
          documentResponsesAPI.getResponseById(params.responseId),
        ])
        const documentData = documentData_.data;
        const responseData = responseData_.data;

        setDocument(documentData)
        setResponse(responseData)
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin công văn. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, params.responseId, toast])

  if (loading) {
    return <DocumentApprovalSkeleton />
  }

  if (!document || !response) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy thông tin</h2>
        <p className="text-muted-foreground mb-4">công văn hoặc phản hồi không tồn tại hoặc đã bị xóa</p>
        <Button asChild>
          <Link href="/van-ban-den">Quay lại danh sách công văn đến</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" className="border-primary/20 hover:bg-primary/10" asChild>
          <Link href={`/van-ban-den/${documentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Phê duyệt công văn trả lời</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <ManagerApproval documentId={documentId} responseId={responseId} />
        </div>
        <div className="md:col-span-3">
          <div className="bg-primary/5 border rounded-md p-4">
            <h3 className="font-medium mb-2">Hướng dẫn phê duyệt công văn</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  1
                </span>
                <span>Xem xét nội dung công văn trả lời đã được Trưởng phòng phê duyệt</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  2
                </span>
                <span>Kiểm tra các tệp đính kèm (nếu có)</span>
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
                  Chọn "Phê duyệt và ban hành" nếu đồng ý với nội dung, hoặc "Trả lại phòng" nếu cần phòng xử lý lại
                </span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Lưu ý:</span> Khi phê duyệt, công văn sẽ được chuyển cho văn thư để ban
                hành và lưu trữ. Khi trả lại, phòng chuyên môn sẽ nhận được thông báo và ý kiến chỉ đạo của Thủ trưởng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentApprovalSkeleton() {
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
                <Skeleton className="h-24 w-full" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-24 w-full" />
              </div>

              <div className="flex gap-2 mt-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
              </div>
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
  )
}

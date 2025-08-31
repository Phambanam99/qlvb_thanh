import { Card, CardContent } from "@/components/ui/card"
import { workflowAPI } from "@/lib/api"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WorkflowHistoryItem {
  id: number
  action: string
  actor: string
  timestamp: string
  description: string
  status: "completed" | "current" | "pending"
}

interface DocumentProcessingHistoryProps {
  documentId: number
}

export default function DocumentProcessingHistory({ documentId }: DocumentProcessingHistoryProps) {
  const [history, setHistory] = useState<WorkflowHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Gọi API để lấy lịch sử xử lý công văn
        const response_ = await workflowAPI.getDocumentHistory(documentId)
        const response = response_.data;
        // Chuyển đổi dữ liệu API thành định dạng hiển thị
        const formattedHistory = response.map((item: any) => ({
          id: item.id,
          action: item.newStatusDisplayName,
          actor: `${item.actorName || 'Hệ thống'}`,
          timestamp: formatDate(item.timestamp),
          description: item.comments || 'Không có mô tả',
          status: determineStatus(item.status),
        }))
        
        setHistory(formattedHistory)
      } catch (error) {
        setError("Không thể tải lịch sử xử lý công văn. Vui lòng thử lại sau.")
      } finally {
        setIsLoading(false)
      }
    }

    if (documentId) {
      fetchHistory()
    }
  }, [documentId])

  // Hàm chuyển đổi trạng thái từ API sang trạng thái hiển thị
  const determineStatus = (apiStatus: string): "completed" | "current" | "pending" => {
    // Tùy chỉnh logic này theo trạng thái thực tế từ API của bạn
    if (apiStatus === "COMPLETED" || apiStatus === "APPROVED") return "completed"
    if (apiStatus === "IN_PROGRESS" || apiStatus === "PROCESSING") return "current"
    return "pending"
  }

  // Hàm định dạng ngày giờ 
  const formatDate = (dateString: string): string => {
    if (!dateString) return "Không xác định"
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (e) {
      return dateString
    }
  }

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "completed":
        return <div className="h-2 w-2 rounded-full bg-green-500" />
      case "current":
        return <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      case "pending":
        return <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
      default:
        return <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
    }
  }

  // Hiển thị skeleton khi đang tải dữ liệu
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="relative pl-8">
                  <div className="absolute left-0 top-2 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Hiển thị thông báo khi không có lịch sử
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-40">
          <p className="text-muted-foreground">Chưa có lịch sử xử lý cho công văn này</p>
        </CardContent>
      </Card>
    )
  }

  // Hiển thị lịch sử từ API
  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {history.map((item) => (
              <div key={item.id} className="relative pl-8">
                <div className="absolute left-0 top-2 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                  {getStatusIndicator(item.status)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${item.status === "current" ? "text-primary" : ""}`}>{item.action}</p>
                    <p className="text-sm text-muted-foreground">{item.timestamp}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.actor}</p>
                  <p className="text-sm"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                  ></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
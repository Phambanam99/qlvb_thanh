"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { use } from "react";
import { useAuth } from "@/lib/auth-context";
import { incomingDocumentsAPI } from "@/lib/api/incomingDocuments";
import { workflowAPI } from "@/lib/api/workflow";
import Link from "next/link";
import { ArrowLeft, Check, Clock, FileText, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

export default function DocumentUpdatePage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { user, hasRole } = useAuth();
  const documentId = Number.parseInt(id);
  
  // State cho form cập nhật
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<number>(0);
  const [comments, setComments] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        // Lấy thông tin văn bản
        const documentData_ = await incomingDocumentsAPI.getIncomingDocumentById(
          documentId
        );
        const documentData = documentData_.data;
        
        // Lấy trạng thái workflow
        const workflowStatus_ = await workflowAPI.getDocumentStatus(documentId);
        const workflowStatus = workflowStatus_.data;
        
        // Kết hợp dữ liệu
        const combinedData = {
          ...documentData.data,
          status: workflowStatus.status,
          assignedToId: workflowStatus.assignedToId,
          assignedToName: workflowStatus.assignedToName,
          assignedToIds: workflowStatus.assignedToIds,
          
        };
        
        setDocument(combinedData);
        
        // Kiểm tra quyền truy cập
        const isAssignedToCurrentUser = 
          combinedData.assignedToIds && 
          Array.isArray(combinedData.assignedToIds) && 
          combinedData.assignedToIds.includes(Number(user?.id));
          
        const isUserAssigned = 
          isAssignedToCurrentUser ||
          (combinedData.assignedToId && combinedData.assignedToId == Number(user?.id)) ||
          (combinedData.primaryProcessorId && combinedData.primaryProcessorId == Number(user?.id));
          
        // Nếu người dùng không được phân công, chuyển về trang chi tiết
        if (!isUserAssigned && !hasRole(["ROLE_ADMIN", "ROLE_VAN_THU", "ROLE_CUC_TRUONG", "ROLE_CUC_PHO"])) {
          toast({
            title: "Không có quyền truy cập",
            description: "Bạn không được phân công xử lý văn bản này",
            variant: "destructive",
          });
          router.push(`/van-ban-den/${documentId}`);
          return;
        }
        
        // Đặt giá trị mặc định cho form
        setStatus(combinedData.status || "SPECIALIST_PROCESSING");
        setProgress(combinedData.processingProgress || 0);
        setComments("");
        
        if (combinedData.processDeadline) {
          try {
            setDeadline(new Date(combinedData.processDeadline));
          } catch (e) {
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

    fetchDocument();
  }, [documentId, toast, router, user?.id, hasRole]);

  // Xử lý cập nhật thông tin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document || !user) return;
    
    try {
      setSubmitting(true);
      
      // Gửi cập nhật trạng thái xử lý
      await workflowAPI.updateProcessingStatus(documentId, {
        documentId: documentId,
        status: status,
        statusDisplayName: getStatusDisplayName(status),
        assignedToId: user.id,
        comments: comments,
        processingProgress: progress,
        deadline: deadline ? format(deadline, "yyyy-MM-dd") : undefined
      });
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin xử lý văn bản",
      });
      
      // Chuyển về trang chi tiết
      router.push(`/van-ban-den/${documentId}`);
      
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật thông tin xử lý. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Lấy tên hiển thị cho trạng thái
  const getStatusDisplayName = (statusCode: string): string => {
    const statusMap: Record<string, string> = {
      "SPECIALIST_PROCESSING": "Chuyên viên đang xử lý",
      "PROCESSING_COMPLETED": "Đã hoàn thành xử lý",
      "PENDING_APPROVAL": "Chờ phê duyệt",
      "APPROVED": "Đã phê duyệt",
      "REJECTED": "Bị từ chối",
      "ON_HOLD": "Tạm hoãn xử lý",
      "WAITING_FOR_INFO": "Đang chờ bổ sung thông tin"
    };
    
    return statusMap[statusCode] || statusCode;
  };

  if (loading) {
    return <DocumentUpdateSkeleton />;
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
          Cập nhật thông tin xử lý
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin văn bản</CardTitle>
              <CardDescription>
                Cập nhật tiến độ và trạng thái xử lý văn bản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h2 className="font-medium text-lg">{document.title}</h2>
                <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Số văn bản: {document.documentNumber}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={document.status || "default"}>
                    {getStatusDisplayName(document.status)}
                  </Badge>
                  {document.processDeadline && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Hạn xử lý: {format(new Date(document.processDeadline), "dd/MM/yyyy")}
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Trạng thái xử lý</Label>
                    <Select 
                      value={status} 
                      onValueChange={setStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái xử lý" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Trạng thái xử lý</SelectLabel>
                          <SelectItem value="SPECIALIST_PROCESSING">Đang xử lý</SelectItem>
                          <SelectItem value="PROCESSING_COMPLETED">Hoàn thành xử lý</SelectItem>
                          <SelectItem value="PENDING_APPROVAL">Chờ phê duyệt</SelectItem>
                          <SelectItem value="ON_HOLD">Tạm hoãn xử lý</SelectItem>
                          <SelectItem value="WAITING_FOR_INFO">Chờ bổ sung thông tin</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="progress">Tiến độ xử lý (%)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                        className="w-24"
                      />
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Hạn xử lý (nếu cần điều chỉnh)</Label>
                    <DatePicker
                      date={deadline}
                      setDate={setDeadline}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comments">Ghi chú cập nhật</Label>
                    <Textarea
                      id="comments"
                      placeholder="Nhập ghi chú về tiến độ, khó khăn, hoặc các thông tin bổ sung..."
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={submitting || !comments}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {submitting ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Cập nhật thông tin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <div className="bg-primary/5 border rounded-md p-4">
            <h3 className="font-medium mb-2">Hướng dẫn cập nhật thông tin xử lý</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  1
                </span>
                <span>
                  Cập nhật trạng thái xử lý hiện tại của văn bản
                </span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  2
                </span>
                <span>Cập nhật tiến độ xử lý bằng cách nhập số phần trăm hoàn thành</span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  3
                </span>
                <span>
                  Điều chỉnh hạn xử lý nếu cần thiết (yêu cầu phải được phê duyệt)
                </span>
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs mr-2 mt-0.5">
                  4
                </span>
                <span>
                  Thêm ghi chú về tiến độ, khó khăn hoặc thông tin cập nhật
                </span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Lưu ý:</span> Khi chuyển trạng thái sang "Chờ phê duyệt", 
                văn bản sẽ được gửi đến trưởng phòng hoặc người phê duyệt để xem xét.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentUpdateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-full mb-1" />
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-6 w-24 mb-4" />
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-2.5 w-full" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-10 w-full" />
                </div>
                
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-24 w-full" />
                </div>
                
                <div className="flex justify-end">
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>
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

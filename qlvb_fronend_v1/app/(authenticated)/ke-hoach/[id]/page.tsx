"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  FileText,
  Loader2,
  Trash,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  workPlansAPI,
  type WorkPlanDTO,
  type WorkPlanTaskDTO,
} from "@/lib/api/workPlans";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use } from "react";

export default function WorkPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;

  const workPlanId = Number.parseInt(id);
  const { hasRole, user } = useAuth();
  const { toast } = useToast();

  const [workPlan, setWorkPlan] = useState<WorkPlanDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionComment, setRejectionComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkPlanTaskDTO | null>(
    null
  );
  const [newProgress, setNewProgress] = useState(0);
  const [newStatus, setNewStatus] = useState("");
  const [progressComment, setProgressComment] = useState("");
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    const fetchWorkPlan = async () => {
      try {
        setIsLoading(true);
        const data_ = await workPlansAPI.getWorkPlanById(workPlanId);
        const data = data_.data;
        setWorkPlan(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin kế hoạch");
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin kế hoạch",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkPlan();
  }, [workPlanId, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Dự thảo</Badge>;
      case "pending":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case "approved":
        return <Badge variant="default">Đã duyệt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>;
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Hoàn thành</Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Đang thực hiện
          </Badge>
        );
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <Badge variant="outline">Chưa bắt đầu</Badge>;
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            Đang thực hiện
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Hoàn thành</Badge>
        );
      case "delayed":
        return <Badge variant="destructive">Trễ hạn</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await workPlansAPI.approveWorkPlan(workPlanId, {
        comments: approvalComment,
      });

      toast({
        title: "Thành công",
        description: "Kế hoạch đã được phê duyệt thành công",
      });

      // Refresh data
      const data_ = await workPlansAPI.getWorkPlanById(workPlanId);
      const data = data_.data;
      setWorkPlan(data);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể phê duyệt kế hoạch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await workPlansAPI.rejectWorkPlan(workPlanId, {
        comments: rejectionComment,
      });

      toast({
        title: "Thành công",
        description: "Kế hoạch đã được từ chối",
      });

      // Refresh data
      const data_ = await workPlansAPI.getWorkPlanById(workPlanId);
      const data = data_.data;
      setWorkPlan(data);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể từ chối kế hoạch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await workPlansAPI.deleteWorkPlan(workPlanId);

      toast({
        title: "Thành công",
        description: "Kế hoạch đã được xóa thành công",
      });

      // Redirect to list page
      window.location.href = "/ke-hoach";
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể xóa kế hoạch",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedTask) return;

    try {
      setIsUpdatingProgress(true);

      // Use the correct API function for updating task status and progress
      await workPlansAPI.updateTaskStatus(workPlanId, selectedTask.id, {
        progress: newProgress,
        status: newStatus,
        comments: progressComment,
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật tiến độ công việc",
      });

      // Refresh data
      const data_ = await workPlansAPI.getWorkPlanById(workPlanId);
      const data = data_.data;
      setWorkPlan(data);

      // Close dialog and reset state
      setIsProgressDialogOpen(false);
      setSelectedTask(null);
      setNewProgress(0);
      setNewStatus("");
      setProgressComment("");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật tiến độ công việc",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const openProgressDialog = (task: WorkPlanTaskDTO) => {
    setSelectedTask(task);
    setNewProgress(task.progress);
    setNewStatus(task.status);
    setProgressComment("");
    setIsProgressDialogOpen(true);
  };

  const calculateOverallProgress = (tasks: WorkPlanTaskDTO[] | undefined) => {
    if (!tasks || tasks.length === 0) return 0;

    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  // Kiểm tra quyền chỉnh sửa
  const canEdit =
    hasRole(["admin", "manager"]) ||
    (hasRole("staff") &&
      workPlan?.createdBy === user?.name &&
      workPlan?.status === "draft");

  // Kiểm tra quyền phê duyệt
  const canApprove =
    hasRole(["admin", "manager"]) && workPlan?.status === "pending";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (error || !workPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-red-500 mb-4">
          {error || "Không tìm thấy kế hoạch"}
        </p>
        <Button asChild>
          <Link href="/ke-hoach">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            asChild
          >
            <Link href="/ke-hoach">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Chi tiết kế hoạch</h1>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              asChild
            >
              <Link href={`/ke-hoach/${workPlanId}/chinh-sua`}>
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </Button>
          )}
          {canApprove && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Từ chối kế hoạch</AlertDialogTitle>
                    <AlertDialogDescription>
                      Vui lòng nhập lý do từ chối để người tạo có thể chỉnh sửa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="Nhập lý do từ chối..."
                    value={rejectionComment}
                    onChange={(e) => setRejectionComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Phê duyệt
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Phê duyệt kế hoạch</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có thể thêm ý kiến trước khi phê duyệt kế hoạch này.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    placeholder="Nhập ý kiến (không bắt buộc)..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận phê duyệt"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{workPlan.title}</CardTitle>
                {getStatusBadge(workPlan.status)}
              </div>
              <CardDescription>
                {workPlan.department} • Người tạo: {workPlan.createdBy} • Ngày
                tạo: {new Date(workPlan.createdAt).toLocaleDateString("vi-VN")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mô tả
                </p>
                <p className="mt-1">{workPlan.description}</p>
              </div>
              <Separator />
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tiến độ tổng thể
                  </p>
                  <p className="text-sm font-medium">
                    {calculateOverallProgress(workPlan.tasks)}%
                  </p>
                </div>
                <Progress
                  value={calculateOverallProgress(workPlan.tasks)}
                  className="mt-2"
                />
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Danh sách công việc
                </p>
                <Tabs defaultValue="list" className="mt-2">
                  <TabsList>
                    <TabsTrigger value="list">Danh sách</TabsTrigger>
                    <TabsTrigger value="timeline">Dòng thời gian</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list" className="space-y-4 mt-4">
                    {workPlan.tasks && workPlan.tasks.length > 0 ? (
                      workPlan.tasks.map((task) => (
                        <Card key={task.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-medium">{task.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(task.startDate).toLocaleDateString(
                                    "vi-VN"
                                  )}{" "}
                                  -{" "}
                                  {new Date(task.endDate).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </p>
                                <p className="text-sm">{task.description}</p>
                                <p className="text-sm">
                                  <span className="text-muted-foreground">
                                    Người thực hiện:{" "}
                                  </span>
                                  {task.assignee}
                                </p>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                {getTaskStatusBadge(task.status)}
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-medium">
                                    {task.progress}%
                                  </p>
                                  <div className="w-24">
                                    <Progress value={task.progress} />
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openProgressDialog(task)}
                                >
                                  Cập nhật tiến độ
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Không có công việc nào trong kế hoạch này
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="timeline">
                    <div className="p-4">
                      <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                        <div className="space-y-6">
                          {workPlan.tasks && workPlan.tasks.length > 0 ? (
                            workPlan.tasks.map((task) => (
                              <div key={task.id} className="relative pl-8">
                                <div className="absolute left-0 top-2 h-6 w-6 rounded-full border bg-background flex items-center justify-center">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{task.title}</p>
                                    {getTaskStatusBadge(task.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(
                                      task.startDate
                                    ).toLocaleDateString("vi-VN")}{" "}
                                    -{" "}
                                    {new Date(task.endDate).toLocaleDateString(
                                      "vi-VN"
                                    )}
                                  </p>
                                  <p className="text-sm">{task.description}</p>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm text-muted-foreground">
                                      Tiến độ:
                                    </p>
                                    <p className="text-sm font-medium">
                                      {task.progress}%
                                    </p>
                                    <div className="w-24">
                                      <Progress value={task.progress} />
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => openProgressDialog(task)}
                                  >
                                    Cập nhật tiến độ
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Không có công việc nào trong kế hoạch này
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin kế hoạch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Trạng thái
                </p>
                <div className="mt-1">{getStatusBadge(workPlan.status)}</div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Thời gian
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {new Date(workPlan.startDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(workPlan.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Người tạo
                </p>
                <p className="mt-1">{workPlan.createdBy}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ngày tạo
                </p>
                <p className="mt-1">
                  {new Date(workPlan.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cập nhật lần cuối
                </p>
                <p className="mt-1">
                  {new Date(workPlan.updatedAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Phòng ban
                </p>
                <p className="mt-1">{workPlan.department}</p>
              </div>
            </CardContent>
            {canEdit && workPlan.status === "draft" && (
              <CardFooter className="bg-accent/30 border-t border-primary/10">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash className="mr-2 h-4 w-4" /> Xóa kế hoạch
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa kế hoạch</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa kế hoạch này? Hành động này
                        không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Đang xử lý..." : "Xác nhận xóa"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tài liệu liên quan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workPlan.documents && workPlan.documents.length > 0 ? (
                  workPlan.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm">{doc.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Xem
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có tài liệu liên quan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Update Dialog */}
      <Dialog
        open={isProgressDialogOpen}
        onOpenChange={setIsProgressDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cập nhật tiến độ công việc</DialogTitle>
            <DialogDescription>
              {selectedTask ? selectedTask.title : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-progress">Tiến độ hoàn thành (%)</Label>
              <div className="flex items-center space-x-4">
                <Slider
                  id="task-progress"
                  min={0}
                  max={100}
                  step={5}
                  value={[newProgress]}
                  onValueChange={(value) => setNewProgress(value[0])}
                  className="flex-1"
                />
                <span className="w-12 text-center font-medium">
                  {newProgress}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-status">Trạng thái</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="task-status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Chưa bắt đầu</SelectItem>
                  <SelectItem value="in_progress">Đang thực hiện</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="delayed">Trễ hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-comment">Ghi chú</Label>
              <Textarea
                id="progress-comment"
                placeholder="Nhập ghi chú về tiến độ (không bắt buộc)"
                value={progressComment}
                onChange={(e) => setProgressComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProgressDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateProgress}
              disabled={isUpdatingProgress}
              className="bg-primary"
            >
              {isUpdatingProgress ? "Đang cập nhật..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

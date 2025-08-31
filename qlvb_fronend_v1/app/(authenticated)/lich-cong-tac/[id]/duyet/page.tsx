"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
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
import { schedulesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/lib/notifications-context";

export default function ApproveSchedulePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const scheduleId = Number.parseInt(id);
  const router = useRouter();
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true);

        // Fetch schedule details
        const response_ = await schedulesAPI.getScheduleById(scheduleId);
        const response = response_.data;
        setSchedule(response);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin lịch công tác");
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin lịch công tác",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId, toast]);

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "internal":
        return <Badge variant="outline">Nội bộ</Badge>;
      case "external":
        return <Badge variant="secondary">Bên ngoài</Badge>;
      case "online":
        return <Badge variant="default">Trực tuyến</Badge>;
      case "field":
        return <Badge variant="destructive">Hiện trường</Badge>;
      default:
        return <Badge variant="outline">Khác</Badge>;
    }
  };

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);

      // Gọi API để phê duyệt lịch công tác
      await schedulesAPI.approveSchedule(scheduleId, { comments });

      toast({
        title: "Thành công",
        description: "Đã phê duyệt lịch công tác thành công!",
      });

      addNotification({
        title: "Thành công",
        message: "Lịch công tác đã được phê duyệt.",
        type: "success",
      });

      // Trigger storage event to refresh schedule list
      if (typeof window !== "undefined") {
        localStorage.setItem("scheduleDataUpdate", Date.now().toString());
        setTimeout(() => {
          localStorage.removeItem("scheduleDataUpdate");
        }, 100);
      }

      router.push("/lich-cong-tac");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể phê duyệt lịch công tác",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);

      // Gọi API để từ chối lịch công tác
      await schedulesAPI.rejectSchedule(scheduleId, { comments });

      toast({
        title: "Thành công",
        description: "Đã từ chối lịch công tác thành công!",
      });

      addNotification({
        title: "Thành công",
        message: "Lịch công tác đã bị từ chối.",
        type: "success",
      });

      // Trigger storage event to refresh schedule list
      if (typeof window !== "undefined") {
        localStorage.setItem("scheduleDataUpdate", Date.now().toString());
        setTimeout(() => {
          localStorage.removeItem("scheduleDataUpdate");
        }, 100);
      }

      router.push("/lich-cong-tac");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message || "Không thể từ chối lịch công tác",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-red-500 mb-4">
          {error || "Không tìm thấy lịch công tác"}
        </p>
        <Button asChild>
          <Link href="/lich-cong-tac">Quay lại danh sách</Link>
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
            <Link href="/lich-cong-tac">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Duyệt lịch công tác</h1>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-base">
          Chờ duyệt
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{schedule.title}</CardTitle>
              <CardDescription>
                {schedule.department} • Người tạo:{" "}
                {schedule.creator?.name || "Không xác định"} • Ngày tạo:{" "}
                {new Date(schedule.createdAt).toLocaleDateString("vi-VN")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mô tả
                </p>
                <p className="mt-2">{schedule.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Chi tiết lịch công tác
                </p>
                <Tabs defaultValue="list" className="mt-2">
                  <TabsList className="bg-card border p-1 rounded-full w-auto inline-flex">
                    <TabsTrigger
                      value="list"
                      className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Danh sách
                    </TabsTrigger>
                    <TabsTrigger
                      value="calendar"
                      className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Lịch
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="list" className="space-y-4 mt-4">
                    {schedule.items && schedule.items.length > 0 ? (
                      schedule.items.map((item: any) => (
                        <Card
                          key={item.id}
                          className="overflow-hidden hover:shadow-md transition-all card-hover"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                <div className="text-sm font-medium bg-accent rounded-full w-14 h-14 flex items-center justify-center">
                                  {item.startTime}
                                </div>
                                <div className="h-full w-px bg-border mt-1"></div>
                                <div className="text-sm font-medium bg-accent rounded-full w-14 h-14 flex items-center justify-center">
                                  {item.endTime}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-lg">
                                    {item.title}
                                  </h3>
                                  {getEventTypeBadge(item.type)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(item.date).toLocaleDateString(
                                    "vi-VN"
                                  )}{" "}
                                  • {item.location}
                                </p>
                                <p className="text-sm mt-3">
                                  {item.description}
                                </p>
                                <p className="text-sm mt-3">
                                  <span className="text-muted-foreground">
                                    Thành phần:{" "}
                                  </span>
                                  {Array.isArray(item.participants)
                                    ? item.participants.join(", ")
                                    : typeof item.participants === "string"
                                    ? item.participants
                                    : "Không có thông tin"}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Không có sự kiện nào trong lịch công tác này
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="calendar">
                    <div className="p-8 text-center text-muted-foreground bg-accent/30 rounded-lg mt-4">
                      Xem lịch theo dạng lịch tuần/tháng
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Phê duyệt</CardTitle>
              <CardDescription>
                Phê duyệt hoặc từ chối lịch công tác
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Nhận xét</p>
                <Textarea
                  placeholder="Nhập nhận xét của bạn..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                className="w-full rounded-full"
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                <Check className="mr-2 h-4 w-4" />{" "}
                {isSubmitting ? "Đang xử lý..." : "Phê duyệt"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" /> Từ chối
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận từ chối</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn từ chối lịch công tác này? Vui lòng
                      cung cấp lý do từ chối trong phần nhận xét.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">
                      Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReject}
                      className="rounded-full"
                    >
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin phê duyệt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Người tạo
                </p>
                <p className="mt-1 font-medium">
                  {schedule.creator?.name || "Không xác định"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ngày tạo
                </p>
                <p className="mt-1">
                  {new Date(schedule.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Phòng ban
                </p>
                <p className="mt-1">{schedule.department}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Loại lịch
                </p>
                <p className="mt-1">{schedule.period}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

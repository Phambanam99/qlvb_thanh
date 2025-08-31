"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { ScheduleDTO, schedulesAPI } from "@/lib/api";
import { usersAPI } from "@/lib/api/users";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { use } from "react";
export default function ScheduleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const scheduleId = Number.parseInt(id);
  const { hasRole } = useAuth();
  const { toast } = useToast();

  const [schedule, setSchedule] = useState<ScheduleDTO>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedSchedules, setRelatedSchedules] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Function to fetch user names for participants
  const fetchUserNames = async (userIds: number[]) => {
    try {
      const userPromises = userIds.map(id => usersAPI.getUserById(id));
      const users = await Promise.all(userPromises);
      
      const nameMap: Record<string, string> = {};
      users.forEach(user => {
        if (user.id) {
          nameMap[user.id.toString()] = user.fullName;
        }
      });
      
      setUserNames(prevNames => ({ ...prevNames, ...nameMap }));
    } catch (error) {
      console.error("Error fetching user names:", error);
    }
  };

  // Function to get participant display text
  const getParticipantDisplay = (participants: any) => {
    if (!participants) return "Không có thông tin";
    
    if (Array.isArray(participants)) {
      if (participants.length === 0) return "Không có thông tin";
      
      // If all participants are numbers (user IDs), try to get names
      if (participants.every(p => typeof p === 'number' || (typeof p === 'string' && !isNaN(Number(p))))) {
        const names = participants.map(p => userNames[p.toString()] || `User ${p}`);
        return names.join(", ");
      }
      
      // If participants are already names
      return participants.join(", ");
    }
    
    if (typeof participants === "string") {
      return participants;
    }
    
    return "Không có thông tin";
  };

  // Replace getRelatedSchedules with a custom function
  const fetchRelatedSchedules = async () => {
    try {
      // Since getRelatedSchedules doesn't exist, we'll use getAllSchedules and filter
      const allSchedules_ = await schedulesAPI.getAllSchedules();
      const allSchedules = allSchedules_.data;
      // Filter schedules that might be related (this is a workaround)
      const related = allSchedules
        .filter(
          (s) =>
            s.id !== scheduleId &&
            (s.title?.includes(schedule?.title || "") ||
              s.description?.includes(schedule?.description || ""))
        )
        .slice(0, 5); // Limit to 5 related schedules
      setRelatedSchedules(related);
    } catch (error) {
    }
  };

  // Fix the data property access
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setIsLoading(true);
        const scheduleData_ = await schedulesAPI.getScheduleById(scheduleId);
        const scheduleData = scheduleData_.data;
        setSchedule(scheduleData);
        
        // Extract participant IDs from all events and fetch user names
        if (scheduleData?.events) {
          const participantIds = new Set<number>();
          scheduleData.events.forEach((event: any) => {
            if (event.participants && Array.isArray(event.participants)) {
              event.participants.forEach((id: any) => {
                if (typeof id === 'number') {
                  participantIds.add(id);
                } else if (typeof id === 'string' && !isNaN(Number(id))) {
                  participantIds.add(Number(id));
                }
              });
            }
          });
          
          if (participantIds.size > 0) {
            await fetchUserNames(Array.from(participantIds));
          }
        }
        
        setIsLoading(false);
      } catch (error: any) {
        setError(error.message || "Không thể tải thông tin lịch công tác");
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin lịch công tác",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchScheduleData();
    fetchRelatedSchedules();
  }, [scheduleId, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Chờ duyệt</Badge>;
      case "approved":
        return <Badge variant="success">Đã duyệt</Badge>;
      case "rejected":
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

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

  // Kiểm tra quyền chỉnh sửa
  const canEdit = hasRole("creator") && schedule?.status === "pending";

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
          <h1 className="text-3xl font-bold">Chi tiết lịch công tác</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="rounded-full">
            <Printer className="mr-2 h-4 w-4" />
            In lịch
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{schedule.title}</CardTitle>
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800"
                >
                  {schedule.status === "APPROVED"
                    ? "Đã duyệt"
                    : schedule.status === "PENDING"
                    ? "Chờ duyệt"
                    : schedule.status === "REJECTED"
                    ? "Từ chối"
                    : "Khác"}
                </Badge>
              </div>
              <CardDescription>
                {schedule.department} • Người tạo:{" "}
                {schedule.createdByName || "Không xác định"} • Ngày tạo:{" "}
                {new Date(schedule.createdAt).toLocaleDateString("vi-VN")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mô tả
                </p>
                <p className="mt-1">{schedule.description}</p>
              </div>
              {schedule.comments && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nhận xét của người duyệt
                    </p>
                    <div className="mt-1 rounded-md bg-muted p-3">
                      <p className="text-sm">{schedule.comments}</p>
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Chi tiết lịch công tác
                </p>
                <Tabs defaultValue="list" className="mt-2">
                  <TabsList>
                    <TabsTrigger value="list">Danh sách</TabsTrigger>
                    <TabsTrigger value="calendar">Lịch</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list" className="space-y-4 mt-4">
                    {schedule.events && schedule.events.length > 0 ? (
                      schedule.events.map((item: any) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center">
                                <div className="text-sm font-medium">
                                  {item.startTime}
                                </div>
                                <div className="h-full w-px bg-border mt-1"></div>
                                <div className="text-sm font-medium">
                                  {item.endTime}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium">{item.title}</h3>
                                  {getEventTypeBadge(item.type)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(item.date).toLocaleDateString(
                                    "vi-VN"
                                  )}{" "}
                                  • {item.location}
                                </p>
                                <p className="text-sm mt-2">
                                  {item.description}
                                </p>
                                <p className="text-sm mt-2">
                                  <span className="text-muted-foreground">
                                    Thành phần:{" "}
                                  </span>
                                  {Array.isArray(item.participantNames)
                                    ? item.participantNames.join(", ")
                                    : typeof item.participantNames === "string"
                                    ? item.participantNames
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
                    <div className="p-4 text-center text-muted-foreground">
                      Xem lịch theo dạng lịch tuần/tháng
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
              <CardTitle>Thông tin lịch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Trạng thái
                </p>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    {schedule.status === "APPROVED"
                      ? "Đã duyệt"
                      : schedule.status === "PENDING"
                      ? "Chờ duyệt"
                      : schedule.status === "REJECTED"
                      ? "Từ chối"
                      : "Khác"}
                  </Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Người tạo
                </p>
                <p className="mt-1">
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
              {schedule.approver && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Người duyệt
                    </p>
                    <p className="mt-1">{schedule.approver}</p>
                  </div>
                </>
              )}
              {schedule.approvedAt && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ngày duyệt
                    </p>
                    <p className="mt-1">
                      {new Date(schedule.approvedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch liên quan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatedSchedules && relatedSchedules.length > 0 ? (
                  relatedSchedules.map((relatedSchedule: any) => (
                    <div
                      key={relatedSchedule.id}
                      className="rounded-md border p-3"
                    >
                      <div className="flex justify-between">
                        <p className="font-medium">{relatedSchedule.title}</p>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          {relatedSchedule.status === "APPROVED"
                            ? "Đã duyệt"
                            : relatedSchedule.status === "PENDING"
                            ? "Chờ duyệt"
                            : relatedSchedule.status === "REJECTED"
                            ? "Từ chối"
                            : "Khác"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {relatedSchedule.period}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/lich-cong-tac/${relatedSchedule.id}`}>
                            Xem
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có lịch liên quan
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

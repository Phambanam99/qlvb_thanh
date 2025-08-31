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
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { ScheduleEventDTO, schedulesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";

interface EventDocument {
  name: string;
  size: string;
  url?: string;
}

interface EventHistory {
  action: string;
  user: string;
  timestamp: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  department: string;
  schedule: string;
  scheduleId: number;
  participants: string[];
  description: string;
  documents: EventDocument[];
  notes?: string;
  history?: EventHistory[];
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { toast } = useToast();
  const [event, setEvent] = useState<ScheduleEventDTO | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<ScheduleEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );
  const { user, hasRole, setDataLoaded } = useAuth();

  // Resolve params Promise
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const eventId = resolvedParams?.id;

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;

      try {
        setLoading(true);

        // Fetch event details
        const eventData_ = await schedulesAPI.getEventById(eventId);
        const eventData = eventData_.data;
        setEvent(eventData);

        // Fetch related events (events on the same day)
        const eventsData_ = await schedulesAPI.getScheduleEvents({
          date: eventData.date,
          excludeId: eventId,
          departmentId: String(user?.departmentId),
        });
        const eventsData = eventsData_.data;
        setRelatedEvents(eventsData.slice(0, 3)); // Limit to 3 related events
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin sự kiện. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, user?.departmentId, toast]);

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

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold mb-2">Không tìm thấy sự kiện</h2>
        <p className="text-muted-foreground mb-4">
          Sự kiện này không tồn tại hoặc đã bị xóa
        </p>
        <Button asChild>
          <Link href="/lich-cong-tac">Quay lại lịch công tác</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/lich-cong-tac">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Chi tiết sự kiện</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{event.title}</CardTitle>
                {getEventTypeBadge(event.type)}
              </div>
              <CardDescription>
                Thuộc lịch:{" "}
                <Link
                  href={`/lich-cong-tac/${event.scheduleId}`}
                  className="hover:underline"
                >
                  Xem chi tiết lịch
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start space-x-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Ngày</p>
                    <p>{event.date}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Thời gian</p>
                    <p>
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Địa điểm</p>
                    <p>{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phòng ban</p>
                    <p>{event.department}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Mô tả
                </p>
                <p className="mt-1">{event.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Thành phần tham dự
                </p>
                <p className="mt-1">{event.participantNames.join(", ")}</p>
              </div>
              {event.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ghi chú
                    </p>
                    <p className="mt-1">{event.notes}</p>
                  </div>
                </>
              )}
              {event.documents && event.documents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Tài liệu đính kèm
                    </p>
                    <div className="space-y-2">
                      {event.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <span className="text-sm">{doc.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {doc.size}
                            </span>
                            {doc.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Tải xuống
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Các sự kiện khác trong ngày</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedEvents.length > 0 ? (
                <div className="space-y-4">
                  {relatedEvents.map((relatedEvent) => (
                    <div
                      key={relatedEvent.id}
                      className="rounded-md border p-3"
                    >
                      <div className="flex justify-between">
                        <p className="font-medium">{relatedEvent.title}</p>
                        {getEventTypeBadge(relatedEvent.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {relatedEvent.startTime} - {relatedEvent.endTime} •{" "}
                        {relatedEvent.location}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/lich-cong-tac/su-kien/${relatedEvent.id}`}
                          >
                            Xem
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Không có sự kiện nào khác trong ngày này
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thay đổi</CardTitle>
            </CardHeader>
            <CardContent>
              {event.history && event.history.length > 0 ? (
                <div className="space-y-4">
                  {event.history.map((item, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm">{item.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.user} • {item.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm">Tạo sự kiện</p>
                      <p className="text-xs text-muted-foreground">
                        Hệ thống • {new Date().toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Skeleton className="h-5 w-5" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  ))}
              </div>
              <Separator />
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
              <Separator />
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="rounded-md border p-3">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-48 mt-2" />
                      <div className="mt-2 flex justify-end">
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Skeleton className="h-2 w-2 mt-2 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48 mt-1" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

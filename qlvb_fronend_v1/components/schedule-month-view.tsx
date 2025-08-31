"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScheduleMonthViewProps {
  date?: Date;
  department?: string;
  type?: string;
  schedules?: any[]; // Make schedules optional
}

export default function ScheduleMonthView({
  date = new Date(),
  department = "all",
  type = "all",
  schedules = [], // Provide default empty array
}: ScheduleMonthViewProps) {
  const [monthDays, setMonthDays] = useState<(Date | null)[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [dialogEvents, setDialogEvents] = useState<any[]>([]);

  // Tính toán các ngày trong tháng
  useEffect(() => {
    const days = [];
    const currentDate = new Date(date);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Ngày đầu tiên của tháng
    const firstDay = new Date(year, month, 1);
    // Ngày cuối cùng của tháng
    const lastDay = new Date(year, month + 1, 0);

    // Lấy thứ của ngày đầu tiên (0 = Chủ nhật, 1 = Thứ 2, ...)
    const firstDayOfWeek = firstDay.getDay() || 7; // Chuyển 0 (Chủ nhật) thành 7

    // Thêm các ô trống cho các ngày trước ngày đầu tiên của tháng
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Thêm các ngày trong tháng
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    setMonthDays(days);
  }, [date]);

  // Prepare events based on provided schedules
  useEffect(() => {
    // console.log("Month View Schedules:", schedules); // Debug log
    // console.log("Department filter (Month View):", department); // Debug log để kiểm tra giá trị department

    // Skip if no schedules provided
    if (!schedules || schedules.length === 0) {
      setEvents([]);
      return;
    }

    // Transform schedules into events format
    let transformedEvents: any[] = [];

    // Iterate through each schedule which contains multiple events
    schedules.forEach((schedule) => {
      // Skip if schedule has no events
      if (
        !schedule.events ||
        !Array.isArray(schedule.events) ||
        schedule.events.length === 0
      ) {
        return;
      }

      // Process each event in the schedule
      schedule.events.forEach((event) => {
        // Skip if event has no date
        if (!event.date) {
         
          return;
        }

        // Convert event date to Date object
        const eventDate = new Date(event.date);
        const eventMonth = eventDate.getMonth();
        const eventYear = eventDate.getFullYear();

        // Check if the schedule is in current month view
        const viewMonth = date.getMonth();
        const viewYear = date.getFullYear();

        // Only include if the event is in the same month and year as the current view
        if (eventMonth !== viewMonth || eventYear !== viewYear) {
          return;
        }

        // Format times from HH:MM:SS to HH:MM
        const startTime = event.startTime
          ? event.startTime.substring(0, 5)
          : "08:00";
        const endTime = event.endTime ? event.endTime.substring(0, 5) : "17:00";

        transformedEvents.push({
          id: event.id,
          scheduleId: schedule.id,
          title: event.title,
          date: event.date,
          startTime: startTime,
          endTime: endTime,
          location:
            event.location || schedule.departmentName || "Không có địa điểm",
          department: schedule.departmentName,
          departmentId: schedule.departmentId, // Thêm departmentId để lọc theo ID
          type: event.type || "internal",
          description: event.description || "",
          status: schedule.status,
        });
      });
    });

    // Filter events by department if needed
    if (department !== "all") {
      transformedEvents = transformedEvents.filter((event) => {
        // So sánh bằng ID thay vì tên phòng ban
        return (
          event.departmentId &&
          event.departmentId.toString() === department.toString()
        );
      });
    }

    setEvents(transformedEvents);
    // console.log("Transformed Month Events:", transformedEvents); // Debug log
  }, [schedules, date, department, type]);

  const getDayEvents = (day: Date | null) => {
    if (!day) return [];

    // Format day as YYYY-MM-DD to match event.date format
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(day.getDate()).padStart(2, "0")}`;

    // console.log("Looking for events on day:", dayStr);
    const matchingEvents = events.filter((event) => {
      const eventDate = event.date;
      const match = eventDate === dayStr;
      // console.log(
      //   `Event ${event.id} date: ${eventDate}, match with ${dayStr}: ${match}`
      // );
      return match;
    });

    return matchingEvents;
  };

  const isToday = (day: Date | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((name, index) => (
            <div
              key={index}
              className="text-center font-medium p-2 text-muted-foreground"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, index) => {
            const dayEvents = getDayEvents(day);
            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] border rounded-lg p-2 transition-colors",
                  !day ? "bg-muted/30" : "bg-card/50 hover:bg-card",
                  isToday(day)
                    ? "bg-primary/10 font-bold ring-1 ring-primary/20"
                    : ""
                )}
              >
                {day && (
                  <>
                    <div className="text-right text-sm font-medium">
                      {day.getDate()}
                    </div>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <Tooltip key={event.id}>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/lich-cong-tac/su-kien/${event.id}`}
                              className="block text-xs truncate hover:underline p-1 rounded bg-accent/50 hover:bg-accent transition-colors"
                            >
                              {event.startTime} {event.title}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{event.description || "Không có mô tả"}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {dayEvents.length > 3 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div
                              className="text-xs text-primary font-medium text-center cursor-pointer"
                              onClick={() => setDialogEvents(dayEvents)}
                            >
                              +{dayEvents.length - 3} sự kiện khác
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Sự kiện</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[400px]">
                              <div className="space-y-4">
                                {dialogEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    className="border rounded-lg p-4 space-y-2"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Badge>{event.type}</Badge>
                                      <span className="text-sm font-medium">
                                        {event.title}
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {event.description || "Không có mô tả"}
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                      <Calendar className="w-4 h-4" />
                                      <span>{event.date}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {event.startTime} - {event.endTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                      <MapPin className="w-4 h-4" />
                                      <span>{event.location}</span>
                                    </div>
                                    <Button
                                      asChild
                                      variant="link"
                                      className="text-sm"
                                    >
                                      <Link
                                        href={`/lich-cong-tac/su-kien/${event.id}`}
                                      >
                                        Xem chi tiết
                                      </Link>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

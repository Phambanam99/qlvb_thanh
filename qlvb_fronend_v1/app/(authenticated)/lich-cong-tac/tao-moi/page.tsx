"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  CalendarIcon,
  Plus,
  Save,
  Trash,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { de, vi } from "date-fns/locale";
import { usersAPI } from "@/lib/api/users";
// Cập nhật import để sử dụng API từ thư mục lib/api
import { schedulesAPI, departmentsAPI } from "@/lib/api";
import { useNotifications } from "@/lib/notifications-context";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

// Hàm xử lý vấn đề lệch ngày khi làm việc với Date
const normalizeDate = (date: Date | null | undefined): Date | undefined => {
  if (!date) return undefined;
  // Tạo một ngày mới với cùng giá trị của ngày hiện tại, loại bỏ thông tin giờ
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export default function CreateSchedulePage() {
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "week";

  const [scheduleType, setScheduleType] = useState<"week" | "month">(
    template === "month" ? "month" : "week"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dữ liệu mẫu cho phòng ban
  const [departments, setDepartments] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Thêm các state và hooks cần thiết
  const { addNotification } = useNotifications();
  const router = useRouter();

  const addScheduleItem = () => {
    const newItem = {
      id: Date.now(),
      title: "",
      date: null,
      startTime: "",
      endTime: "",
      location: "",
      participants: [],
      description: "",
      type: "internal",
    };
    setScheduleItems([...scheduleItems, newItem]);
  };

  const updateScheduleItem = (id: number, field: string, value: any) => {
    // Xử lý đặc biệt cho trường date để tránh vấn đề timezone
    if (field === "date" && value) {
      value = normalizeDate(value);
    }
    setScheduleItems(
      scheduleItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeScheduleItem = (id: number) => {
    setScheduleItems(scheduleItems.filter((item) => item.id !== id));
  };

  // Kiểm tra dữ liệu trước khi submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dữ liệu
    if (!title) {
      addNotification({
        title: "Lỗi",
        message: "Vui lòng nhập tiêu đề lịch công tác",
        type: "error",
      });
      return;
    }

    if (!startDate) {
      addNotification({
        title: "Lỗi",
        message: "Vui lòng chọn ngày bắt đầu",
        type: "error",
      });
      return;
    }

    if (!endDate) {
      addNotification({
        title: "Lỗi",
        message: "Vui lòng chọn ngày kết thúc",
        type: "error",
      });
      return;
    }

    if (scheduleItems.length === 0) {
      addNotification({
        title: "Cảnh báo",
        message:
          "Lịch công tác chưa có sự kiện nào. Bạn có chắc muốn tiếp tục?",
        type: "warning",
      });
      // Có thể thêm confirm dialog ở đây
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu - thống nhất sử dụng period thay vì scheduleType
      const scheduleData = {
        title,
        description,
        departmentId: department,
        period: scheduleType, // Đổi tên trường để thống nhất với backend
        startDate: startDate ? normalizeDate(startDate) : undefined,
        endDate: endDate ? normalizeDate(endDate) : undefined,
        events: scheduleItems.map((item) => ({
          ...item,
          // Đảm bảo date là chuỗi ISO date, sử dụng múi giờ local
          date: item.date
            ? new Date(
                item.date.getTime() - item.date.getTimezoneOffset() * 60000
              )
                .toISOString()
                .split("T")[0]
            : null,
        })),
      };

      await schedulesAPI.createSchedule(scheduleData);

      addNotification({
        title: "Thành công",
        message: "Lịch công tác đã được tạo và chờ phê duyệt.",
        type: "success",
      });

      // Trigger storage event to refresh schedule list
      if (typeof window !== 'undefined') {
        localStorage.setItem('scheduleDataUpdate', Date.now().toString());
        // Remove the item immediately to allow future triggers
        setTimeout(() => {
          localStorage.removeItem('scheduleDataUpdate');
        }, 100);
      }

      router.push("/lich-cong-tac");
    } catch (error) {
      addNotification({
        title: "Lỗi",
        message: "Không thể tạo lịch công tác. Vui lòng thử lại sau.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thêm useEffect để lấy dữ liệu phòng ban và cán bộ từ API
  useEffect(() => {
    const fetchDepartmentsAndStaff = async () => {
      try {
        // Kiểm tra trước khi gọi API lấy phòng ban
        if (departments.length === 0) {
          setIsLoadingDepartments(true);
          const departmentsData_ = await departmentsAPI.getAllDepartments();
          const departmentsData = departmentsData_.data;

          // Kiểm tra cấu trúc dữ liệu và xử lý phù hợp
          if (departmentsData && Array.isArray(departmentsData.content)) {
            setDepartments(departmentsData.content);
          } else if (Array.isArray(departmentsData)) {
            setDepartments(departmentsData);
          } else {
            ;
            setDepartments([]);
            addNotification({
              title: "Lỗi",
              message: "Định dạng dữ liệu phòng ban không đúng",
              type: "error",
            });
          }
          setIsLoadingDepartments(false);
        }

        // Kiểm tra trước khi gọi API lấy danh sách cán bộ
        if (staffMembers.length === 0) {
          setIsLoadingStaff(true);
          const usersData_ = await usersAPI.getAllUsers();
          const usersData = usersData_.data;
          if (Array.isArray(usersData)) {
            setStaffMembers(usersData);
          } else {
            setStaffMembers([]);
            addNotification({
              title: "Lỗi",
              message: "Định dạng dữ liệu người dùng không đúng",
              type: "error",
            });
          }
          setIsLoadingStaff(false);
        }
      } catch (error) {
        addNotification({
          title: "Lỗi",
          message: "Không thể tải dữ liệu phòng ban và cán bộ",
          type: "error",
        });
        setIsLoadingDepartments(false);
        setIsLoadingStaff(false);
      }
    };

    fetchDepartmentsAndStaff();
  }, [addNotification]);

  // Sửa lỗi fetchStaffForDepartment
  useEffect(() => {
    const fetchStaffForDepartment = async () => {
      if (!department) return;

      try {
        setIsLoadingStaff(true);
        // Sửa gọi API đúng - department đã là ID (string)
        const usersData_ = await usersAPI.getUsersByDepartmentId(
          Number(department)
        );
        const usersData = usersData_.data;
        setStaffMembers(usersData);
      } catch (error) {
        addNotification({
          title: "Lỗi",
          message: "Không thể tải danh sách cán bộ cho phòng ban này",
          type: "error",
        });
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffForDepartment();
  }, [department, addNotification]);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" className="rounded-full" asChild>
          <Link href="/lich-cong-tac">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Tạo lịch công tác mới</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin chung</CardTitle>
              <CardDescription>
                Nhập thông tin chung của lịch công tác
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">
                  Tiêu đề
                </Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề lịch công tác"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả lịch công tác"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-base">
                    Phòng ban
                  </Label>
                  <Select
                    value={department}
                    onValueChange={(value) => {
                      setDepartment(value); // value đã là ID (string)
                      // Reset participants khi đổi phòng ban
                      scheduleItems.forEach((item) => {
                        updateScheduleItem(item.id, "participants", []);
                      });
                    }}
                    required
                  >
                    <SelectTrigger id="department" className="h-11">
                      <SelectValue
                        placeholder={
                          isLoadingDepartments
                            ? "Đang tải..."
                            : "Chọn phòng ban"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingDepartments ? (
                        <div className="p-2 text-center">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Đang tải...
                          </p>
                        </div>
                      ) : !departments || departments.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Không có phòng ban nào
                        </SelectItem>
                      ) : (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduleType" className="text-base">
                    Loại lịch
                  </Label>
                  <Select
                    value={scheduleType}
                    onValueChange={(value: "week" | "month") =>
                      setScheduleType(value)
                    }
                    required
                  >
                    <SelectTrigger id="scheduleType" className="h-11">
                      <SelectValue placeholder="Chọn loại lịch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Lịch tuần</SelectItem>
                      <SelectItem value="month">Lịch tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-base">
                    Ngày bắt đầu
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, "dd/MM/yyyy")
                          : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) =>
                          setStartDate(date ? normalizeDate(date) : undefined)
                        }
                        initialFocus
                        locale={vi}
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-base">
                    Ngày kết thúc
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM/yyyy") : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) =>
                          setEndDate(date ? normalizeDate(date) : undefined)
                        }
                        initialFocus
                        locale={vi}
                        disabled={(date) =>
                          startDate ? date < startDate : false
                        }
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chi tiết lịch công tác</CardTitle>
                  <CardDescription>
                    Thêm các sự kiện trong lịch công tác
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addScheduleItem}
                  className="rounded-full"
                >
                  <Plus className="mr-2 h-4 w-4" /> Thêm sự kiện
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {scheduleItems.length === 0 ? (
                  <div className="text-center py-12 bg-accent/30 rounded-lg">
                    <p className="text-muted-foreground">
                      Chưa có sự kiện nào. Nhấn "Thêm sự kiện" để bắt đầu.
                    </p>
                  </div>
                ) : (
                  scheduleItems.map((item, index) => (
                    <Card key={item.id} className="shadow-sm border-dashed">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Sự kiện #{index + 1}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeScheduleItem(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor={`item-title-${item.id}`}>
                            Tiêu đề
                          </Label>
                          <Input
                            id={`item-title-${item.id}`}
                            placeholder="Nhập tiêu đề sự kiện"
                            value={item.title}
                            onChange={(e) =>
                              updateScheduleItem(
                                item.id,
                                "title",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`item-date-${item.id}`}>Ngày</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id={`item-date-${item.id}`}
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !item.date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {item.date
                                    ? format(item.date, "dd/MM/yyyy")
                                    : "Chọn ngày"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={item.date}
                                  onSelect={(date) =>
                                    updateScheduleItem(item.id, "date", date)
                                  }
                                  initialFocus
                                  locale={vi}
                                  disabled={(date) =>
                                    startDate && endDate
                                      ? date < startDate || date > endDate
                                      : false
                                  }
                                  className="rounded-md border"
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-type-${item.id}`}>
                              Loại sự kiện
                            </Label>
                            <Select
                              value={item.type}
                              onValueChange={(value) =>
                                updateScheduleItem(item.id, "type", value)
                              }
                            >
                              <SelectTrigger id={`item-type-${item.id}`}>
                                <SelectValue placeholder="Chọn loại sự kiện" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="internal">Nội bộ</SelectItem>
                                <SelectItem value="external">
                                  Bên ngoài
                                </SelectItem>
                                <SelectItem value="online">
                                  Trực tuyến
                                </SelectItem>
                                <SelectItem value="field">
                                  Hiện trường
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-start-time-${item.id}`}>
                              Thời gian bắt đầu
                            </Label>
                            <Input
                              id={`item-start-time-${item.id}`}
                              type="time"
                              value={item.startTime}
                              onChange={(e) =>
                                updateScheduleItem(
                                  item.id,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-end-time-${item.id}`}>
                              Thời gian kết thúc
                            </Label>
                            <Input
                              id={`item-end-time-${item.id}`}
                              type="time"
                              value={item.endTime}
                              onChange={(e) =>
                                updateScheduleItem(
                                  item.id,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-location-${item.id}`}>
                              Địa điểm
                            </Label>
                            <Input
                              id={`item-location-${item.id}`}
                              placeholder="Nhập địa điểm"
                              value={item.location}
                              onChange={(e) =>
                                updateScheduleItem(
                                  item.id,
                                  "location",
                                  e.target.value
                                )
                              }
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`item-participants-${item.id}`}>
                              Thành phần tham dự
                            </Label>
                            <div className="relative">
                              <Select value="multiple" disabled>
                                <SelectTrigger
                                  id={`item-participants-${item.id}`}
                                  className="hidden"
                                >
                                  <SelectValue placeholder="Chọn nhiều người tham dự" />
                                </SelectTrigger>
                              </Select>

                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    disabled={isLoadingStaff}
                                  >
                                    {isLoadingStaff
                                      ? "Đang tải..."
                                      : item.participants.length === 0
                                      ? "Chọn người tham dự"
                                      : item.participants.length === 1
                                      ? `${item.participants.length} người được chọn`
                                      : item.participants.length ===
                                        staffMembers.length
                                      ? "Tất cả người dùng"
                                      : `${item.participants.length} người được chọn`}
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-full p-0"
                                  align="start"
                                >
                                  <Command>
                                    <CommandInput placeholder="Tìm kiếm người tham dự..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Không tìm thấy kết quả
                                      </CommandEmpty>
                                      <CommandGroup>
                                        <CommandItem
                                          onSelect={() => {
                                            if (
                                              staffMembers.length ===
                                              item.participants.length
                                            ) {
                                              // If all are selected, deselect all
                                              updateScheduleItem(
                                                item.id,
                                                "participants",
                                                []
                                              );
                                            } else {
                                              // Select all
                                              updateScheduleItem(
                                                item.id,
                                                "participants",
                                                staffMembers.map((staff) =>
                                                  staff.id.toString()
                                                )
                                              );
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Checkbox
                                              checked={
                                                staffMembers.length > 0 &&
                                                staffMembers.length ===
                                                  item.participants.length
                                              }
                                              onCheckedChange={() => {}}
                                            />
                                            <span>Tất cả</span>
                                          </div>
                                        </CommandItem>
                                        {staffMembers.map((staff) => (
                                          <CommandItem
                                            key={staff.id}
                                            onSelect={() => {
                                              const staffId =
                                                staff.id.toString();
                                              const currentParticipants = [
                                                ...item.participants,
                                              ];
                                              const isSelected =
                                                currentParticipants.includes(
                                                  staffId
                                                );

                                              let newParticipants;
                                              if (isSelected) {
                                                // Remove if already selected
                                                newParticipants =
                                                  currentParticipants.filter(
                                                    (id) => id !== staffId
                                                  );
                                              } else {
                                                // Add if not selected
                                                newParticipants = [
                                                  ...currentParticipants,
                                                  staffId,
                                                ];
                                              }

                                              updateScheduleItem(
                                                item.id,
                                                "participants",
                                                newParticipants
                                              );
                                            }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Checkbox
                                                checked={item.participants.includes(
                                                  staff.id.toString()
                                                )}
                                                onCheckedChange={() => {}}
                                              />
                                              <span>
                                                {staff.name || staff.fullName}
                                              </span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-description-${item.id}`}>
                            Mô tả
                          </Label>
                          <Textarea
                            id={`item-description-${item.id}`}
                            placeholder="Nhập mô tả sự kiện"
                            value={item.description}
                            onChange={(e) =>
                              updateScheduleItem(
                                item.id,
                                "description",
                                e.target.value
                              )
                            }
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                asChild
              >
                <Link href="/lich-cong-tac">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Đang lưu..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Lưu lịch công tác
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}

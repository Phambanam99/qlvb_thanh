"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { DatePicker } from "@/components/ui/date-picker";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { workPlansAPI } from "@/lib/api/workPlans";
import { departmentsAPI } from "@/lib/api/departments";
import { usersAPI } from "@/lib/api/users";

interface Task {
  id: number;
  title: string;
  description: string;
  assignee: string; // ID của người thực hiện
  assigneeName?: string; // Thêm tên người thực hiện
  startDate: Date;
  endDate: Date;
  status: string;
}

export default function CreateWorkPlanPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch departments
        const departmentsData_ = await departmentsAPI.getAllDepartments();
        const departmentsData = departmentsData_.data;

        // Kiểm tra và xử lý nhiều trường hợp cấu trúc dữ liệu
        if (Array.isArray(departmentsData)) {
          setDepartments(departmentsData);
        } else if (departmentsData && Array.isArray(departmentsData.content)) {
          // Trường hợp dữ liệu được bọc trong thuộc tính content
          setDepartments(departmentsData.content);
        } else {
          // Nếu không phải mảng, khởi tạo một mảng rỗng
          setDepartments([]);
        }

        // Fetch users
        const usersData_ = await usersAPI.getAllUsers();
        const usersData = usersData_.data;

        // Thêm log để xem cấu trúc dữ liệu người dùng

        // Đảm bảo dữ liệu người dùng có cả id và name
        const formattedUsers = Array.isArray(usersData)
          ? usersData.map((user) => ({
              id: user.id.toString(),
              name:
                user.fullName || user.username
                  ? `${user.fullName}`
                  : "Người dùng",
            }))
          : [];

        setUsers(formattedUsers);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const addTask = () => {
    const newTask: Task = {
      id: Date.now(),
      title: "",
      description: "",
      assignee: "",
      
      startDate: new Date(),
      endDate: new Date(),
      status: "not_started",
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: number, field: keyof Task, value: any) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, [field]: value };

          // Nếu đang cập nhật assignee
          if (field === "assignee") {
            // Đồng bộ assigneeId với assignee (nếu API yêu cầu cả hai)
          
            updatedTask.assigneeName = getUserNameById(value);
          }

          return updatedTask;
        }
        return task;
      })
    );
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !department || !startDate || !endDate) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin kế hoạch",
        variant: "destructive",
      });
      return;
    }

    if (tasks.length === 0) {
      toast({
        title: "Thiếu công việc",
        description: "Vui lòng thêm ít nhất một công việc cho kế hoạch",
        variant: "destructive",
      });
      return;
    }

    // Validate tasks
    for (const task of tasks) {
      if (!task.title || !task.assignee || !task.startDate || !task.endDate) {
        toast({
          title: "Thiếu thông tin công việc",
          description:
            "Vui lòng điền đầy đủ thông tin cho tất cả các công việc",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const workPlanData = {
        title,
        description,
        department,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        status: "draft",
        tasks: tasks.map((task) => ({
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          assigneeId: Number(task.assignee),
          startDate: task.startDate.toISOString(),
          endDate: task.endDate.toISOString(),
          status: task.status,
          progress: 0,
        })),
      };

      const response_ = await workPlansAPI.createWorkPlan(workPlanData);
      const response = response_.data;


      toast({
        title: "Thành công",
        description: "Kế hoạch đã được tạo thành công",
      });

      router.push(`/ke-hoach/${response.id}`);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.message || "Không thể tạo kế hoạch. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserNameById = (id: string) => {
    const user = users.find((user) => user.id === id);
    return user ? user.name : "Người dùng";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" className="rounded-full" asChild>
          <Link href="/ke-hoach">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Tạo kế hoạch mới</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin kế hoạch</CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết về kế hoạch công tác
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề kế hoạch</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề kế hoạch"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Nhập mô tả chi tiết về kế hoạch"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Phòng ban</Label>
                  <Select
                    value={department}
                    onValueChange={setDepartment}
                    required
                  >
                    <SelectTrigger id="department">
                      <SelectValue
                        placeholder={
                          isLoading ? "Đang tải..." : "Chọn phòng ban"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoading ? (
                        <div className="p-2 text-center">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Đang tải...
                          </p>
                        </div>
                      ) : departments.length === 0 ? (
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
                  <Label>Thời gian thực hiện</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <DatePicker
                        date={startDate}
                        setDate={setStartDate}
                        placeholder="Ngày bắt đầu"
                      />
                    </div>
                    <div>
                      <DatePicker
                        date={endDate}
                        setDate={setEndDate}
                        placeholder="Ngày kết thúc"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Danh sách công việc</CardTitle>
                <CardDescription>
                  Thêm các công việc cần thực hiện trong kế hoạch
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTask}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm công việc
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    Chưa có công việc nào. Nhấn "Thêm công việc" để bắt đầu.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id} className="border-dashed">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between">
                        <h3 className="font-medium">
                          Công việc #{tasks.indexOf(task) + 1}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground"
                          onClick={() => removeTask(task.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`task-title-${task.id}`}>
                          Tiêu đề công việc
                        </Label>
                        <Input
                          id={`task-title-${task.id}`}
                          placeholder="Nhập tiêu đề công việc"
                          value={task.title}
                          onChange={(e) =>
                            updateTask(task.id, "title", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`task-description-${task.id}`}>
                          Mô tả công việc
                        </Label>
                        <Textarea
                          id={`task-description-${task.id}`}
                          placeholder="Nhập mô tả chi tiết về công việc"
                          value={task.description}
                          onChange={(e) =>
                            updateTask(task.id, "description", e.target.value)
                          }
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`task-assignee-${task.id}`}>
                            Người thực hiện
                          </Label>
                          <Select
                            value={task.assignee}
                            onValueChange={(value) => {
                              updateTask(task.id, "assignee", value);
                            }}
                            required
                          >
                            <SelectTrigger
                              id={`task-assignee-${task.id}`}
                              className="relative"
                            >
                              {task.assignee ? (
                                <div>{getUserNameById(task.assignee)}</div>
                              ) : (
                                <SelectValue placeholder="Chọn người thực hiện" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {isLoading ? (
                                <div className="p-2 text-center">
                                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Đang tải...
                                  </p>
                                </div>
                              ) : users.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Không có người dùng nào
                                </SelectItem>
                              ) : (
                                users.map((user) => (
                                  <SelectItem
                                    key={user.id}
                                    value={user.id.toString()}
                                  >
                                    {user.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày bắt đầu</Label>
                          <DatePicker
                            date={task.startDate}
                            setDate={(date) =>
                              updateTask(task.id, "startDate", date)
                            }
                            placeholder="Ngày bắt đầu"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày kết thúc</Label>
                          <DatePicker
                            date={task.endDate}
                            setDate={(date) =>
                              updateTask(task.id, "endDate", date)
                            }
                            placeholder="Ngày kết thúc"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/ke-hoach">Hủy</Link>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || tasks.length === 0}
              >
                {isSubmitting ? "Đang xử lý..." : "Tạo kế hoạch"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}

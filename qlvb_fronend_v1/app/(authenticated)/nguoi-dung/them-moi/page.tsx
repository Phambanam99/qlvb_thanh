"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
// Cập nhật import để sử dụng API từ thư mục lib/api
import { usersAPI } from "@/lib/api";
import { departmentsAPI } from "@/lib/api/departments";
import { rolesAPI } from "@/lib/api/roles";
import type { DepartmentDTO } from "@/lib/api/departments";
import type { RoleDTO } from "@/lib/api/roles";

export default function AddUserPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const { hasRole, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const router = useRouter();

  // Fetch departments and roles data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [departmentsResponse_, rolesResponse_] = await Promise.all([
          departmentsAPI.getAllDepartments(),
          rolesAPI.getAllRoles(),
        ]);
        const departmentsResponse = departmentsResponse_.data;
        const rolesResponse = rolesResponse_.data;
        setDepartments(departmentsResponse.content || []);
        setRoles(rolesResponse || []);
      } catch (error) {
        addNotification({
          title: "Lỗi",
          message:
            "Không thể tải dữ liệu phòng ban và vai trò. Vui lòng thử lại sau.",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [addNotification]);

  // Cập nhật hàm handleSubmit để sử dụng state thay vì truy xuất DOM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      addNotification({
        title: "Lỗi",
        message: "Mật khẩu và xác nhận mật khẩu không khớp.",
        type: "error",
      });
      return;
    }

    // Kiểm tra đã chọn phòng ban và vai trò
    if (!selectedDepartment) {
      addNotification({
        title: "Lỗi",
        message: "Vui lòng chọn phòng ban.",
        type: "error",
      });
      return;
    }

    if (!selectedRole) {
      addNotification({
        title: "Lỗi",
        message: "Vui lòng chọn vai trò.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Tạo đối tượng dữ liệu người dùng từ form
      const userData = {
        fullName,
        email,
        phone,
        departmentId: Number(selectedDepartment),
        username,
        password,
        roles: [selectedRole],
        isActive,
      };

      // Gọi API để tạo người dùng mới
      await usersAPI.createUser(userData);

      // Thêm thông báo
      addNotification({
        title: "Thêm người dùng thành công",
        message: "Người dùng mới đã được thêm vào hệ thống.",
        type: "success",
      });

      // Reset form và chuyển hướng
      setIsSubmitting(false);
      router.push("/nguoi-dung");
    } catch (error) {
      addNotification({
        title: "Lỗi",
        message: "Không thể thêm người dùng. Vui lòng thử lại sau.",
        type: "error",
      });
      setIsSubmitting(false);
    }
  };

  // Kiểm tra quyền hạn
  if (!hasRole("ROLE_ADMIN") && !hasPermission("manage_users")) {
    router.push("/khong-co-quyen");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/nguoi-dung">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Thêm người dùng mới
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card md:col-span-1">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Nhập thông tin cá nhân của người dùng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  placeholder="Nhập họ và tên"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Phòng ban</Label>
                <Select
                  id="department"
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem
                        key={department.id}
                        value={department.id.toString()}
                      >
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card md:col-span-1">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>
                Thiết lập thông tin đăng nhập và quyền hạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  placeholder="Nhập tên đăng nhập"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Chức vụ</Label>
                <Select
                  id="role"
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name || ""}>
                        {role.displayName || role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    defaultChecked
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <label
                    htmlFor="active"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Kích hoạt tài khoản
                  </label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-accent/30 p-6">
              <div className="flex space-x-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/nguoi-dung">Hủy</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang xử
                      lý...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu người dùng
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}

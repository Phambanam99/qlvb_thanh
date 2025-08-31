"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { authAPI } from "@/lib/api/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { departmentsAPI } from "@/lib/api/departments";
import { rolesAPI } from "@/lib/api/roles";
import Link from "next/link";
import { ErrorMessage } from "@/components/ui/error-message";

export interface DepartmentOption {
  id: number;
  name: string;
}

export interface RoleOption {
  name: string;
  displayName: string;
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  // Load departments and roles
  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        // console.log("Đang tải dữ liệu phòng ban và vai trò...");

        // Load departments
        try {
          // console.log("Đang tải dữ liệu phòng ban...");
          const departmentsData_ = await departmentsAPI.getAllDepartments();
          const departmentsData = departmentsData_.data;
          // console.log("Dữ liệu phòng ban:", departmentsData);

          if (departmentsData && departmentsData.content) {
            setDepartments(
              departmentsData.content.map((dept) => ({
                id: dept.id,
                name: dept.name,
              }))
            );
            // console.log("Đã tải dữ liệu phòng ban thành công");
          } else {
            // console.error("Dữ liệu phòng ban không hợp lệ:", departmentsData);
          }
        } catch (deptError) {
          // console.error("Lỗi khi tải dữ liệu phòng ban:", deptError);
        }

        // Load roles
        try {
          // console.log("Đang tải dữ liệu vai trò...");
          const rolesData_ = await rolesAPI.getAllRoles();
          const rolesData = rolesData_.data;
          // console.log("Dữ liệu vai trò:", rolesData);

          if (rolesData) {
            setRoles(
              rolesData.map((role) => ({
                name: role.name,
                displayName: role.displayName || role.name,
              }))
            );
            // console.log("Đã tải dữ liệu vai trò thành công");
          } else {
            // console.error("Dữ liệu vai trò không hợp lệ:", rolesData);
          }
        } catch (roleError) {
          // console.error("Lỗi khi tải dữ liệu vai trò:", roleError);
        }
      } catch (error) {
        // console.error("Lỗi khi tải dữ liệu:", error);
        setError("Không thể tải dữ liệu phòng ban và vai trò");
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  const validateForm = () => {
    if (!username) {
      setError("Vui lòng nhập tên đăng nhập");
      return false;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return false;
    }
    if (!fullName) {
      setError("Vui lòng nhập họ tên");
      return false;
    }
    if (!departmentId) {
      setError("Vui lòng chọn đơn vị");
      return false;
    }
    if (!role) {
      setError("Vui lòng chọn vai trò");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        username,
        password,
        fullName,
        departmentId: parseInt(departmentId),
        roles: [role],
      };

      // console.log("Đang gửi dữ liệu đăng ký:", userData);
      await authAPI.register(userData);

      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản của bạn đã được tạo thành công",
      });

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 1500);
    } catch (error: any) {
      // console.error("Registration error:", error);
      setError(
        error.response?.data ||
          "Đăng ký thất bại. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Hệ thống quản lý văn bản
          </h1>
          <p className="text-muted-foreground mt-2">Đăng ký tài khoản mới</p>
        </div>

        <Card className="border-primary/10 shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Đăng ký</CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin để tạo tài khoản mới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorMessage message={error} />

            {dataLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input
                    id="username"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Đơn vị</Label>
                  <Select
                    value={departmentId}
                    onValueChange={setDepartmentId}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={String(dept.id)}>
                            {dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>
                          Không có dữ liệu phòng ban
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Vai trò</Label>
                  <Select
                    value={role}
                    onValueChange={setRole}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <SelectItem key={role.name} value={role.name}>
                            {role.displayName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>
                          Không có dữ liệu vai trò
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang
                      đăng ký...
                    </>
                  ) : (
                    "Đăng ký"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter>
            <div className="w-full text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="text-primary font-medium">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

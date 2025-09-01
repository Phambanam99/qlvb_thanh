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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { DepartmentDTO, departmentsAPI } from "@/lib/api";
import { DEPARTMENT_MANAGEMENT_ROLES, hasRoleInGroup } from "@/lib/role-utils";
import AuthGuard from "@/components/auth-guard";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response_ = await departmentsAPI.getAllDepartments();
        const response = response_.data;
        if (response.content) {
          setDepartments(response.content as DepartmentDTO[]);
        } else {
          toast({
            title: "Lỗi",
            description: "Không thể tải danh sách phòng ban",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Đã xảy ra lỗi khi tải dữ liệu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = typeFilter === "all" || dept.group === typeFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddNew = () => {
    router.push("/phong-ban/them-moi");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Check if user has permission to view this page
  if (user?.roles.includes("admin") && user?.roles.includes("manager")) {
    router.push("/khong-co-quyen");
    return null;
  }

  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN")
  return (
    <AuthGuard>
      <div className="container mx-auto max-w-full px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý phòng ban</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.push("/phong-ban/so-do")}>Xem sơ đồ tổ chức</Button>
        {isAdmin && (
          <Button onClick={handleAddNew}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm mới
          </Button>
        )}
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Danh sách phòng ban</CardTitle>
          <CardDescription>
            Quản lý tất cả phòng ban trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="relative w-full md:w-1/3">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm kiếm phòng ban..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Trạng thái:</span>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên phòng ban</TableHead>
                  <TableHead>Viết tắt</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Mã đơn vị</TableHead>
                  <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
                  <TableHead className="text-right">Số nhân viên</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Không tìm thấy phòng ban nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow
                      key={dept.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/phong-ban/${dept.id}`)}
                    >
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.abbreviation}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {dept.email || "—"}
                      </TableCell>
                      <TableCell>{dept.codeDepartment || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge 
                          variant={dept.group === "ACTIVE" ? "default" : "secondary"}
                          className={dept.group === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                        >
                          {dept.group === "ACTIVE" ? "Đang hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {dept.userCount}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {filteredDepartments.length} / {departments.length} phòng
            ban
          </div>
        </CardFooter>
      </Card>
      </div>
    </AuthGuard>
  );
}

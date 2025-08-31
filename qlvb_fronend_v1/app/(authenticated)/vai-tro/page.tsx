"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Loader2,
  Plus,
  Search,
  Settings,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { rolesAPI } from "@/lib/api/roles";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
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
import AuthGuard from "@/components/auth-guard";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const rolesData_ = await rolesAPI.getAllRoles();
        const rolesData = rolesData_.data;
        setRoles(rolesData);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu vai trò. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [toast]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "system" && role.isSystem) ||
      (typeFilter === "custom" && !role.isSystem);

    return matchesSearch && matchesType;
  });

  const handleDeleteRole = async (roleId: number) => {
    try {
      setDeleteLoading(roleId);
      await rolesAPI.deleteRole(roleId);

      // Cập nhật danh sách vai trò sau khi xóa
      setRoles(roles.filter((role) => role.id !== roleId));

      toast({
        title: "Thành công",
        description: "Đã xóa chức vụ thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa chức vụ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Kiểm tra quyền truy cập
  const canManageRoles =
    hasPermission("ROLE_ADMIN") || hasPermission("ROLE_MANAGER");

  return (
    <AuthGuard allowedRoles={["ROLE_ADMIN"]}>
      <div className="container mx-auto max-w-full px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Quản lý chức vụ</h1>
        {canManageRoles && (
          <Link href="/vai-tro/them-moi">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm chức vụ
            </Button>
          </Link>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>
            Lọc danh sách chức vụ theo các tiêu chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, mô tả..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loại chức vụ</label>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chức vụ</SelectItem>
                  <SelectItem value="system">Chức vụ hệ thống</SelectItem>
                  <SelectItem value="custom">Chức vụ tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách vai trò</CardTitle>
          <CardDescription>
            Tổng số: {filteredRoles.length} vai trò
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên vai trò</TableHead>
                  <TableHead>Tên hiển thị</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Số người dùng</TableHead>
                  {canManageRoles && (
                    <TableHead className="text-right">Thao tác</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManageRoles ? 6 : 5}
                      className="h-24 text-center"
                    >
                      Không tìm thấy vai trò nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.displayName}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description}
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <Badge variant="secondary">Hệ thống</Badge>
                        ) : (
                          <Badge variant="outline">Tùy chỉnh</Badge>
                        )}
                      </TableCell>
                      <TableCell>{role.userCount || 0}</TableCell>
                      {canManageRoles && (
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/vai-tro/${role.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={role.isSystem}
                              >
                                <Settings className="h-4 w-4" />
                                <span className="sr-only">Chỉnh sửa</span>
                              </Button>
                            </Link>

                            {!role.isSystem && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                    <span className="sr-only">Xóa</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Xác nhận xóa vai trò
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc chắn muốn xóa vai trò "
                                      {role.displayName}"? Hành động này không
                                      thể hoàn tác.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRole(role.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={deleteLoading === role.id}
                                    >
                                      {deleteLoading === role.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Đang xóa...
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="mr-2 h-4 w-4" />
                                          Xóa vai trò
                                        </>
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AuthGuard>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
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
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Plus,
  Search,
  UserCog,
  RotateCcw,
} from "lucide-react";
import { UserDTO, usersAPI } from "@/lib/api/users";
import { rolesAPI } from "@/lib/api/roles";
import { departmentsAPI } from "@/lib/api/departments";
import { useToast } from "@/components/ui/use-toast";
import { PageResponse, DepartmentDTO } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  DEPARTMENT_MANAGEMENT_ROLES,
  DEPARTMENT_HEAD_ROLES,
  SYSTEM_ROLES,
  hasRoleInGroup,
} from "@/lib/role-utils";
import { useHierarchicalDepartments } from "@/hooks/use-hierarchical-departments";
import AuthGuard from "@/components/auth-guard";

export default function UsersPage() {
  // User data states
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use hierarchical departments hook
  const {
    visibleDepartments,
    userDepartmentIds,
    loading: loadingDepartments,
    error: departmentsError,
  } = useHierarchicalDepartments();

  // Filter states (form values - not yet applied)
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Applied filter states (actually used for API calls)
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [appliedRoleFilter, setAppliedRoleFilter] = useState("all");
  const [appliedDepartmentFilter, setAppliedDepartmentFilter] = useState("all");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  // Function to fetch users with pagination
  const fetchUsers = useCallback(async (page: number, size: number) => {
    
    
    setLoading(true);

    try {
      // Get current user's roles and department
      const userRoles = user?.roles || [];
      const userDepartmentId = user?.departmentId;

      // Check if user is an admin or leadership (can see all users)
      const isAdmin = hasRoleInGroup(userRoles, SYSTEM_ROLES);
      const isLeadership = hasRoleInGroup(userRoles, [
        "ROLE_CUC_TRUONG",
        "ROLE_CUC_PHO",
        "ROLE_CHINH_UY",
        "ROLE_PHO_CHINH_UY",
      ]);
      const isDepartmentHead = hasRoleInGroup(userRoles, DEPARTMENT_HEAD_ROLES);

      // Prepare filter parameters using applied filters
      const params: any = {
        page,
        size,
      };

      // Apply role filter if selected
      if (appliedRoleFilter !== "all") {
        params.roleId = appliedRoleFilter;
      }

      // Apply status filter if selected
      if (appliedStatusFilter !== "all") {
        params.status = appliedStatusFilter === "active" ? 1 : 0;
      }

      // Apply search term if provided
      if (appliedSearchTerm.trim()) {
        params.keyword = appliedSearchTerm.trim();
      }

     

      let usersData;

      if (isAdmin || isLeadership) {
       
        if (appliedDepartmentFilter !== "all") {
          params.departmentId = appliedDepartmentFilter;
        }
        
        const usersData_ = await usersAPI.getPaginatedUsers(params);
        usersData = usersData_.data;
      } else if (isDepartmentHead && userDepartmentId) {
        // Use userDepartmentIds from hierarchical departments hook
        const departmentIds = userDepartmentIds.length > 0 ? userDepartmentIds : [Number(userDepartmentId)];

        if (
          appliedDepartmentFilter !== "all" &&
          departmentIds.includes(Number(appliedDepartmentFilter))
        ) {
          params.departmentId = appliedDepartmentFilter;
          const usersData_ = await usersAPI.getPaginatedUsers(params);
          usersData = usersData_.data;
        } else if (appliedDepartmentFilter === "all") {
          const allUsersInDepartments = [];

          for (const deptId of departmentIds) {
            try {
              const deptParams = { ...params, departmentId: deptId };
              const deptUsers_ = await usersAPI.getPaginatedUsers(deptParams);
              const deptUsers = deptUsers_.data;
              allUsersInDepartments.push(...deptUsers.content);
            } catch (error) {
             
            }
          }

          // Remove duplicates based on user ID
          const uniqueUsers = allUsersInDepartments.filter(
            (user, index, array) =>
              array.findIndex((u) => u.id === user.id) === index
          );

          // Apply pagination manually
          const startIndex = page * size;
          const endIndex = startIndex + size;
          const paginatedUsers = uniqueUsers.slice(startIndex, endIndex);

          usersData = {
            content: paginatedUsers,
            totalElements: uniqueUsers.length,
            totalPages: Math.ceil(uniqueUsers.length / size),
            size,
            number: page,
          };
        } else {
          usersData = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size,
            number: page,
          };
        }
      } else {
          //
        // Regular users can only see themselves - no need for pagination here
        usersData = {
          content: user ? [user as UserDTO] : [],
          totalElements: user ? 1 : 0,
          totalPages: 1,
          size,
          number: 0,
        };
      }

      setUsers(usersData.content);
      setTotalUsers(usersData.totalElements);
      setTotalPages(usersData.totalPages);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu người dùng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, appliedRoleFilter, appliedStatusFilter, appliedSearchTerm, appliedDepartmentFilter, userDepartmentIds, toast]);

  // Fetch initial data: roles only (departments handled by hook)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const rolesData_ = await rolesAPI.getAllRoles();
        const rolesData = rolesData_.data;
        setRoles(rolesData);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    // Only fetch initial data when user is available
    if (user) {
      fetchInitialData();
    }
  }, [user, toast]);

  // Refetch users when applied filters or pagination changes
  useEffect(() => {
    // Skip if user data or roles/departments haven't loaded yet
    if (!user || !roles.length || loadingDepartments) {
      return;
    }

   

    fetchUsers(currentPage, itemsPerPage);
  }, [
    currentPage,
    itemsPerPage,
    fetchUsers,
    user,
    roles,
    visibleDepartments,
    userDepartmentIds,
    loadingDepartments,
    appliedSearchTerm,
    appliedRoleFilter,
    appliedDepartmentFilter,
    appliedStatusFilter,
  ]);

  // Page change handler
  const handlePageChange = (page: number) => {
    // Ensure page is within valid range
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    setCurrentPage(validPage);
  };

  // Per page items change handler
  const handlePerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
    setCurrentPage(0); // Reset to first page when changing items per page
  };

  // Apply filters function
  const applyFilters = () => {
 
    
    setAppliedSearchTerm(searchTerm);
    setAppliedRoleFilter(roleFilter);
    setAppliedDepartmentFilter(departmentFilter);
    setAppliedStatusFilter(statusFilter);
    setCurrentPage(0); // Reset to first page when applying filters
  };

  const resetFilters = () => {
    
    setSearchTerm("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setAppliedSearchTerm("");
    setAppliedRoleFilter("all");
    setAppliedDepartmentFilter("all");
    setAppliedStatusFilter("all");
    setCurrentPage(0);
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : "Không xác định";
  };

  const getDepartmentName = (departmentId: string | number | undefined) => {
    if (!departmentId) return "Không xác định";
    const department = visibleDepartments.find(
      (d) => d.id === Number(departmentId)
    );
    return department ? department.name : "Không xác định";
  };

  if (loading && currentPage === 0 && !users.length) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["ROLE_ADMIN"]}>
      <div className="container mx-auto max-w-full px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>

        {/* Only show Add User button for admins, leadership, and department heads */}
        {hasRoleInGroup(user?.roles || [], [
          ...SYSTEM_ROLES,
          ...DEPARTMENT_MANAGEMENT_ROLES,
        ]) && (
          <Link href="/nguoi-dung/them-moi">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm người dùng
            </Button>
          </Link>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>
            Lọc danh sách người dùng theo các tiêu chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phòng ban</label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {!loadingDepartments && visibleDepartments && visibleDepartments.length <= 1 
                      ? "Đơn vị hiện tại" 
                      : "Tất cả phòng ban"}
                  </SelectItem>
                  {!loadingDepartments &&
                  visibleDepartments &&
                  visibleDepartments.length > 0
                    ? visibleDepartments.map((department) => (
                        <SelectItem
                          key={department.id}
                          value={String(department.id)}
                        >
                          {department.level > 0 ? "\u00A0".repeat(department.level * 2) + "└ " : ""}
                          {department.name}
                        </SelectItem>
                      ))
                    : !loadingDepartments && (
                        <SelectItem value="no-departments" disabled>
                          Không có phòng ban nào
                        </SelectItem>
                      )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã vô hiệu hóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Filter action buttons */}
          <div className="flex gap-2 mt-4 justify-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={loading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Đặt lại
            </Button>
            <Button
              onClick={applyFilters}
              disabled={loading}
            >
              <Search className="mr-2 h-4 w-4" />
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>
            Hiển thị {users.length} / {totalUsers} người dùng
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Họ tên</TableHead>
                  <TableHead className="px-6">Vai trò</TableHead>
                  <TableHead className="px-6">Phòng ban</TableHead>
                  <TableHead className="px-6">Trạng thái</TableHead>
                  <TableHead className="px-6 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center px-6">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                        Đang tải dữ liệu...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center px-6">
                      Không tìm thấy người dùng nào
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium px-6">
                        {user.fullName}
                      </TableCell>
                      <TableCell className="px-6">
                        {user.roleDisplayNames?.[0] || "Không xác định"}
                      </TableCell>
                      <TableCell className="px-6">
                        {getDepartmentName(user.departmentId)}
                      </TableCell>
                      <TableCell className="px-6">
                        {user.status === 1 ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            Đang hoạt động
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700"
                          >
                            Đã vô hiệu hóa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <Link href={`/nguoi-dung/${user.id}`}>
                          <Button variant="ghost" size="icon">
                            <UserCog className="h-4 w-4" />
                            <span className="sr-only">Xem chi tiết</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Hiển thị</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue>{itemsPerPage}</SelectValue>
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              mục trên mỗi trang
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-sm text-muted-foreground">
              Trang {currentPage + 1} / {Math.max(1, totalPages)}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0 || loading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={
                  currentPage === totalPages - 1 || totalPages === 0 || loading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={
                  currentPage === totalPages - 1 || totalPages === 0 || loading
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      </div>
    </AuthGuard>
  );
}

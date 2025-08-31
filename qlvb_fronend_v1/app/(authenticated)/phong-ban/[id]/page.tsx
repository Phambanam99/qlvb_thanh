"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  PlusIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { departmentsAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DEPARTMENT_MANAGEMENT_ROLES, hasRoleInGroup } from "@/lib/role-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const departmentFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Tên phòng ban phải có ít nhất 3 ký tự" })
    .max(100, { message: "Tên phòng ban không được vượt quá 100 ký tự" }),
  abbreviation: z
    .string()
    .min(2, { message: "Tên viết tắt phải có ít nhất 2 ký tự" })
    .max(20, { message: "Tên viết tắt không được vượt quá 20 ký tự" }),
  email: z
    .string()
    .email({ message: "Email không hợp lệ" })
    .optional()
    .or(z.literal("")),
  codeDepartment: z.string().optional(),
  group: z.string().optional(),
  parentDepartmentId: z.string().optional(),
  storageLocation: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const departmentId = Number.parseInt(id);
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission, user } = useAuth(); // Move all useAuth hooks to top
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [department, setDepartment] = useState<any>(null);
  const [parentDepartments, setParentDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // Calculate permissions early, before any returns
  const userRoles = user?.roles || [];
  const canManageDepartment =
    hasPermission("ROLE_ADMIN") ||
    hasRoleInGroup(userRoles, DEPARTMENT_MANAGEMENT_ROLES);

  // For department heads, they can only manage their own departments
  const canManageUsers =
    canManageDepartment ||
    (user?.departmentId === departmentId &&
      hasRoleInGroup(userRoles, ["ROLE_TRUONG_PHONG", "ROLE_TRUONG_BAN"]));

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      email: "",
      codeDepartment: "",
      group: "",
      parentDepartmentId: "",
      storageLocation: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy thông tin phòng ban
        const departmentData_ = await departmentsAPI.getDepartmentById(
          departmentId
        );
        const departmentData = departmentData_.data || departmentData_;
        console.log('📂 Loaded department data:', departmentData);
        setDepartment(departmentData);

        // Lấy danh sách phòng ban cha
        const departmentsResponse_ = await departmentsAPI.getAllDepartments();
        const departmentsResponse = (departmentsResponse_ as any).data || departmentsResponse_;
        // Lọc bỏ phòng ban hiện tại và các phòng ban con của nó
        const filteredDepartments =
          departmentsResponse.content?.filter(
            (dept: any) =>
              dept.id !== Number(departmentId) &&
              dept.parentDepartmentId !== Number(departmentId)
          ) || [];
        setParentDepartments(filteredDepartments);

        // Cập nhật form với dữ liệu phòng ban
        form.reset({
          name: departmentData.name || "",
          abbreviation: departmentData.abbreviation || "",
          email: departmentData.email || "",
          codeDepartment: departmentData.codeDepartment || "",
          group: departmentData.group || "",
          parentDepartmentId: departmentData.parentDepartmentId
            ? String(departmentData.parentDepartmentId)
            : "none",
          storageLocation: departmentData.storageLocation || "",
        });

        // TODO: Lấy danh sách người dùng thuộc phòng ban
        const users_ = await usersAPI.getUsersByDepartmentId(departmentId);
        const users = (users_ as any).data || users_;
        // Hiện tại đang sử dụng mảng giả định
        setUsers(users);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu phòng ban. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [departmentId, form, toast]);

  const onSubmit = async (data: DepartmentFormValues) => {
    if (!hasPermission("ROLE_ADMIN")) {
      toast({
        title: "Không có quyền",
        description: "Bạn không có quyền chỉnh sửa phòng ban",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const departmentData = {
        name: data.name,
        abbreviation: data.abbreviation,
        email: data.email || undefined,
        codeDepartment: data.codeDepartment || undefined,
        group: data.group || undefined,
        parentDepartmentId:
          data.parentDepartmentId && data.parentDepartmentId !== "none"
            ? Number(data.parentDepartmentId)
            : undefined,
        storageLocation: data.storageLocation || undefined,
      };

      await departmentsAPI.updateDepartment(departmentId, departmentData);

      toast({
        title: "Thành công",
        description: "Đã cập nhật phòng ban thành công",
      });

      // Cập nhật dữ liệu phòng ban
      const updatedDepartment_ = await departmentsAPI.getDepartmentById(
        departmentId
      );
      const updatedDepartment = (updatedDepartment_ as any).data || updatedDepartment_;
      setDepartment(updatedDepartment);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phòng ban. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!hasPermission("ROLE_ADMIN")) {
      toast({
        title: "Không có quyền",
        description: "Bạn không có quyền xóa phòng ban",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);

      await departmentsAPI.deleteDepartment(departmentId);

      toast({
        title: "Thành công",
        description: "Đã xóa phòng ban thành công",
      });

      // Chuyển về trang danh sách phòng ban
      router.push("/phong-ban");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa phòng ban. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="container py-6">
        <div className="mb-6 flex items-center">
          <Link href="/phong-ban" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Không tìm thấy phòng ban</h1>
        </div>
        <p>Phòng ban không tồn tại hoặc đã bị xóa.</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/phong-ban" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{department.name}</h1>
            <div className="text-muted-foreground">
              <Badge variant="outline" className="mt-1">
                {department.abbreviation}
              </Badge>
            </div>
          </div>
        </div>

        {canManageDepartment && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa phòng ban
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa phòng ban</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa phòng ban "{department.name}"? Hành
                  động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteDepartment}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xóa...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Xóa phòng ban
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Thông tin chung</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
          <TabsTrigger value="documents">công văn</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin phòng ban</CardTitle>
                  <CardDescription>
                    Chỉnh sửa thông tin chi tiết cho phòng ban
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên phòng ban</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập tên phòng ban"
                              {...field}
                              disabled={!canManageDepartment}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="abbreviation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên viết tắt</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập tên viết tắt"
                              {...field}
                              disabled={!canManageDepartment}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập email phòng ban"
                            {...field}
                            disabled={!canManageDepartment}
                          />
                        </FormControl>
                        <FormDescription>
                          Email liên hệ của phòng ban
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="codeDepartment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mã đơn vị</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập mã đơn vị"
                              {...field}
                              disabled={!canManageDepartment}
                            />
                          </FormControl>
                          <FormDescription>
                            Mã định danh duy nhất cho đơn vị
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="group"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nhóm</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập nhóm phòng ban"
                              {...field}
                              disabled={!canManageDepartment}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="parentDepartmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phòng ban cấp trên</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!canManageDepartment}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phòng ban cấp trên" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Không có</SelectItem>
                            {parentDepartments.map((dept) => (
                              <SelectItem key={dept.id} value={String(dept.id)}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Phòng ban cấp trên trực tiếp
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storageLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vị trí lưu trữ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập vị trí lưu trữ"
                            {...field}
                            disabled={!canManageDepartment}
                          />
                        </FormControl>
                        <FormDescription>
                          Vị trí lưu trữ vật lý của tài liệu phòng ban
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                {canManageDepartment && (
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/phong-ban")}
                      disabled={isSubmitting}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Người dùng trong phòng ban</CardTitle>
                <CardDescription>
                  Danh sách người dùng thuộc phòng ban này
                </CardDescription>
              </div>

              {canManageUsers && (
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/nguoi-dung/them-moi?departmentId=${departmentId}`
                    )
                  }
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Thêm người dùng
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground">
                  Không có người dùng nào trong phòng ban này.
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>Tài khoản</TableHead>
                        <TableHead>Chức vụ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.fullName}
                          </TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>
                            {user.roleDisplayNames.join(", ")}
                          </TableCell>
                          <TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>công văn liên quan</CardTitle>
              <CardDescription>
                Danh sách công văn liên quan đến phòng ban này
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

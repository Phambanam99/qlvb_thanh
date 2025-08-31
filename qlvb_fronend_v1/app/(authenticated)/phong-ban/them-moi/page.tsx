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
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { departmentsAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { DEPARTMENT_MANAGEMENT_ROLES, hasRoleInGroup } from "@/lib/role-utils";

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
  type: z.string({
    required_error: "Vui lòng chọn loại phòng ban",
  }),
  group: z.string().optional(),
  parentDepartmentId: z.string().optional(),
  storageLocation: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

export default function AddDepartmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departmentTypes, setDepartmentTypes] = useState<any[]>([]);
  const [parentDepartments, setParentDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      email: "",
      type: "",
      group: "",
      parentDepartmentId: "",
      storageLocation: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Lấy danh sách loại phòng ban
        const types_ = await departmentsAPI.getDepartmentTypes();
        const types = types_.data;
        setDepartmentTypes(types || []);

        // Lấy danh sách phòng ban cha
        const departmentsResponse_ = await departmentsAPI.getAllDepartments();
        const departmentsResponse = departmentsResponse_.data;
        setParentDepartments(departmentsResponse.content || []);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const onSubmit = async (data: DepartmentFormValues) => {
    if (
      !hasPermission("ROLE_ADMIN") &&
      !hasRoleInGroup(DEPARTMENT_MANAGEMENT_ROLES)
    ) {
      toast({
        title: "Không có quyền",
        description: "Bạn không có quyền thêm phòng ban mới",
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
        type: data.type as any,
        group: data.group || undefined,
        parentDepartmentId:
          data.parentDepartmentId && data.parentDepartmentId !== "none"
            ? Number(data.parentDepartmentId)
            : undefined,
        storageLocation: data.storageLocation || undefined,
      };

      await departmentsAPI.createDepartment(departmentData);

      toast({
        title: "Thành công",
        description: "Đã tạo phòng ban mới thành công",
      });

      // Chuyển về trang danh sách phòng ban
      router.push("/phong-ban");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo phòng ban mới. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Link href="/phong-ban" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Thêm phòng ban mới</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phòng ban</CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết cho phòng ban mới
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
                        <Input placeholder="Nhập tên phòng ban" {...field} />
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
                        <Input placeholder="Nhập tên viết tắt" {...field} />
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
                        placeholder="Nhập email phòng ban (không bắt buộc)"
                        {...field}
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại phòng ban</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại phòng ban" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departmentTypes.map((type) => (
                            <SelectItem key={type.code} value={type.code}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder="Nhập nhóm phòng ban (không bắt buộc)"
                          {...field}
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn phòng ban cấp trên (không bắt buộc)" />
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
                        placeholder="Nhập vị trí lưu trữ (không bắt buộc)"
                        {...field}
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
                    Lưu phòng ban
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

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
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { rolesAPI } from "@/lib/api/roles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { use } from "react";
const roleFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Tên vai trò phải có ít nhất 3 ký tự" })
    .max(50, { message: "Tên vai trò không được vượt quá 50 ký tự" })
    .regex(/^[A-Z0-9_]+$/, {
      message: "Tên vai trò chỉ được chứa chữ cái in hoa, số và dấu gạch dưới",
    }),
  displayName: z
    .string()
    .min(3, { message: "Tên hiển thị phải có ít nhất 3 ký tự" })
    .max(100, { message: "Tên hiển thị không được vượt quá 100 ký tự" }),
  description: z
    .string()
    .min(10, { message: "Mô tả phải có ít nhất 10 ký tự" })
    .max(500, { message: "Mô tả không được vượt quá 500 ký tự" }),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

export default function RoleDetailPage({ params }: { params: { id: string } }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const roleId = Number.parseInt(id);
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchRoleData = async () => {
      try {
        setLoading(true);
        const roleData_ = await rolesAPI.getRoleById(roleId);
        const roleData = roleData_.data;
        setRole(roleData);

        // Cập nhật form với dữ liệu vai trò
        form.reset({
          name: roleData.name || "",
          displayName: roleData.displayName || "",
          description: roleData.description || "",
        });
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

    fetchRoleData();
  }, [roleId, form]);

  const onSubmit = async (data: RoleFormValues) => {
    try {
      setIsSubmitting(true);

      // Thêm tiền tố ROLE_ nếu chưa có
      if (!data.name.startsWith("ROLE_")) {
        data.name = `ROLE_${data.name}`;
      }

      await rolesAPI.updateRole(roleId, {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      });
     
      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò thành công",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật vai trò. Vui lòng thử lại sau.",
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

  if (!role) {
    return (
      <div className="container py-6">
        <div className="mb-6 flex items-center">
          <Link href="/vai-tro" className="mr-4">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Không tìm thấy vai trò</h1>
        </div>
        <p>Vai trò không tồn tại hoặc đã bị xóa.</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Link href="/vai-tro" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Chi tiết vai trò</h1>
          <p className="text-muted-foreground">
            {role.isSystem && (
              <Badge variant="secondary" className="mt-1">
                Vai trò hệ thống
              </Badge>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Thông tin chung</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin vai trò</CardTitle>
                  <CardDescription>
                    Chỉnh sửa thông tin chi tiết cho vai trò
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên vai trò</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tên vai trò (ví dụ: ADMIN, MANAGER)"
                            {...field}
                            disabled={role.isSystem}
                          />
                        </FormControl>
                        <FormDescription>
                          Tên vai trò sẽ được thêm tiền tố ROLE_ nếu chưa có
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên hiển thị</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tên hiển thị (ví dụ: Quản trị viên)"
                            {...field}
                            disabled={role.isSystem}
                          />
                        </FormControl>
                        <FormDescription>
                          Tên hiển thị sẽ được hiển thị trong giao diện người
                          dùng
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả chi tiết về vai trò này"
                            className="min-h-[100px]"
                            {...field}
                            disabled={role.isSystem}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/vai-tro")}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || role.isSystem}
                  >
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
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Người dùng có vai trò này</CardTitle>
              <CardDescription>
                Danh sách người dùng được gán vai trò này
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

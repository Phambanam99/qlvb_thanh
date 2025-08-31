"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { rolesAPI } from "@/lib/api/roles";

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

export default function AddRolePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
    },
  });

  const onSubmit = async (data: RoleFormValues) => {
    try {
      setIsSubmitting(true);

      // Thêm tiền tố ROLE_ nếu chưa có
      if (!data.name.startsWith("ROLE_")) {
        data.name = `ROLE_${data.name}`;
      }

      await rolesAPI.createRole({
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      });

      toast({
        title: "Thành công",
        description: "Đã tạo vai trò mới thành công",
      });

      // Chuyển về trang danh sách vai trò
      router.push("/vai-tro");
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo vai trò mới. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Link href="/vai-tro" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Thêm vai trò mới</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin vai trò</CardTitle>
              <CardDescription>
                Nhập thông tin chi tiết cho vai trò mới
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
                      />
                    </FormControl>
                    <FormDescription>
                      Tên hiển thị sẽ được hiển thị trong giao diện người dùng
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
                    Lưu vai trò
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

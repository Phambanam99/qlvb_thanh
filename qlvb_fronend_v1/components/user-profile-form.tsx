"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Save } from "lucide-react";
import { rolesAPI, type RoleDTO } from "@/lib/api/roles";

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Họ tên phải có ít nhất 2 ký tự",
  }),
  username: z.string().min(2, {
    message: "Tên đăng nhập phải có ít nhất 2 ký tự",
  }),
  email: z.string().optional().refine((val) => {
    if (!val || val === "") return true; // Allow empty
    return z.string().email().safeParse(val).success;
  }, {
    message: "Email không hợp lệ",
  }),
  phone: z.string().optional(),
  position: z.string().optional(),
  roles: z.array(
    z.string({
      required_error: "Vui lòng chọn vai trò",
    })
  ).min(1, "Vui lòng chọn ít nhất một vai trò"),
  departmentId: z.string({
    required_error: "Vui lòng chọn phòng ban",
  }).min(1, "Vui lòng chọn phòng ban"),
  isActive: z.boolean({
    required_error: "Vui lòng chọn trạng thái tài khoản",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  user: any;
  roles: any[];
  departments: any[];
  onSubmit: (data: ProfileFormValues) => void;
  saving: boolean;
  isProfileEdit?: boolean; // Add flag to indicate if this is for profile editing
}

export default function UserProfileForm({
  user,
  roles,
  departments,
  onSubmit,
  saving,
  isProfileEdit = false,
}: UserProfileFormProps) {
  const [loadingRoles, setLoadingRoles] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      phone: "",
      position: "",
      roles: [],
      departmentId: "",
      isActive: true,
    },
  });

  // Handle role change
  const handleRoleChange = (value: string) => {
    if (value && value.trim() !== "") {
      form.setValue("roles", [value]);
    }
  };

  // Reset form when user data changes
  useEffect(() => {
    console.log("UserProfileForm - user data changed:", user);
    if (user && user.id) { // Make sure user is fully loaded
      // Handle current role - check multiple sources
      let currentRole = "";
      if (user.roles && user.roles.length > 0) {
        currentRole = user.roles[0].name || user.roles[0];
      } else if (user.roleId && roles.length > 0) {
        // Find role by roleId if roles array is available
        const roleObj = roles.find(r => r.id === user.roleId);
        if (roleObj) {
          currentRole = roleObj.name;
        }
      }
      
      const formData = {
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        position: user.roleDisplayNames?.[0] || "",
        roles: currentRole ? [currentRole] : [],
        departmentId: user.departmentId?.toString() || "",
        isActive: user.status === 1 || user.isActive === true,
      };
      
      console.log("UserProfileForm - resetting form with:", formData);
      form.reset(formData);
    }
  }, [user, roles, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên</FormLabel>
                <FormControl>
                  <Input placeholder="Nhập họ và tên" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email <span className="text-muted-foreground">(không bắt buộc)</span></FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="example@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại <span className="text-muted-foreground">(không bắt buộc)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Nhập số điện thoại" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chức vụ</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingRoles ? "Đang tải..." : "Chọn chức vụ"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingRoles ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tải danh sách chức vụ...
                        </div>
                      </SelectItem>
                    ) : !Array.isArray(roles) || roles.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Không có chức vụ nào
                      </SelectItem>
                    ) : (
                      roles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.displayName || role.name || ""}
                        >
                          {role.displayName || role.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          /> */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên đăng nhập</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nhập tên đăng nhập" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isProfileEdit && (
            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vai trò</FormLabel>
                  <Select
                    onValueChange={handleRoleChange}
                    value={field.value?.[0] || ""}
                    defaultValue={field.value?.[0] || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vai trò" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(roles) && roles.length > 0 ? (
                        roles.map((role) => (
                          <SelectItem
                            key={role.id}
                            value={role.name || `role-${role.id}`}
                          >
                            {role.displayName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-roles" disabled>
                          Không có vai trò nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!isProfileEdit && (
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phòng ban</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                    defaultValue={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phòng ban" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(departments) && departments.length > 0 ? (
                        departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id.toString()}
                          >
                            {department.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-departments" disabled>
                          Không có phòng ban nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {!isProfileEdit && (
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái tài khoản</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "true")} 
                    value={field.value ? "true" : "false"}
                    defaultValue={field.value ? "true" : "false"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          Đang hoạt động
                        </span>
                      </SelectItem>
                      <SelectItem value="false">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500"></span>
                          Vô hiệu hóa
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
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
        </div>
      </form>
    </Form>
  );
}

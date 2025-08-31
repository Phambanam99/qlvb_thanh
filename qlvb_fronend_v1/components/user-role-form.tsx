"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useEffect } from "react";

const roleFormSchema = z.object({
  roles: z.array(
    z.string({
      required_error: "Vui lòng chọn vai trò",
    })
  ).min(1, "Vui lòng chọn ít nhất một vai trò"),
  departmentId: z.string({
    required_error: "Vui lòng chọn phòng ban",
  }).min(1, "Vui lòng chọn phòng ban"),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface UserRoleFormProps {
  user: any;
  roles: any[];
  departments: any[];
  onSubmit: (data: RoleFormValues) => void;
  saving: boolean;
}

export default function UserRoleForm({
  user,
  roles,
  departments,
  onSubmit,
  saving,
}: UserRoleFormProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      roles: user.roles?.length
        ? [user.roles[0].name || user.roles[0]]
        : [],
      departmentId: user.departmentId?.toString() || "",
    },
  });

  // Update roles when form value changes
  const handleRoleChange = (value: string) => {
    if (value && value.trim() !== "") {
      form.setValue("roles", [value]);
    }
  };

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      const currentRole = user.roles?.length 
        ? (user.roles[0].name || user.roles[0])
        : "";
      
      form.reset({
        roles: currentRole ? [currentRole] : [],
        departmentId: user.departmentId?.toString() || "",
      });
    }
  }, [user, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
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
                    {roles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.name || `role-${role.id}`}
                      >
                        {role.displayName}
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
                <FormMessage />
              </FormItem>
            )}
          />
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  ArrowLeft,
  UserCog,
  Key,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { usersAPI } from "@/lib/api/users";
import { rolesAPI } from "@/lib/api/roles";
import { departmentsAPI } from "@/lib/api/departments";
import UserProfileForm from "@/components/user-profile-form";
import UserPasswordForm from "@/components/user-password-form";
import { cp } from "fs";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData_, rolesData_, departmentsData_] = await Promise.all([
          usersAPI.getUserById(userId),
          rolesAPI.getAllRoles(),
          departmentsAPI.getAllDepartments(),
        ]);
        const userData = (userData_ as any).data || userData_; // Handle wrapped response
        const rolesData = (rolesData_ as any).data || rolesData_; // Handle wrapped response  
        const departmentsData = departmentsData_;
        console.log("Fetched user data:", userData);
        console.log("Fetched roles data:", rolesData);
        console.log("Fetched departments response:", departmentsData);
        
        // Handle departments data structure  
        let finalDepartments: any[] = [];
        if (departmentsData?.data?.content) {
          finalDepartments = departmentsData.data.content;
        } else if (Array.isArray(departmentsData)) {
          finalDepartments = departmentsData;
        }
        
        console.log("Final departments:", finalDepartments);
        
        setUser(userData);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setDepartments(finalDepartments);
      } catch (error) {
        setRoles([]);
        setDepartments([]);
        toast({
          title: "Lỗi",
          description:
            "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleUpdateProfile = async (data: any) => {
    try {
      setSaving(true);
      console.log("Updating user profile with data:", data);
      
      const updateData = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        username: data.username,
        roles: data.roles,
        departmentId: data.departmentId,
        userStatus: data.isActive ? "ACTIVE" : "INACTIVE",
      };
      
      console.log("Update data prepared:", updateData);
      const updatedUser_ = await usersAPI.updateUser(userId, updateData);
      const updatedUser = (updatedUser_ as any).data || updatedUser_; // Handle wrapped response
      setUser(updatedUser);
      toast({ 
        title: "Thành công",
        description: "Thông tin người dùng đã được cập nhật",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          "Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (data: any) => {
    try {
      setSaving(true);
      await usersAPI.resetPassword(userId, data.newPassword);
      toast({
        title: "Thành công",
        description: "Mật khẩu đã được đặt lại",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-2">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h2 className="text-xl font-semibold">Không tìm thấy người dùng</h2>
        <p className="text-muted-foreground">
          Người dùng không tồn tại hoặc đã bị xóa
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Chi tiết người dùng</h1>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <UserCog className="h-4 w-4" />
            Thông tin cá nhân
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-1">
            <Key className="h-4 w-4" />
            Đặt lại mật khẩu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân & Quản lý tài khoản</CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân, vai trò, phòng ban và trạng thái tài khoản của người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfileForm
                user={user}
                roles={roles}
                departments={departments}
                onSubmit={handleUpdateProfile}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Đặt lại mật khẩu</CardTitle>
              <CardDescription>Đặt lại mật khẩu cho người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <UserPasswordForm
                onSubmit={handleChangePassword}
                saving={saving}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

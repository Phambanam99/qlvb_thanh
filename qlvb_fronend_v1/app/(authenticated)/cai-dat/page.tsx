"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { Loader2, Save } from "lucide-react";
import { settingsAPI } from "@/lib/api/settings";

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    general: {
      systemName: "",
      organizationName: "",
      adminEmail: "",
      systemDescription: "",
      documentPrefix: "",
      documentCounter: 1,
    },
    notifications: {
      incomingDocuments: true,
      approvals: true,
      schedules: true,
      emailEnabled: false,
      emailServer: "",
      emailPort: "",
      emailSecurity: "tls",
      emailUsername: "",
      emailPassword: "",
    },
    security: {
      passwordMinLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      lockAccountAfterFailures: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
  });

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response_ = await settingsAPI.getSettings();
        const response = response_.data;
        setSettings(response);
      } catch (error) {

        addNotification({
          title: "Lỗi",
          message: "Không thể tải cài đặt hệ thống",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Lấy dữ liệu từ form
      const formData = new FormData(e.target as HTMLFormElement);
      const updatedSettings = {
        systemName: formData.get("system-name") as string,
        organizationName: formData.get("organization-name") as string,
        adminEmail: formData.get("admin-email") as string,
        systemDescription: formData.get("system-description") as string,
        documentPrefix: formData.get("document-prefix") as string,
        documentCounter: Number.parseInt(
          formData.get("document-counter") as string
        ),
      };

      // Gọi API để cập nhật cài đặt
      await settingsAPI.updateGeneralSettings(updatedSettings);

      // Cập nhật state
      setSettings((prev) => ({
        ...prev,
        general: updatedSettings,
      }));

      // Thêm thông báo
      addNotification({
        title: "Cài đặt đã được lưu",
        message: "Các cài đặt chung đã được cập nhật thành công.",
        type: "success",
      });
    } catch (error) {
      addNotification({
        title: "Lỗi",
        message: "Không thể lưu cài đặt. Vui lòng thử lại sau.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Lấy dữ liệu từ form
      const formData = new FormData(e.target as HTMLFormElement);
      const updatedSettings = {
        incomingDocuments: formData.get("notify-incoming") === "on",
        approvals: formData.get("notify-approval") === "on",
        schedules: formData.get("notify-schedule") === "on",
        emailEnabled: formData.get("email-enabled") === "on",
        emailServer: formData.get("email-server") as string,
        emailPort: formData.get("email-port") as string,
        emailSecurity: formData.get("email-security") as string,
        emailUsername: formData.get("email-username") as string,
        emailPassword: formData.get("email-password") as string,
      };

      // Gọi API để cập nhật cài đặt
      await settingsAPI.updateNotificationSettings(updatedSettings);

      // Cập nhật state
      setSettings((prev) => ({
        ...prev,
        notifications: updatedSettings,
      }));

      // Thêm thông báo
      addNotification({
        title: "Cài đặt thông báo đã được lưu",
        message: "Các cài đặt thông báo đã được cập nhật thành công.",
        type: "success",
      });
    } catch (error) {
      addNotification({
        title: "Lỗi",
        message: "Không thể lưu cài đặt thông báo. Vui lòng thử lại sau.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSecuritySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Lấy dữ liệu từ form
      const formData = new FormData(e.target as HTMLFormElement);
      const updatedSettings = {
        passwordMinLength: Number.parseInt(
          formData.get("password-min-length") as string
        ),
        requireUppercase: formData.get("require-uppercase") === "on",
        requireNumbers: formData.get("require-numbers") === "on",
        requireSpecialChars: formData.get("require-special") === "on",
        lockAccountAfterFailures: formData.get("lock-account") === "on",
        twoFactorAuth: formData.get("two-factor") === "on",
        sessionTimeout: Number.parseInt(
          formData.get("session-timeout") as string
        ),
      };

      // Gọi API để cập nhật cài đặt
      await settingsAPI.updateSecuritySettings(updatedSettings);

      // Cập nhật state
      setSettings((prev) => ({
        ...prev,
        security: updatedSettings,
      }));

      // Thêm thông báo
      addNotification({
        title: "Cài đặt bảo mật đã được lưu",
        message: "Các cài đặt bảo mật đã được cập nhật thành công.",
        type: "success",
      });
    } catch (error) {
      addNotification({
        title: "Lỗi",
        message: "Không thể lưu cài đặt bảo mật. Vui lòng thử lại sau.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kiểm tra quyền hạn
  const canManageSettings = hasPermission("manage_settings");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-primary">Cài đặt hệ thống</h1>
          <p className="text-muted-foreground">
            Quản lý các cài đặt của hệ thống
          </p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Đang tải cài đặt...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-primary">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground">
          Quản lý các cài đặt của hệ thống
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Cài đặt chung</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="appearance">Giao diện</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <form onSubmit={handleSaveGeneralSettings}>
              <CardHeader>
                <CardTitle>Cài đặt chung</CardTitle>
                <CardDescription>
                  Quản lý các cài đặt chung của hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="system-name">Tên hệ thống</Label>
                  <Input
                    id="system-name"
                    name="system-name"
                    defaultValue={settings.general.systemName}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization-name">Tên đơn vị</Label>
                  <Input
                    id="organization-name"
                    name="organization-name"
                    defaultValue={settings.general.organizationName}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email quản trị</Label>
                  <Input
                    id="admin-email"
                    name="admin-email"
                    type="email"
                    defaultValue={settings.general.adminEmail}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-description">Mô tả hệ thống</Label>
                  <Textarea
                    id="system-description"
                    name="system-description"
                    defaultValue={settings.general.systemDescription}
                    disabled={!canManageSettings}
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="document-prefix">Tiền tố số công văn đi</Label>
                  <Input
                    id="document-prefix"
                    name="document-prefix"
                    defaultValue={settings.general.documentPrefix}
                    disabled={!canManageSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-counter">Bộ đếm công văn đi</Label>
                  <Input
                    id="document-counter"
                    name="document-counter"
                    type="number"
                    defaultValue={settings.general.documentCounter}
                    disabled={!canManageSettings}
                  />
                </div>
              </CardContent>
              {canManageSettings && (
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang
                        lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Lưu cài đặt
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </form>
          </Card>
        </TabsContent>

        {/* Các tab khác giữ nguyên */}
      </Tabs>
    </div>
  );
}

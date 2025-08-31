"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Send,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Building,
  Briefcase,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import {
  DEPARTMENT_MANAGEMENT_ROLES,
  SYSTEM_ROLES,
  hasRoleInGroup,
} from "@/lib/role-utils";

export function MainSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  // Check if user is in system admin roles
  const isSystemAdmin = user?.roles && hasRoleInGroup(user.roles, SYSTEM_ROLES);

  // Check if user is in a department management role
  const canManageDepartment =
    user?.roles && hasRoleInGroup(user.roles, DEPARTMENT_MANAGEMENT_ROLES);

  return (
    <Sidebar>
      <SidebarHeader className="pb-0">
        <div className="flex items-center px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="ml-2">
            <h3 className="text-lg font-semibold">Quản lý văn bản</h3>
            <p className="text-xs text-muted-foreground">
              Hệ thống quản lý văn bản
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Trang chủ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/van-ban-den")}>
                  <Link href="/van-ban-den">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Văn bản đến</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/van-ban-di")}>
                  <Link href="/van-ban-di">
                    <Send className="mr-2 h-4 w-4" />
                    <span>Văn bản đi</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/lich-cong-tac")}
                >
                  <Link href="/lich-cong-tac">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Lịch công tác</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/ke-hoach")}>
                  <Link href="/ke-hoach">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Kế hoạch</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(user?.roles.includes("admin") || user?.roles.includes("manager")) && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản trị</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/nguoi-dung")}>
                    <Link href="/nguoi-dung">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Người dùng</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/phong-ban")}>
                    <Link href="/phong-ban">
                      <Building className="mr-2 h-4 w-4" />
                      <span>Phòng ban</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/thong-ke")}>
                    <Link href="/thong-ke">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Thống kê</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/cai-dat")}>
                    <Link href="/cai-dat">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {canManageDepartment && (
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý phòng ban</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/quan-ly-phong-ban")}
                  >
                    <Link href="/quan-ly-phong-ban">
                      <Building className="mr-2 h-4 w-4" />
                      <span>Danh sách phòng ban</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/them-phong-ban")}
                  >
                    <Link href="/them-phong-ban">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Thêm phòng ban</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Send,
  ClipboardList,
  Calendar,
  Users,
  Settings,
  Menu,
  X,
  Building,
  UserCheck,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { hasPermission } = useAuth();

  // Định nghĩa các mục menu với quyền hạn tương ứng
  const navItems = [
    {
      title: "Văn bản đến",
      href: "/van-ban-den",
      icon: FileText,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "Văn bản đi",
      href: "/van-ban-di",
      icon: Send,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "Kế hoạch công tác",
      href: "/ke-hoach",
      icon: ClipboardList,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "Lịch công tác",
      href: "/lich-cong-tac",
      icon: Calendar,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "Tiện ích",
      href: "/tien-ich",
      icon: Wrench,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "Quản lý người dùng",
      href: "/nguoi-dung",
      icon: Users,
      permission: "manage_users", // Tất cả các vai trò có quyền manage_users
    },
    {
      title: "Quản lý vai trò",
      href: "/vai-tro",
      icon: UserCheck,
      permission: "ROLE_ADMIN", // Chỉ admin mới có thể xem
    },
    {
      title: "Quản lý phòng ban",
      href: "/phong-ban",
      icon: Building,
      permission: "ROLE_ADMIN", // Chỉ admin mới có thể xem
    },
    {
      title: "Cài đặt",
      href: "/cai-dat",
      icon: Settings,
      permission: "ROLE_ADMIN", // Chỉ admin mới có thể xem
    },
  ];

  // Lọc các mục menu dựa trên quyền hạn
  const filteredNavItems = navItems.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden shadow-sm bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-accent/50 shadow-md border-r transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <nav className="flex-1 overflow-auto py-6 px-4">
            <div className="space-y-1.5">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all hover:bg-primary/10 hover:text-primary",
                    pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              ))}
            </div>
          </nav>
          <div className="border-t p-4">
            <div className="rounded-md bg-primary/10 p-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                  ?
                </div>
                <div>
                  <p className="font-medium text-primary">Cần trợ giúp?</p>
                  <p className="text-xs text-muted-foreground">
                    Xem hướng dẫn sử dụng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

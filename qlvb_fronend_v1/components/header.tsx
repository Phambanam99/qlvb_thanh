"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  User,
  FileText,
  Send,
  ClipboardList,
  Calendar,
  Users,
  Settings,
  Building,
  Building2,
  UserCheck,
  Menu,
  ChevronDown,
  HelpCircle,
  Database,
  FileType,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationsDropdown from "@/components/notifications-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

export const Header = () => {
  const { user, logout, hasPermission } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDataLibraryOpen, setIsDataLibraryOpen] = useState(false);

  // Định nghĩa các tab module ở header (theo thiết kế)
  const moduleNavItems = [
    {
      title: "Quản lý công văn",
      href: "/van-ban-den",
      icon: FileText,
      permission: null,
    },
    {
      title: "Quản lý tổ chức biên chế",
      href: "/phong-ban",
      icon: Building,
      permission: null,
    },
    {
      title: "Quản lý vũ khí - TBKT",
      href: "/vu-khi-trang-bi",
      icon: Wrench,
      permission: null,
    },
    {
      title: "Quản lý dữ liệu",
      href: "/nguoi-dung",
      icon: Database,
      permission: null,
    },
  ];

  // Định nghĩa các mục menu chính (submenu cho Quản lý công văn)
  const mainNavItems = [
    {
      title: "công văn đến",
      href: "/van-ban-den",
      icon: FileText,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "công văn đi",
      href: "/van-ban-di",
      icon: Send,
      permission: null, // Tất cả người dùng đều có thể xem
    },
    {
      title: "công văn chung",
      href: "/cong-van-chung",
      icon: ClipboardList,
      permission: null,
    }
  ];

  // Định nghĩa các mục trong Thư viện dữ liệu
  const dataLibraryItems = [
    {
      title: "Người dùng",
      href: "/nguoi-dung",
      icon: Users,
      permission: "ROLE_ADMIN",
    },
    {
      title: "Vai trò",
      href: "/vai-tro",
      icon: UserCheck,
      permission: "ROLE_ADMIN",
    },
    {
      title: "Phòng ban",
      href: "/phong-ban",
      icon: Building,
      permission: "ROLE_ADMIN",
    },
    {
      title: "Loại công văn",
      href: "/loai-van-ban",
      icon: FileType,
      permission: "ROLE_ADMIN",
    },
    {
      title: "Đơn vị ngoài",
      href: "/don-vi-ngoai",
      icon: Building2,
      permission: "ROLE_ADMIN",
    },
    {
      title: "Quản lý hướng dẫn",
      href: "/admin/guide-files",
      icon: HelpCircle,
      permission: "ROLE_ADMIN",
    },{
      title: "Quản lý vũ khí trang bị",
      href: "/vu-khi-trang-bi",
      icon: HelpCircle,
      permission: "ROLE_ADMIN",
    },
  ];

  // Lọc các mục menu dựa trên quyền hạn
  const filteredModuleNavItems = moduleNavItems.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );
  const filteredMainNavItems = mainNavItems.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  const filteredDataLibraryItems = dataLibraryItems.filter(
    (item) => item.permission === null || hasPermission(item.permission)
  );

  // Kiểm tra xem có quyền truy cập Thư viện dữ liệu không
  const hasDataLibraryAccess = filteredDataLibraryItems.length > 0;

  // Kiểm tra xem có tab nào trong thư viện dữ liệu đang active không
  const isDataLibraryActive = dataLibraryItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <div className="mr-6">
          <Link href="/van-ban-den" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-primary hidden md:block">
              Quản lý công văn
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center space-x-1 flex-1">
          {/* Module tabs */}
          {filteredModuleNavItems.map((item) => {
            const isDocsGroup = item.title === "Quản lý công văn";
            const isActiveBase = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isDocsActive = pathname.startsWith("/van-ban-den") || pathname.startsWith("/van-ban-di") || pathname.startsWith("/cong-van-chung");
            const isActive = isDocsGroup ? isDocsActive : isActiveBase;

            if (isDocsGroup) {
              return (
                <DropdownMenu key={item.href}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/van-ban-den" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Công văn đến
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/van-ban-di" className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Công văn đi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cong-van-chung" className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> Công văn chung
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}

          {/* Data Library Dropdown */}
          {hasDataLibraryAccess && (
            <DropdownMenu
              open={isDataLibraryOpen}
              onOpenChange={setIsDataLibraryOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    isDataLibraryActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Database className="h-4 w-4" />
                  Thư viện dữ liệu
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Quản lý dữ liệu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filteredDataLibraryItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 w-full",
                          isActive && "bg-accent"
                        )}
                        onClick={() => setIsDataLibraryOpen(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="xl:hidden flex-1">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Menu className="h-4 w-4" />
                <span>Menu</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Chức năng</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Module tabs (mobile) */}
              {filteredModuleNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn("flex items-center gap-2 w-full", isActive && "bg-accent")}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />

              {/* Main navigation items for mobile */}
              {filteredMainNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                
                // Only internal app links are used on mobile
                
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 w-full",
                        isActive && "bg-accent"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                );
              })}

              {/* Data Library items for mobile */}
              {hasDataLibraryAccess && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Thư viện dữ liệu</DropdownMenuLabel>
                  {filteredDataLibraryItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 w-full",
                            isActive && "bg-accent"
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <NotificationsDropdown />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover:bg-primary/10"
              >
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarImage
                    src="/placeholder.svg?height=36&width=36"
                    alt="Avatar"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.fullName ? user.fullName.charAt(0) : "??"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.fullName || "Người dùng"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "email@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/huong-dan-su-dung" className="flex items-center">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Hướng dẫn sử dụng</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className="flex items-center cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

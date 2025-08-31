"use client";

import type React from "react";

import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/header";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationsProvider } from "@/lib/notifications-context";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, dataLoading, setDataLoaded, user } =
    useAuth();
  const router = useRouter();
  const [renderContent, setRenderContent] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/dang-nhap");
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated && !loading && !dataLoading) {
      setRenderContent(true);
    } else {
      setRenderContent(false);
    }
  }, [isAuthenticated, loading, dataLoading]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    if (isAuthenticated && user && dataLoading) {
      try {
        timeoutId = setTimeout(() => {
          setDataLoaded();
        }, 1000); 
      } catch (error) {
       
        setDataLoaded();
      }
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, dataLoading, setDataLoaded, user]);

  if (loading || dataLoading || !renderContent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Đang xác thực..."
              : dataLoading
              ? "Đang tải dữ liệu..."
              : "Đang chuẩn bị hiển thị..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <NotificationsProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </NotificationsProvider>
  );
}

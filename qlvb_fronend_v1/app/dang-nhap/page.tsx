"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, InfoIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ErrorMessage } from "@/components/ui/error-message";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { login } = useAuth();
  const { toast } = useToast();

  // Kiểm tra xem người dùng có đến từ phiên hết hạn không
  useEffect(() => {
    const hasExpired = searchParams.get("session_expired") === "true";
    if (hasExpired) {
      setSessionExpired(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Đăng nhập và đợi cho đến khi hoàn tất
      const loginResult = await login(username, password, rememberMe);
      
      // console.log("loginResult", loginResult);

      if (loginResult === true) {
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
        });

        // Đợi một chút để đảm bảo token được lưu trữ đúng cách
        // và các state trong AuthContext được cập nhật
        setTimeout(() => {
          // console.log("🚀 Đang chuyển hướng sau khi đăng nhập thành công...");
          router.push(callbackUrl);
        }, 100);
      } else {
        // Xử lý trường hợp loginResult không phải true (có thể undefined hoặc false)
        setError(
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập."
        );
      }
    } catch (error: any) {
      // console.error("Login error:", error);
      setError(
        error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
        <CardDescription className="text-center">
          Nhập thông tin đăng nhập của bạn để truy cập hệ thống
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessionExpired && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Phiên của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.
            </AlertDescription>
          </Alert>
        )}
        <ErrorMessage message={error} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input
              id="username"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked === true)
                }
              />
              <Label htmlFor="remember" className="text-sm cursor-pointer">
                Ghi nhớ đăng nhập
              </Label>
            </div>
            <Button variant="link" className="p-0 h-auto text-sm" asChild>
              <a href="/quen-mat-khau">Quên mật khẩu?</a>
            </Button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng
                nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-muted-foreground">
          Đã chưa có tài khoản?{" "}
          <Link href="/dang-ky" className="text-primary font-medium">
            Đăng ký ngay
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

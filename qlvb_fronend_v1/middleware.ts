import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  // const token = request.cookies.get("auth-token")?.value
  const token = request.cookies.get("auth-token")?.value;
  // Đường dẫn hiện tại
  const { pathname } = request.nextUrl;

  // Danh sách các đường dẫn công khai (không cần xác thực)
  const publicPaths = ["/dang-nhap", "/quen-mat-khau", "/dang-ky"];

  // Kiểm tra nếu đường dẫn là API hoặc các tài nguyên tĩnh
  const isApiOrStaticPath =
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".");

  // Nếu đường dẫn là công khai hoặc API/tài nguyên tĩnh, cho phép truy cập
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    isApiOrStaticPath
  ) {
    return NextResponse.next();
  }

  // Nếu không có token và không phải đường dẫn công khai, chuyển hướng đến trang đăng nhập
  if (!token) {
    const url = new URL("/dang-nhap", request.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Nếu có token, cho phép truy cập
  return NextResponse.next();
}

// Cấu hình middleware chỉ chạy trên các đường dẫn cụ thể
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes
     * 2. /_next/static (static files)
     * 3. /_next/image (image optimization files)
     * 4. /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

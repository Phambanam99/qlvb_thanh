import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function AccessDeniedPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-6">
        <ShieldAlert className="h-12 w-12 text-red-600" />
      </div>
      <h1 className="mb-2 text-3xl font-bold">Không có quyền truy cập</h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên nếu bạn cho rằng đây là một lỗi.
      </p>
      <div className="flex space-x-4">
        <Button asChild>
          <Link href="/">Quay lại trang chủ</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dang-nhap">Đăng nhập lại</Link>
        </Button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UserStatusFormProps {
  user: any
  onSubmit: (data: { userStatus: string }) => void
  saving: boolean
}

export default function UserStatusForm({ user, onSubmit, saving }: UserStatusFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [action, setAction] = useState<"activate" | "deactivate">("activate")
 
  const handleStatusChange = (isActive: boolean) => {
    setAction(isActive ? "activate" : "deactivate")
    setIsDialogOpen(true)
  }

  const confirmStatusChange = () => {

    onSubmit(action === "activate" ? { userStatus: "ACTIVE" }: {userStatus: "INACTIVE"})
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium">Trạng thái tài khoản</h3>
            {user.status === 1 ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                Đang hoạt động
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                Đã vô hiệu hóa
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {user.status === 1
              ? "Tài khoản đang hoạt động và có thể đăng nhập vào hệ thống"
              : "Tài khoản đã bị vô hiệu hóa và không thể đăng nhập vào hệ thống"}
          </p>
        </div>

        {user.status === 1 ? (
          <Button variant="destructive" onClick={() => handleStatusChange(false)}>
            <XCircle className="mr-2 h-4 w-4" />
            Vô hiệu hóa
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
            onClick={() => handleStatusChange(true)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Kích hoạt
          </Button>
        )}
      </div>

      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Lưu ý quan trọng</AlertTitle>
        <AlertDescription>
          {user.status === 1
            ? "Vô hiệu hóa tài khoản sẽ ngăn người dùng đăng nhập vào hệ thống. Các tài liệu và dữ liệu của họ vẫn được giữ nguyên."
            : "Kích hoạt tài khoản sẽ cho phép người dùng đăng nhập lại vào hệ thống với quyền truy cập như trước."}
        </AlertDescription>
      </Alert>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "activate" ? "Kích hoạt tài khoản?" : "Vô hiệu hóa tài khoản?"}</DialogTitle>
            <DialogDescription>
              {action === "activate"
                ? "Bạn có chắc chắn muốn kích hoạt tài khoản này? Người dùng sẽ có thể đăng nhập vào hệ thống."
                : "Bạn có chắc chắn muốn vô hiệu hóa tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant={action === "activate" ? "default" : "destructive"}
              onClick={confirmStatusChange}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý
                </>
              ) : (
                <>{action === "activate" ? "Kích hoạt" : "Vô hiệu hóa"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

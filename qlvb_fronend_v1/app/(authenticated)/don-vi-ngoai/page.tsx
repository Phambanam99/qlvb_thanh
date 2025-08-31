"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { senderApi, SenderDTO } from "@/lib/api/senders";

export default function SendersPage() {
  const [senders, setSenders] = useState<SenderDTO[]>([]);
  const [filteredSenders, setFilteredSenders] = useState<SenderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSender, setEditingSender] = useState<SenderDTO | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  // Check permissions
  const canManage = hasRole("ROLE_ADMIN");

  useEffect(() => {
    fetchSenders();
  }, []);

  useEffect(() => {
    // Filter senders based on search query
    const filtered = senders.filter(
      (sender) =>
        sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sender.description &&
          sender.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredSenders(filtered);
  }, [senders, searchQuery]);

  const fetchSenders = async () => {
    try {
      setLoading(true);
      const data_ = await senderApi.getAllSenders();
      const data = data_.data;
      setSenders(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn vị ngoài",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên đơn vị",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingSender) {
        // Update existing sender
        await senderApi.updateSender(editingSender.id!, formData);
        toast({
          title: "Thành công",
          description: "Cập nhật đơn vị ngoài thành công",
        });
      } else {
        // Create new sender
        await senderApi.createSender(formData);
        toast({
          title: "Thành công",
          description: "Tạo đơn vị ngoài mới thành công",
        });
      }

      await fetchSenders();
      handleDialogClose();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: editingSender
          ? "Không thể cập nhật đơn vị ngoài"
          : "Đơn vị đã tồn tại",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (sender: SenderDTO) => {
    setEditingSender(sender);
    setFormData({
      name: sender.name,
      description: sender.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn vị ngoài này?")) {
      return;
    }

    try {
      await senderApi.deleteSender(id);
      toast({
        title: "Thành công",
        description: "Xóa đơn vị ngoài thành công",
      });
      await fetchSenders();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa đơn vị ngoài",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSender(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return "-";
    }
  };

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Không có quyền truy cập
              </h3>
              <p>Bạn không có quyền truy cập trang này.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold">Quản lý đơn vị ngoài</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Quản lý danh sách các đơn vị bên ngoài gửi văn bản
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSenders}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm đơn vị ngoài
          </Button>
        </div>
      </div>

      {/* Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleDialogClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSender
                ? "Chỉnh sửa đơn vị ngoài"
                : "Thêm đơn vị ngoài mới"}
            </DialogTitle>
            <DialogDescription>
              {editingSender
                ? "Chỉnh sửa thông tin đơn vị ngoài"
                : "Tạo đơn vị ngoài mới trong hệ thống"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên đơn vị *</Label>
                <Input
                  id="name"
                  placeholder="Ví dụ: Sở Tài chính, UBND Tỉnh..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả về đơn vị (tùy chọn)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : editingSender ? (
                  "Cập nhật"
                ) : (
                  "Tạo mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm đơn vị ngoài..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn vị ngoài</CardTitle>
          <CardDescription>
            Tổng cộng {filteredSenders.length} đơn vị ngoài
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải...</span>
            </div>
          ) : filteredSenders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy đơn vị ngoài nào"
                : "Chưa có đơn vị ngoài nào"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đơn vị</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSenders.map((sender) => (
                  <TableRow key={sender.id}>
                    <TableCell className="font-medium">{sender.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {sender.description || "-"}
                    </TableCell>
                    <TableCell>{formatDate(sender.createdAt)}</TableCell>
                    <TableCell>{formatDate(sender.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(sender)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sender.id!)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

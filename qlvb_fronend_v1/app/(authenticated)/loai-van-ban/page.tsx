"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  FileType,
  Search,
  RefreshCw,
} from "lucide-react";
import { documentTypesAPI, DocumentTypeDTO } from "@/lib/api/document-types";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth-guard";

interface DocumentTypeFormData {
  name: string;
}

export default function DocumentTypesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  // State management
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentTypeDTO | null>(null);
  const [formData, setFormData] = useState<DocumentTypeFormData>({ name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check permissions
  const canManage = hasPermission("ROLE_ADMIN");
  
  

  // Fetch document types
  const fetchDocumentTypes = async () => {
    try {
      setIsLoading(true);
      const data = await documentTypesAPI.getAllDocumentTypes();
      setDocumentTypes(data);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách loại công văn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // Filter document types based on search query
  const filteredDocumentTypes = documentTypes.filter((type) =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên loại công văn",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingType) {
        // Update existing document type
        await documentTypesAPI.updateDocumentType(editingType.id, {
          name: formData.name.trim(),
        });
        toast({
          title: "Thành công",
          description: "Cập nhật loại công văn thành công",
        });
      } else {
        // Create new document type
        await documentTypesAPI.createDocumentType({
          name: formData.name.trim(),
          isActive: true,
        });
        toast({
          title: "Thành công",
          description: "Tạo loại công văn mới thành công",
        });
      }

      // Reset form and refresh data
      setFormData({ name: "" });
      setEditingType(null);
      setIsDialogOpen(false);
      await fetchDocumentTypes();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: editingType
          ? "Không thể cập nhật loại công văn"
          : "Không thể tạo loại công văn mới",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (docType: DocumentTypeDTO) => {
    setEditingType(docType);
    setFormData({ name: docType.name });
    setIsDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (docType: DocumentTypeDTO) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại công văn "${docType.name}"?`)) {
      return;
    }

    try {
      await documentTypesAPI.deleteDocumentType(docType.id);
      toast({
        title: "Thành công",
        description: "Xóa loại công văn thành công",
      });
      await fetchDocumentTypes();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa loại công văn",
        variant: "destructive",
      });
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    setFormData({ name: "" });
  };

  // Handle button click
  const handleAddButtonClick = () => {
    
    setIsDialogOpen(true);
  };

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Bạn không có quyền truy cập trang này.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={["ROLE_ADMIN"]}>
      <div className="container mx-auto max-w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileType className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold">Quản lý loại công văn</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Quản lý các loại công văn trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocumentTypes}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>

          <Button onClick={handleAddButtonClick}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm loại công văn
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingType
                    ? "Chỉnh sửa loại công văn"
                    : "Thêm loại công văn mới"}
                </DialogTitle>
                <DialogDescription>
                  {editingType
                    ? "Chỉnh sửa thông tin loại công văn"
                    : "Tạo loại công văn mới trong hệ thống"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tên loại công văn</Label>
                    <Input
                      id="name"
                      placeholder="Ví dụ: Công văn, Quyết định, Thông báo..."
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
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
                    {isSubmitting
                      ? "Đang xử lý..."
                      : editingType
                      ? "Cập nhật"
                      : "Tạo mới"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm loại công văn..."
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
          <CardTitle>Danh sách loại công văn</CardTitle>
          <CardDescription>
            Tổng cộng {filteredDocumentTypes.length} loại công văn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải...</span>
            </div>
          ) : filteredDocumentTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "Không tìm thấy loại công văn nào"
                : "Chưa có loại công văn nào"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên loại công văn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ngày cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocumentTypes.map((docType) => (
                  <TableRow key={docType.id}>
                    <TableCell className="font-medium">
                      {docType.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={docType.isActive ? "default" : "secondary"}
                      >
                        {docType.isActive ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(docType.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {new Date(docType.updatedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(docType)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(docType)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </AuthGuard>
  );
}

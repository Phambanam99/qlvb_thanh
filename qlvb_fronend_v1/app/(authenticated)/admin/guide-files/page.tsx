"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  guideFilesAPI,
  type GuideFileDTO,
  type CreateGuideFileDTO,
  type UpdateGuideFileDTO,
} from "@/lib/api/guide-files";
import {
  Upload,
  Download,
  Edit,
  Trash2,
  FileText,
  Video,
  Image,
  File,
  Plus,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import PDFViewerModal from "@/components/ui/pdf-viewer-modal";
import { isPDFFile } from "@/lib/utils/pdf-viewer";
// Format file size utility function
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const FILE_CATEGORIES = [
  { value: "overview", label: "Tổng quan hệ thống" },
  { value: "documents", label: "Quản lý văn bản" },
  { value: "schedule", label: "Lịch công tác" },
  { value: "users", label: "Quản lý người dùng" },
  { value: "other", label: "Khác" },
];

export default function AdminGuideFilesPage() {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const [guideFiles, setGuideFiles] = useState<GuideFileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<GuideFileDTO | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] =
    useState<GuideFileDTO | null>(null);

  const [formData, setFormData] = useState<CreateGuideFileDTO>({
    name: "",
    description: "",
    category: "",
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check admin permission
  useEffect(() => {
    if (!hasPermission("ROLE_ADMIN")) {
      toast({
        title: "Không có quyền truy cập",
        description: "Bạn không có quyền quản lý file hướng dẫn",
        variant: "destructive",
      });
      return;
    }
  }, [hasPermission]);

  // Fetch guide files
  useEffect(() => {
    fetchGuideFiles();
  }, []);

  const fetchGuideFiles = async () => {
    try {
      setLoading(true);
      const files_ = await guideFilesAPI.getAllGuideFiles();
      const files = files_.data;
      setGuideFiles(files);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách file hướng dẫn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !editingFile) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn file để upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      if (editingFile) {
        // Update existing file
        await guideFilesAPI.updateGuideFile(editingFile.id, formData);

        // Replace file if new file selected
        if (selectedFile) {
          await guideFilesAPI.replaceGuideFile(editingFile.id, selectedFile);
        }

        toast({
          title: "Thành công",
          description: "Đã cập nhật file hướng dẫn",
        });
      } else {
        // Upload new file
        if (!selectedFile) return;

        await guideFilesAPI.uploadGuideFile(formData, selectedFile);

        toast({
          title: "Thành công",
          description: "Đã upload file hướng dẫn mới",
        });
      }

      // Reset form and refresh data
      setFormData({ name: "", description: "", category: "", isActive: true });
      setSelectedFile(null);
      setEditingFile(null);
      setIsDialogOpen(false);
      fetchGuideFiles();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: editingFile
          ? "Không thể cập nhật file"
          : "Không thể upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (file: GuideFileDTO) => {
    setEditingFile(file);
    setFormData({
      name: file.name,
      description: file.description,
      category: file.category,
      isActive: file.isActive,
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa file này?")) return;

    try {
      await guideFilesAPI.deleteGuideFile(id);
      toast({
        title: "Thành công",
        description: "Đã xóa file hướng dẫn",
      });
      fetchGuideFiles();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa file",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (file: GuideFileDTO) => {
    try {
      const blob_   = await guideFilesAPI.downloadGuideFile(file.id);
      const blob = blob_.data;
     
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể download file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />;
    if (fileType.includes("video")) return <Video className="h-4 w-4" />;
    if (fileType.includes("image")) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", category: "", isActive: true });
    setSelectedFile(null);
    setEditingFile(null);
  };

  // Handle PDF preview
  const handlePreviewFile = (file: GuideFileDTO) => {
    setSelectedFileForPreview(file);
    setPdfViewerOpen(true);
  };

  // Download file for PDF viewer
  const handlePDFDownload = async () => {
    if (!selectedFileForPreview) return null;
    try {
      const result_ = await guideFilesAPI.downloadGuideFile(selectedFileForPreview.id);
      const result = result_.data;
      return result;
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải file PDF",
        variant: "destructive",
      });
      return null;
    }
  };

  if (!hasPermission("ROLE_ADMIN")) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-muted-foreground">
              Bạn không có quyền quản lý file hướng dẫn
            </p>
          </CardContent>
        </Card>

        {/* PDF Viewer Modal */}
        <PDFViewerModal
          isOpen={pdfViewerOpen}
          onClose={() => {
            setPdfViewerOpen(false);
            setSelectedFileForPreview(null);
          }}
          fileName={selectedFileForPreview?.fileName}
          title={selectedFileForPreview?.name}
          onDownload={handlePDFDownload}
          options={{
            allowDownload: true,
            allowPrint: true,
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Quản lý File Hướng dẫn
        </h1>
        <p className="text-muted-foreground">
          Upload và quản lý các file hướng dẫn sử dụng hệ thống
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Tổng cộng: {guideFiles.length} file
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Upload File Mới
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingFile ? "Chỉnh sửa File" : "Upload File Mới"}
                </DialogTitle>
                <DialogDescription>
                  {editingFile
                    ? "Cập nhật thông tin file hướng dẫn"
                    : "Upload file hướng dẫn mới cho người dùng"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên file</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nhập tên file hướng dẫn"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Nhập mô tả chi tiết về file"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: !!checked }))
                    }
                  />
                  <Label htmlFor="isActive">Hiển thị công khai</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">
                    {editingFile ? "File mới (tùy chọn)" : "Chọn file"}
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.mp4,.avi,.mov,.png,.jpg,.jpeg"
                    required={!editingFile}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Đã chọn: {selectedFile.name} (
                      {formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingFile ? "Đang cập nhật..." : "Đang upload..."}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {editingFile ? "Cập nhật" : "Upload"}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách File Hướng dẫn</CardTitle>
          <CardDescription>
            Quản lý tất cả file hướng dẫn sử dụng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải danh sách file...</span>
            </div>
          ) : guideFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có file nào</h3>
              <p className="text-muted-foreground">
                Upload file hướng dẫn đầu tiên
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Kích thước</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guideFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          {getFileIcon(file.fileType)}
                        </div>
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {file.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {FILE_CATEGORIES.find((c) => c.value === file.category)
                          ?.label || file.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>
                      {file.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Hiển thị
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Ẩn
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(file.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isPDFFile(file.fileType, file.fileName) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewFile(file)}
                            title="Xem trước PDF"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file)}
                          title="Tải xuống"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(file)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(file.id)}
                          className="text-destructive hover:text-destructive"
                          title="Xóa"
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

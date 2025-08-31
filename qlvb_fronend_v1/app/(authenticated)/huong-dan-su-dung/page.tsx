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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle,
  FileText,
  Send,
  ClipboardList,
  Calendar,
  Users,
  Settings,
  Building,
  UserCheck,
  Download,
  Phone,
  User,
  MapPin,
  Loader2,
  Eye,
} from "lucide-react";
import { guideFilesAPI, type GuideFileDTO } from "@/lib/api/guide-files";
import { useToast } from "@/components/ui/use-toast";
import PDFViewerModal from "@/components/ui/pdf-viewer-modal";
import { isPDFFile } from "@/lib/utils/pdf-viewer";

export default function UserGuidePage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [guideFiles, setGuideFiles] = useState<GuideFileDTO[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GuideFileDTO | null>(null);
  const { toast } = useToast();

  // Format file size utility function
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const sections = [
    {
      id: "overview",
      title: "Tổng quan hệ thống",
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Hệ thống Quản lý văn bản điện tử giúp tự động hóa quy trình xử lý
            văn bản, quản lý lịch công tác và kế hoạch trong tổ chức.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Đăng nhập</h4>
              <p className="text-sm text-blue-600">
                Sử dụng tài khoản được cấp để đăng nhập vào hệ thống
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800">Dashboard</h4>
              <p className="text-sm text-green-600">
                Xem tổng quan thống kê và thông báo quan trọng
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "documents",
      title: "Quản lý văn bản",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Văn bản đến & Văn bản đi</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Tạo mới văn bản nội bộ và bên ngoài
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Phân công xử lý văn bản đến
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Theo dõi tiến độ xử lý
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Lưu trữ và tìm kiếm văn bản
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "schedule",
      title: "Lịch công tác & Kế hoạch",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quản lý lịch công tác</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Tạo lịch công tác hàng tuần/tháng
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Phê duyệt và theo dõi thực hiện
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Báo cáo kết quả công tác
            </li>
          </ul>
          <h3 className="text-lg font-semibold mt-6">Quản lý kế hoạch</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Lập kế hoạch dài hạn và ngắn hạn
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Phân công nhiệm vụ theo kế hoạch
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "users",
      title: "Quản lý người dùng & Vai trò",
      icon: Users,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quản lý người dùng</h3>
          <p className="text-muted-foreground text-sm">
            Chỉ dành cho quản trị viên
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Tạo tài khoản người dùng mới
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Phân quyền và vai trò
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Quản lý phòng ban và cơ cấu tổ chức
            </li>
          </ul>
        </div>
      ),
    },
  ];

  // Fetch guide files on component mount
  useEffect(() => {
    const fetchGuideFiles = async () => {
      try {
        setLoadingFiles(true);
        const files_ = await guideFilesAPI.getActiveGuideFiles();
        const files = files_.data;
        setGuideFiles(files);
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách file hướng dẫn",
          variant: "destructive",
        });
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchGuideFiles();
  }, []);

  // Handle file download
  const handleDownloadFile = async (file: GuideFileDTO) => {
    try {
      const blob_ = await guideFilesAPI.downloadGuideFile(file.id);
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
        description: "Không thể tải file",
        variant: "destructive",
      });
    }
  };

  // Handle PDF preview
  const handlePreviewFile = (file: GuideFileDTO) => {
    setSelectedFile(file);
    setPdfViewerOpen(true);
  };

  // Download file for PDF viewer
  const handlePDFDownload = async () => {
    if (!selectedFile) return null;
    try {
      const result_ = await guideFilesAPI.downloadGuideFile(selectedFile.id);
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
  const active = sections.find((s) => s.id === activeSection);
  const ActiveIcon = active?.icon;
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Hướng dẫn sử dụng</h1>
        <p className="text-muted-foreground">
          Tài liệu hướng dẫn và thông tin liên hệ hỗ trợ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Danh mục</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="mr-2 h-4 w-4" />
                {section.title}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Section Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {ActiveIcon && <ActiveIcon className="h-5 w-5" />}
                {active?.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.find((s) => s.id === activeSection)?.content}
            </CardContent>
          </Card>

          {/* Download Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Tài liệu hướng dẫn
              </CardTitle>
              <CardDescription>
                Tải xuống các tài liệu hướng dẫn chi tiết
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Đang tải danh sách file...</span>
                </div>
              ) : guideFiles.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Chưa có file hướng dẫn
                  </h3>
                  <p className="text-muted-foreground">
                    Hiện tại chưa có file hướng dẫn nào được upload
                  </p>
                </div>
              ) : (
                guideFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {file.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{file.fileType}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </span>
                      {isPDFFile(file.fileType, file.fileName) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewFile(file)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Tải
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* About Us Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800">
                      Hệ thống Quản lý Văn bản Điện tử
                    </h3>
                    <p className="text-gray-600">
                      Phiên bản V0.1 - Phát triển năm 2025
                    </p>
                    <p className="text-gray-400">
                      Phần mềm đang trong giai đoạn phát triển và hoàn thiện,
                      <br />
                      vui lòng liên hệ với chúng tôi nếu có vấn đề hoặc góp ý
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nhà phát triển
                      </h4>
                      <div className="flex items-center gap-20  space-y-2 text-sm justify-center">
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Họ tên:</span>
                          <span className="text-blue-600 font-semibold">
                            P.NCPT
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">Đơn vị:</span>
                          <span>Phòng 7 - Cục 75</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span className="font-medium">Liên hệ:</span>
                          <a
                            href="tel:521248"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            521248
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          setSelectedFile(null);
        }}
        fileName={selectedFile?.fileName}
        title={selectedFile?.name}
        onDownload={handlePDFDownload}
        options={{
          allowDownload: true,
          allowPrint: true,
        }}
      />
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  X,
  Download,
  FileText,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { isPDFFile, openPDFInNewWindow } from "@/lib/utils/pdf-viewer";
import PDFViewerModal from "@/components/ui/pdf-viewer-modal";

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages?: number;
}

export default function MergePDFPage() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [mergedFileName, setMergedFileName] = useState("merged-document.pdf");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] =
    useState<string>("");
  const [mergedPdfBlob, setMergedPdfBlob] = useState<Blob | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newFiles: PDFFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!isPDFFile(file.type, file.name)) {
          toast({
            title: "Lỗi",
            description: `File ${file.name} không phải là PDF`,
            variant: "destructive",
          });
          continue;
        }

        try {
          // Get page count
          const arrayBuffer = await file.arrayBuffer();

          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pageCount = pdfDoc.getPageCount();

          newFiles.push({
            id: `${Date.now()}-${i}`,
            file,
            name: file.name,
            size: file.size,
            pages: pageCount,
          });
        } catch (error) {
          toast({
            title: "Lỗi",
            description: `Không thể đọc file ${file.name}`,
            variant: "destructive",
          });
        }
      }

      setPdfFiles((prev) => [...prev, ...newFiles]);

      if (newFiles.length > 0) {
        toast({
          title: "Thành công",
          description: `Đã thêm ${newFiles.length} file PDF`,
        });
      }
    },
    [toast]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Remove file
  const removeFile = (id: string) => {
    setPdfFiles((prev) => prev.filter((file) => file.id !== id));
  };

  // Move file up/down
  const moveFile = (id: string, direction: "up" | "down") => {
    setPdfFiles((prev) => {
      const index = prev.findIndex((file) => file.id === id);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newFiles = [...prev];
      [newFiles[index], newFiles[newIndex]] = [
        newFiles[newIndex],
        newFiles[index],
      ];
      return newFiles;
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Merge PDFs
  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      toast({
        title: "Lỗi",
        description: "Cần ít nhất 2 file PDF để ghép",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();
 

      for (const pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      // Save merged PDF for preview
      setMergedPdfBlob(blob);

      // Download merged PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = mergedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Thành công",
        description: `Đã ghép ${pdfFiles.length} file PDF thành công. Bạn có thể xem trước file đã ghép.`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể ghép file PDF. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Preview individual PDF file
  const previewPDF = (file: File) => {
    setSelectedFileForPreview(file.name);
    setPdfViewerOpen(true);
  };

  // Preview merged PDF
  const previewMergedPDF = () => {
    if (!mergedPdfBlob) return;
    setSelectedFileForPreview(mergedFileName);
    setPdfViewerOpen(true);
  };

  // Handle PDF download for viewer
  const handlePDFDownload = async (): Promise<Blob | null> => {
    if (selectedFileForPreview === mergedFileName && mergedPdfBlob) {
      return mergedPdfBlob;
    }

    // Find the individual file
    const file = pdfFiles.find((f) => f.name === selectedFileForPreview);
    if (file) {
      return file.file;
    }

    return null;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ghép File PDF</h1>
        <p className="text-muted-foreground">
          Tải lên nhiều file PDF và ghép chúng thành một file duy nhất
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Tải lên File PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg mb-2">Kéo thả file PDF vào đây</p>
            <p className="text-sm text-muted-foreground mb-4">hoặc</p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="pdf-upload"
            />
            <Button 
              variant="outline" 
              className="cursor-pointer"
              onClick={triggerFileInput}
              type="button"
            >
              Chọn file PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {pdfFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Danh sách File PDF ({pdfFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pdfFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-red-100 p-2 rounded">
                      <FileText className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.pages} trang
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewPDF(file.file)}
                      title="Xem trước"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFile(file.id, "up")}
                      disabled={index === 0}
                      title="Di chuyển lên"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveFile(file.id, "down")}
                      disabled={index === pdfFiles.length - 1}
                      title="Di chuyển xuống"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      title="Xóa"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Merge Settings */}
      {pdfFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cài đặt ghép file</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="filename">Tên file sau khi ghép</Label>
                <Input
                  id="filename"
                  value={mergedFileName}
                  onChange={(e) => setMergedFileName(e.target.value)}
                  placeholder="merged-document.pdf"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    Tổng số trang:{" "}
                    {pdfFiles.reduce((sum, file) => sum + (file.pages || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Kích thước ước tính:{" "}
                    {formatFileSize(
                      pdfFiles.reduce((sum, file) => sum + file.size, 0)
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  {mergedPdfBlob && (
                    <Button
                      variant="outline"
                      onClick={previewMergedPDF}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Xem file đã ghép
                    </Button>
                  )}

                  <Button
                    onClick={mergePDFs}
                    disabled={isProcessing || pdfFiles.length < 2}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang ghép...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Ghép và tải xuống
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• Kéo thả hoặc chọn nhiều file PDF để tải lên</p>
            <p>• Sử dụng nút mũi tên để sắp xếp thứ tự file</p>
            <p>• Nhấn nút mắt để xem trước file PDF</p>
            <p>• Đặt tên cho file sau khi ghép</p>
            <p>• Nhấn "Ghép và tải xuống" để tạo file PDF mới</p>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={pdfViewerOpen}
        onClose={() => setPdfViewerOpen(false)}
        title={selectedFileForPreview}
        onDownload={handlePDFDownload}
      />
    </div>
  );
}

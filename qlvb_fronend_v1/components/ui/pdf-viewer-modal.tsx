"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink, X } from "lucide-react";
import {
  createPDFBlobUrl,
  cleanupBlobUrl,
  downloadFile,
  openPDFInNewWindow,
  PDFViewerOptions,
} from "@/lib/utils/pdf-viewer";
import { useToast } from "@/components/ui/use-toast";

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: number;
  fileName?: string;
  fileBlob?: Blob;
  title?: string;
  options?: PDFViewerOptions;
  onDownload?: () => Promise<Blob | null>;
}

export default function PDFViewerModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  fileBlob,
  title,
  options = {},
  onDownload,
}: PDFViewerModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const {
    width = "90vw",
    height = "80vh",
    allowDownload = true,
    allowPrint = true,
  } = options;

  useEffect(() => {
    if (isOpen && !pdfUrl) {
      if (fileBlob) {
        // Use provided blob
        const url = createPDFBlobUrl(fileBlob);
        setPdfUrl(url);
      } else if (onDownload) {
        // Fetch blob using onDownload function
        loadPDF();
      }
    }

    return () => {
      if (pdfUrl) {
        cleanupBlobUrl(pdfUrl);
        setPdfUrl("");
      }
    };
  }, [isOpen, fileBlob, onDownload]);

  const loadPDF = async () => {
    if (!onDownload) return;

    setIsLoading(true);
    setError("");

    try {
      const blob = await onDownload();
      if (blob) {
        const url = createPDFBlobUrl(blob);
        setPdfUrl(url);
      } else {
        setError("Không thể tải file PDF");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải file PDF");
      toast({
        title: "Lỗi",
        description: "Không thể tải file PDF",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (fileBlob && fileName) {
      downloadFile(fileBlob, fileName);
      return;
    }

    if (onDownload && fileName) {
      try {
        const blob = await onDownload();
        if (blob) {
          downloadFile(blob, fileName);
          toast({
            title: "Thành công",
            description: "File đã được tải xuống",
          });
        }
      } catch (err) {
        toast({
          title: "Lỗi",
          description: "Không thể tải xuống file",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenInNewWindow = async () => {
    if (fileBlob) {
      openPDFInNewWindow(fileBlob, title || fileName);
      return;
    }

    if (onDownload) {
      try {
        const blob = await onDownload();
        if (blob) {
          openPDFInNewWindow(blob, title || fileName);
        }
      } catch (err) {
        toast({
          title: "Lỗi",
          description: "Không thể mở file trong tab mới",
          variant: "destructive",
        });
      }
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      cleanupBlobUrl(pdfUrl);
      setPdfUrl("");
    }
    setError("");
    onClose();
  };

  return (
    <Dialog  open={isOpen}  onOpenChange={handleClose}>
      <DialogContent
        className="max-w-none p-0 flex flex-col h-[80vh] w-[80vw] "
        // style={{ width, height }}
        aria-describedby="pdf-viewer-description"
      >
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between pr-12">
            <DialogTitle className="text-lg font-semibold">
              {title || fileName || "Xem trước PDF"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {allowDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  Tải xuống
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInNewWindow}
                disabled={isLoading || !pdfUrl}
              >
                <ExternalLink className="h-4 w-4" />
                Mở tab mới
              </Button>
              
            </div>
          </div>
        </DialogHeader>

        <div
          id="pdf-viewer-description"
          className="flex-1 flex flex-col bg-gray-50"
          style={{ height: "calc(100% - 80px)" }}
        >
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <p className="mt-2 text-sm text-gray-500">Đang tải PDF...</p>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-red-500 text-center">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={loadPDF}
              >
                Thử lại
              </Button>
            </div>
          )}

          {pdfUrl && !isLoading && !error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-none"
              title={title || fileName || "PDF Viewer"}
              loading="lazy"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

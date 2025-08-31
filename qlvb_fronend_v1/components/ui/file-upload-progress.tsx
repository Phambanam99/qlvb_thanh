"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Paperclip, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProgressProps {
  files: File[];
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
  onRemoveFile: (index: number) => void;
  onCancelUpload?: () => void;
  formatFileSize: (bytes: number) => string;
  getTotalSize: () => string;
  className?: string;
}

export function FileUploadProgress({
  files,
  uploadProgress,
  isUploading,
  error,
  onRemoveFile,
  onCancelUpload,
  formatFileSize,
  getTotalSize,
  className = "",
}: FileUploadProgressProps) {
  if (files.length === 0 && !error) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Các tệp đã chọn ({files.length}) - Tổng: {getTotalSize()}
            </span>
            {isUploading && onCancelUpload && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelUpload}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Hủy
              </Button>
            )}
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Đang tải lên...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Files List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className={`flex items-center justify-between rounded-md border p-2 transition-colors ${
                  isUploading
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-accent/30"
                }`}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <Paperclip className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                    onClick={() => onRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

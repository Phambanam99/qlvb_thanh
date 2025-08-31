"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface FileUploadSectionProps {
  files: File[];
  onFileChange: (files: File[]) => void;
  className?: string;
  multiple?: boolean;
  maxSize?: number; // Max file size in MB
  allowedTypes?: string[]; // Array of allowed MIME types
}

export function FileUploadSection({
  files,
  onFileChange,
  className,
  multiple = false,
  maxSize = 10, // Default 10MB
  allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
}: FileUploadSectionProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setError(null);

      // Check if multiple files are allowed
      if (!multiple && e.target.files.length > 1) {
        setError("Chỉ được phép tải lên 1 file");
        return;
      }

      // Convert FileList to array for easier manipulation
      const fileArray = Array.from(e.target.files);

      // Validate file types
      const invalidTypeFiles = fileArray.filter(
        (file) => allowedTypes && !allowedTypes.includes(file.type)
      );

      if (invalidTypeFiles.length > 0) {
        setError(
          `File không hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`
        );
        return;
      }

      // Validate file sizes
      const oversizedFiles = fileArray.filter(
        (file) => file.size > maxSize * 1024 * 1024
      );

      if (oversizedFiles.length > 0) {
        setError(`File quá lớn. Kích thước tối đa là ${maxSize}MB`);
        return;
      }

      // If all validations pass, update files
      if (multiple) {
        onFileChange([...files, ...fileArray]);
      } else {
        onFileChange(fileArray);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFileChange(newFiles);
  };

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else return (bytes / 1048576).toFixed(2) + " MB";
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileChange}
            multiple={multiple}
            accept={allowedTypes?.join(",")}
            className="max-w-md"
          />
          {multiple && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onFileChange([])}
              disabled={files.length === 0}
            >
              Xóa tất cả
            </Button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Display list of files */}
        {files.length > 0 && (
          <div className="border rounded-md p-3 mt-2">
            <h4 className="text-sm font-medium mb-2">
              Tệp đính kèm ({files.length})
            </h4>
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                >
                  <div>
                    <span className="font-medium">{file.name}</span>
                    <span className="text-gray-500 ml-2">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Xóa file</span>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

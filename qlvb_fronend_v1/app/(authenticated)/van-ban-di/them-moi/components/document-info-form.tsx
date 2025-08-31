"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash } from "lucide-react";
import { DocumentTypeManager } from "./document-type-manager";
import { RecipientSelector } from "./recipient-selector";

interface DocumentInfoFormProps {
  formData: {
    documentNumber: string;
    sentDate: string;
    recipient: string;
    documentType: string;
    title: string;
    content: string;
  };
  documentScope: "INTERNAL" | "EXTERNAL";
  files: File[];
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (name: string, value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
}

export function DocumentInfoForm({
  formData,
  documentScope,
  files,
  onInputChange,
  onSelectChange,
  onFileChange,
  onRemoveFile,
}: DocumentInfoFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">
            Số văn bản <span className="text-red-500">*</span>
          </Label>
          <Input
            id="documentNumber"
            name="documentNumber"
            placeholder="Nhập số văn bản"
            required
            value={formData.documentNumber}
            onChange={onInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sentDate">Ngày ban hành</Label>
          <Input
            id="sentDate"
            name="sentDate"
            type="date"
            required
            value={formData.sentDate}
            onChange={onInputChange}
          />
        </div>

        {/* Only show recipient for external documents */}
        {documentScope === "EXTERNAL" && (
          <RecipientSelector
            value={formData.recipient}
            onValueChange={(value) => onSelectChange("recipient", value)}
          />
        )}

        <DocumentTypeManager
          value={formData.documentType}
          onValueChange={(value) => onSelectChange("documentType", value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Trích yếu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Nhập trích yếu văn bản"
          required
          value={formData.title}
          onChange={onInputChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Nội dung</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Nhập nội dung văn bản"
          rows={10}
          value={formData.content}
          onChange={onInputChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments">Tệp đính kèm</Label>
        <div className="flex items-center gap-2">
          <Input
            id="attachments"
            type="file"
            multiple
            onChange={onFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("attachments")?.click()}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Chọn tệp
          </Button>
          <span className="text-sm text-muted-foreground">
            {files.length > 0
              ? `Đã chọn ${files.length} tệp`
              : "Chưa có tệp nào được chọn"}
          </span>
        </div>
        {files.length > 0 && (
          <div className="mt-2">
            {files.map((file, index) => (
              <div key={index} className="text-sm">
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(index)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect, SearchableSelectItem } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Paperclip, Plus, X } from "lucide-react";
import { DocumentTypeDTO } from "@/lib/api";
import { URGENCY_LEVELS } from "@/lib/types/urgency";

interface DocumentInfoFormProps {
  // Document basic info
  documentNumber: string;
  setDocumentNumber: (value: string) => void;
  documentCode: string;
  setDocumentCode: (value: string) => void;
  documentTitle: string;
  setDocumentTitle: (value: string) => void;
  documentSummary: string;
  setDocumentSummary: (value: string) => void;
  documentDate: Date | undefined;
  setDocumentDate: (value: Date) => void;
  receivedDate: Date | undefined;
  setReceivedDate: (value: Date) => void;

  // Sender and type
  sendingDepartmentName: string;
  setSendingDepartmentName: (value: string) => void;
  selectedDocumentType: string | null;
  setSelectedDocumentType: (value: string) => void;

  // Document properties
  urgencyLevel: string;
  setUrgencyLevel: (value: string) => void;
  securityLevel: string;
  setSecurityLevel: (value: string) => void;

  // New fields for IncomingDocument
  receiptNumber?: string;
  setReceiptNumber?: (value: string) => void;
  processingOfficerId?: string;
  setProcessingOfficerId?: (value: string) => void;
  processingOfficers?: any[];

  // Files
  files: File[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index: number) => void;

  // Document types management
  documentTypes: DocumentTypeDTO[];
  isLoadingDocumentTypes: boolean;
  newDocumentType: string;
  setNewDocumentType: (value: string) => void;
  isDocumentTypeDialogOpen: boolean;
  setIsDocumentTypeDialogOpen: (value: boolean) => void;
  isCreatingDocumentType: boolean;
  documentTypeError: string | null;
  setDocumentTypeError: (value: string | null) => void;
  handleAddDocumentType: () => void;

  // Sender management
  senderDepartments: any[];
  isLoadingDepartments: boolean;
  newSender: string;
  setNewSender: (value: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (value: boolean) => void;
  isCreatingSender: boolean;
  senderError: string | null;
  setSenderError: (value: string | null) => void;
  createSender: () => void;

  // Validation
  validationErrors: Record<string, string>;
  setValidationErrors: (value: Record<string, string>) => void;
}

export function DocumentInfoForm({
  documentNumber,
  setDocumentNumber,
  documentCode,
  setDocumentCode,
  documentTitle,
  setDocumentTitle,
  documentSummary,
  setDocumentSummary,
  documentDate,
  setDocumentDate,
  receivedDate,
  setReceivedDate,
  sendingDepartmentName,
  setSendingDepartmentName,
  selectedDocumentType,
  setSelectedDocumentType,
  urgencyLevel,
  setUrgencyLevel,
  securityLevel,
  setSecurityLevel,
  receiptNumber,
  setReceiptNumber,
  processingOfficerId,
  setProcessingOfficerId,
  processingOfficers = [],
  files,
  handleFileChange,
  handleRemoveFile,
  documentTypes,
  isLoadingDocumentTypes,
  newDocumentType,
  setNewDocumentType,
  isDocumentTypeDialogOpen,
  setIsDocumentTypeDialogOpen,
  isCreatingDocumentType,
  documentTypeError,
  setDocumentTypeError,
  handleAddDocumentType,
  senderDepartments,
  isLoadingDepartments,
  newSender,
  setNewSender,
  dialogOpen,
  setDialogOpen,
  isCreatingSender,
  senderError,
  setSenderError,
  createSender,
  validationErrors,
  setValidationErrors,
}: DocumentInfoFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="documentNumber">
            Số văn bản <span className="text-red-500">*</span>
          </Label>
          <Input
            id="documentNumber"
            name="documentNumber"
            value={documentNumber}
            onChange={(e) => {
              setDocumentNumber(e.target.value);
              if (validationErrors.documentNumber) {
                setValidationErrors((prev) => ({
                  ...prev,
                  documentNumber: "",
                }));
              }
            }}
            placeholder="Nhập số văn bản"
            className={validationErrors.documentNumber ? "border-red-500" : ""}
            required
          />
          {validationErrors.documentNumber && (
            <p className="text-sm text-red-500">
              {validationErrors.documentNumber}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Số lưu trữ</Label>
          <Input
            id="referenceNumber"
            name="referenceNumber"
            value={documentCode}
            onChange={(e) => setDocumentCode(e.target.value)}
            placeholder="Nhập số lưu trữ"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signingDate">Ngày ký</Label>
          <Input
            id="signingDate"
            name="signingDate"
            type="date"
            value={documentDate?.toISOString().split("T")[0] || ""}
            onChange={(e) => setDocumentDate(new Date(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receivedDate">Ngày nhận</Label>
          <Input
            id="receivedDate"
            name="receivedDate"
            type="date"
            value={receivedDate?.toISOString().split("T")[0] || ""}
            onChange={(e) => setReceivedDate(new Date(e.target.value))}
            required
          />
        </div>

        {/* Số thu - Receipt Number */}
        {setReceiptNumber && (
          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Số thu</Label>
            <Input
              id="receiptNumber"
              name="receiptNumber"
              value={receiptNumber || ""}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Nhập số thu"
            />
          </div>
        )}

        {/* Cán bộ xử lý - Processing Officer */}
        {setProcessingOfficerId && (
          <div className="space-y-2">
            <Label htmlFor="processingOfficer">Cán bộ xử lý</Label>
            <Select
              value={processingOfficerId || ""}
              onValueChange={setProcessingOfficerId}
            >
              <SelectTrigger id="processingOfficer" name="processingOfficer">
                <SelectValue placeholder="Chọn cán bộ xử lý" />
              </SelectTrigger>
              <SelectContent>
                {processingOfficers.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Không có cán bộ nào
                  </SelectItem>
                ) : (
                  processingOfficers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id.toString()}>
                      {officer.fullName || officer.name} - {officer.position || 'Chưa có chức danh'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Sender Selection */}
        <div className="space-y-2">
          <Label htmlFor="issuingAuthority">Đơn vị gửi</Label>
          <div className="flex gap-2">
            <Select
              name="issuingAuthority"
              value={sendingDepartmentName}
              onValueChange={setSendingDepartmentName}
              required
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Chọn đơn vị gửi" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingDepartments ? (
                  <SelectItem value="loading" disabled>
                    Đang tải...
                  </SelectItem>
                ) : senderDepartments.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    Không có đơn vị nào
                  </SelectItem>
                ) : (
                  senderDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm đơn vị gửi mới</DialogTitle>
                  <DialogDescription>
                    Nhập tên đơn vị gửi chưa có trong hệ thống
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newDepartment">Tên đơn vị gửi</Label>
                    <Input
                      id="newDepartment"
                      value={newSender}
                      onChange={(e) => {
                        setNewSender(e.target.value);
                        setSenderError(null);
                      }}
                      placeholder="Nhập tên đơn vị gửi mới"
                      className={senderError ? "border-red-500" : ""}
                    />
                    {senderError && (
                      <p className="text-sm font-medium text-red-500 mt-1">
                        {senderError}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setSenderError(null);
                    }}
                    type="button"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={createSender}
                    disabled={isCreatingSender || !newSender.trim()}
                    type="button"
                  >
                    {isCreatingSender ? "Đang thêm..." : "Thêm đơn vị"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Document Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="documentType">Loại văn bản</Label>
          <div className="flex gap-2">
            <SearchableSelect
              items={documentTypes.map((type): SearchableSelectItem => ({
                value: type.name,
                label: type.name,
              }))}
              value={selectedDocumentType || "OFFICIAL_LETTER"}
              onValueChange={setSelectedDocumentType}
              placeholder="Chọn loại văn bản"
              searchPlaceholder="Tìm kiếm loại văn bản..."
              emptyMessage="Không tìm thấy loại văn bản phù hợp"
              loading={isLoadingDocumentTypes}
              loadingMessage="Đang tải..."
              disabled={isLoadingDocumentTypes}
              className="flex-1"
            />

            <Dialog
              open={isDocumentTypeDialogOpen}
              onOpenChange={setIsDocumentTypeDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm loại văn bản mới</DialogTitle>
                  <DialogDescription>
                    Nhập tên loại văn bản chưa có trong hệ thống
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="newDocumentType">Tên loại văn bản</Label>
                    <Input
                      id="newDocumentType"
                      value={newDocumentType}
                      onChange={(e) => {
                        setNewDocumentType(e.target.value);
                        setDocumentTypeError(null);
                      }}
                      placeholder="Nhập tên loại văn bản mới"
                      className={documentTypeError ? "border-red-500" : ""}
                    />
                    {documentTypeError && (
                      <p className="text-sm font-medium text-red-500 mt-1">
                        {documentTypeError}
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDocumentTypeDialogOpen(false);
                    }}
                    type="button"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleAddDocumentType}
                    disabled={isCreatingDocumentType || !newDocumentType.trim()}
                    type="button"
                  >
                    {isCreatingDocumentType
                      ? "Đang thêm..."
                      : "Thêm loại văn bản"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urgencyLevel">Độ khẩn</Label>
          <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
            <SelectTrigger id="urgencyLevel" name="urgencyLevel">
              <SelectValue placeholder="Chọn độ khẩn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={URGENCY_LEVELS.KHAN}>Khẩn</SelectItem>
              <SelectItem value={URGENCY_LEVELS.THUONG_KHAN}>
                Thượng khẩn
              </SelectItem>
              <SelectItem value={URGENCY_LEVELS.HOA_TOC}>Hỏa tốc</SelectItem>
              <SelectItem value={URGENCY_LEVELS.HOA_TOC_HEN_GIO}>
                Hỏa tốc hẹn giờ
              </SelectItem>
              <SelectItem value="IMMEDIATE">Hỏa tốc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityLevel">Độ mật</Label>
          <Select value={securityLevel} onValueChange={setSecurityLevel}>
            <SelectTrigger id="securityLevel" name="securityLevel">
              <SelectValue placeholder="Chọn độ mật" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NORMAL">Bình thường</SelectItem>
              <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
              <SelectItem value="SECRET">Tối mật</SelectItem>
              <SelectItem value="TOP_SECRET">Tuyệt mật</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Trích yếu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={documentTitle}
          onChange={(e) => {
            setDocumentTitle(e.target.value);
            if (validationErrors.documentTitle) {
              setValidationErrors((prev) => ({
                ...prev,
                documentTitle: "",
              }));
            }
          }}
          placeholder="Nhập trích yếu văn bản"
          className={validationErrors.documentTitle ? "border-red-500" : ""}
          required
        />
        {validationErrors.documentTitle && (
          <p className="text-sm text-red-500">
            {validationErrors.documentTitle}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Tóm tắt nội dung</Label>
        <Textarea
          id="summary"
          name="summary"
          value={documentSummary}
          onChange={(e) => setDocumentSummary(e.target.value)}
          placeholder="Nhập tóm tắt nội dung văn bản"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachments">Tệp đính kèm</Label>
        <div className="flex items-center gap-2">
          <Input
            id="attachments"
            type="file"
            multiple
            onChange={handleFileChange}
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
          <div className="mt-2 space-y-1">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
              >
                <span>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
                <Button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

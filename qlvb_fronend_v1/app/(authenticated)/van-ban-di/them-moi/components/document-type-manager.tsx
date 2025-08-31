"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus } from "lucide-react";
import { documentTypesAPI, DocumentTypeDTO } from "@/lib/api";
import { useNotifications } from "@/lib/notifications-context";

interface DocumentTypeManagerProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function DocumentTypeManager({
  value,
  onValueChange,
}: DocumentTypeManagerProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeDTO[]>([]);
  const [isLoadingDocumentTypes, setIsLoadingDocumentTypes] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingDocumentType, setIsCreatingDocumentType] = useState(false);
  const [documentTypeError, setDocumentTypeError] = useState<string | null>(
    null
  );
  const { addNotification } = useNotifications();

  // Fetch document types on component mount
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setIsLoadingDocumentTypes(true);
        const types = await documentTypesAPI.getAllDocumentTypes();
        setDocumentTypes(types);
      } catch (error) {
        addNotification({
          title: "Lỗi",
          message: "Không thể tải danh sách loại văn bản",
          type: "error",
        });
      } finally {
        setIsLoadingDocumentTypes(false);
      }
    };

    fetchDocumentTypes();
  }, [addNotification]);

  const handleCreateDocumentType = async () => {
    if (!newDocumentType.trim()) {
      addNotification({
        title: "Cảnh báo",
        message: "Tên loại văn bản không được để trống",
        type: "warning",
      });
      return;
    }

    // Check if document type already exists
    const documentTypeExists = documentTypes.some(
      (type) => type.name.toLowerCase() === newDocumentType.trim().toLowerCase()
    );

    if (documentTypeExists) {
      setDocumentTypeError("Loại văn bản này đã tồn tại trong hệ thống");
      return;
    }

    try {
      setIsCreatingDocumentType(true);
      setDocumentTypeError(null);

      const documentTypeData = {
        name: newDocumentType.trim(),
        isActive: true,
      };

      const createdType_ = await documentTypesAPI.createDocumentType(
        documentTypeData
      );
      const createdType = createdType_.data;

      // Add the new document type to the list
      setDocumentTypes((prevTypes) => [...prevTypes, createdType]);

      // Set the new document type as selected
      onValueChange(createdType.name);

      // Reset and close dialog
      setNewDocumentType("");
      setIsDialogOpen(false);

      addNotification({
        title: "Thành công",
        message: "Đã thêm loại văn bản mới",
        type: "success",
      });
    } catch (error: any) {
      let errorMessage = "Có lỗi xảy ra khi thêm loại văn bản";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setDocumentTypeError(errorMessage);
    } finally {
      setIsCreatingDocumentType(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="documentType">Loại văn bản</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id="documentType" className="flex-1">
            <SelectValue placeholder="Chọn loại văn bản" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingDocumentTypes ? (
              <SelectItem value="loading" disabled>
                Đang tải danh sách loại văn bản...
              </SelectItem>
            ) : documentTypes.length === 0 ? (
              <SelectItem value="empty" disabled>
                Chưa có loại văn bản nào
              </SelectItem>
            ) : (
              documentTypes.map((type) => (
                <SelectItem key={type.id} value={String(type.name)}>
                  {type.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
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
                  setIsDialogOpen(false);
                  setDocumentTypeError(null);
                  setNewDocumentType("");
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateDocumentType}
                disabled={isCreatingDocumentType || !newDocumentType.trim()}
              >
                {isCreatingDocumentType ? "Đang thêm..." : "Thêm loại văn bản"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

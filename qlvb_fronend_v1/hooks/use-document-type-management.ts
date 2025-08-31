"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { documentTypesAPI, DocumentTypeDTO } from "@/lib/api";

export function useDocumentTypeManagement() {
  const [newDocumentType, setNewDocumentType] = useState("");
  const [isDocumentTypeDialogOpen, setIsDocumentTypeDialogOpen] =
    useState(false);
  const [isCreatingDocumentType, setIsCreatingDocumentType] = useState(false);
  const [documentTypeError, setDocumentTypeError] = useState<string | null>(
    null
  );
  const { toast } = useToast();

  // Create a new document type
  const createDocumentType = async (
    documentTypes: DocumentTypeDTO[]
  ): Promise<DocumentTypeDTO[] | null> => {
    if (!newDocumentType.trim()) {
      setDocumentTypeError("Tên loại công văn không được để trống");
      return null;
    }

    if (
      documentTypes.some(
        (type) => type.name.toLowerCase() === newDocumentType.toLowerCase()
      )
    ) {
      setDocumentTypeError("Loại công văn này đã tồn tại");
      return null;
    }

    try {
      setIsCreatingDocumentType(true);
      setDocumentTypeError(null);

      // Create the document type with code derived from name
      const code = newDocumentType.toUpperCase().replace(/[^A-Z0-9]/g, "_");

      await documentTypesAPI.createDocumentType({
        name: newDocumentType,
        code: code,
      });

      // Refresh the list
      const updatedTypes = await documentTypesAPI.getAllDocumentTypes();
     

      // Reset and close dialog
      setNewDocumentType("");
      setIsDocumentTypeDialogOpen(false);

      toast({
        title: "Thành công",
        description: "Đã thêm loại công văn mới",
      });

      return updatedTypes;
    } catch (error) {
      setDocumentTypeError("Không thể tạo loại công văn mới");
      toast({
        title: "Lỗi",
        description: "Không thể tạo loại công văn mới",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsCreatingDocumentType(false);
    }
  };

  return {
    newDocumentType,
    setNewDocumentType,
    isDocumentTypeDialogOpen,
    setIsDocumentTypeDialogOpen,
    isCreatingDocumentType,
    documentTypeError,
    setDocumentTypeError,
    createDocumentType,
  };
}

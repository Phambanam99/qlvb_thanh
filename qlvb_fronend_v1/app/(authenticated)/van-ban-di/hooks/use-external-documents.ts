"use client";

import { useEffect, useState } from "react";
import { outgoingDocumentsAPI } from "@/lib/api/outgoingDocuments";
import { useToast } from "@/components/ui/use-toast";
import { useOutgoingDocuments } from "@/lib/store";

// Interface for external documents (original format)
interface OutgoingDocument {
  id: number | string;
  number: string;
  title: string;
  sentDate: string;
  recipient: string;
  status: string;
  departmentId?: number;
  departmentName?: string;
}

interface UseExternalDocumentsProps {
  activeSearchQuery: string;
  currentPage: number;
  pageSize: number;
}

export function useExternalDocuments({
  activeSearchQuery,
  currentPage,
  pageSize,
}: UseExternalDocumentsProps) {
  const { toast } = useToast();
  const { outgoingDocuments, loading, setOutgoingDocuments, setLoading } =
    useOutgoingDocuments();
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch external documents (original function)
  const fetchExternalDocuments = async (
    page = currentPage,
    size = pageSize
  ) => {
    try {
      setLoading(true);
      
      let response_;
      let response;

      // Nếu có search query, sử dụng API search cho văn bản bên ngoài
      if (activeSearchQuery.trim()) {
        response = await outgoingDocumentsAPI.searchDocuments(activeSearchQuery.trim(), page, size);
        
        if (response && response.documents) {
          const formattedDocuments = response.documents.map((doc: any) => ({
            id: doc.id,
            number: doc.number || "Chưa có số",
            title: doc.title || "Không có tiêu đề",
            sentDate: doc.sentDate || "Chưa ban hành",
            recipient: doc.recipient || "Chưa xác định",
            status: doc.status || "draft",
            departmentId: doc.draftingDepartmentId ?? null,
            departmentName: doc.draftingDepartment || "Chưa xác định",
          }));

          setOutgoingDocuments(formattedDocuments);
          
          // Set pagination info from search results
          setTotalItems(response.totalElements || response.documents.length);
          setTotalPages(response.totalPages || 1);
        }
      } else {
        // Không có search query, sử dụng pagination bình thường
        response_ = await outgoingDocumentsAPI.getAllDocuments(page, size);
        response = response_;

        if (response && response.documents) {
          const formattedDocuments = response.documents.map((doc: any) => ({
            id: doc.id,
            number: doc.number || "Chưa có số",
            title: doc.title || "Không có tiêu đề",
            sentDate: doc.sentDate || "Chưa ban hành",
            recipient: doc.recipient || "Chưa xác định",
            status: doc.status || "draft",
            departmentId: doc.draftingDepartmentId ?? null,
            departmentName: doc.draftingDepartment || "Chưa xác định",
          }));

          setOutgoingDocuments(formattedDocuments);

          // External documents don't have pagination info, so set basic values
          setTotalItems(response.documents.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          "Không thể tải dữ liệu văn bản bên ngoài. Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setOutgoingDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    documents: outgoingDocuments,
    loading,
    totalItems,
    totalPages,
    fetchExternalDocuments,
  };
}

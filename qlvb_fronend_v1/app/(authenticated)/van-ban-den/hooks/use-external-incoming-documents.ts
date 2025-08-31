/**
 * Custom hook for managing external documents (văn bản bên ngoài đến)
 * Handle search, pagination for external incoming documents
 */

"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { incomingDocumentsAPI } from "@/lib/api/incomingDocuments";

interface UseExternalIncomingDocumentsProps {
  activeSearchQuery: string;
  currentPage: number;
  pageSize: number;
}

export function useExternalIncomingDocuments({
  activeSearchQuery,
  currentPage,
  pageSize,
}: UseExternalIncomingDocumentsProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  const fetchExternalDocuments = useCallback(async (page = 0, size = 10) => {
    if (loading) return; // Prevent concurrent calls
    
    try {
      setLoading(true);
      
      let response;
      
      if (activeSearchQuery.trim()) {
        // Use search API when there's an active search query
        response = await incomingDocumentsAPI.searchDocuments(activeSearchQuery, page, size);
        
        if (response?.content) {
          setDocuments(response.content);
          setTotalItems(response.page?.totalElements || response.content.length);
          setTotalPages(response.page?.totalPages || 1);
        }
      } else {
        // Use paginated API for normal browsing
        response = await incomingDocumentsAPI.getAllDocuments(page, size);
        
        if (response?.content) {
          setDocuments(response.content);
          setTotalItems(response.page?.totalElements || response.content.length);
          setTotalPages(response.page?.totalPages || 1);
        } else {
          setDocuments([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      }
    } catch (error) {
      console.error("Error fetching external incoming documents:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu văn bản bên ngoài. Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setDocuments([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [activeSearchQuery, toast]);

  return {
    documents,
    loading,
    totalItems,
    totalPages,
    fetchExternalDocuments,
  };
}

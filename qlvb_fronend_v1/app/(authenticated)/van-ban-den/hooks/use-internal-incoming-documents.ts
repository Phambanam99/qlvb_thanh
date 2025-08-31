/**
 * Custom hook for managing internal documents (văn bản nội bộ đến)
 * Handle search, pagination, and read status for internal incoming documents
 */

"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  getReceivedDocumentsExcludingSent, 
  getAllReceivedDocumentsExcludingSent,
  getReceivedDocumentsByYear, // Add new API
  searchDocuments // Add search API
} from "@/lib/api/internalDocumentApi";

interface UseInternalIncomingDocumentsProps {
  activeSearchQuery: string;
  currentPage: number;
  pageSize: number;
  yearFilter?: number; // Add year filter
  monthFilter?: number; // Add month filter
}

export function useInternalIncomingDocuments({
  activeSearchQuery,
  currentPage,
  pageSize,
  yearFilter,
  monthFilter,
}: UseInternalIncomingDocumentsProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  const fetchInternalDocuments = useCallback(async (page = 0, size = 10) => {
    if (loading) return; // Prevent concurrent calls
    
    try {
      setLoading(true);
      
      let response;
      
      if (activeSearchQuery.trim()) {
        // Use search API when there's an active search query
        response = await searchDocuments(activeSearchQuery, page, size);
        
        if (response?.data?.content) {
          setDocuments(response.data.content);
          setTotalItems(response.data.totalElements || response.data.content.length);
          setTotalPages(response.data.totalPages || 1);
        } else if (response?.content) {
          // Fallback for different API structure
          setDocuments(response.content);
          setTotalItems(response.totalElements || response.content.length);
          setTotalPages(response.totalPages || 1);
        }
      } else if (yearFilter) {
        // Use year/month filter API when year is specified
        response = await getReceivedDocumentsByYear(yearFilter, monthFilter, page, size);
        
        if (response?.data?.content) {
          setDocuments(response.data.content);
          setTotalItems(response.data.totalElements || response.data.content.length);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setDocuments([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } else {
        // Use paginated API for normal browsing
        response = await getReceivedDocumentsExcludingSent(page, size);
        
        // getReceivedDocumentsExcludingSent returns {message: 'Success', data: {...}}
        if (response?.data?.content) {
          setDocuments(response.data.content);
          setTotalItems(response.data.totalElements || response.data.content.length);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setDocuments([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      }
    } catch (error) {
      console.error("Error fetching internal incoming documents:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu văn bản nội bộ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setDocuments([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [activeSearchQuery, yearFilter, monthFilter, toast]);

  return {
    documents,
    loading,
    totalItems,
    totalPages,
    fetchInternalDocuments,
  };
}

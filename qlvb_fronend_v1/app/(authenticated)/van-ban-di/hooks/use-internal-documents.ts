"use client";

import { useState } from "react";
import { getSentDocuments, getSentDocumentsByYear, searchDocuments } from "@/lib/api/internalDocumentApi";
import { useToast } from "@/components/ui/use-toast";
import { InternalDocument } from "@/lib/api/internalDocumentApi";

interface UseInternalDocumentsProps {
  activeSearchQuery: string;
  currentPage: number;
  pageSize: number;
  getReadStatus: (id: number) => any;
  updateMultipleReadStatus: (updates: any[]) => void;
  year?: number;
  month?: number;
}

export function useInternalDocuments({
  activeSearchQuery,
  currentPage,
  pageSize,
  getReadStatus,
  updateMultipleReadStatus,
  year,
  month,
}: UseInternalDocumentsProps) {
  const { toast } = useToast();
  const [internalDocuments, setInternalDocuments] = useState<InternalDocument[]>([]);
  const [loadingInternal, setLoadingInternal] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch internal documents
  const fetchInternalDocuments = async (
    page = currentPage,
    size = pageSize
  ) => {
    try {
      setLoadingInternal(true);
      
      let response_;
      let response;
      
      // Nếu có search query, sử dụng API search thay vì load tất cả documents
      if (activeSearchQuery.trim()) {
        response_ = await searchDocuments(activeSearchQuery.trim(), page, size);
        response = response_.data;
        
        if (response && response.content) {
          const documentsWithUpdatedReadStatus = response.content.map(
            (doc: InternalDocument) => {
              const globalReadStatus = getReadStatus(doc.id);
              if (
                globalReadStatus.isRead !== undefined &&
                globalReadStatus.isRead !== doc.isRead
              ) {
                return {
                  ...doc,
                  isRead: globalReadStatus.isRead,
                  readAt: globalReadStatus.readAt || doc.readAt,
                };
              }
              return doc;
            }
          );

          setInternalDocuments(documentsWithUpdatedReadStatus);

          // Cập nhật global read status với data từ server
          const readStatusUpdates = response.content.map(
            (doc: InternalDocument) => ({
              id: doc.id,
              isRead: doc.isRead,
              readAt: doc.readAt,
            })
          );
          updateMultipleReadStatus(readStatusUpdates);

          // Set pagination info from search results
          setTotalItems(response.totalElements || response.content.length);
          setTotalPages(response.totalPages || 1);
        }
      } else {
        // Sử dụng API mới theo year/month nếu có, fallback về getSentDocuments
        if (year) {
          response_ = await getSentDocumentsByYear(year, month, page, size);
          
        } else {
          response_ = await getSentDocuments(page, size);
        }
        response = response_.data;

        if (response && response.content) {
          // Cập nhật trạng thái đọc từ global state cho văn bản đi
          const documentsWithUpdatedReadStatus = response.content.map(
            (doc: InternalDocument) => {
              const globalReadStatus = getReadStatus(doc.id);
              if (
                globalReadStatus.isRead !== undefined &&
                globalReadStatus.isRead !== doc.isRead
              ) {
                return {
                  ...doc,
                  isRead: globalReadStatus.isRead,
                  readAt: globalReadStatus.readAt || doc.readAt,
                };
              }
              return doc;
            }
          );

          setInternalDocuments(documentsWithUpdatedReadStatus);

          // Cập nhật global read status với data từ server
          const readStatusUpdates = response.content.map(
            (doc: InternalDocument) => ({
              id: doc.id,
              isRead: doc.isRead,
              readAt: doc.readAt,
            })
          );
          updateMultipleReadStatus(readStatusUpdates);

          // Set pagination info if available
          if (response.totalElements !== undefined) {
            setTotalItems(
              Math.max(response.totalElements, response.content.length)
            );
          } else {
            setTotalItems(response.content.length);
          }

          if (response.totalPages !== undefined) {
            setTotalPages(Math.max(response.totalPages, 1));
          } else {
            setTotalPages(1);
          }
        }
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          "Không thể tải dữ liệu văn bản nội bộ. Vui lòng thử lại sau.",
        variant: "destructive",
      });
      setInternalDocuments([]);
    } finally {
      setLoadingInternal(false);
    }
  };

  return {
    documents: internalDocuments,
    loading: loadingInternal,
    totalItems,
    totalPages,
    fetchInternalDocuments,
  };
}

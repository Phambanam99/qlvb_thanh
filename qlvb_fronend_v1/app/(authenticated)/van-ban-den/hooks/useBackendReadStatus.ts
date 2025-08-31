/**
 * Hook for managing document read status from backend
 * Replaces frontend-only useUniversalReadStatus with backend API calls
 */

import { useState, useEffect, useCallback } from "react";
import {
  documentReadStatusAPI,
  DocumentType,
} from "@/lib/api/documentReadStatus";

interface UseBackendReadStatusProps {
  documents: any[];
  documentType: DocumentType;
  enabled?: boolean;
}

export function useBackendReadStatus({
  documents,
  documentType,
  enabled = true,
}: UseBackendReadStatusProps) {
  const [readStatuses, setReadStatuses] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch read status for all documents
  const fetchReadStatuses = useCallback(async () => {
    if (!enabled || !documents || documents.length === 0) {
    
      return;
    }

    try {
      setIsLoading(true);
      const documentIds = documents
        .map((doc) => doc.id)
        .filter((id) => id != null);

      if (documentIds.length === 0) {
        return;
      }

    

      const response = await documentReadStatusAPI.getBatchReadStatus(
        documentIds,
        documentType
      );


      // Backend returns Map<Long, Boolean> but keys might be numbers or strings
      const numericReadStatuses: Record<number, boolean> = {};

      // Handle both numeric keys and string keys
      Object.entries(response).forEach(([docId, isRead]) => {
        const numericId = typeof docId === "string" ? parseInt(docId) : docId;
        numericReadStatuses[numericId] = Boolean(isRead);
      });

  
      setReadStatuses(numericReadStatuses);
    } catch (error) {
      // Set all as unread on error
      const errorStatuses: Record<number, boolean> = {};
      documents.forEach((doc) => {
        if (doc.id != null) {
          errorStatuses[doc.id] = false;
        }
      });
      setReadStatuses(errorStatuses);
    } finally {
      setIsLoading(false);
    }
  }, [documents, documentType, enabled]);

  // Fetch read statuses when documents change
  useEffect(() => {
    fetchReadStatuses();
  }, [fetchReadStatuses]);

  // Get read status for a specific document
  const getReadStatus = useCallback(
    (documentId: number): boolean => {
      const status = readStatuses[documentId] ?? false;
    
      return status;
    },
    [readStatuses]
  );

  // Toggle read status for a document
  const toggleReadStatus = useCallback(
    async (documentId: number): Promise<void> => {
      try {
        const currentStatus = getReadStatus(documentId);
      

        if (currentStatus) {
          await documentReadStatusAPI.markAsUnread(documentId, documentType);
        } else {
          await documentReadStatusAPI.markAsRead(documentId, documentType);
        }

        // Update local state immediately for better UX
        setReadStatuses((prev) => ({
          ...prev,
          [documentId]: !currentStatus,
        }));


        // Refetch to ensure consistency with backend
        setTimeout(() => {
          fetchReadStatuses();
        }, 500);
      } catch (error) {
        // Revert local state on error
        fetchReadStatuses();
      }
    },
    [documentType, getReadStatus, fetchReadStatuses]
  );

  // Mark as read (for document click)
  const markAsRead = useCallback(
    async (documentId: number): Promise<void> => {
      try {
        await documentReadStatusAPI.markAsRead(documentId, documentType);

        // Update local state
        setReadStatuses((prev) => ({
          ...prev,
          [documentId]: true,
        }));

      } catch (error) {
      }
    },
    [documentType]
  );

  return {
    readStatuses,
    isLoading,
    getReadStatus,
    toggleReadStatus,
    markAsRead,
    refresh: fetchReadStatuses,
  };
}

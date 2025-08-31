"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  DocumentType, 
  documentReadStatusAPI,
  BatchReadStatusResponse 
} from "@/lib/api/documentReadStatus";

interface ReadStatusState {
  [key: string]: boolean; // documentId_documentType -> isRead
}

type UnreadCounts = {
  [key in DocumentType]?: number;
}

// Global state for read status across all document types
let globalReadStatus: ReadStatusState = {};
let globalUnreadCounts: UnreadCounts = {};
let loadingDocuments = new Set<string>(); // Track loading documents to prevent duplicates
const subscribers = new Set<() => void>();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

const getKey = (documentId: number, documentType: DocumentType): string => {
  return `${documentId}_${documentType}`;
};

export const useUniversalReadStatus = () => {
  const [, forceUpdate] = useState({});

  const subscribe = useCallback(() => {
    const callback = () => forceUpdate({});
    subscribers.add(callback);

    return () => {
      subscribers.delete(callback);
    };
  }, []);

  useEffect(() => {
    return subscribe();
  }, [subscribe]);

  /**
   * Mark a document as read
   */
  const markAsRead = useCallback(async (documentId: number, documentType: DocumentType) => {
    try {
      await documentReadStatusAPI.markAsRead(documentId, documentType);
      
      const key = getKey(documentId, documentType);
      globalReadStatus[key] = true;
      
      // Update unread count
      if (globalUnreadCounts[documentType] !== undefined && globalUnreadCounts[documentType]! > 0) {
        globalUnreadCounts[documentType] = globalUnreadCounts[documentType]! - 1;
      }
      
      notifySubscribers();
      
      // Trigger storage event for cross-tab synchronization
      if (typeof window !== "undefined") {
        localStorage.setItem("universalReadStatusUpdate", JSON.stringify({
          documentId,
          documentType,
          isRead: true,
          timestamp: Date.now()
        }));
        setTimeout(() => {
          localStorage.removeItem("universalReadStatusUpdate");
        }, 100);
      }
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Mark a document as unread
   */
  const markAsUnread = useCallback(async (documentId: number, documentType: DocumentType) => {
    try {
      await documentReadStatusAPI.markAsUnread(documentId, documentType);
      
      const key = getKey(documentId, documentType);
      globalReadStatus[key] = false;
      
      // Update unread count
      if (globalUnreadCounts[documentType] !== undefined) {
        globalUnreadCounts[documentType] = globalUnreadCounts[documentType]! + 1;
      }
      
      notifySubscribers();
      
      // Trigger storage event for cross-tab synchronization
      if (typeof window !== "undefined") {
        localStorage.setItem("universalReadStatusUpdate", JSON.stringify({
          documentId,
          documentType,
          isRead: false,
          timestamp: Date.now()
        }));
        setTimeout(() => {
          localStorage.removeItem("universalReadStatusUpdate");
        }, 100);
      }
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Get read status for a document
   */
  const getReadStatus = useCallback((documentId: number, documentType: DocumentType): boolean | undefined => {
    const key = getKey(documentId, documentType);
    return key in globalReadStatus ? globalReadStatus[key] : undefined;
  }, []);

  /**
   * Check if read status has been loaded for a document
   */
  const hasReadStatus = useCallback((documentId: number, documentType: DocumentType): boolean => {
    const key = getKey(documentId, documentType);
    return key in globalReadStatus;
  }, []);

  /**
   * Load read status for multiple documents using individual API calls
   */
  const loadBatchReadStatus = useCallback(async (documentIds: number[], documentType: DocumentType) => {
    try {
      // Validate input parameters
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        console.log("⚠️ loadBatchReadStatus: Invalid or empty documentIds array");
        return;
      }

      if (!documentType) {
        console.log("⚠️ loadBatchReadStatus: Missing documentType");
        return;
      }

      // Create loading key for this batch to prevent duplicates
      const loadingKey = `${documentIds.sort().join(',')}_${documentType}`;
      
      // Check if this batch is already loading
      if (loadingDocuments.has(loadingKey)) {
        console.log("⚠️ loadBatchReadStatus: Already loading this batch, skipping");
        return;
      }

      // Filter out documents that already have read status loaded
      const documentsToLoad = documentIds.filter(documentId => {
        const key = getKey(documentId, documentType);
        return !(key in globalReadStatus);
      });

      if (documentsToLoad.length === 0) {
        console.log("✅ loadBatchReadStatus: All documents already have read status loaded");
        return;
      }

      console.log("🔍 loadBatchReadStatus called with:", { documentsToLoad, documentType });

      // Mark as loading
      loadingDocuments.add(loadingKey);

      // Use individual API calls instead of batch API
      const promises = documentsToLoad.map(async (documentId) => {
        try {
          const response = await documentReadStatusAPI.isDocumentRead(documentId, documentType);
          // Response format: { message: "Success", data: { isRead: true } }
          const isRead = response.data?.isRead || false;
          return {
            documentId,
            isRead
          };
        } catch (error: any) {
          console.warn(`⚠️ Failed to get read status for document ${documentId}:`, error.message);
          return {
            documentId,
            isRead: false // Default to unread if error
          };
        }
      });

      const results = await Promise.all(promises);
      
      console.log("✅ loadBatchReadStatus individual results:", results);
      
      // Check if any read status actually changed before notifying
      let hasChanges = false;
      
      // Update global state
      results.forEach(({ documentId, isRead }) => {
        const key = getKey(documentId, documentType);
        const currentStatus = globalReadStatus[key];
        if (currentStatus !== Boolean(isRead)) {
          globalReadStatus[key] = Boolean(isRead);
          hasChanges = true;
        }
      });
      
      // Only notify if there were actual changes
      if (hasChanges) {
        notifySubscribers();
      }
      
      // Remove from loading set
      loadingDocuments.delete(loadingKey);
      
    } catch (error: any) {
      console.error("❌ loadBatchReadStatus error:", {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Remove from loading set even on error
      const loadingKey = `${documentIds.sort().join(',')}_${documentType}`;
      loadingDocuments.delete(loadingKey);
      
      // Don't throw the error to prevent breaking the UI
      // throw error;
    }
  }, []);

  /**
   * Load unread count for a document type
   */
  const loadUnreadCount = useCallback(async (documentType: DocumentType) => {
    try {
      const response = await documentReadStatusAPI.countUnreadDocuments(documentType);
      globalUnreadCounts[documentType] = response.unreadCount;
      notifySubscribers();
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Get unread count for a document type
   */
  const getUnreadCount = useCallback((documentType: DocumentType): number => {
    return globalUnreadCounts[documentType] ?? 0;
  }, []);

  /**
   * Toggle read status
   */
  const toggleReadStatus = useCallback(async (documentId: number, documentType: DocumentType) => {
    const currentStatus = getReadStatus(documentId, documentType);
    if (currentStatus) {
      await markAsUnread(documentId, documentType);
    } else {
      await markAsRead(documentId, documentType);
    }
  }, [getReadStatus, markAsRead, markAsUnread]);

  /**
   * Clear all read status (useful for logout)
   */
  const clearAllReadStatus = useCallback(() => {
    globalReadStatus = {};
    globalUnreadCounts = {};
    loadingDocuments.clear(); // Clear loading state too
    notifySubscribers();
  }, []);

  return {
    markAsRead,
    markAsUnread,
    getReadStatus,
    hasReadStatus,
    loadBatchReadStatus,
    loadUnreadCount,
    getUnreadCount,
    toggleReadStatus,
    clearAllReadStatus,
  };
};

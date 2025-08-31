"use client";

import { useCallback, useRef } from "react";
import { useUniversalReadStatus } from "./use-universal-read-status";
import { DocumentType } from "@/lib/api/documentReadStatus";

/**
 * Optimized hook for managing document read status
 * Prevents infinite loops and unnecessary re-renders
 */
export function useOptimizedReadStatus() {
  const universalReadStatus = useUniversalReadStatus();
  const loadingRef = useRef<Set<string>>(new Set());

  // Debounced batch loading to prevent multiple calls
  const loadBatchReadStatus = useCallback(
    async (documentIds: number[], documentType: DocumentType) => {
      if (documentIds.length === 0) return;

      const key = `${documentType}-${documentIds.sort().join(",")}`;
      
      // Prevent duplicate loading
      if (loadingRef.current.has(key)) {
        return;
      }

      try {
        loadingRef.current.add(key);
        await universalReadStatus.loadBatchReadStatus(documentIds, documentType);
      } catch (error) {
      } finally {
        // Remove from loading set after a delay to prevent immediate re-loading
        setTimeout(() => {
          loadingRef.current.delete(key);
        }, 1000);
      }
    },
    [universalReadStatus]
  );

  // Optimized mark as read with error handling
  const markAsRead = useCallback(
    async (documentId: number, documentType: DocumentType) => {
      try {
        await universalReadStatus.markAsRead(documentId, documentType);
        return true;
      } catch (error) {
        return false;
      }
    },
    [universalReadStatus]
  );

  // Optimized mark as unread with error handling
  const markAsUnread = useCallback(
    async (documentId: number, documentType: DocumentType) => {
      try {
        await universalReadStatus.markAsUnread(documentId, documentType);
        return true;
      } catch (error) {
        return false;
      }
    },
    [universalReadStatus]
  );

  // Optimized toggle with error handling
  const toggleReadStatus = useCallback(
    async (documentId: number, documentType: DocumentType) => {
      try {
        await universalReadStatus.toggleReadStatus(documentId, documentType);
        return true;
      } catch (error) {
        return false;
      }
    },
    [universalReadStatus]
  );

  // Get read status (no async needed)
  const getReadStatus = useCallback(
    (documentId: number, documentType: DocumentType) => {
      return universalReadStatus.getReadStatus(documentId, documentType);
    },
    [universalReadStatus]
  );

  // Subscribe to changes (should only be called once)
  const subscribe = useCallback(() => {
    return universalReadStatus.subscribe();
  }, [universalReadStatus]);

  return {
    loadBatchReadStatus,
    markAsRead,
    markAsUnread,
    toggleReadStatus,
    getReadStatus,
    subscribe,
    // Expose original methods for compatibility
    universalReadStatus,
  };
}

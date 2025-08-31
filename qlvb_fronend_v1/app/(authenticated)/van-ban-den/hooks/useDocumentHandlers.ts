/**
 * Document handlers hook
 * Centralized event handlers for document interactions
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface UseDocumentHandlersProps {
  onInternalDocumentRead?: (docId: number) => Promise<void>;
  onExternalDocumentRead?: (docId: number) => Promise<void>;
  onExternalReadStatusToggle?: (docId: number) => Promise<void>;
  getExternalReadStatus?: (docId: number) => boolean;
}

export function useDocumentHandlers({
  onInternalDocumentRead,
  onExternalDocumentRead,
  onExternalReadStatusToggle,
  getExternalReadStatus,
}: UseDocumentHandlersProps) {
  const router = useRouter();

  const handleInternalDocumentClick = useCallback(
    async (doc: any) => {
      try {
        // Mark as read when clicked
        if (onInternalDocumentRead && doc.id) {
          await onInternalDocumentRead(doc.id);
        }

        // Navigate to detail page
        router.push(`/van-ban-den/noi-bo/${doc.id}`);
      } catch (error) {
        // Still navigate even if read status fails
        router.push(`/van-ban-den/noi-bo/${doc.id}`);
      }
    },
    [router, onInternalDocumentRead]
  );

  const handleExternalDocumentClick = useCallback(
    async (doc: any) => {
      try {
        // Mark as read when clicked
        if (onExternalDocumentRead && doc.id) {
          await onExternalDocumentRead(doc.id);
        }

        // Navigate to detail page - use correct route
        router.push(`/van-ban-den/${doc.id}`);
      } catch (error) {
        // Still navigate even if read status fails
        router.push(`/van-ban-den/${doc.id}`);
      }
    },
    [router, onExternalDocumentRead]
  );

  const handleExternalReadStatusToggle = useCallback(
    async (docId: number) => {
      try {
        if (onExternalReadStatusToggle) {
          await onExternalReadStatusToggle(docId);
        }
      } catch (error) {
      }
    },
    [onExternalReadStatusToggle]
  );

  const getExternalReadStatusWrapper = useCallback(
    (docId: number): boolean => {
      const status = getExternalReadStatus
        ? getExternalReadStatus(docId)
        : false;
     
      return status;
    },
    [getExternalReadStatus]
  );

  return {
    handleInternalDocumentClick,
    handleExternalDocumentClick,
    handleExternalReadStatusToggle,
    getExternalReadStatus: getExternalReadStatusWrapper,
  };
}

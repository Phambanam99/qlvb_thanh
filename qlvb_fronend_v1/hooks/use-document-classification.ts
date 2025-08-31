import { useState, useEffect } from "react";
import {
  incomingDocumentsAPI,
  DocumentClassificationResponse,
} from "@/lib/api/incomingDocuments";

export interface UseDocumentClassificationReturn {
  classification: DocumentClassificationResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to get document classification status for current user
 * @param documentId - Document ID to get classification for
 * @param enabled - Whether to fetch classification data (default: true)
 * @returns Classification data, loading state, error state, and refetch function
 */
export function useDocumentClassification(
  documentId: number,
  enabled: boolean = true
): UseDocumentClassificationReturn {
  const [classification, setClassification] =
    useState<DocumentClassificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassification = async () => {
    if (!documentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await incomingDocumentsAPI.getDocumentClassification(
        documentId
      );
      setClassification(result);
      // console.log("Classification fetched:", result);
    } catch (err: any) {
      // Handle 404 errors more gracefully - don't log as errors for missing classifications
      if (err?.response?.status === 404) {
        setError("CLASSIFICATION_NOT_FOUND");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to fetch classification"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch if explicitly disabled
    if (!enabled) {
      return;
    }
    
    fetchClassification();
  }, [documentId, enabled]);

  const refetch = async () => {
    await fetchClassification();
  };

  return {
    classification,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get classification for multiple documents
 * @param documentIds - Array of document IDs
 * @returns Map of document classifications indexed by document ID
 */
export function useMultipleDocumentClassifications(documentIds: number[]): {
  classifications: Record<number, DocumentClassificationResponse>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [classifications, setClassifications] = useState<
    Record<number, DocumentClassificationResponse>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassifications = async () => {
    if (!documentIds.length) return;

    setIsLoading(true);
    setError(null);

    try {
      const promises = documentIds.map(async (id) => {
        try {
          const result = await incomingDocumentsAPI.getDocumentClassification(
            id
          );
          return { id, classification: result };
        } catch (err: any) {
          // Handle 404 errors more gracefully
          if (err?.response?.status === 404) {
          } else {
           
          }
          return { id, classification: null };
        }
      });

      const results = await Promise.all(promises);

      const newClassifications: Record<number, DocumentClassificationResponse> =
        {};
      results.forEach(({ id, classification }) => {
        if (classification) {
          newClassifications[id] = classification;
        }
      });
      // console.log("Classifications fetched:", newClassifications);

      setClassifications(newClassifications);
      
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch classifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassifications();
  }, [documentIds.join(",")]);

  const refetch = async () => {
    await fetchClassifications();
  };

  return {
    classifications,
    isLoading,
    error,
    refetch,
  };
}

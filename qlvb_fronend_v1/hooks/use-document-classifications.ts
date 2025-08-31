import { useState, useEffect } from "react";
import {
  incomingDocumentsAPI,
  DocumentClassificationResponse,
} from "@/lib/api/incomingDocuments";

export interface UseDocumentClassificationsReturn {
  classifications: Record<number, DocumentClassificationResponse>;
  isLoading: boolean;
  error: string | null;
  getClassificationByDocId: (
    docId: number
  ) => DocumentClassificationResponse | null;
}

/**
 * Hook to get document classifications for multiple documents
 * @param documentIds - Array of document IDs to get classifications for
 * @returns Classifications data, loading state, error state, and getter function
 */
export function useDocumentClassifications(
  documentIds: number[]
): UseDocumentClassificationsReturn {
  const [classifications, setClassifications] = useState<
    Record<number, DocumentClassificationResponse>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClassifications = async (docIds: number[]) => {
    if (docIds.length === 0) {
      setClassifications({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch classifications for all documents in parallel
      const promises = docIds.map(async (docId) => {
        try {
          const classification_  = await incomingDocumentsAPI.getDocumentClassification(docId);
          const classification = classification_.data;
          return { docId, classification };
        } catch (err) {
         
          return null;
        }
      });

      const results = await Promise.all(promises);

      // Build classifications record
      const newClassifications: Record<number, DocumentClassificationResponse> =
        {};
      results.forEach((result) => {
        if (result) {
          newClassifications[result.docId] = result.classification;
        }
      });

      setClassifications(newClassifications);
    } catch (err: any) {
      setError(err.message || "Failed to fetch document classifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassifications(documentIds);
  }, [JSON.stringify(documentIds)]); // Use JSON.stringify for deep comparison

  const getClassificationByDocId = (
    docId: number
  ): DocumentClassificationResponse | null => {
    return classifications[docId] || null;
  };

  return {
    classifications,
    isLoading,
    error,
    getClassificationByDocId,
  };
}

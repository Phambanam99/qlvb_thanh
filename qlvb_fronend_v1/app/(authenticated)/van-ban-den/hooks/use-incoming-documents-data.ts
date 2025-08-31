/**
 * Simplified Custom hook for managing incoming documents data
 * Reduces complexity while maintaining the same UI interface
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useIncomingDocuments } from "@/lib/store";
import { DocumentFilters, PaginationState, DocumentTab } from "../types";
import {
  getReceivedDocumentsExcludingSent,
  getAllReceivedDocumentsExcludingSent,
  InternalDocument,
} from "@/lib/api/internalDocumentApi";
import { incomingDocumentsAPI } from "@/lib/api/incomingDocuments";

export interface UseIncomingDocumentsProps {
  initialFilters?: Partial<DocumentFilters>;
  initialPagination?: Partial<PaginationState>;
  activeTab?: DocumentTab; // Add activeTab prop
}

export const useIncomingDocumentsData = (
  props: UseIncomingDocumentsProps = {}
) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    incomingDocuments,
    loading: storeLoading,
    setIncomingDocuments,
    setLoading: setStoreLoading,
  } = useIncomingDocuments();

  // Use activeTab from props or default to "internal"
  const activeTab = props.activeTab || "internal";

  // Debug logging
  const [filters, setFilters] = useState<DocumentFilters>({
    searchQuery: "",
    statusFilter: "all",
    departmentFilter: "all",
    issuingAuthorityFilter: "all",
    startDate: "",
    endDate: "",
    processingStatusTab: "pending",
    ...props.initialFilters,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0,
    ...props.initialPagination,
  });

  // Document state
  const [internalDocuments, setInternalDocuments] = useState<
    InternalDocument[]
  >([]);
  const [loadingInternal, setLoadingInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Control refs
  const initialLoadComplete = useRef(false);
  const fetchInProgressRef = useRef(false);

  /**
   * Single unified fetch function with debouncing
   */
  const fetchDocuments = useCallback(
    async (page = 0, size = pagination.pageSize, resetPagination = false) => {
      // Prevent multiple concurrent calls
      if (fetchInProgressRef.current) {
        return;
      }

      if (!user) {
        return;
      }

      try {
        fetchInProgressRef.current = true;
        setError(null);


        if (activeTab === "internal") {
          setLoadingInternal(true);

          // Simple logic: use search endpoint if search query exists, otherwise paginated
          const response = filters.searchQuery.trim()
            ? await getAllReceivedDocumentsExcludingSent()
            : await getReceivedDocumentsExcludingSent(page, size);

          if (response?.data) {
            const documents = filters.searchQuery.trim()
              ? response.data
              : response.data.content || [];

            setInternalDocuments(documents);

            if (resetPagination || filters.searchQuery.trim()) {
              setPagination((prev) => ({
                ...prev,
                currentPage: page,
                pageSize: size,
                totalItems: filters.searchQuery.trim()
                  ? response.data.length
                  : response.data.totalElements || documents.length,
                totalPages: filters.searchQuery.trim()
                  ? 1
                  : response.data.totalPages || 1,
              }));
            }
          }
        } else {
          setStoreLoading(true);

          const response = await incomingDocumentsAPI.getAllDocuments(
            page,
            size
          );

          if (response?.content) {
            setIncomingDocuments(response.content);

            if (resetPagination) {
              setPagination((prev) => ({
                ...prev,
                currentPage: page,
                pageSize: size,
                totalItems:
                  response.page?.totalElements || response.content.length,
                totalPages: response.page?.totalPages || 1,
              }));
            }
          }
        }
      } catch (error) {
        const errorMessage =
          activeTab === "internal"
            ? "Không thể tải dữ liệu văn bản nội bộ. Vui lòng thử lại sau."
            : "Không thể tải dữ liệu văn bản. Vui lòng thử lại sau.";

        setError(errorMessage);
        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });

        // Reset data on error
        if (activeTab === "internal") {
          setInternalDocuments([]);
        } else {
          setIncomingDocuments([]);
        }
      } finally {
        setLoadingInternal(false);
        setStoreLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [
      user,
      activeTab,
      filters.searchQuery,
      pagination.pageSize,
      setIncomingDocuments,
      setStoreLoading,
      toast,
    ]
  );

  /**
   * Update filters and trigger refetch
   */
  const updateFilters = useCallback(
    (newFilters: Partial<DocumentFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      // Reset to first page when filters change
      fetchDocuments(0, pagination.pageSize, true);
    },
    [fetchDocuments, pagination.pageSize]
  );

  /**
   * Update pagination
   */
  const updatePagination = useCallback(
    (newPagination: Partial<PaginationState>) => {
      setPagination((prev) => {
        const updated = { ...prev, ...newPagination };

        // Trigger fetch if page changed
        if (
          newPagination.currentPage !== undefined &&
          newPagination.currentPage !== prev.currentPage
        ) {
          fetchDocuments(newPagination.currentPage, updated.pageSize);
        }

        return updated;
      });
    },
    [fetchDocuments]
  );

  /**
   * Manual refresh
   */
  const refresh = useCallback(() => {
    fetchDocuments(pagination.currentPage, pagination.pageSize, true);
  }, [fetchDocuments, pagination.currentPage, pagination.pageSize]);

  // Initial load effect
  useEffect(() => {
    if (!user || initialLoadComplete.current) {
      return;
    }

    initialLoadComplete.current = true;
    fetchDocuments(0, pagination.pageSize, true);
  }, [user, fetchDocuments, pagination.pageSize]);

  // Filter changes effect (excluding searchQuery which is handled in updateFilters)
  useEffect(() => {
    if (!initialLoadComplete.current) {
      return;
    }

    fetchDocuments(0, pagination.pageSize, true);
  }, [
    activeTab, // Add activeTab as dependency
    filters.statusFilter,
    filters.departmentFilter,
    filters.processingStatusTab,
    fetchDocuments,
    pagination.pageSize,
    // Note: searchQuery is excluded here to prevent double-fetching
  ]);

  // Client-side filtering for external documents
  const getFilteredDocuments = useCallback(() => {
    const rawDocuments =
      activeTab === "internal" ? internalDocuments : incomingDocuments;

    if (activeTab === "internal" || !rawDocuments) {
      return rawDocuments;
    }

    // Apply processing status filter for external documents
    return rawDocuments.filter((doc: any) => {
      // Processing status filter
      if (
        filters.processingStatusTab &&
        filters.processingStatusTab !== "all"
      ) {
        const status = doc.trackingStatus?.toUpperCase() || "";
        const docTabCode =
          status === "PROCESSED"
            ? "completed"
            : status === "NOT_PROCESSED" || status === ""
            ? "not_processed"
            : "pending";

        if (docTabCode !== filters.processingStatusTab) {
          return false;
        }
      }

      // Department filter
      if (filters.departmentFilter && filters.departmentFilter !== "all") {
        if (
          doc.recipientDepartmentId?.toString() !== filters.departmentFilter
        ) {
          return false;
        }
      }

      // Issuing authority filter
      if (
        filters.issuingAuthorityFilter &&
        filters.issuingAuthorityFilter !== "all"
      ) {
        if (doc.issuingAuthority !== filters.issuingAuthorityFilter) {
          return false;
        }
      }

      // Search query filter
      if (filters.searchQuery.trim()) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          doc.documentNumber?.toLowerCase().includes(searchLower) ||
          doc.title?.toLowerCase().includes(searchLower) ||
          doc.issuingAuthority?.toLowerCase().includes(searchLower);

        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, internalDocuments, incomingDocuments, filters]);

  // Computed values
  const currentDocuments = getFilteredDocuments();
  const isLoading = activeTab === "internal" ? loadingInternal : storeLoading;

  return {
    // State
    activeTab,
    filters,
    pagination,
    currentDocuments,
    allDocuments:
      activeTab === "internal" ? internalDocuments : incomingDocuments, // Unfiltered data
    internalDocuments,
    externalDocuments: incomingDocuments,
    availableAuthorities: [], // Simplified - can be added back if needed
    isLoading,
    error,
    initialLoadComplete: initialLoadComplete.current,

    // Actions
    updateFilters,
    updatePagination,
    fetchDocuments,
    refresh,

    // Backward compatibility
    fetchInternalDocuments: () =>
      fetchDocuments(pagination.currentPage, pagination.pageSize),
    fetchExternalDocuments: () =>
      fetchDocuments(pagination.currentPage, pagination.pageSize),
  };
};

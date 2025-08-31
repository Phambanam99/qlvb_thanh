"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Globe } from "lucide-react";

// Import hooks và context
import { useAuth } from "@/lib/auth-context";
import { useHierarchicalDepartments } from "@/hooks/use-hierarchical-departments";
import { useDocumentReadStatus } from "@/hooks/use-document-read-status";
import { usePageVisibility } from "@/hooks/use-page-visibility";
import { useUniversalReadStatus } from "@/hooks/use-universal-read-status";

// Import components
import { SearchFilters } from "./components/search-filters";
import { InternalDocumentsTable } from "./components/internal-documents-table";
import { ExternalDocumentsTable } from "./components/external-documents-table";
import { PaginationControls } from "./components/pagination-controls";

// Import hooks cho documents
import { useInternalDocuments } from "./hooks/use-internal-documents";
import { useExternalDocuments } from "./hooks/use-external-documents";
import { PrintInternalDocumentsButton } from "@/components/print/print-internal-documents-button";

// Import types
import { InternalDocument } from "@/lib/api/internalDocumentApi";

// Interface for external documents (original format)
interface OutgoingDocument {
  id: number | string;
  number: string;
  title: string;
  sentDate: string;
  recipient: string;
  status: string;
  departmentId?: number;
  departmentName?: string;
}

export default function OutgoingDocumentsPage() {
  // Search và filter states - riêng biệt cho từng tab
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [externalSearchQuery, setExternalSearchQuery] = useState("");
  const [internalActiveSearchQuery, setInternalActiveSearchQuery] = useState("");
  const [externalActiveSearchQuery, setExternalActiveSearchQuery] = useState("");
  
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  
  // Filter states - separate current and active values
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);
  const [activeYearFilter, setActiveYearFilter] = useState<number>(new Date().getFullYear());
  const [activeMonthFilter, setActiveMonthFilter] = useState<number | undefined>(undefined);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("internal");

  // Hooks
  const { user, hasRole } = useAuth();
  const {
    visibleDepartments,
    loading: loadingDepartments,
    userDepartmentIds,
  } = useHierarchicalDepartments();

  const { subscribe, getReadStatus, updateMultipleReadStatus } =
    useDocumentReadStatus();
  const universalReadStatus = useUniversalReadStatus();
  const isPageVisible = usePageVisibility();

  // Custom hooks cho documents - sử dụng search riêng cho từng tab
  const internalDocsHook = useInternalDocuments({
    activeSearchQuery: internalActiveSearchQuery,
    currentPage,
    pageSize,
    getReadStatus,
    updateMultipleReadStatus,
    year: activeYearFilter,
    month: activeMonthFilter,
  });

  const externalDocsHook = useExternalDocuments({
    activeSearchQuery: externalActiveSearchQuery,
    currentPage,
    pageSize,
  });

  const hasFullAccess = hasRole([
    "ROLE_ADMIN",
    "ROLE_VAN_THU",
    "ROLE_CUC_TRUONG",
    "ROLE_CUC_PHO",
    "ROLE_CHINH_UY",
    "ROLE_PHO_CHINH_UY",
  ]);

  // Effects
  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, []);

  // Refresh data when page becomes visible again
  useEffect(() => {
    if (isPageVisible && user && !loadingDepartments) {
      setTimeout(() => {
        fetchDocuments(currentPage, pageSize);
      }, 100);
    }
  }, [isPageVisible]);

  // Main fetch function
  const fetchDocuments = async (page = currentPage, size = pageSize) => {
    if (activeTab === "internal") {
      await internalDocsHook.fetchInternalDocuments(page, size);
    } else {
      await externalDocsHook.fetchExternalDocuments(page, size);
    }
  };

  // Effects để load data - sử dụng activeSearchQuery phù hợp với tab
  useEffect(() => {
    if (!user || loadingDepartments) return;
    setCurrentPage(0);
    setTimeout(() => {
      fetchDocuments(0, pageSize);
    }, 50);
  }, [user?.id, statusFilter, activeTab, loadingDepartments, activeYearFilter, activeMonthFilter, internalActiveSearchQuery, externalActiveSearchQuery]);

  useEffect(() => {
    if (user && (currentPage > 0 || pageSize !== 10)) {
      fetchDocuments(currentPage, pageSize);
    }
  }, [currentPage, pageSize, user?.id]);

  // Load read status
  useEffect(() => {
    if (externalDocsHook.documents.length > 0) {
      const documentIds = externalDocsHook.documents
        .map((doc: any) => Number(doc.id))
        .filter((id: any) => !isNaN(id));
      if (documentIds.length > 0) {
        universalReadStatus.loadBatchReadStatus(
          documentIds,
          "OUTGOING_EXTERNAL"
        );
      }
    }
  }, [externalDocsHook.documents.length]);

  useEffect(() => {
    if (internalDocsHook.documents.length > 0) {
      const documentIds = internalDocsHook.documents.map((doc: any) => doc.id);
      if (documentIds.length > 0) {
        universalReadStatus.loadBatchReadStatus(
          documentIds,
          "OUTGOING_INTERNAL"
        );
      }
    }
  }, [internalDocsHook.documents.length]);

  // Helper functions
  const getChildDepartmentIds = (departmentId: string) => {
    if (departmentId === "all") return [];
    const selectedDept = visibleDepartments.find(
      (d: any) => d.id.toString() === departmentId
    );
    if (!selectedDept) return [];

    const childIds: number[] = [];
    const collectChildIds = (dept: any) => {
      if (dept.children && dept.children.length > 0) {
        dept.children.forEach((child: any) => {
          childIds.push(child.id);
          collectChildIds(child);
        });
      }
    };

    collectChildIds(selectedDept);
    return [Number(departmentId), ...childIds];
  };

  // Search handlers - riêng biệt cho từng tab
  const handleSearch = () => {
    if (activeTab === "internal") {
      setInternalActiveSearchQuery(internalSearchQuery);
      // Apply filters at the same time when search
      setActiveYearFilter(yearFilter);
      setActiveMonthFilter(monthFilter);
    } else {
      setExternalActiveSearchQuery(externalSearchQuery);
    }
    setCurrentPage(0);
  };

  const handleApplyFilters = () => {
    // Apply year/month filters for internal tab
    if (activeTab === "internal") {
      setActiveYearFilter(yearFilter);
      setActiveMonthFilter(monthFilter);
      setCurrentPage(0);
    }
  };

  const handleClearSearch = () => {
    if (activeTab === "internal") {
      setInternalSearchQuery("");
      setInternalActiveSearchQuery("");
    } else {
      setExternalSearchQuery("");
      setExternalActiveSearchQuery("");
    }
    setCurrentPage(0);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Tab change handler - clear search khi đổi tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(0);
    // Reset search khi đổi tab để tránh confusion
    if (value === "internal") {
      setExternalSearchQuery("");
      setExternalActiveSearchQuery("");
    } else {
      setInternalSearchQuery("");
      setInternalActiveSearchQuery("");
    }
  };

  // Filter handlers
  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setCurrentPage(0);
  };

  const handleYearFilterChange = (value: number) => {
    setYearFilter(value);
    // Không gọi API ngay, chỉ cập nhật state
  };

  const handleMonthFilterChange = (value: number | undefined) => {
    setMonthFilter(value);
    // Không gọi API ngay, chỉ cập nhật state
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setYearFilter(new Date().getFullYear());
    setMonthFilter(undefined);
    setActiveYearFilter(new Date().getFullYear());
    setActiveMonthFilter(undefined);
    setStatusFilter("all");
    setDepartmentFilter("all");
    // Clear search theo tab hiện tại
    if (activeTab === "internal") {
      setInternalSearchQuery("");
      setInternalActiveSearchQuery("");
    } else {
      setExternalSearchQuery("");
      setExternalActiveSearchQuery("");
    }
    setCurrentPage(0);
  };

  // Cross-tab read status synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "universalReadStatusUpdate" && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          if (update.documentType === "OUTGOING_INTERNAL" || update.documentType === "OUTGOING_EXTERNAL") {
            // Force refresh of documents to update read status
            if (activeTab === "internal" && update.documentType === "OUTGOING_INTERNAL") {
              // Re-trigger internal documents hook
              setCurrentPage(currentPage);
            } else if (activeTab === "external" && update.documentType === "OUTGOING_EXTERNAL") {
              // Re-trigger external documents hook  
              setCurrentPage(currentPage);
            }
          }
        } catch (error) {
          // Ignore invalid JSON
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const update = e.detail;
      if (update.documentType === "OUTGOING_INTERNAL" || update.documentType === "OUTGOING_EXTERNAL") {
        // Force refresh of documents to update read status
        if (activeTab === "internal" && update.documentType === "OUTGOING_INTERNAL") {
          // Re-trigger internal documents hook
          setCurrentPage(currentPage);
        } else if (activeTab === "external" && update.documentType === "OUTGOING_EXTERNAL") {
          // Re-trigger external documents hook
          setCurrentPage(currentPage);
        }
      }
    };

    // Listen for storage events (cross-tab)
    window.addEventListener("storage", handleStorageChange);
    
    // Listen for custom events (same tab) 
    window.addEventListener("documentReadStatusChanged", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("documentReadStatusChanged", handleCustomEvent as EventListener);
    };
  }, [activeTab, currentPage]);

  // Document click handlers
  const handleInternalDocumentClick = async (doc: InternalDocument) => {
    try {
      const currentReadStatus = universalReadStatus.getReadStatus(
        doc.id,
        "OUTGOING_INTERNAL"
      );

      if (!currentReadStatus) {
        try {
          await universalReadStatus.markAsRead(doc.id, "OUTGOING_INTERNAL");
          
          // Trigger cross-tab sync
          if (typeof window !== "undefined") {
            const eventData = {
              documentId: doc.id,
              documentType: "OUTGOING_INTERNAL",
              isRead: true,
              timestamp: Date.now(),
              source: 'list-page-click'
            };
            
            localStorage.setItem("universalReadStatusUpdate", JSON.stringify(eventData));
            setTimeout(() => {
              localStorage.removeItem("universalReadStatusUpdate");
            }, 100);
            
            // Also dispatch custom event for immediate sync
            window.dispatchEvent(new CustomEvent("documentReadStatusChanged", {
              detail: eventData
            }));
          }
        } catch (markError) {
          // Continue even if marking fails
        }
      }

      window.location.href = `/van-ban-di/noi-bo/${doc.id}`;
    } catch (error) {
      window.location.href = `/van-ban-di/noi-bo/${doc.id}`;
    }
  };

  const handleExternalDocumentClick = async (doc: OutgoingDocument) => {
    try {
      const currentReadStatus = universalReadStatus.getReadStatus(
        Number(doc.id),
        "OUTGOING_EXTERNAL"
      );

      if (!currentReadStatus) {
        try {
          await universalReadStatus.markAsRead(
            Number(doc.id),
            "OUTGOING_EXTERNAL"
          );
          
          // Trigger cross-tab sync
          if (typeof window !== "undefined") {
            const eventData = {
              documentId: Number(doc.id),
              documentType: "OUTGOING_EXTERNAL",
              isRead: true,
              timestamp: Date.now(),
              source: 'list-page-click'
            };
            
            localStorage.setItem("universalReadStatusUpdate", JSON.stringify(eventData));
            setTimeout(() => {
              localStorage.removeItem("universalReadStatusUpdate");
            }, 100);
            
            // Also dispatch custom event for immediate sync
            window.dispatchEvent(new CustomEvent("documentReadStatusChanged", {
              detail: eventData
            }));
          }
        } catch (markError) {
          // Continue even if marking fails
        }
      }

      window.location.href = `/van-ban-di/${doc.id}`;
    } catch (error) {
      window.location.href = `/van-ban-di/${doc.id}`;
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDocuments(page, pageSize);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  // Get current state
  const isLoading = activeTab === "internal" ? 
    internalDocsHook.loading : 
    externalDocsHook.loading;

  const currentDocuments = activeTab === "internal" ? 
    internalDocsHook.documents : 
    externalDocsHook.documents;

  const totalItems = activeTab === "internal" ? 
    internalDocsHook.totalItems : 
    externalDocsHook.totalItems;

  const totalPages = activeTab === "internal" ? 
    internalDocsHook.totalPages : 
    externalDocsHook.totalPages;

  if (isLoading || loadingDepartments) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SearchFilters
        searchQuery={activeTab === "internal" ? internalSearchQuery : externalSearchQuery}
        setSearchQuery={activeTab === "internal" ? setInternalSearchQuery : setExternalSearchQuery}
        activeSearchQuery={activeTab === "internal" ? internalActiveSearchQuery : externalActiveSearchQuery}
        departmentFilter={departmentFilter}
        yearFilter={yearFilter}
        monthFilter={monthFilter}
        statusFilter={statusFilter}
        activeTab={activeTab}
        hasFullAccess={hasFullAccess}
        visibleDepartments={visibleDepartments}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onSearchKeyPress={handleSearchKeyPress}
        onDepartmentFilterChange={handleDepartmentFilterChange}
        onYearFilterChange={handleYearFilterChange}
        onMonthFilterChange={handleMonthFilterChange}
        onApplyFilters={handleApplyFilters}
        onStatusFilterChange={handleStatusFilterChange}
        onClearFilters={handleClearFilters}
        onTabChange={handleTabChange}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
    

        <TabsContent value="internal" className="mt-6">
          <InternalDocumentsTable
            documents={internalDocsHook.documents}
            isLoading={internalDocsHook.loading}
            universalReadStatus={universalReadStatus}
            onDocumentClick={handleInternalDocumentClick}
          />
        </TabsContent>
      </Tabs>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        documentsLength={currentDocuments.length}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

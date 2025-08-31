"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, Globe } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useHierarchicalDepartments } from "@/hooks/use-hierarchical-departments";
import { useBackendReadStatus } from "./hooks/useBackendReadStatus";
// Add universal read status for internal documents
import { useUniversalReadStatus } from "@/hooks/use-universal-read-status";

// Import new components and hooks
import { SearchFilters } from "./components/SearchFilters";
import { InternalDocumentsTable } from "./components/InternalDocumentsTable";
import { ExternalDocumentsTable } from "./components/ExternalDocumentsTable";
import { DocumentPagination } from "./components/DocumentPagination";

// Import new custom hooks
import { useInternalIncomingDocuments } from "./hooks/use-internal-incoming-documents";
import { useExternalIncomingDocuments } from "./hooks/use-external-incoming-documents";
import { PrintInternalDocumentsButton } from "@/components/print/print-internal-documents-button";

// Custom hooks (keep existing)
import { useDocumentHandlers } from "./hooks/useDocumentHandlers";

// Utils
import {
  formatDate,
  getDocumentCountByStatus,
  extractAvailableAuthorities,
} from "./utils/documentUtils";

// Constants
const FULL_ACCESS_ROLES = [
  "ROLE_ADMIN",
  "ROLE_VAN_THU",
  "ROLE_CUC_TRUONG",
  "ROLE_CUC_PHO",
  "ROLE_CHINH_UY",
  "ROLE_PHO_CHINH_UY",
];

export default function IncomingDocumentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();

  // Tab-specific search states - similar to văn bản đi
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [externalSearchQuery, setExternalSearchQuery] = useState("");
  const [internalActiveSearchQuery, setInternalActiveSearchQuery] = useState("");
  const [externalActiveSearchQuery, setExternalActiveSearchQuery] = useState("");

  // Year/month filter states for internal documents
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);
  const [activeYearFilter, setActiveYearFilter] = useState<number>(new Date().getFullYear());
  const [activeMonthFilter, setActiveMonthFilter] = useState<number | undefined>(undefined);

  // Filter states (keeping existing structure for now)
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [issuingAuthorityFilter, setIssuingAuthorityFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Local state
  const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
  const [availableAuthorities, setAvailableAuthorities] = useState<string[]>([]);
  const [isAddLoading, setIsAddLoading] = useState(false);

  // Hooks
  const { visibleDepartments, loading: loadingDepartments } = useHierarchicalDepartments();
  
  // Universal read status for internal documents
  const universalReadStatus = useUniversalReadStatus();

  // Custom hooks cho documents - sử dụng search riêng cho từng tab
  const internalDocsHook = useInternalIncomingDocuments({
    activeSearchQuery: internalActiveSearchQuery,
    currentPage,
    pageSize,
    yearFilter: activeYearFilter,
    monthFilter: activeMonthFilter,
  });

  const externalDocsHook = useExternalIncomingDocuments({
    activeSearchQuery: externalActiveSearchQuery,
    currentPage,
    pageSize,
  });

  // Permission checks
  const hasFullAccess = FULL_ACCESS_ROLES.some((role) => hasRole(role));
  const hasVanThuRole = hasRole("ROLE_VAN_THU");

  // Backend read status for external documents
  const externalReadStatus = useBackendReadStatus({
    documents: externalDocsHook.documents || [],
    documentType: "INCOMING_EXTERNAL",
    enabled: activeTab === "external" && Boolean(externalDocsHook.documents?.length),
  });

  // Create document handlers with backend read status
  const documentHandlers = useDocumentHandlers({
    onInternalDocumentRead: async (docId: number) => {
      // Will implement when internal documents need read status
    },
    onExternalDocumentRead: async (docId: number) => {
      await externalReadStatus.markAsRead(docId);
    },
    onExternalReadStatusToggle: async (docId: number) => {
      await externalReadStatus.toggleReadStatus(docId);
    },
    getExternalReadStatus: (docId: number) => {
      return externalReadStatus.getReadStatus(docId);
    },
  });

  // Handle URL parameters
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "internal" || tabParam === "external") {
      setActiveTab(tabParam as "internal" | "external");
    }
  }, [searchParams]);

  // Effects để load data khi cần thiết
  useEffect(() => {
    if (!user || loadingDepartments) {
      return;
    }
    
    setCurrentPage(0);
    
    // Fetch data ngay lập tức cho tab hiện tại - gọi trực tiếp
    const timeoutId = setTimeout(() => {
      if (activeTab === "internal") {
        internalDocsHook.fetchInternalDocuments(0, pageSize);
      } else {
        externalDocsHook.fetchExternalDocuments(0, pageSize);
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [user?.id, statusFilter, activeTab, loadingDepartments, dateFromFilter, dateToFilter, internalActiveSearchQuery, externalActiveSearchQuery, activeYearFilter, activeMonthFilter, pageSize]);
  // NOTE: KHÔNG thêm internalDocsHook.fetchInternalDocuments vào dependencies - sẽ gây infinite loop

  // Effect riêng cho pagination
  useEffect(() => {
    if (!user || loadingDepartments) return;
    if (currentPage === 0 && pageSize === 10) return; // Skip initial values
    
    if (activeTab === "internal") {
      internalDocsHook.fetchInternalDocuments(currentPage, pageSize);
    } else {
      externalDocsHook.fetchExternalDocuments(currentPage, pageSize);
    }
  }, [currentPage, pageSize, user?.id, activeTab, loadingDepartments]);
  // NOTE: KHÔNG thêm hook functions vào dependencies - sẽ gây infinite loop

  // Extract available authorities
  useEffect(() => {
    if (activeTab === "external") {
      const authorities = extractAvailableAuthorities(externalDocsHook.documents || []);
      setAvailableAuthorities(authorities);
    }
  }, [externalDocsHook.documents, activeTab]);

  // Load read status for internal documents
  useEffect(() => {
    if (activeTab === "internal" && internalDocsHook.documents?.length > 0) {
      const documentIds = internalDocsHook.documents.map((doc: any) => doc.id);
      universalReadStatus.loadBatchReadStatus(
        documentIds,
        "INCOMING_INTERNAL"
      );
    }
  }, [internalDocsHook.documents, activeTab, universalReadStatus]);

  // Listen for read status updates from detail page or other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "documentReadStatusUpdate" && e.newValue) {
        try {
          const update = JSON.parse(e.newValue);
          if (update.documentType === "INCOMING_INTERNAL" && activeTab === "internal") {
            // Refresh read status for internal documents
            if (internalDocsHook.documents?.length > 0) {
              const documentIds = internalDocsHook.documents.map((doc: any) => doc.id);
              universalReadStatus.loadBatchReadStatus(
                documentIds,
                "INCOMING_INTERNAL"
              );
            }
          }
        } catch (error) {
          console.error("Error parsing storage update:", error);
        }
      }
    };

    const handleCustomUpdate = () => {
      // Handle custom document read status update event
      if (activeTab === "internal" && internalDocsHook.documents?.length > 0) {
        const documentIds = internalDocsHook.documents.map((doc: any) => doc.id);
        universalReadStatus.loadBatchReadStatus(
          documentIds,
          "INCOMING_INTERNAL"
        );
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener("storage", handleStorageChange);
    
    // Listen for custom events (same-tab communication)
    window.addEventListener("documentReadStatusUpdate", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("documentReadStatusUpdate", handleCustomUpdate);
    };
  }, [internalDocsHook.documents, activeTab, universalReadStatus]);

  // Main fetch function
  const fetchDocuments = async (page = currentPage, size = pageSize) => {
    if (activeTab === "internal") {
      await internalDocsHook.fetchInternalDocuments(page, size);
    } else {
      await externalDocsHook.fetchExternalDocuments(page, size);
    }
  };

  // Search handlers - riêng biệt cho từng tab
  const handleSearch = () => {
    if (activeTab === "internal") {
      setInternalActiveSearchQuery(internalSearchQuery);
    } else {
      setExternalActiveSearchQuery(externalSearchQuery);
    }
    setCurrentPage(0);
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
    setActiveTab(value as "internal" | "external");
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

  const handleDateFromChange = (value: string) => {
    setDateFromFilter(value);
    setCurrentPage(0);
  };

  const handleDateToChange = (value: string) => {
    setDateToFilter(value);
    setCurrentPage(0);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const handleIssuingAuthorityChange = (value: string) => {
    setIssuingAuthorityFilter(value);
    setCurrentPage(0);
  };

  // Year/month filter handlers for internal documents
  const handleYearFilterChange = (year: number) => {
    setYearFilter(year);
  };

  const handleMonthFilterChange = (month: number | undefined) => {
    setMonthFilter(month);
  };

  const handleApplyFilters = () => {
    if (activeTab === "internal") {
      setActiveYearFilter(yearFilter);
      setActiveMonthFilter(monthFilter);
    }
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    const currentYear = new Date().getFullYear();
    setDateFromFilter("");
    setDateToFilter("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setIssuingAuthorityFilter("all");
    // Reset year/month filters for internal documents
    setYearFilter(currentYear);
    setMonthFilter(undefined);
    setActiveYearFilter(currentYear);
    setActiveMonthFilter(undefined);
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

  const handleRefresh = () => {
    fetchDocuments(currentPage, pageSize);
  };

  const handleAddDocument = () => {
    setIsAddLoading(true);
    router.push("/van-ban-den/them-moi");
  };

  // Document click handlers
  const handleInternalDocumentClick = async (doc: any) => {
    try {
      // Mark as read when navigating
      const currentReadStatus = universalReadStatus.getReadStatus(
        doc.id,
        "INCOMING_INTERNAL"
      );

      if (!currentReadStatus) {
        try {
          await universalReadStatus.markAsRead(doc.id, "INCOMING_INTERNAL");
          
          // Trigger storage event to notify other tabs/components
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "documentReadStatusUpdate",
              JSON.stringify({
                documentId: doc.id,
                documentType: "INCOMING_INTERNAL",
                timestamp: Date.now()
              })
            );
            setTimeout(() => {
              localStorage.removeItem("documentReadStatusUpdate");
            }, 100);
          }
        } catch (markError) {
          // Continue even if marking fails
          console.error("Error marking as read:", markError);
        }
      }

      // Navigate to internal document detail
      window.location.href = `/van-ban-den/noi-bo/${doc.id}`;
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = `/van-ban-den/noi-bo/${doc.id}`;
    }
  };

  // Internal document read status toggle
  const handleInternalReadStatusToggle = async (docId: number) => {
    try {
      await universalReadStatus.toggleReadStatus(docId, "INCOMING_INTERNAL");
      
      // Trigger storage event to notify other tabs/components
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "documentReadStatusUpdate",
          JSON.stringify({
            documentId: docId,
            documentType: "INCOMING_INTERNAL",
            timestamp: Date.now()
          })
        );
        setTimeout(() => {
          localStorage.removeItem("documentReadStatusUpdate");
        }, 100);
      }
    } catch (error) {
      console.error("Error toggling internal read status:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái đọc. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleExternalDocumentClick = async (doc: any) => {
    try {
      const currentReadStatus = externalReadStatus.getReadStatus(Number(doc.id));

      if (!currentReadStatus) {
        try {
          await externalReadStatus.markAsRead(Number(doc.id));
        } catch (markError) {
          // Continue even if marking fails
        }
      }

      window.location.href = `/van-ban-den/${doc.id}`;
    } catch (error) {
      window.location.href = `/van-ban-den/${doc.id}`;
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

  const handlePreviousPage = () => {
    const newPage = Math.max(0, currentPage - 1);
    setCurrentPage(newPage);
    fetchDocuments(newPage, pageSize);
  };

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    fetchDocuments(newPage, pageSize);
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

  // Loading state
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
      {/* Search Filters */}
      <SearchFilters
        searchQuery={activeTab === "internal" ? internalSearchQuery : externalSearchQuery}
        setSearchQuery={activeTab === "internal" ? setInternalSearchQuery : setExternalSearchQuery}
        activeSearchQuery={activeTab === "internal" ? internalActiveSearchQuery : externalActiveSearchQuery}
        yearFilter={activeTab === "internal" ? yearFilter : undefined}
        monthFilter={activeTab === "internal" ? monthFilter : undefined}
        departmentFilter={departmentFilter}
        dateFromFilter={dateFromFilter}
        dateToFilter={dateToFilter}
        statusFilter={statusFilter}
        issuingAuthorityFilter={issuingAuthorityFilter}
        activeTab={activeTab}
        hasFullAccess={hasFullAccess}
        visibleDepartments={visibleDepartments}
        availableAuthorities={availableAuthorities}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        onSearchKeyPress={handleSearchKeyPress}
        onYearFilterChange={activeTab === "internal" ? handleYearFilterChange : undefined}
        onMonthFilterChange={activeTab === "internal" ? handleMonthFilterChange : undefined}
        onApplyFilters={activeTab === "internal" ? handleApplyFilters : undefined}
        onDepartmentFilterChange={handleDepartmentFilterChange}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onStatusFilterChange={handleStatusFilterChange}
        onIssuingAuthorityChange={handleIssuingAuthorityChange}
        onClearFilters={handleClearFilters}
        onRefresh={handleRefresh}
      />

      {/* Document Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
      

        {/* Internal Documents Tab */}
        <TabsContent value="internal" className="mt-6">
        
          <InternalDocumentsTable
            documents={currentDocuments}
            onDocumentClick={handleInternalDocumentClick}
            formatDate={formatDate}
            universalReadStatus={universalReadStatus}
            onReadStatusToggle={handleInternalReadStatusToggle}
            getReadStatus={(docId: number) => 
              universalReadStatus.getReadStatus(docId, "INCOMING_INTERNAL") || false
            }
          />
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <DocumentPagination
        currentDocumentsLength={currentDocuments?.length || 0}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageSizeChange={handlePageSizeChange}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />
    </div>
  );
}

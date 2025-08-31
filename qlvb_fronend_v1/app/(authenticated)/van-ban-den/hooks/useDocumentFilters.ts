/**
 * Custom hook for document filters
 * Manages all filter states and logic
 */

import { useState, useCallback, useEffect } from "react";

export interface DocumentFiltersState {
  searchQuery: string;
  statusFilter: string;
  departmentFilter: string;
  processingStatusTab: string;
  startDate: string;
  endDate: string;
  issuingAuthorityFilter: string;
}

export function useDocumentFilters() {
  const [filters, setFilters] = useState<DocumentFiltersState>({
    searchQuery: "",
    statusFilter: "all",
    departmentFilter: "all",
    processingStatusTab: "pending",
    startDate: "",
    endDate: "",
    issuingAuthorityFilter: "all",
  });

  const updateFilter = useCallback(
    (key: keyof DocumentFiltersState, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: "",
      statusFilter: "all",
      departmentFilter: "all",
      processingStatusTab: "pending",
      startDate: "",
      endDate: "",
      issuingAuthorityFilter: "all",
    });
  }, []);

  // Individual setters for easier use
  const setSearchQuery = useCallback(
    (value: string) => updateFilter("searchQuery", value),
    [updateFilter]
  );
  const setStatusFilter = useCallback(
    (value: string) => updateFilter("statusFilter", value),
    [updateFilter]
  );
  const setDepartmentFilter = useCallback(
    (value: string) => updateFilter("departmentFilter", value),
    [updateFilter]
  );
  const setProcessingStatusTab = useCallback(
    (value: string) => updateFilter("processingStatusTab", value),
    [updateFilter]
  );
  const setStartDate = useCallback(
    (value: string) => updateFilter("startDate", value),
    [updateFilter]
  );
  const setEndDate = useCallback(
    (value: string) => updateFilter("endDate", value),
    [updateFilter]
  );
  const setIssuingAuthorityFilter = useCallback(
    (value: string) => updateFilter("issuingAuthorityFilter", value),
    [updateFilter]
  );

  return {
    filters,
    setSearchQuery,
    setStatusFilter,
    setDepartmentFilter,
    setProcessingStatusTab,
    setStartDate,
    setEndDate,
    setIssuingAuthorityFilter,
    resetFilters,
  };
}

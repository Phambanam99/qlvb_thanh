/**
 * Type definitions for văn bản đến (incoming documents) module
 * Centralizes all types to improve type safety and maintainability
 */

import { IncomingDocumentDTO } from "@/lib/api";
import { InternalDocument } from "@/lib/api/internalDocumentApi";

// Document tab types
export type DocumentTab = "internal" | "external";

// Document source types for filtering
export type DocumentSource = "all" | "department" | "assigned";

// Document status groups for simplified status management
export interface StatusGroup {
  code: string;
  displayName: string;
  description?: string;
  statuses: string[];
}

// Status tab configuration
export interface StatusTab {
  code: string;
  displayName: string;
  description: string;
}

// Document filter configuration
export interface DocumentFilters {
  searchQuery: string;
  statusFilter: string;
  departmentFilter: string;
  issuingAuthorityFilter: string;
  startDate: string;
  endDate: string;
  processingStatusTab: string;
}

// Pagination configuration
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

// Document list state for both internal and external documents
export interface DocumentListState {
  documents: (InternalDocument | IncomingDocumentDTO)[];
  loading: boolean;
  error: string | null;
}

// Permission configuration
export interface UserPermissions {
  hasFullAccess: boolean;
  hasDepartmentAccess: boolean;
  canViewAllDocuments: boolean;
  documentSource: DocumentSource;
}

// Document action callbacks
export interface DocumentActions {
  onDocumentClick: (document: InternalDocument | IncomingDocumentDTO) => void;
  onMarkAsRead: (documentId: number) => void;
  onFilterChange: (filters: Partial<DocumentFilters>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

// Error boundary state
export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

// Available document authorities
export interface IssuingAuthority {
  value: string;
  label: string;
  count?: number;
}

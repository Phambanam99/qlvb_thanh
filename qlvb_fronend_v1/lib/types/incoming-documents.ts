import { IncomingDocumentDTO } from "@/lib/api";
import { InternalDocument } from "@/lib/api/internalDocumentApi";

export interface DocumentFilters {
  searchQuery: string;
  statusFilter: string;
  departmentFilter: string;
  startDate: string;
  endDate: string;
  issuingAuthorityFilter: string;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface DocumentsState {
  internalDocuments: InternalDocument[];
  externalDocuments: IncomingDocumentDTO[];
  loading: boolean;
  loadingInternal: boolean;
}

export interface TabState {
  activeTab: string;
  processingStatusTab: string;
}

export type DocumentType = 'internal' | 'external';
export type ProcessingStatus = 'not_processed' | 'pending' | 'completed';

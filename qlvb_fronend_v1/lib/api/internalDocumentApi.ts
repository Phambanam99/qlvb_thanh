// lib/api/internalDocumentApi.ts
import api from "./config";
import axios from "axios";
import { UrgencyLevel } from "@/lib/types/urgency";

// Priority enum (tương đương InternalDocument.Priority)


// RecipientRequest tương đương nested class trong DTO
export interface RecipientRequest {
  departmentId: number;  // @NotNull
  userId?: number | null; // nullable
  notes?: string;
}

// CreateInternalDocumentDTO
export interface CreateInternalDocumentDTO {
  documentNumber: string;  // @NotBlank
  title: string;           // @NotBlank, @Size(max = 2000)
  summary?: string;
  documentType?: string;
  signingDate?: string; // ISO date string (LocalDateTime)
  urgencyLevel: UrgencyLevel;  // @NotNull, default: Priority.KHAN
  notes?: string;
  recipients: RecipientRequest[];  // @NotNull, @Size(min=1)
  replyToId?: number;
  signer?: string;
  
  // New fields matching OutgoingDocument
  draftingDepartmentId?: number;
  securityLevel?: 'NORMAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  documentSignerId?: number;
  isSecureTransmission?: boolean;
  processingDeadline?: string; // ISO date string
  issuingAgency?: string;
  distributionType?: 'REGULAR' | 'CONFIDENTIAL' | 'COPY_BOOK' | 'PARTY' | 'STEERING_COMMITTEE';
  numberOfCopies?: number;
  numberOfPages?: number;
  noPaperCopy?: boolean;
}
// Interface for internal documents (new format from API)
export interface InternalDocument {
  id: number;
  documentNumber: string;
  title: string;
  summary: string;
  documentType: string;
  signingDate: string;
  urgencyLevel: UrgencyLevel;
  priority?: UrgencyLevel
  notes?: string;
  status: "DRAFT" | "SENT" | "APPROVED";
  isInternal: boolean | null;
  senderId: number;
  senderName: string;
  senderDepartment: string;
  
  // New fields matching OutgoingDocument
  draftingDepartment?: {
    id: number;
    name: string;
    code?: string;
  };
  securityLevel?: 'NORMAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  documentSigner?: {
    id: number;
    fullName: string;
    username?: string;
  };
  isSecureTransmission?: boolean;
  processingDeadline?: string;
  issuingAgency?: string;
  distributionType?: 'REGULAR' | 'CONFIDENTIAL' | 'COPY_BOOK' | 'PARTY' | 'STEERING_COMMITTEE';
  distributionTypeDisplayName?: string;
  numberOfCopies?: number;
  numberOfPages?: number;
  noPaperCopy?: boolean;
  
  recipients: {
    id: number;
    departmentId: number;
    departmentName: string;
    userId?: number;
    userName?: string;
    isRead: boolean;
    readAt?: string;
    receivedAt: string;
    notes?: string;
  }[];
  attachments: {
    id: number;
    filename: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
    uploadedByName?: string;
    description?: string;
  }[];
  replyToId?: number;
  replyToTitle?: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt?: string;
}
export interface InternalDocumentDetail extends InternalDocument {
  documentNumber: string;
  title: string;
  summary: string;
  documentType: string;
  signingDate: string;
  signer?: string;
  urgencyLevel: UrgencyLevel;
  notes?: string;
  status: "DRAFT" | "SENT" | "APPROVED";
  isInternal: boolean | null;
  senderId: number;
  senderName: string;
  senderDepartment: string;
  
  // New fields matching OutgoingDocument
  draftingDepartment?: {
    id: number;
    name: string;
    code?: string;
  };
  securityLevel?: 'NORMAL' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  documentSigner?: {
    id: number;
    fullName: string;
    username?: string;
  };
  isSecureTransmission?: boolean;
  processingDeadline?: string;
  issuingAgency?: string;
  distributionType?: 'REGULAR' | 'CONFIDENTIAL' | 'COPY_BOOK' | 'PARTY' | 'STEERING_COMMITTEE';
  distributionTypeDisplayName?: string;
  numberOfCopies?: number;
  numberOfPages?: number;
  noPaperCopy?: boolean;
  
  recipients: {
    id: number;
    departmentId: number;
    departmentName: string;
    userId?: number;
    userName?: string;
    isRead: boolean;
    readAt?: string;
    receivedAt: string;
    notes?: string;
  }[];
  attachments: {
    id: number;
    filename: string;
    contentType: string;
    fileSize: number;
    uploadedAt: string;
    uploadedByName?: string;
    description?: string;
  }[];
  replyToId?: number;
  replyToTitle?: string;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readAt?: string;
}

export interface DocumentHistory {
  id: number;
  action: string;
  details: string;
  performedBy: {
    id: number;
    name: string;
    fullName: string;
  };
  performedAt: string;
  performedByName: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DocumentStats {
  replyCount: number;
  historyCount: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  lastActivity: string;
}

export const createInternalDocument = async (
  document: CreateInternalDocumentDTO,
  files?: File[],
  descriptions?: string[],
  onUploadProgress?: (progressEvent: any) => void,
  cancelToken?: any
) => {
  const formData = new FormData();
  formData.append("document", JSON.stringify(document));
  if (files) {
    files.forEach((file, idx) => {
      formData.append("files", file);
    });
  }
  if (descriptions) {
    descriptions.forEach((desc) => {
      formData.append("descriptions", desc);
    });
  }

  const response = await api.post("/internal-documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
    cancelToken,
    timeout: 600000, // 10 minutes timeout for large files
  });

  return response.data;
};

export const createInternalDocumentJson = async (document: any) => {
  const response = await api.post("/internal-documents/json", document);
  return response.data;
};

export const updateInternalDocument = async (
  documentNumber: string,
  document: CreateInternalDocumentDTO,
  files?: File[],
  descriptions?: string[],
  onUploadProgress?: (progressEvent: any) => void,
  cancelToken?: any
) => {
  const formData = new FormData();
  formData.append("document", JSON.stringify(document));
  if (files) {
    files.forEach((file, idx) => {
      formData.append("files", file);
    });
  }
  if (descriptions) {
    descriptions.forEach((desc) => {
      formData.append("descriptions", desc);
    });
  }

  const response = await api.put(`/internal-documents/${documentNumber}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
    cancelToken,
    timeout: 600000, // 10 minutes timeout for large files
  });

  return response.data;
};

export const getDocumentById = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}`);
  return response.data;
};

export const getSentDocuments = async (page = 0, size = 10) => {
  const response = await api.get("/internal-documents/sent", {
    params: { page, size },
  });
  console.log("Sent documents response:", response.data);
  return response.data;
};

export const getSentDocumentsByYear = async (year: number, month?: number, page = 0, size = 10) => {
  const params: any = { page, size };
  if (month !== undefined && month !== null) {
    params.month = month;
  }
  
  const response = await api.get(`/internal-documents/sent/by-year/${year}`, {
    params
  });
  console.log("Sent documents by year response:", response.data);
  return response.data;
};

export const getReceivedDocumentsByYear = async (year: number, month?: number, page = 0, size = 10) => {
  const params: any = { page, size };
  if (month !== undefined && month !== null) {
    params.month = month;
  }
  
  const response = await api.get(`/internal-documents/received/by-year/${year}`, {
    params
  });
  return response.data;
};

export const getAllSentDocuments = async () => {
  const response = await api.get("/internal-documents/sent/all");
  return response.data;
};

export const getReceivedDocuments = async (page = 0, size = 10) => {
  const response = await api.get("/internal-documents/received", {
    params: { page, size },
  });
  return response.data;
};

export const getAllReceivedDocuments = async () => {
  const response = await api.get("/internal-documents/received/all");
  return response.data;
};

export const getReceivedDocumentsExcludingSent = async (
  page = 0,
  size = 10
) => {
  const response = await api.get("/internal-documents/received", {
    params: { page, size },
  });

  // Lọc ra những văn bản không phải do chính user tạo
  if (response.data && response.data.content) {
    // Lấy thông tin user hiện tại từ localStorage hoặc context
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (currentUser) {
      const filteredContent = response.data.content.filter(
        (doc: any) => doc.senderId !== currentUser.id
      );

      return {
        ...response.data,
        content: filteredContent,
        totalElements: filteredContent.length,
      };
    }
  }

  return response.data;
};

export const getAllReceivedDocumentsExcludingSent = async () => {
  const response = await api.get("/internal-documents/received/all");

  // Lọc ra những văn bản không phải do chính user tạo
  if (response.data && response.data.data) {
    // Lấy thông tin user hiện tại từ localStorage hoặc context
    const userStr = localStorage.getItem("user");
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (currentUser) {
      const filteredContent = response.data.data.filter(
        (doc: any) => doc.senderId !== currentUser.id
      );

      return {
        ...response.data,
        data: filteredContent,
      };
    }
  }

  return response.data;
};

export const getUnreadDocuments = async (page = 0, size = 10) => {
  const response = await api.get("/internal-documents/unread", {
    params: { page, size },
  });
  return response.data;
};

export const getAllUnreadDocuments = async () => {
  const response = await api.get("/internal-documents/unread/all");
  return response.data;
};

// DEPRECATED: Use DocumentReadStatusService instead
export const countUnreadDocuments = async () => {
  const response = await api.get("/internal-documents/unread/count");
  return response.data.unreadCount;
};

export const searchDocuments = async (keyword: string, page = 0, size = 10) => {
  const response = await api.get("/internal-documents/search", {
    params: { keyword, page, size },
  });
  console.log("Search response:", response.data);
  return response.data;
};

export const advancedSearchDocuments = async (filters: {
  senderId?: number;
  recipientUserId?: number;
  recipientDepartmentId?: number;
  priority?: string;
  documentType?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
}) => {
  const response = await api.get("/internal-documents/search/advanced", {
    params: filters,
  });
  return response.data;
};

// DEPRECATED: Use DocumentReadStatusService instead  
export const markDocumentAsRead = async (id: number) => {
  const response = await api.post(`/internal-documents/${id}/mark-read`);
  return response.data;
};

export const uploadAttachment = async (
  id: number,
  file: File,
  description?: string
) => {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);

  const response = await api.post(
    `/internal-documents/${id}/attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

export const uploadMultipleAttachments = async (
  id: number,
  files: File[],
  descriptions?: string[]
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  descriptions?.forEach((desc) => formData.append("descriptions", desc));

  const response = await api.post(
    `/internal-documents/${id}/attachments/multiple`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};

export const getStatistics = async () => {
  const response = await api.get("/internal-documents/statistics");
  return response.data;
};

export const getDocumentsByPriority = async (
  priority: string,
  page = 0,
  size = 10
) => {
  const response = await api.get(`/internal-documents/priority/${priority}`, {
    params: { page, size },
  });
  return response.data;
};

export const getDocumentsByDateRange = async (
  startDate: string,
  endDate: string,
  page = 0,
  size = 10
) => {
  const response = await api.get("/internal-documents/date-range", {
    params: { startDate, endDate, page, size },
  });
  return response.data;
};

export const getDocumentsByType = async (
  documentType: string,
  page = 0,
  size = 10
) => {
  const response = await api.get(`/internal-documents/type/${documentType}`, {
    params: { page, size },
  });
  return response.data;
};

export const replyToDocument = async (id: number, document: any) => {
  const response = await api.post(`/internal-documents/${id}/reply`, document);
  return response.data;
};

export const replyToDocumentWithAttachments = async (
  id: number,
  document: any,
  files?: File[],
  descriptions?: string[]
) => {
  // console.log("=== DEBUG replyToDocumentWithAttachments ===");
  // console.log("Document ID:", id);
  // console.log("Document data:", document);
  // console.log("Files:", files);
  // console.log("Descriptions:", descriptions);

  const formData = new FormData();
  formData.append("document", JSON.stringify(document));

  if (files && files.length > 0) {
    // console.log(`Adding ${files.length} files to FormData`);
    files.forEach((file, index) => {
      // console.log(`File ${index}:`, file.name, file.size, file.type);  
      formData.append("files", file);
    });
  } else {
    // console.log("No files to upload");
  }

  if (descriptions) {
    // console.log("Adding descriptions:", descriptions);
    descriptions.forEach((desc) => {
      formData.append("descriptions", desc);
    });
  }

  // Log FormData contents
  //  console.log("FormData entries:");
  for (let [key, value] of formData.entries()) {
    // console.log(key, value);
  }

  const response = await api.post(
    `/internal-documents/${id}/reply-with-attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  ).catch((error) => {
    // console.log("error", error.response);
    return {
      success: false,
      data: error.response.data,
    };
  });

  return response.data;
};

export const getInternalDocumentHistory = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/history`);
  return response.data;
};

export const getDocumentReplies = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/replies`);
  return response.data;
};

export const getDocumentThread = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/thread`);
  return response.data;
};

export const getDocumentStats = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/stats`);
  return response.data;
};

export const downloadAttachment = async (
  documentId: number,
  attachmentId: number
) => {
  const response = await api.get(
    `/internal-documents/${documentId}/attachments/${attachmentId}`,
    {
      responseType: "blob", // Important for file downloads
    }
  );
  console.log("response", response);
  return response;
};

// NEW: Document readers API using unified system
export const getDocumentReaders = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/readers`);
  return response.data.data;
};

export const getDocumentReadersOnly = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/readers/read-only`);
  return response.data.data;
};

export const getDocumentReadStatistics = async (id: number) => {
  const response = await api.get(`/internal-documents/${id}/read-statistics`);
  return response.data.data;
};

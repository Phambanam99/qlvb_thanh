/**
 * Document utilities
 * Common utility functions for document operations
 */

// Format date helper
export const formatDate = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "Chưa xác định";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
      return "Chưa xác định";
    }
    return date.toLocaleDateString("vi-VN");
  } catch {
    return "Chưa xác định";
  }
};

// Status grouping helper
export const getSimplifiedStatusGroup = (
  detailedStatus: string | null | undefined
) => {
  if (!detailedStatus) {
    return { code: "not_processed", displayName: "Chưa xử lý" };
  }

  const normalizedStatus = detailedStatus.trim().toLowerCase();

  // Simple mapping
  if (
    normalizedStatus.includes("completed") ||
    normalizedStatus.includes("approved")
  ) {
    return { code: "completed", displayName: "Đã xử lý" };
  }

  if (
    normalizedStatus.includes("processing") ||
    normalizedStatus.includes("reviewing")
  ) {
    return { code: "pending", displayName: "Đang xử lý" };
  }

  return { code: "not_processed", displayName: "Chưa xử lý" };
};

// Document count by status helper
export const getDocumentCountByStatus = (
  documents: any[],
  statusKey: string,
  activeTab: "internal" | "external"
): number => {
  if (!documents || activeTab !== "external") return 0;

  if (statusKey === "all") return documents.length;

  return documents.filter((doc: any) => {
    const status = doc.trackingStatus?.toUpperCase() || "";
    const docTabCode =
      status === "PROCESSED"
        ? "completed"
        : status === "NOT_PROCESSED" || status === ""
        ? "not_processed"
        : "pending";
    return docTabCode === statusKey;
  }).length;
};

// Extract available authorities from documents
export const extractAvailableAuthorities = (documents: any[]): string[] => {
  return Array.from(
    new Set(
      documents
        .map((doc: any) => doc.issuingAuthority)
        .filter((authority: any) => authority && authority.trim() !== "")
    )
  ).sort();
};

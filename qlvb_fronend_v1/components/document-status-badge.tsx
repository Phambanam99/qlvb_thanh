"use client";

import { Badge } from "@/components/ui/badge";
import { useDocumentClassification } from "@/hooks/use-document-classification";
import { Loader2 } from "lucide-react";

interface DocumentStatusBadgeProps {
  documentId?: number | null;
  fallbackStatus?: string;
  fallbackDisplayStatus?: string;
  isExternalDocument?: boolean; // Flag to indicate if this is an external document
}

export function DocumentStatusBadge({
  documentId,
  fallbackStatus,
  fallbackDisplayStatus,
  isExternalDocument = false,
}: DocumentStatusBadgeProps) {
  // For external documents, skip classification fetch and use fallback immediately
  const shouldFetchClassification = !!documentId && !isExternalDocument;
  
  // Only fetch classification if we have a valid documentId and it's not an external document
  const { classification, isLoading, error } = useDocumentClassification(
    documentId || 0,
    shouldFetchClassification // Only enabled if documentId is truthy and not external
  );

  // If no documentId provided, show fallback immediately
  if (!documentId) {
    return (
      <Badge variant="secondary">
        {fallbackDisplayStatus || fallbackStatus || "Unknown"}
      </Badge>
    );
  }

  // For external documents, skip classification and use fallback directly
  if (isExternalDocument && fallbackStatus) {
    return getBadgeForStatus(
      fallbackStatus,
      fallbackDisplayStatus || fallbackStatus
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Đang tải...
      </Badge>
    );
  }

  // Show error state with fallback
  if (error) {
    // For 404 errors (classification not found), use fallback gracefully
    if (error === "CLASSIFICATION_NOT_FOUND" && fallbackStatus) {
      return getBadgeForStatus(
        fallbackStatus,
        fallbackDisplayStatus || fallbackStatus
      );
    }
    
    // For other errors, show fallback if available, otherwise show error
    if (fallbackStatus) {
      return getBadgeForStatus(
        fallbackStatus,
        fallbackDisplayStatus || fallbackStatus
      );
    }
    
    // No fallback available, show error
    return (
      <Badge variant="outline" className="text-red-600 border-red-200">
        Lỗi tải dữ liệu
      </Badge>
    );
  }

  // Show classification result
  if (classification) {
    return getBadgeForStatus(
      classification.status,
      classification.statusDescription
    );
  }

  // Default fallback
  return (
    <Badge variant="outline">
      {fallbackDisplayStatus || fallbackStatus || "Không xác định"}
    </Badge>
  );
}

/**
 * Get badge variant and styling based on status
 */
function getBadgeForStatus(status: string, displayText: string) {
  // Define status groups and their styling
  const statusConfig = getStatusConfig(status);

  return (
    <Badge variant={statusConfig.variant} className={statusConfig.className}>
      {displayText}
    </Badge>
  );
}

/**
 * Get badge configuration based on status
 */
function getStatusConfig(status: string): {
  variant: "default" | "outline" | "secondary" | "destructive";
  className?: string;
} {
  const statusLower = status.toLowerCase();

  // Completed/Success statuses
  if (
    statusLower.includes("completed") ||
    statusLower.includes("approved") ||
    statusLower.includes("published") ||
    statusLower.includes("archived") ||
    statusLower.includes("hoàn thành") ||
    statusLower.includes("đã duyệt") ||
    statusLower.includes("đã phê duyệt")
  ) {
    return {
      variant: "default",
      className: "bg-green-100 text-green-800 border-green-300",
    };
  }

  // In progress statuses
  if (
    statusLower.includes("processing") ||
    statusLower.includes("reviewing") ||
    statusLower.includes("assigned") ||
    statusLower.includes("distributed") ||
    statusLower.includes("đang xử lý") ||
    statusLower.includes("đang xem xét") ||
    statusLower.includes("đã phân công") ||
    statusLower.includes("đã phân phối")
  ) {
    return {
      variant: "secondary",
      className: "bg-blue-100 text-blue-800 border-blue-300",
    };
  }

  // Pending/Not started statuses
  if (
    statusLower.includes("pending") ||
    statusLower.includes("draft") ||
    statusLower.includes("registered") ||
    statusLower.includes("chờ") ||
    statusLower.includes("chưa") ||
    statusLower.includes("dự thảo")
  ) {
    return {
      variant: "outline",
      className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    };
  }

  // Rejected/Error statuses
  if (
    statusLower.includes("rejected") ||
    statusLower.includes("error") ||
    statusLower.includes("failed") ||
    statusLower.includes("từ chối") ||
    statusLower.includes("lỗi")
  ) {
    return {
      variant: "destructive",
    };
  }

  // Default styling
  return {
    variant: "outline" as const,
  };
}

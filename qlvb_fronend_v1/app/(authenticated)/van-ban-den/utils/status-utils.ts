/**
 * Status management utilities for văn bản đến
 * Centralizes all status-related logic for better maintainability
 */

import { StatusGroup, StatusTab } from "../types";

// Define comprehensive status groups with clear mapping
export const STATUS_GROUPS: Record<string, StatusGroup> = {
  not_processed: {
    code: "not_processed",
    displayName: "Chưa xử lý",
    description: "Văn bản chưa được xử lý",
    statuses: [
      "draft",
      "registered",
      "pending_approval",
      "new",
      "created",
      "received",
      "unprocessed",
      "waiting",
      "DRAFT",
      "REGISTERED",
      "PENDING_APPROVAL",
      "NEW",
      "CREATED",
      "RECEIVED",
      "UNPROCESSED",
      "WAITING",
    ],
  },
  pending: {
    code: "pending",
    displayName: "Đang xử lý",
    description: "Văn bản đang được xử lý",
    statuses: [
      "distributed",
      "dept_assigned",
      "specialist_processing",
      "specialist_submitted",
      "leader_reviewing",
      "department_reviewing",
      "pending",
      "processing",
      "in_progress",
      "under_review",
      "reviewing",
      "assigned",
      "PENDING",
      "PROCESSING",
      "IN_PROGRESS",
      "UNDER_REVIEW",
      "DISTRIBUTED",
      "DEPT_ASSIGNED",
      "SPECIALIST_PROCESSING",
    ],
  },
  completed: {
    code: "completed",
    displayName: "Đã xử lý",
    description: "Văn bản đã hoàn thành xử lý",
    statuses: [
      "leader_approved",
      "leader_commented",
      "department_approved",
      "department_commented",
      "published",
      "completed",
      "archived",
      "approved",
      "finished",
      "done",
      "resolved",
      "closed",
      "COMPLETED",
      "APPROVED",
      "FINISHED",
      "DONE",
      "RESOLVED",
      "CLOSED",
      "LEADER_APPROVED",
      "DEPARTMENT_APPROVED",
      "PUBLISHED",
      "ARCHIVED",
    ],
  },
};

// Status tabs for UI navigation
export const STATUS_TABS: Record<string, StatusTab> = {
  not_processed: {
    code: "not_processed",
    displayName: "Chưa xử lý",
    description: "Văn bản chưa được xử lý",
  },
  pending: {
    code: "pending",
    displayName: "Đang xử lý",
    description: "Văn bản đang được xử lý",
  },
  completed: {
    code: "completed",
    displayName: "Đã hoàn thành",
    description: "Văn bản đã hoàn thành xử lý",
  },
};

/**
 * Get simplified status group for a given detailed status
 * @param detailedStatus - The detailed status from the backend
 * @returns StatusGroup with code and display name
 */
export const getSimplifiedStatusGroup = (
  detailedStatus: string | null | undefined
): { code: string; displayName: string } => {
  // Handle null/undefined status
  if (!detailedStatus) {
    return { code: "not_processed", displayName: "Chưa xử lý" };
  }

  // Normalize status for case-insensitive matching
  const normalizedStatus = detailedStatus.trim().toLowerCase();

  // Find matching status group
  for (const [key, group] of Object.entries(STATUS_GROUPS)) {
    const hasMatch = group.statuses.some(
      (status) =>
        status === detailedStatus || status.toLowerCase() === normalizedStatus
    );

    if (hasMatch) {
      return { code: group.code, displayName: group.displayName };
    }
  }

  // Log unknown status for debugging
 
  return { code: "pending", displayName: "Đang xử lý" };
};

/**
 * Get all available status options for filtering
 * @returns Array of status options with value and label
 */
export const getStatusFilterOptions = () => [
  { value: "all", label: "Tất cả trạng thái" },
  ...Object.values(STATUS_GROUPS).map((group) => ({
    value: group.code,
    label: group.displayName,
  })),
];

/**
 * Check if a status belongs to a specific group
 * @param status - Status to check
 * @param groupCode - Group code to check against
 * @returns boolean indicating if status belongs to group
 */
export const isStatusInGroup = (
  status: string | null | undefined,
  groupCode: string
): boolean => {
  if (!status) return false;

  const group = STATUS_GROUPS[groupCode];
  if (!group) return false;

  const normalizedStatus = status.toLowerCase();
  return group.statuses.some(
    (s) => s === status || s.toLowerCase() === normalizedStatus
  );
};

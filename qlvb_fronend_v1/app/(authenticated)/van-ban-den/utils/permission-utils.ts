/**
 * Permission management utilities for văn bản đến
 * Centralizes role-based access control logic
 */

import { DocumentSource, UserPermissions } from "../types";

// Define role hierarchies for better maintainability
export const ROLE_HIERARCHIES = {
  // Full access roles - can view all documents
  FULL_ACCESS: [
    "ROLE_ADMIN",
    "ROLE_VAN_THU",
    "ROLE_CUC_TRUONG",
    "ROLE_CUC_PHO",
    "ROLE_CHINH_UY",
    "ROLE_PHO_CHINH_UY",
  ],

  // Department leadership - can view department documents
  DEPARTMENT_LEADERSHIP: [
    "ROLE_TRUONG_PHONG",
    "ROLE_PHO_PHONG",
    "ROLE_TRUONG_BAN",
    "ROLE_PHO_BAN",
    "ROLE_CUM_TRUONG",
    "ROLE_PHO_CUM_TRUONG",
    "ROLE_CHINH_TRI_VIEN_CUM",
    "ROLE_PHO_TRAM_TRUONG",
    "ROLE_TRAM_TRUONG",
  ],

  // Staff roles - can view assigned documents only
  STAFF: ["ROLE_NHAN_VIEN", "ROLE_TRO_LY"],
} as const;

// Document source options for filtering
export const DOCUMENT_SOURCE_OPTIONS = [
  { value: "all" as DocumentSource, label: "Tất cả văn bản" },
  { value: "department" as DocumentSource, label: "Văn bản phòng/đơn vị" },
  { value: "assigned" as DocumentSource, label: "Văn bản được giao" },
];

/**
 * Check if user has a specific role
 * @param userRoles - Array of user roles
 * @param targetRole - Role to check for
 * @returns boolean indicating if user has the role
 */
export const hasRole = (userRoles: string[], targetRole: string): boolean => {
  return userRoles.includes(targetRole);
};

/**
 * Check if user has any role from a list
 * @param userRoles - Array of user roles
 * @param targetRoles - Array of roles to check for
 * @returns boolean indicating if user has any of the roles
 */
export const hasAnyRole = (
  userRoles: string[],
  targetRoles: readonly string[]
): boolean => {
  return targetRoles.some((role) => userRoles.includes(role));
};

/**
 * Determine user permissions based on their roles
 * @param userRoles - Array of user roles
 * @returns UserPermissions object with calculated permissions
 */
export const calculateUserPermissions = (
  userRoles: string[]
): UserPermissions => {
  const hasFullAccess = hasAnyRole(userRoles, ROLE_HIERARCHIES.FULL_ACCESS);
  const hasDepartmentAccess = hasAnyRole(
    userRoles,
    ROLE_HIERARCHIES.DEPARTMENT_LEADERSHIP
  );
  const isStaff = hasAnyRole(userRoles, ROLE_HIERARCHIES.STAFF);

  // Determine document source based on permissions
  let documentSource: DocumentSource = "all";

  if (hasDepartmentAccess && !hasFullAccess) {
    documentSource = "department";
  } else if (isStaff && !hasDepartmentAccess && !hasFullAccess) {
    documentSource = "assigned";
  }

  return {
    hasFullAccess,
    hasDepartmentAccess,
    canViewAllDocuments: hasFullAccess,
    documentSource,
  };
};

/**
 * Check if user can view a specific document
 * @param userPermissions - User's calculated permissions
 * @param document - Document to check access for
 * @param userDepartmentId - User's department ID
 * @returns boolean indicating if user can view the document
 */
export const canViewDocument = (
  userPermissions: UserPermissions,
  document: any, // Could be InternalDocument or IncomingDocumentDTO
  userDepartmentId?: number
): boolean => {
  // Full access users can view everything
  if (userPermissions.hasFullAccess) {
    return true;
  }

  // Department leaders can view department documents
  if (userPermissions.hasDepartmentAccess && userDepartmentId) {
    // Check if document belongs to user's department or sub-departments
    return (
      document.departmentId === userDepartmentId ||
      document.assignedDepartmentId === userDepartmentId
    );
  }

  // Staff can only view assigned documents
  if (userPermissions.documentSource === "assigned") {
    return (
      document.assignedUserId === userDepartmentId || // Assuming user ID is passed
      document.processingOfficerId === userDepartmentId
    );
  }

  return false;
};

/**
 * Get available document source options based on user permissions
 * @param userPermissions - User's calculated permissions
 * @returns Array of available document source options
 */
export const getAvailableDocumentSources = (
  userPermissions: UserPermissions
): Array<{ value: DocumentSource; label: string }> => {
  if (userPermissions.hasFullAccess) {
    return DOCUMENT_SOURCE_OPTIONS;
  }

  if (userPermissions.hasDepartmentAccess) {
    return DOCUMENT_SOURCE_OPTIONS.filter((option) => option.value !== "all");
  }

  // Staff users only see assigned documents
  return DOCUMENT_SOURCE_OPTIONS.filter(
    (option) => option.value === "assigned"
  );
};

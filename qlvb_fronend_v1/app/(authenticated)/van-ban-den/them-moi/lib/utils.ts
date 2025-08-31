import { roleDisplayNames } from "./constants";
import type {
  ValidationErrors,
  DocumentPurpose,
  NotificationScope,
} from "./constants";

/**
 * Get role display name helper
 */
export const getRoleDisplayName = (role: string): string => {
  return (
    roleDisplayNames[role] ||
    role.replace("ROLE_", "").replace(/_/g, " ").toLowerCase()
  );
};

/**
 * Helper function to find user by ID
 */
export const findUserById = (
  departmentUsers: Record<number, any[]>,
  deptId: number,
  userId: number
) => {
  const users = departmentUsers[deptId] || [];
  return users.find((user) => user.id === userId) || null;
};

/**
 * Helper function to convert department ID for selection
 */
export const convertDepartmentId = (deptId: number | string): number => {
  return typeof deptId === "string" && deptId.includes("-")
    ? Number(deptId.split("-")[0])
    : Number(deptId);
};

/**
 * Helper function to remove secondary department from selection
 */
export const removeSecondaryDepartment = (
  deptId: number | string,
  secondaryDepartments: (number | string)[],
  clearSelection: () => void,
  selectPrimaryDepartment: (id: number) => void,
  selectSecondaryDepartment: (id: number) => void,
  primaryDepartment: number | null
) => {
  if (typeof deptId === "string" && deptId.includes("-")) {
    // For composite IDs like "departmentId-userId"
    const currentIds = secondaryDepartments.filter((id: any) => id !== deptId);
    clearSelection();
    if (primaryDepartment) {
      selectPrimaryDepartment(primaryDepartment);
    }
    currentIds.forEach((id: any) =>
      selectSecondaryDepartment(convertDepartmentId(id))
    );
  } else {
    // For regular department IDs
    selectSecondaryDepartment(Number(deptId));
  }
};

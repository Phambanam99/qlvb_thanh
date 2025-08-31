// Leadership role configuration
export const leadershipRoleOrder: Record<string, number> = {
  ROLE_CUC_TRUONG: 1,
  ROLE_CUC_PHO: 2,
  ROLE_CHINH_UY: 3,
  ROLE_PHO_CHINH_UY: 4,
  ROLE_TRUONG_PHONG: 5,
  ROLE_PHO_PHONG: 6,
  ROLE_TRAM_TRUONG: 7,
  ROLE_PHO_TRAM_TRUONG: 8,
  ROLE_CHINH_TRI_VIEN_TRAM: 9,
  ROLE_CUM_TRUONG: 10,
  ROLE_PHO_CUM_TRUONG: 11,
  ROLE_CHINH_TRI_VIEN_CUM: 12,
  ROLE_TRUONG_BAN: 13,
};

// Role display names mapping
export const roleDisplayNames: Record<string, string> = {
  ROLE_CUC_TRUONG: "Cục trưởng",
  ROLE_CUC_PHO: "Cục phó",
  ROLE_CHINH_UY: "Chính ủy",
  ROLE_PHO_CHINH_UY: "Phó Chính ủy",
  ROLE_TRUONG_PHONG: "Trưởng phòng",
  ROLE_PHO_PHONG: "Phó phòng",
  ROLE_TRAM_TRUONG: "Trạm trưởng",
  ROLE_PHO_TRAM_TRUONG: "Phó Trạm trưởng",
  ROLE_CHINH_TRI_VIEN_TRAM: "Chính trị viên trạm",
  ROLE_CUM_TRUONG: "Cụm trưởng",
  ROLE_PHO_CUM_TRUONG: "Phó cụm trưởng",
  ROLE_CHINH_TRI_VIEN_CUM: "Chính trị viên cụm",
  ROLE_TRUONG_BAN: "Trưởng Ban",
};

// Document purpose types
export type DocumentPurpose = "PROCESS" | "NOTIFICATION";
export type NotificationScope = "ALL_UNITS" | "SPECIFIC_UNITS";

// Validation error types
export interface ValidationErrors {
  documentNumber?: string;
  documentTitle?: string;
  sendingDepartmentName?: string;
  primaryDepartment?: string;
  notificationDepartments?: string;
  [key: string]: string | undefined;
}

// For components that expect Record<string, string>
export type ValidationErrorsForComponents = Record<string, string>;

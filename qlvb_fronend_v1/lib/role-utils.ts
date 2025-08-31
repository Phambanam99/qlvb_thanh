/**
 * This file contains role definitions and utility functions for role-based permissions
 */

// Các vai trò lãnh đạo cấp cục (chiefs/commanders)
export const LEADERSHIP_ROLES = [
  "ROLE_CUC_TRUONG", // Cục trưởng
  "ROLE_CUC_PHO", // Cục phó
  "ROLE_CHINH_UY", // Chính ủy
  "ROLE_PHO_CHINH_UY", // Phó chính ủy
];

// Vai trò lãnh đạo đơn vị/phòng ban (department heads)
export const DEPARTMENT_HEAD_ROLES = [
  "ROLE_TRUONG_PHONG", // Trưởng phòng
  "ROLE_PHO_PHONG", // Phó phòng
  "ROLE_TRUONG_BAN", // Trưởng ban
  "ROLE_PHO_BAN", // Phó ban
  "ROLE_CUM_TRUONG", // Cụm trưởng
  "ROLE_PHO_CUM_TRUONG", // Phó cụm trưởng
  "ROLE_TRAM_TRUONG", // Trạm trưởng
  "ROLE_PHO_TRAM_TRUONG", // Phó trạm trưởng
  "ROLE_CHINH_TRI_VIEN_TRAM", // Chính trị viên trạm
  "ROLE_CHINH_TRI_VIEN_CUM", // Chính trị viên cụm
];

// Vai trò nhân viên (staff)
export const STAFF_ROLES = [
  "ROLE_NHAN_VIEN", // Nhân viên
  "ROLE_TRO_LY", // Trợ lý
];

// Vai trò văn thư (clerk/document management)
export const CLERK_ROLES = [
  "ROLE_VAN_THU", // Văn thư
];

// Vai trò hệ thống
export const SYSTEM_ROLES = [
  "ROLE_ADMIN", // Quản trị viên
  "ROLE_MANAGER", // Quản lý hệ thống
];

// Nhóm các vai trò theo quyền hạn

// Vai trò có quyền xem tất cả công văn/thông tin
export const FULL_ACCESS_ROLES = [
  ...SYSTEM_ROLES,
  ...CLERK_ROLES,
  ...LEADERSHIP_ROLES,
];

// Vai trò có quyền quản lý phòng ban và người dùng trong phòng
export const DEPARTMENT_MANAGEMENT_ROLES = [
  ...SYSTEM_ROLES,
  ...LEADERSHIP_ROLES,
  "ROLE_TRUONG_PHONG", // Trưởng phòng
  "ROLE_PHO_PHONG", // Phó phòng (thêm mới)
  "ROLE_TRUONG_BAN", // Trưởng ban
  "ROLE_PHO_BAN", // Phó ban (thêm mới)
  "ROLE_CUM_TRUONG", // Cụm trưởng
  "ROLE_PHO_CUM_TRUONG", // Phó cụm trưởng (thêm mới)
  "ROLE_TRAM_TRUONG", // Trạm trưởng (sửa từ ROLE_TRUONG_TRAM)
  "ROLE_PHO_TRAM_TRUONG", // Phó trạm trưởng (thêm mới)
  "ROLE_CHINH_TRI_VIEN_TRAM", // Chính trị viên trạm (thêm mới)
  "ROLE_CHINH_TRI_VIEN_CUM", // Chính trị viên cụm (thêm mới)
];

// Vai trò có quyền xem thông tin của phòng/đơn vị mình
export const DEPARTMENT_ACCESS_ROLES = [...DEPARTMENT_HEAD_ROLES];

// Vai trò chỉ có quyền xem thông tin liên quan đến cá nhân mình
export const PERSONAL_ACCESS_ROLES = [...STAFF_ROLES];

/**
 * Kiểm tra xem một vai trò có thuộc nhóm lãnh đạo cục không
 * @param role Tên vai trò
 * @returns Boolean
 */
export function isLeadershipRole(role: string): boolean {
  return LEADERSHIP_ROLES.includes(role);
}

/**
 * Kiểm tra xem một vai trò có thuộc nhóm lãnh đạo phòng/đơn vị không
 * @param role Tên vai trò
 * @returns Boolean
 */
export function isDepartmentHeadRole(role: string): boolean {
  return DEPARTMENT_HEAD_ROLES.includes(role);
}

/**
 * Kiểm tra xem một vai trò có quyền quản lý phòng/đơn vị không
 * (bao gồm quản trị viên, lãnh đạo cục, và trưởng phòng/trưởng ban)
 * @param role Tên vai trò
 * @returns Boolean
 */
export function hasDepartmentManagementAccess(role: string): boolean {
  return DEPARTMENT_MANAGEMENT_ROLES.includes(role);
}

/**
 * Kiểm tra xem một người dùng có thuộc nhóm vai trò nhất định không
 * @param userRoles Danh sách vai trò của người dùng
 * @param roleGroup Nhóm vai trò cần kiểm tra
 * @returns Boolean
 */
export function hasRoleInGroup(
  userRoles: string[],
  roleGroup: string[]
): boolean {
  return userRoles.some((role) => roleGroup.includes(role));
}

/**
 * Lấy tên hiển thị cho vai trò
 * @param roleName Tên kỹ thuật của vai trò (VD: ROLE_CUC_TRUONG)
 * @returns String tên hiển thị (VD: Cục trưởng)
 */
export function getRoleDisplayName(roleName: string): string {
  const displayNames: Record<string, string> = {
    ROLE_CUC_TRUONG: "Cục trưởng",
    ROLE_CUC_PHO: "Cục phó",
    ROLE_CHINH_UY: "Chính ủy",
    ROLE_PHO_CHINH_UY: "Phó chính ủy",
    ROLE_TRUONG_PHONG: "Trưởng phòng",
    ROLE_PHO_PHONG: "Phó phòng",
    ROLE_TRUONG_BAN: "Trưởng ban",
    ROLE_PHO_BAN: "Phó ban",
    ROLE_CUM_TRUONG: "Cụm trưởng",
    ROLE_PHO_CUM_TRUONG: "Phó cụm trưởng",
    ROLE_TRAM_TRUONG: "Trạm trưởng",
    ROLE_PHO_TRAM_TRUONG: "Phó trạm trưởng",
    ROLE_CHINH_TRI_VIEN_TRAM: "Chính trị viên trạm",
    ROLE_CHINH_TRI_VIEN_CUM: "Chính trị viên cụm",
    ROLE_NHAN_VIEN: "Nhân viên",
    ROLE_TRO_LY: "Trợ lý",
    ROLE_VAN_THU: "Văn thư",
    ROLE_ADMIN: "Quản trị viên",
    ROLE_MANAGER: "Quản lý hệ thống",
  };

  return displayNames[roleName] || roleName.replace("ROLE_", "");
}

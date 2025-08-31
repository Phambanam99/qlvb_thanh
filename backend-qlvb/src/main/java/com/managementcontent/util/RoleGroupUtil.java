package com.managementcontent.util;

import com.managementcontent.model.enums.UserRole;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Utility class for grouping user roles into hierarchical categories
 */
public class RoleGroupUtil {

    // Nhóm 1: Chỉ huy cục (Lãnh đạo cấp cao nhất)
    public static final Set<String> ROLE_CHI_HUY_CUC = new HashSet<>(Arrays.asList(
            UserRole.CUC_TRUONG.getCode(),
            UserRole.CUC_PHO.getCode(), 
            UserRole.PHO_CHINH_UY.getCode(),
            UserRole.CHINH_UY.getCode()
    ));

    // Nhóm 2: Chỉ huy đơn vị (Lãnh đạo cấp trung)
    public static final Set<String> ROLE_CHI_HUY_DON_VI = new HashSet<>(Arrays.asList(
            UserRole.TRUONG_PHONG.getCode(),
            UserRole.PHO_PHONG.getCode(),
            UserRole.TRAM_TRUONG.getCode(),
            UserRole.PHO_TRAM_TRUONG.getCode(),
            UserRole.TRUONG_BAN.getCode(),
            UserRole.CHINH_TRI_VIEN_CUM.getCode(),
            UserRole.PHO_CUM_TRUONG.getCode(),
            UserRole.CUM_TRUONG.getCode(),
            UserRole.CHINH_TRI_VIEN_TRAM.getCode()
    ));

    // Nhóm 3: Văn thư (Quản lý văn bản)
    public static final Set<String> ROLE_VAN_THU = new HashSet<>(Arrays.asList(
            UserRole.VAN_THU.getCode()
    ));

    // Nhóm 4: Nhân viên (Cấp thực hiện)
    public static final Set<String> ROLE_NHAN_VIEN = new HashSet<>(Arrays.asList(
            UserRole.TRO_LY.getCode(),
            UserRole.NHAN_VIEN.getCode()
    ));

    /**
     * Enum định nghĩa các nhóm role
     */
    public enum RoleGroup {
        CHI_HUY_CUC("Chỉ huy cục"),
        CHI_HUY_DON_VI("Chỉ huy đơn vị"),
        VAN_THU("Văn thư"),
        NHAN_VIEN("Nhân viên");

        private final String displayName;

        RoleGroup(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Xác định nhóm role của một user dựa trên role string
     * 
     * @param role Role string của user
     * @return RoleGroup tương ứng, null nếu không tìm thấy
     */
    public static RoleGroup getRoleGroup(String role) {
        if (role == null) {
            return null;
        }

        if (ROLE_CHI_HUY_CUC.contains(role)) {
            return RoleGroup.CHI_HUY_CUC;
        } else if (ROLE_CHI_HUY_DON_VI.contains(role)) {
            return RoleGroup.CHI_HUY_DON_VI;
        } else if (ROLE_VAN_THU.contains(role)) {
            return RoleGroup.VAN_THU;
        } else if (ROLE_NHAN_VIEN.contains(role)) {
            return RoleGroup.NHAN_VIEN;
        }

        return null;
    }

    /**
     * Xác định nhóm role của một user dựa trên danh sách roles
     * Trả về nhóm có quyền cao nhất
     * 
     * @param roles Set các roles của user
     * @return RoleGroup có quyền cao nhất
     */
    public static RoleGroup getHighestRoleGroup(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return null;
        }

        // Kiểm tra theo thứ tự ưu tiên từ cao xuống thấp
        for (String role : roles) {
            if (ROLE_CHI_HUY_CUC.contains(role)) {
                return RoleGroup.CHI_HUY_CUC;
            }
        }

        for (String role : roles) {
            if (ROLE_CHI_HUY_DON_VI.contains(role)) {
                return RoleGroup.CHI_HUY_DON_VI;
            }
        }

        for (String role : roles) {
            if (ROLE_VAN_THU.contains(role)) {
                return RoleGroup.VAN_THU;
            }
        }

        for (String role : roles) {
            if (ROLE_NHAN_VIEN.contains(role)) {
                return RoleGroup.NHAN_VIEN;
            }
        }

        return null;
    }

    /**
     * Kiểm tra user có thuộc nhóm chỉ huy cục không
     */
    public static boolean isChiHuyCuc(String role) {
        return ROLE_CHI_HUY_CUC.contains(role);
    }

    /**
     * Kiểm tra user có thuộc nhóm chỉ huy đơn vị không
     */
    public static boolean isChiHuyDonVi(String role) {
        return ROLE_CHI_HUY_DON_VI.contains(role);
    }

    /**
     * Kiểm tra user có phải văn thư không
     */
    public static boolean isVanThu(String role) {
        return ROLE_VAN_THU.contains(role);
    }

    /**
     * Kiểm tra user có phải nhân viên không
     */
    public static boolean isNhanVien(String role) {
        return ROLE_NHAN_VIEN.contains(role);
    }

    /**
     * Kiểm tra user có quyền lãnh đạo (chỉ huy cục hoặc chỉ huy đơn vị) không
     */
    public static boolean isLeadership(String role) {
        return isChiHuyCuc(role) || isChiHuyDonVi(role);
    }

    /**
     * Kiểm tra user có quyền lãnh đạo cấp cao (chỉ huy cục) không
     */
    public static boolean isHighLevelLeadership(String role) {
        return isChiHuyCuc(role);
    }

    /**
     * Kiểm tra user có quyền lãnh đạo cấp trung (chỉ huy đơn vị) không
     */
    public static boolean isMidLevelLeadership(String role) {
        return isChiHuyDonVi(role);
    }

    /**
     * Lấy tất cả roles trong một nhóm
     */
    public static Set<String> getRolesInGroup(RoleGroup group) {
        switch (group) {
            case CHI_HUY_CUC:
                return new HashSet<>(ROLE_CHI_HUY_CUC);
            case CHI_HUY_DON_VI:
                return new HashSet<>(ROLE_CHI_HUY_DON_VI);
            case VAN_THU:
                return new HashSet<>(ROLE_VAN_THU);
            case NHAN_VIEN:
                return new HashSet<>(ROLE_NHAN_VIEN);
            default:
                return new HashSet<>();
        }
    }

    /**
     * Lấy level ưu tiên của role group (số càng nhỏ càng cao)
     */
    public static int getRoleGroupPriority(RoleGroup group) {
        switch (group) {
            case CHI_HUY_CUC:
                return 1;
            case CHI_HUY_DON_VI:
                return 2;
            case VAN_THU:
                return 3;
            case NHAN_VIEN:
                return 4;
            default:
                return Integer.MAX_VALUE;
        }
    }

    /**
     * So sánh quyền hạn giữa hai role groups
     * @return true nếu group1 có quyền cao hơn group2
     */
    public static boolean hasHigherAuthority(RoleGroup group1, RoleGroup group2) {
        if (group1 == null || group2 == null) {
            return false;
        }
        return getRoleGroupPriority(group1) < getRoleGroupPriority(group2);
    }

    // ==================== Methods working with UserRole enum ====================

    /**
     * Xác định nhóm role từ UserRole enum
     */
    public static RoleGroup getRoleGroup(UserRole userRole) {
        if (userRole == null) {
            return null;
        }
        return getRoleGroup(userRole.getCode());
    }

    /**
     * Xác định nhóm role cao nhất từ Set UserRole enums
     */
    public static RoleGroup getHighestRoleGroupFromEnums(Set<UserRole> userRoles) {
        if (userRoles == null || userRoles.isEmpty()) {
            return null;
        }
        
        Set<String> roleCodes = new HashSet<>();
        for (UserRole role : userRoles) {
            roleCodes.add(role.getCode());
        }
        
        return getHighestRoleGroup(roleCodes);
    }

    /**
     * Kiểm tra UserRole có thuộc nhóm chỉ huy cục không
     */
    public static boolean isChiHuyCuc(UserRole userRole) {
        return userRole != null && isChiHuyCuc(userRole.getCode());
    }

    /**
     * Kiểm tra UserRole có thuộc nhóm chỉ huy đơn vị không
     */
    public static boolean isChiHuyDonVi(UserRole userRole) {
        return userRole != null && isChiHuyDonVi(userRole.getCode());
    }

    /**
     * Kiểm tra UserRole có phải văn thư không
     */
    public static boolean isVanThu(UserRole userRole) {
        return userRole != null && isVanThu(userRole.getCode());
    }

    /**
     * Kiểm tra UserRole có phải nhân viên không
     */
    public static boolean isNhanVien(UserRole userRole) {
        return userRole != null && isNhanVien(userRole.getCode());
    }

    /**
     * Kiểm tra UserRole có quyền lãnh đạo không
     */
    public static boolean isLeadership(UserRole userRole) {
        return userRole != null && isLeadership(userRole.getCode());
    }

    /**
     * Kiểm tra UserRole có quyền lãnh đạo cấp cao không
     */
    public static boolean isHighLevelLeadership(UserRole userRole) {
        return userRole != null && isHighLevelLeadership(userRole.getCode());
    }

    /**
     * Kiểm tra UserRole có quyền lãnh đạo cấp trung không
     */
    public static boolean isMidLevelLeadership(UserRole userRole) {
        return userRole != null && isMidLevelLeadership(userRole.getCode());
    }

    /**
     * Lấy tất cả UserRole enums trong một nhóm
     */
    public static Set<UserRole> getUserRolesInGroup(RoleGroup group) {
        Set<String> roleCodes = getRolesInGroup(group);
        Set<UserRole> userRoles = new HashSet<>();
        
        for (String code : roleCodes) {
            UserRole userRole = UserRole.fromCode(code);
            if (userRole != null) {
                userRoles.add(userRole);
            }
        }
        
        return userRoles;
    }

    /**
     * Kiểm tra xem có role nào thuộc system roles không (ADMIN, USER, EDITOR)
     */
    public static boolean isSystemRole(String roleCode) {
        return UserRole.ADMIN.getCode().equals(roleCode) ||
               UserRole.USER.getCode().equals(roleCode) ||
               UserRole.EDITOR.getCode().equals(roleCode);
    }

    /**
     * Kiểm tra xem có role nào thuộc system roles không (ADMIN, USER, EDITOR)
     */
    public static boolean isSystemRole(UserRole userRole) {
        return userRole == UserRole.ADMIN ||
               userRole == UserRole.USER ||
               userRole == UserRole.EDITOR;
    }

    /**
     * Lấy tất cả organizational roles (loại trừ system roles)
     */
    public static Set<UserRole> getOrganizationalRoles() {
        Set<UserRole> orgRoles = new HashSet<>();
        for (UserRole role : UserRole.values()) {
            if (!isSystemRole(role)) {
                orgRoles.add(role);
            }
        }
        return orgRoles;
    }
} 
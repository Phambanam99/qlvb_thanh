package com.managementcontent.model.enums;

/**
 * Enum representing possible roles for a user in the system
 * Includes both system roles (ADMIN, USER) and organizational roles
 */
public enum UserRole {
    // System roles
    ADMIN("ROLE_ADMIN", "Admin"),
    USER("ROLE_USER", "User"),
    EDITOR("ROLE_EDITOR", "Editor"),
    
    // Organizational roles
    TRUONG_PHONG("ROLE_TRUONG_PHONG", "Trưởng phòng"),
    PHO_PHONG("ROLE_PHO_PHONG", "Phó phòng"),
    CUC_TRUONG("ROLE_CUC_TRUONG", "Cục trưởng"),
    CUC_PHO("ROLE_CUC_PHO", "Cục phó"),
    NHAN_VIEN("ROLE_NHAN_VIEN", "Nhân viên"),
    TRO_LY("ROLE_TRO_LY", "Trợ lý"),
    VAN_THU("ROLE_VAN_THU", "Văn thư"),
        // New organizational roles
        CHINH_UY("ROLE_CHINH_UY", "Chính ủy"),
        PHO_CHINH_UY("ROLE_PHO_CHINH_UY", "Phó Chính ủy"),
        TRAM_TRUONG("ROLE_TRAM_TRUONG", "Trạm trưởng"),
        PHO_TRAM_TRUONG("ROLE_PHO_TRAM_TRUONG", "Phó Trạm trưởng"),
        CHINH_TRI_VIEN_TRAM("ROLE_CHINH_TRI_VIEN_TRAM", "Chính trị viên trạm"),
        CUM_TRUONG("ROLE_CUM_TRUONG", "Cụm trưởng"),
        PHO_CUM_TRUONG("ROLE_PHO_CUM_TRUONG", "Phó cụm trưởng"),
        CHINH_TRI_VIEN_CUM("ROLE_CHINH_TRI_VIEN_CUM", "Chính trị viên cụm"),
        TRUONG_BAN("ROLE_TRUONG_BAN", "Trưởng Ban");
    private final String code;
    private final String displayName;

    UserRole(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get UserRole from code
     * @param code the role code string
     * @return corresponding UserRole enum or null if not found
     */
    public static UserRole fromCode(String code) {
        for (UserRole role : UserRole.values()) {
            if (role.getCode().equals(code)) {
                return role;
            }
        }
        return null;
    }

    /**
     * Get UserRole from display name
     * @param displayName the displayed name of the role
     * @return corresponding UserRole enum or null if not found
     */
    public static UserRole fromDisplayName(String displayName) {
        for (UserRole role : UserRole.values()) {
            if (role.getDisplayName().equals(displayName)) {
                return role;
            }
        }
        return null;
    }
}
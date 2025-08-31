package com.managementcontent.model.enums;

import lombok.Getter;

/**
 * Enum representing schedule status with simplified states
 */
@Getter
public enum ScheduleStatus {
    // Backend statuses (keep existing for compatibility)
    DRAFT("chua_dien_ra", "Chưa diễn ra"),
    SUBMITTED("chua_dien_ra", "Chưa diễn ra"),  
    APPROVED("dang_thuc_hien", "Đang thực hiện"),
    REJECTED("chua_dien_ra", "Chưa diễn ra"),
    COMPLETED("da_thuc_hien", "Đã thực hiện");

    private final String frontendCode;
    private final String displayName;

    ScheduleStatus(String frontendCode, String displayName) {
        this.frontendCode = frontendCode;
        this.displayName = displayName;
    }

    /**
     * Get ScheduleStatus from frontend code
     * @param frontendCode string code used by frontend
     * @return corresponding ScheduleStatus enum or null if not found
     */
    public static ScheduleStatus fromFrontendCode(String frontendCode) {
        for (ScheduleStatus status : ScheduleStatus.values()) {
            if (status.getFrontendCode().equals(frontendCode)) {
                return status;
            }
        }
        return null;
    }

    /**
     * Get ScheduleStatus from backend status string
     * @param backendStatus string status stored in database
     * @return corresponding ScheduleStatus enum or null if not found
     */
    public static ScheduleStatus fromBackendStatus(String backendStatus) {
        try {
            return ScheduleStatus.valueOf(backendStatus);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Get backend status string for database storage
     * @return enum name as string
     */
    public String getBackendStatus() {
        return this.name();
    }

    /**
     * Get simplified frontend status for UI
     */
    public static String getSimplifiedStatus(String backendStatus) {
        ScheduleStatus status = fromBackendStatus(backendStatus);
        if (status == null) return "chua_dien_ra";
        return status.getFrontendCode();
    }
} 
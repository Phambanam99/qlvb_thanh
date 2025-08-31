package com.managementcontent.model.enums;

import lombok.Getter;

/**
 * Enum representing work plan status with simplified states
 */
@Getter
public enum WorkPlanStatus {
    // Backend statuses (keep existing for compatibility)
    DRAFT("chua_dien_ra", "Chưa diễn ra"),
    SUBMITTED("chua_dien_ra", "Chưa diễn ra"),  
    APPROVED("chua_dien_ra", "Chưa diễn ra"),
    REJECTED("chua_dien_ra", "Chưa diễn ra"),
    IN_PROGRESS("dang_thuc_hien", "Đang thực hiện"),
    COMPLETED("da_thuc_hien", "Đã thực hiện");

    private final String frontendCode;
    private final String displayName;

    WorkPlanStatus(String frontendCode, String displayName) {
        this.frontendCode = frontendCode;
        this.displayName = displayName;
    }

    /**
     * Get WorkPlanStatus from frontend code
     * @param frontendCode string code used by frontend
     * @return corresponding WorkPlanStatus enum or null if not found
     */
    public static WorkPlanStatus fromFrontendCode(String frontendCode) {
        for (WorkPlanStatus status : WorkPlanStatus.values()) {
            if (status.getFrontendCode().equals(frontendCode)) {
                return status;
            }
        }
        return null;
    }

    /**
     * Get WorkPlanStatus from backend status string
     * @param backendStatus string status stored in database
     * @return corresponding WorkPlanStatus enum or null if not found
     */
    public static WorkPlanStatus fromBackendStatus(String backendStatus) {
        try {
            return WorkPlanStatus.valueOf(backendStatus);
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
        WorkPlanStatus status = fromBackendStatus(backendStatus);
        if (status == null) return "chua_dien_ra";
        return status.getFrontendCode();
    }
} 
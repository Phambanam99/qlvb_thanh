package com.managementcontent.model.enums;

/**
 * Enum representing possible statuses for a user in the system
 */
public enum UserStatus {
    INACTIVE(0, "Vô hiệu hóa"),
    ACTIVE(1, "Đang hoạt động"),
    BLOCKED(2, "Bị chặn"),
    PENDING_APPROVAL(3, "Đang chờ phê duyệt");

    private final int value;
    private final String displayName;

    UserStatus(int value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public int getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Get UserStatus from integer value
     * @param value integer value of status
     * @return corresponding UserStatus enum or null if not found
     */
    public static UserStatus fromValue(int value) {
        for (UserStatus status : UserStatus.values()) {
            if (status.getValue() == value) {
                return status;
            }
        }
        return null;
    }
}
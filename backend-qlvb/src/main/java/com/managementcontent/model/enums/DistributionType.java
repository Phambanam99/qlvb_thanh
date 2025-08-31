package com.managementcontent.model.enums;

import lombok.Getter;

/**
 * Enum representing distribution types for outgoing documents
 * Khối phát hành
 */
@Getter
public enum DistributionType {
    REGULAR(1, "Đi thường"),
    CONFIDENTIAL(2, "Đi mật"),
    COPY_BOOK(3, "Sổ sao"),
    PARTY(5, "Đi đảng"),
    STEERING_COMMITTEE(10, "Đi ban chỉ đạo");

    private final int code;
    private final String displayName;

    DistributionType(int code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    /**
     * Get DistributionType from integer code
     * 
     * @param code integer code of distribution type
     * @return corresponding DistributionType enum or null if not found
     */
    public static DistributionType fromCode(Integer code) {
        if (code == null) {
            return null;
        }
        for (DistributionType type : DistributionType.values()) {
            if (type.getCode() == code) {
                return type;
            }
        }
        return null;
    }

    /**
     * Get DistributionType from display name
     * 
     * @param displayName display name of distribution type
     * @return corresponding DistributionType enum or null if not found
     */
    public static DistributionType fromDisplayName(String displayName) {
        for (DistributionType type : DistributionType.values()) {
            if (type.getDisplayName().equals(displayName)) {
                return type;
            }
        }
        return null;
    }
}
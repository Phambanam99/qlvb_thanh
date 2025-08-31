package com.managementcontent.model.enums;

import lombok.Getter;

/**
 * Enum representing security levels for documents
 * Độ mật của văn bản
 */
@Getter
public enum SecurityLevel {
    NORMAL("normal", "Bình thường"),
    CONFIDENTIAL("confidential", "Mật"),
    SECRET("secret", "Tối mật"),
    TOP_SECRET("top_secret", "Tuyệt mật");

    private final String code;
    private final String displayName;

    SecurityLevel(String code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    /**
     * Get SecurityLevel from string code
     * 
     * @param code string code of security level
     * @return corresponding SecurityLevel enum or null if not found
     */
    public static SecurityLevel fromCode(String code) {
        for (SecurityLevel level : SecurityLevel.values()) {
            if (level.getCode().equals(code)) {
                return level;
            }
        }
        return null;
    }

    /**
     * Get SecurityLevel from display name
     * 
     * @param displayName display name of security level
     * @return corresponding SecurityLevel enum or null if not found
     */
    public static SecurityLevel fromDisplayName(String displayName) {
        for (SecurityLevel level : SecurityLevel.values()) {
            if (level.getDisplayName().equals(displayName)) {
                return level;
            }
        }
        return null;
    }
}
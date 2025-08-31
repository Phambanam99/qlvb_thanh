package com.managementcontent.model.enums;

import java.util.Arrays;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

/**
 * Enumeration of department types in the organization.
 * Provides type-safe access to department type codes and display names.
 */
@JsonDeserialize(using = DepartmentTypeDeserializer.class)
public enum DepartmentType {

    /**
     * Administrative departments (HR, Finance, etc.)
     */
    ADMINISTRATIVE(1, "Phòng ban bảo đảm"),
    /**
     * Professional/specialized departments
     */
    PROFESSIONAL(2, "Phòng ban nghiệp vụ"),

    /**
     * Support departments (IT, Maintenance, etc.)
     */
    SUPPORT(3, "Phòng ban hỗ trợ"),

    /**
     * Subsidiary units
     */
    SUBSIDIARY(4, "Đơn vị trực thuộc"),

    /**
     * Leadership/Management departments
     */
    LEADERSHIP(5, "Ban lãnh đạo");

    private final int code;
    private final String displayName;

    /**
     * Constructor for department type
     * 
     * @param code        Numeric code stored in database
     * @param displayName Human-readable name
     */
    DepartmentType(int code, String displayName) {
        this.code = code;
        this.displayName = displayName;
    }

    /**
     * Get the numeric code for this department type
     * 
     * @return The numeric code
     */
    public int getCode() {
        return code;
    }

    /**
     * Get the display name for this department type
     * 
     * @return The human-readable name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Convert a numeric code to the corresponding department type enum
     * 
     * @param code The numeric code
     * @return The matching department type or null if not found
     */
    public static DepartmentType fromCode(Integer code) {
        if (code == null) {
            return null;
        }

        return Arrays.stream(DepartmentType.values())
                .filter(type -> type.getCode() == code)
                .findFirst()
                .orElse(null);
    }
}
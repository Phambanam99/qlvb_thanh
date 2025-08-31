package com.managementcontent.dto;

import com.managementcontent.model.enums.DepartmentType;
import jakarta.persistence.Column;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

/**
 * DTO for transferring Department data between layers.
 * Provides a clean representation of Department entity without exposing
 * implementation details.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentDTO {

    /**
     * Unique identifier of the department
     */
    private Long id;

    /**
     * Full name of the department
     */
    private String name;

    /**
     * Abbreviated/short name of the department
     */
    private String abbreviation;
    private String codeDepartment;

    /**
     * Official email address of the department
     */
    private String email;

    /**
     * Type of department (as enum)
     */
    private DepartmentType type;

    /**
     * External/legacy system identifier
     */
    private String externalId;

    /**
     * Group or category the department belongs to
     */
    private String group;

    /**
     * Number of active users in this department (calculated field)
     */
    private Integer userCount;

    /**
     * Number of documents currently assigned to this department
     */
    private Integer assignedDocumentsCount;

    /**
     * Parent department identifier
     */
    private Long parentDepartmentId;

    /**
     * Parent department name (for convenience)
     */
    private String parentDepartmentName;

    /**
     * List of child department IDs
     */
    @Builder.Default
    private Set<DepartmentDTO> childDepartments = new HashSet<>();

    /**
     * Helper method to get department type code
     * 
     * @return the numeric code of the department type or null
     */
    public Integer getTypeCode() {
        return type != null ? type.getCode() : null;
    }

    /**
     * Helper method to get department type name
     * 
     * @return the display name of the department type or null
     */
    @Column
    private String storageLocation;

    public String getTypeName() {
        return type != null ? type.getDisplayName() : null;
    }
}
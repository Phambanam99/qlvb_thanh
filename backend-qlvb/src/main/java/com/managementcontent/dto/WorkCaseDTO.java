package com.managementcontent.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO representing a work case that groups related documents.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkCaseDTO {
    /** Unique identifier for the work case */
    private Long id;

    /** Title of the work case */
    private String title;

    /** Unique code for the case */
    private String caseCode;

    /** Detailed description of the work case */
    private String description;

    /** Current status of the work case */
    private String status;

    /** Priority level (LOW, MEDIUM, HIGH, CRITICAL) */
    private String priority;

    /** Due date for the case completion */
    private LocalDateTime deadline;

    /** Timestamp when the case was created */
    private LocalDateTime createdDate;

    /** Timestamp when the case was last modified */
    private LocalDateTime lastModifiedDate;

    /** ID of the user who created the case */
    private Long createdById;

    /** Name of the user who created the case */
    private String createdByName;

    /** ID of the user assigned to the case */
    private Long assignedToId;

    /** Name of the user assigned to the case */
    private String assignedToName;

    /** Completion percentage (0-100) */
    private Integer progress;

    /** Comma-separated tags for categorization */
    private String tags;

    /** Set of document IDs associated with this case */
    private Set<Long> documentIds;
}
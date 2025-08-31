package com.managementcontent.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO representing an entry in the activity log.
 */
@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class ActivityLogDTO {
    /** Unique identifier for the log entry */
    private Long id;

    /** Type of action performed */
    private String actionType;

    /** Description of the action */
    private String actionDescription;

    /** Timestamp when the action was performed */
    private LocalDateTime timestamp;

    /** ID of the user who performed the action */
    private Long userId;

    /** Username of the user who performed the action */
    private String username;

    /** ID of the affected document (if applicable) */
    private Long documentId;

    /** Title of the affected document (if applicable) */
    private String documentTitle;

    /** ID of the affected work case (if applicable) */
    private Long workCaseId;

    /** Title of the affected work case (if applicable) */
    private String workCaseTitle;
}
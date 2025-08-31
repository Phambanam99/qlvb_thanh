package com.managementcontent.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO representing an entry in the document's workflow history.
 */
@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class DocumentHistoryDTO {
    /** Unique identifier for the history entry */
    private Long id;

    /** ID of the document this history pertains to */
    private Long documentId;

    /** Title of the document */
    private String documentTitle;

    /** Type of action performed (STATUS_CHANGE, ASSIGNMENT, etc.) */
    private String action;

    /** Comments or notes related to this history entry */
    private String comments;

    /** Path to attachment file if any */
    private String attachmentPath;

    /** Timestamp when the action was performed */
    private LocalDateTime timestamp;

    /** Previous status code of the document before this action */
    private String previousStatus;

    /** Human-readable display name for the previous status */
    private String previousStatusDisplayName;

    /** New status code of the document after this action */
    private String newStatus;

    /** Human-readable display name for the new status */
    private String newStatusDisplayName;

    /** ID of the user who performed the action */
    private Long actorId;

    /** Name of the user who performed the action */
    private String actorName;

    private List<String> assignedToNames;
    /** ID of the user the document was assigned to (if applicable) */
    private Long assignedToId;

    /** Name of the user the document was assigned to (if applicable) */
    private String assignedToName;
}
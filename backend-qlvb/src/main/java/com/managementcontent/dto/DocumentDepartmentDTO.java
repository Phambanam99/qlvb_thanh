package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing a document's assignment to a department
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDepartmentDTO {
    /** Unique identifier for the assignment */
    private Long id;

    /** ID of the document */
    private Long documentId;

    /** Title of the document */
    private String documentTitle;

    /** ID of the department */
    private Long departmentId;

    /** Name of the department */
    private String departmentName;

    /** Indicates if this department is the primary processor */
    private boolean isPrimary;

    /** Comments or notes about this assignment */
    private String comments;

    /** When the document was assigned to this department */
    private LocalDateTime assignedDate;

    /** Optional deadline for this department */
    private LocalDateTime dueDate;

    /** ID of the user who made this assignment */
    private Long assignedById;

    /** Name of the user who made this assignment */
    private String assignedByName;

    /** Current processing status */
    private String processingStatus;
}
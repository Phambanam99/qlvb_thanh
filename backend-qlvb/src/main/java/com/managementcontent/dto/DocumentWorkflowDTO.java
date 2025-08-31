package com.managementcontent.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Set;

/**
 * DTO for document workflow operations.
 */
@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class DocumentWorkflowDTO {
    /** ID of the document being processed */
    private Long documentId;
    private String action;
    /** Status code to set on the document */
    private String status;
    
    /** Human-readable display name for the status */
    private String statusDisplayName;
    
    /** ID of the user being assigned to the document */
    private Long assignedToId;
    private List<Long> assignedToIds;
    private List<String> assignedToNames;
    private Long primaryDepartmentId;
    private String primaryDepartmentName;
    private Set<Long> collaboratingDepartmentIds;
    private Set<String> collaboratingDepartmentNames;
    /** Name of the user being assigned to the document */
    private String assignedToName;
    private Date closureDeadline;
    /** Comments or notes related to this workflow action */
    private String comments;


}
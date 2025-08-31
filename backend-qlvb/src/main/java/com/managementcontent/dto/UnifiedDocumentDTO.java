package com.managementcontent.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO that provides a unified view of documents for the frontend.
 * Combines properties from both IncomingDocument and OutgoingDocument entities.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UnifiedDocumentDTO {
    /** Unique identifier for the document */
    private Long id;

    /** Document number used for identification */
    private String number;

    /** Reference number for cross-referencing */
    private String referenceNumber;

    /** Date of the referenced document */
    private String referenceDate;

    /** Agency or authority that issued the document */
    private String issuingAgency;

    /** Main subject or title of the document */
    private String subject;

    /** ID of the department responsible for processing */
    private String processingDepartmentId;

    /** Name of the department responsible for processing */
    private String processingDepartment;

    /** Date when the document was received */
    private String receivedDate;

    /** Time when the document was received */
    private String receivedTime;

    /** Security classification level (public, internal, confidential, etc.) */
    private String securityLevel;

    /** Urgency level (normal, urgent, immediate, etc.) */
    private String urgencyLevel;

    /**
     * Current processing status (waiting, in-progress, processed, draft, published)
     */
    private String status;

    /** Flag indicating if document has attachments */
    private boolean hasAttachment;

    /** List of file attachments associated with the document */
    private List<DocumentAttachmentDTO> attachments;

    /** List of users assigned to work on this document */
    private List<String> assignedUsers;

    /** ID of the document type */
    private Long documentTypeId;

    /** Code of the document type (e.g., CONG_VAN, CHI_THI, QUYET_DINH) */
    private String documentTypeCode;

    /** Name of the document type (e.g., Công văn, Chỉ thị, Quyết định) */
    private String documentTypeName;

    /** Indicates if the user is the primary handler of the document */
    private boolean isPrimaryHandler;

    /** Due date for document processing */
    private String deadline;

    /** Flag indicating if document requires a response */
    private boolean requiresResponse;

    /** Comments and notes related to the document */
    private List<DocumentCommentDTO> comments;

    /** Content/body of the document */
    private String content;

    /** Flag indicating if the document includes enclosures */
    private boolean includesEnclosure;

    /** Flag indicating if the document has legal significance */
    private boolean isLegalDocument;

    /** Flag indicating if document should be returned confidentially */
    private boolean isConfidentialReturn;
}
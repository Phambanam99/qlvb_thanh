package com.managementcontent.dto;

import com.managementcontent.model.Department;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Set;

/**
 * DTO representing an incoming document in the system.
 */
@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class IncomingDocumentDTO {
    /** Unique identifier for the document */
    private Long id;

    /** Title or subject of the document */
    private String title;

    /** Loại văn bản cụ thể (OFFICIAL_LETTER, DECISION, ANNOUNCEMENT, v.v.) */
    private String documentType;

    /** Official document number */
    private String documentNumber;

    /** Reference number for cross-referencing */
    private String referenceNumber;

    /** Organization or authority that issued the document */
    private String issuingAuthority;

    /** Urgency level (NORMAL, URGENT, IMMEDIATE, etc.) */
    private String urgencyLevel;

    /** Độ mật của văn bản (NORMAL, CONFIDENTIAL, SECRET, TOP_SECRET) */
    private String securityLevel;

    /** Tóm tắt nội dung chính của văn bản */
    private String summary;

    /** Ghi chú bổ sung về văn bản */
    private String notes;

    /** Date when the document was signed */
    private LocalDate signingDate;
    /** Date when the document was signed */
    private LocalDate receivedDate;
    /** Current processing status */
    private String processingStatus;
    private String displayStatus;

    /**
     * Tracking status for document processing (NOT_PROCESSED, IN_PROCESS,
     * PROCESSED)
     */
    private String trackingStatus;
    private String trackingStatusDisplayName;

    /** Whether the document requires closure handling */
    private Boolean closureRequest;
    private Date closureDeadline;
    /** Text name of the sending department */
    private String sendingDepartmentName;

    private Set<String> collaboratingDepartmentNames;
    private Set<Long> collaboratingDepartmentIds;
    /** Email address where the document was received from */
    private String emailSource;

    /** ID of the primary user responsible for processing */
    private Long primaryProcessDepartmentId;

    /** Primary user responsible for processing (as DTO) */
    private DepartmentDTO primaryProcessor;

    /** Timestamp when the document was created in the system */
    private LocalDateTime created;

    /** Timestamp when the document was last modified */
    private LocalDateTime changed;

    /** Path to the stored attachment file */
    private String attachmentFilename;
    private UserDTO userPrimaryProcessor;
    private String storageLocation;

    /**
     * Số thu - số thứ tự thu thập văn bản
     */
    private String receiptNumber;

    /**
     * Cán bộ xử lý - người được phân công xử lý văn bản
     */
    private UserDTO processingOfficer;
    private Long processingOfficerId;
}
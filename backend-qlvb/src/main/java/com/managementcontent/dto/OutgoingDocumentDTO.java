package com.managementcontent.dto;

import com.managementcontent.model.User;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class OutgoingDocumentDTO {
    private String status;
    private String statusDisplayName;
    /**
     * Tracking status for document processing (NOT_PROCESSED, IN_PROCESS,
     * PROCESSED)
     */
    private String trackingStatus;
    private String trackingStatusDisplayName;
    /** Unique identifier for the document */
    private Long id;

    /** Title or subject of the document */
    private String title;

    /** Type or category of document (Official, Notice, Report, etc.) */
    private String documentType;

    /** Official document number */
    private String documentNumber;

    /** Reference number for cross-referencing */
    private String referenceNumber;

    /** ID of the user who signed the document */
    private Long signerId;

    private String summary;
    /** Name of the user who signed the document */
    private String signerName;
    private String signerPosition;
    /** Date and time when the document was signed */
    private LocalDateTime signingDate;

    /** Department that drafted the document */
    private String draftingDepartment;

    private Long draftingDepartmentId;
    /** List of related document references */
    private String relatedDocuments;

    /** Physical storage location identifier */
    private Integer storageLocation;

    /** Document volume reference */
    private String documentVolume;

    /** Email address for the recipient */
    private String emailAddress;

    /** Text description of the receiving department */
    private String receivingDepartmentText;

    /** Timestamp when the document was created in the system */
    private LocalDateTime created;
    private User creator;
    /** Timestamp when the document was last modified */
    private LocalDateTime changed;

    /** Path to the stored attachment file */
    private String attachmentFilename;

    /**
     * Indicates if this is an internal document that doesn't require formal
     * approval
     */
    private Boolean isInternal;

    /**
     * Đơn vị soạn thảo - có thể lấy từ department của người tạo
     */
    private DepartmentDTO draftingDepartmentEntity;
    private Long draftingDepartmentEntityId;

    /**
     * Độ mật của công văn
     */
    private String securityLevel;
    private String securityLevelDisplayName;

    /**
     * Người ký công văn
     */
    private UserDTO documentSigner;
    private Long documentSignerId;

    /**
     * Chuyển bằng điện mật (có, không)
     */
    private Boolean isSecureTransmission;

    /**
     * Hạn xử lý công văn
     */
    private LocalDateTime processingDeadline;

    /**
     * Cơ quan ban hành
     */
    private String issuingAgency;

    /**
     * Khối phát hành
     */
    private Integer distributionType;
    private String distributionTypeDisplayName;

    /**
     * Số bản phát hành
     */
    private Integer numberOfCopies;

    /**
     * Số tờ của công văn
     */
    private Integer numberOfPages;

    /**
     * Không gửi bản giấy (có, không)
     */
    private Boolean noPaperCopy;
}
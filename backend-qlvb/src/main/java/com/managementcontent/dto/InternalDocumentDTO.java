package com.managementcontent.dto;

import com.managementcontent.model.InternalDocument.Priority;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.model.enums.SecurityLevel;
import com.managementcontent.model.enums.DistributionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InternalDocumentDTO {
    private Long id;
    private String documentNumber;
    private String title;
    private String summary;
    private String documentType;
    private LocalDateTime signingDate;
    private Priority priority;
    private String notes;
    private DocumentProcessingStatus status;
    private Boolean isInternal;
    private String signer;
    private Long numberReceived;
    // Sender information
    private Long senderId;
    private String senderName;
    private String senderDepartment;

    // New fields matching OutgoingDocument
    private DepartmentDTO draftingDepartment;
    private SecurityLevel securityLevel;
    private UserDTO documentSigner;
    private Boolean isSecureTransmission;
    private LocalDateTime processingDeadline;
    private String issuingAgency;
    private DistributionType distributionType;
    private String distributionTypeDisplayName;
    private Integer numberOfCopies;
    private Integer numberOfPages;
    private Boolean noPaperCopy;

    // Recipients
    private List<RecipientDTO> recipients;

    // Attachments
    private List<AttachmentDTO> attachments;

    // Reply information
    private Long replyToId;
    private String replyToTitle;
    private Integer replyCount;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Read status for current user
    private Boolean isRead;
    private LocalDateTime readAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecipientDTO {
        private Long id;
        private Long departmentId;
        private String departmentName;
        private Long userId;
        private String userName;
        private Boolean isRead;
        private LocalDateTime readAt;
        private LocalDateTime receivedAt;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDTO {
        private Long id;
        private String filename;
        private String contentType;
        private Long fileSize;
        private LocalDateTime uploadedAt;
        private String uploadedByName;
        private String description;
    }
}
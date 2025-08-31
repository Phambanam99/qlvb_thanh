package com.managementcontent.dto;

import com.managementcontent.model.InternalDocument.Priority;
import com.managementcontent.model.enums.SecurityLevel;
import com.managementcontent.model.enums.DistributionType;
import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateInternalDocumentDTO {

    @NotBlank(message = "Số công văn không được để trống")
    private String documentNumber;

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 2000, message = "Tiêu đề không được quá 2000 ký tự")
    private String title;

    private Long numberReceive;
    private String summary;

    private String documentType;

    private LocalDateTime signingDate;

    @NotNull(message = "Mức độ ưu tiên không được để trống")
    @Builder.Default
    private Priority urgencyLevel = Priority.KHAN;

    private String notes;
    private String signer;

    // New fields matching OutgoingDocument
    private Long draftingDepartmentId;
    @Builder.Default
    private SecurityLevel securityLevel = SecurityLevel.NORMAL;
    private Long documentSignerId;
    @Builder.Default
    private Boolean isSecureTransmission = false;
    private LocalDateTime processingDeadline;
    private String issuingAgency;
    @Builder.Default
    private DistributionType distributionType = DistributionType.REGULAR;
    private Integer numberOfCopies;
    private Integer numberOfPages;
    @Builder.Default
    private Boolean noPaperCopy = false;

    @NotNull(message = "Danh sách người nhận không được để trống")
    @Size(min = 1, message = "Phải có ít nhất một người nhận")
    private List<RecipientRequest> recipients;

    // For reply documents
    private Long replyToId;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecipientRequest {
        @NotNull(message = "ID phòng ban không được để trống")
        private Long departmentId;

        // Null means send to all users in department
        // Not null means send to specific user
        private Long userId;

        private String notes;
    }
}
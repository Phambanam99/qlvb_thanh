package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.managementcontent.model.enums.SecurityLevel;
import com.managementcontent.model.enums.DistributionType;
import jakarta.persistence.*;
import lombok.*;
import com.managementcontent.model.DocumentRelationship;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table
@Data
@Setter
@Getter
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class OutgoingDocument extends Document {

    @Column
    private String referenceNumber;

    @Column
    private String getDocumentNumber;

    @ManyToOne
    @JoinColumn
    private User signer;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "outgoingDocument", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("outgoing-relationships")
    private Set<DocumentRelationship> relatedIncomingDocuments = new HashSet<>();

    @Column
    private LocalDateTime signingDate;

    @Column(length = 2000)
    private String summary;

    @Column
    private String draftingDepartment;

    @Column
    private String relatedDocuments;

    @Column
    private Integer storageLocation;

    @Column
    private String documentVolume;

    @Column
    private String emailAddress;

    @Column
    private String resend;

    @Column
    private String receivingDepartmentText;

    /**
     * Indicates if this document is for internal use only.
     * Internal documents don't require formal approval process
     * and can be sent directly between users.
     */
    @Column(nullable = false)
    private Boolean isInternal = false;

    /**
     * Đơn vị soạn thảo - có thể lấy từ department của người tạo
     */
    @ManyToOne
    @JoinColumn(name = "drafting_department_id")
    private Department draftingDepartmentEntity;

    /**
     * Độ mật của văn bản
     */
    @Enumerated(EnumType.STRING)
    @Column
    private SecurityLevel securityLevel = SecurityLevel.NORMAL;

    /**
     * Người ký văn bản
     */
    @ManyToOne
    @JoinColumn(name = "document_signer_id")
    private User documentSigner;

    /**
     * Chuyển bằng điện mật (có, không)
     */
    @Column
    private Boolean isSecureTransmission = false;

    /**
     * Hạn xử lý văn bản
     */
    @Column
    private LocalDateTime processingDeadline;

    /**
     * Cơ quan ban hành
     */
    @Column
    private String issuingAgency;

    /**
     * Khối phát hành (1.đi thường, 2. đi mật, 3. sổ sao, 5. đi đảng, 10. đi ban chỉ
     * đạo)
     */
    @Enumerated(EnumType.ORDINAL)
    @Column
    private DistributionType distributionType = DistributionType.REGULAR;

    /**
     * Số bản phát hành
     */
    @Column
    private Integer numberOfCopies;

    /**
     * Số tờ của văn bản
     */
    @Column
    private Integer numberOfPages;

    /**
     * Không gửi bản giấy (có, không)
     */
    @Column
    private Boolean noPaperCopy = false;
}
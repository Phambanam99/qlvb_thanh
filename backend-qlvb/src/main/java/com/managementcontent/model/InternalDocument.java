package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.model.enums.SecurityLevel;
import com.managementcontent.model.enums.DistributionType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "internal_document")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InternalDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_number", unique = true)
    private String documentNumber;

    @Column(name= "number_receive")
    private Long numberReceive;
    @Column(name = "title", nullable = false, length = 2000)
    private String title;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "signing_date")
    private LocalDateTime signingDate;

    @Column
    private String signer;

    @Column(name = "urgencyLevel", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Priority urgencyLevel = Priority.KHAN;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private DocumentProcessingStatus status = DocumentProcessingStatus.PENDING_APPROVAL;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Đơn vị soạn thảo - có thể lấy từ department của người tạo
     */
    @ManyToOne
    @JoinColumn(name = "drafting_department_id")
    private Department draftingDepartment;

    /**
     * Độ mật của công văn
     */
    @Enumerated(EnumType.STRING)
    @Column
    @Builder.Default
    private SecurityLevel securityLevel = SecurityLevel.NORMAL;

    /**
     * Người ký công văn
     */
    @ManyToOne
    @JoinColumn(name = "document_signer_id")
    private User documentSigner;

    /**
     * Chuyển bằng điện mật (có, không)
     */
    @Column
    @Builder.Default
    private Boolean isSecureTransmission = false;

    /**
     * Hạn xử lý công văn
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
    @Builder.Default
    private DistributionType distributionType = DistributionType.REGULAR;

    /**
     * Số bản phát hành
     */
    @Column
    private Integer numberOfCopies;

    /**
     * Số tờ của công văn
     */
    @Column
    private Integer numberOfPages;

    /**
     * Không gửi bản giấy (có, không)
     */
    @Column
    @Builder.Default
    private Boolean noPaperCopy = false;

    // Quan hệ với người nhận
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("internal-document-recipients")
    @Builder.Default
    private Set<InternalDocumentRecipient> recipients = new HashSet<>();

    // Quan hệ với file đính kèm
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("internal-document-attachments")
    @Builder.Default
    private Set<InternalDocumentAttachment> attachments = new HashSet<>();

    // Quan hệ với lịch sử
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("internal-document-history")
    @Builder.Default
    private Set<InternalDocumentHistory> history = new HashSet<>();

    // Quan hệ với reply - công văn trả lời
    @ManyToOne
    @JoinColumn(name = "reply_to_id")
    private InternalDocument replyTo;

    @OneToMany(mappedBy = "replyTo", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("internal-document-replies")
    @Builder.Default
    private Set<InternalDocument> replies = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Priority {
        HOA_TOC("Hỏa tốc"),
        HOA_TOC_HEN_GIO("Hỏa tốc hẹn giờ"),
        THUONG_KHAN("Thượng khẩn"),
        KHAN("Khẩn"),
        THUONG("Thường");

        private final String displayName;

        Priority(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // Helper methods
    public InternalDocumentRecipient addRecipient(Department department, User user) {
        InternalDocumentRecipient recipient = InternalDocumentRecipient.builder()
                .document(this)
                .department(department)
                .user(user)
                .receivedAt(LocalDateTime.now())
                .isRead(false)
                .build();

        this.recipients.add(recipient);
        return recipient;
    }

    public InternalDocumentAttachment addAttachment(String filename, String filePath, String contentType,
            Long fileSize) {
        InternalDocumentAttachment attachment = InternalDocumentAttachment.builder()
                .document(this)
                .filename(filename)
                .filePath(filePath)
                .contentType(contentType)
                .fileSize(fileSize)
                .uploadedAt(LocalDateTime.now())
                .build();

        this.attachments.add(attachment);
        return attachment;
    }

    public InternalDocumentHistory addHistory(String action, String details, User performedBy) {
        InternalDocumentHistory historyEntry = InternalDocumentHistory.builder()
                .document(this)
                .action(action)
                .details(details)
                .performedBy(performedBy)
                .performedAt(LocalDateTime.now())
                .build();

        this.history.add(historyEntry);
        return historyEntry;
    }
}
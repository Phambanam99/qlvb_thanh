package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "node")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vid")
    private Long version;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String language = "";

    @Column(nullable = false, length = 2000)
    private String title = "";

    @ManyToOne
    @JoinColumn(name = "uid")
    private User creator;

    @Column(nullable = false)
    private DocumentProcessingStatus status;

    @Column(nullable = false)
    private LocalDateTime created;

    @Column(nullable = false)
    private LocalDateTime changed;

    @Column()
    private String attachmentFilename;
    // documentNumber needed unique

    @Column(unique = true)
    private String documentNumber;

    @Column()
    private String referenceNumber;

    @Column
    private LocalDateTime signingDate;

    @Column
    private Date processDeadline;

    /**
     * Cơ quan/đơn vị phát hành (áp dụng cho công văn chung)
     */
    @Column(name = "issuing_agency")
    private String issuingAgency;

    /**
     * Số lượt tải xuống tổng cho tài liệu (tính theo lượt tải các file đính kèm)
     */
    @Column(name = "download_count")
    private Long downloadCount = 0L;

    // Add reference to DocumentType
    @ManyToOne
    @JoinColumn(name = "document_type_id")
    private DocumentType documentType;

    // Thêm quan hệ một-nhiều với DocumentDepartment
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude

    @JsonManagedReference("document-departments")
    private Set<DocumentDepartment> assignedDepartments = new HashSet<>();

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User userPrimaryProcessor;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("document-history")
    private Set<DocumentHistory> history = new HashSet<>();

    /**
     * Public portal visibility. If true, document is publicly
     * listable/downloadable.
     */
    // Nullable during initial migration; service code treats null as false.
    @Column(name = "is_public", nullable = true)
    private Boolean isPublic = false;

    /**
     * When the document was published to the public portal.
     */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /**
     * Optional public uploader metadata (for anonymous submissions)
     */
    @Column(name = "uploader_name")
    private String uploaderName;

    @Column(name = "uploader_email")
    private String uploaderEmail;

    /**
     * Categories assigned for public browsing (many-to-many).
     */
    @ManyToMany
    @JoinTable(name = "document_category_links", joinColumns = @JoinColumn(name = "document_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<com.managementcontent.model.DocumentCategory> categories = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        created = LocalDateTime.now();
        changed = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        changed = LocalDateTime.now();
    }

    /**
     * Helper method để thêm phòng ban xử lý cho công văn
     * 
     * @param department Phòng ban được phân công
     * @param isPrimary  Là phòng ban xử lý chính (true) hoặc phòng ban phối hợp
     *                   (false)
     * @param assignedBy Người phân công
     * @param comments   Ghi chú về việc phân công
     * @return DocumentDepartment đã được tạo
     */
    public DocumentDepartment addDepartment(Department department, boolean isPrimary, User assignedBy,
            String comments) {
        DocumentDepartment documentDepartment = DocumentDepartment.builder()
                .document(this)
                .department(department)
                .isPrimary(isPrimary)
                .assignedDate(LocalDateTime.now())
                .assignedBy(assignedBy)
                .comments(comments)
                .build();

        this.assignedDepartments.add(documentDepartment);
        return documentDepartment;
    }
}
package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity to track read status for all types of documents
 * This provides a unified way to track read status across different document
 * types
 */
@Entity
@Table(name = "document_read_status")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentReadStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID of the document (can be from any document table)
     */
    @Column(name = "document_id", nullable = false)
    private Long documentId;

    /**
     * Type of document (INCOMING_EXTERNAL, OUTGOING_INTERNAL, OUTGOING_EXTERNAL)
     * INTERNAL documents already have their own read tracking system
     */
    @Column(name = "document_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private DocumentType documentType;

    /**
     * User who read the document
     */
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Whether the document has been read
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * When the document was marked as read
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * When this record was created
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * When this record was last updated
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Helper method to mark as read
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * Helper method to mark as unread
     */
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }

    /**
     * Document types that use this read status tracking
     */
    public enum DocumentType {
        INCOMING_EXTERNAL("Văn bản đến bên ngoài"),
        INCOMING_INTERNAL("Văn bản đến nội bộ"),
        OUTGOING_INTERNAL("Văn bản đi nội bộ"),
        OUTGOING_EXTERNAL("Văn bản đi bên ngoài");

        private final String displayName;

        DocumentType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}

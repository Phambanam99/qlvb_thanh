package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "internal_document_history")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InternalDocumentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    @JsonBackReference("internal-document-history")
    private InternalDocument document;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @ManyToOne
    @JoinColumn(name = "performed_by", nullable = false)
    private User performedBy;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @PrePersist
    protected void onCreate() {
        if (performedAt == null) {
            performedAt = LocalDateTime.now();
        }
    }

    // Common action constants
    public static final String ACTION_CREATED = "CREATED";
    public static final String ACTION_SENT = "SENT";
    public static final String ACTION_READ = "READ";
    public static final String ACTION_REPLIED = "REPLIED";
    public static final String ACTION_FORWARDED = "FORWARDED";
    public static final String ACTION_UPDATED = "UPDATED";
    public static final String ACTION_DELETED = "DELETED";
    public static final String ACTION_ATTACHMENT_ADDED = "ATTACHMENT_ADDED";
    public static final String ACTION_ATTACHMENT_REMOVED = "ATTACHMENT_REMOVED";
}
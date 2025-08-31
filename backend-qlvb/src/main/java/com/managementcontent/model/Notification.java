package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.managementcontent.model.enums.NotificationType;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean isRead;

    @Column(nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(nullable = true) // Temporarily nullable for migration
    @Builder.Default
    private boolean active = true;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * ID của thực thể liên quan (Document, InternalDocument, etc.)
     */
    @Column(name = "entity_id")
    private Long entityId;

    /**
     * Loại thực thể ("document", "internal_document", etc.)
     */
    @Column(name = "entity_type")
    private String entityType;

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}

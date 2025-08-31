package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "action_type", nullable = false)
    private String actionType;
    
    @Column(name = "action_description", columnDefinition = "TEXT")
    private String actionDescription;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;
    
    @ManyToOne
    @JoinColumn(name = "work_case_id")
    private WorkCase workCase;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    @Column(name = "additional_data", columnDefinition = "TEXT")
    private String additionalData;
    
    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
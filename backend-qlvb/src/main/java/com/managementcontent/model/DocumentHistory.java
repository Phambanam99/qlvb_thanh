package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;

import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "document_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    @JsonBackReference("document-history")
    private Document document;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "new_status")
    private String newStatus;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "attachment_path")
    private String attachmentPath;

    // Phòng xử lý chính
    @ManyToOne
    @JoinColumn(name = "primary_department_id")
    private Department primaryDepartment;

    @ManyToOne
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne
    @JoinColumn(name = "performed_by_id")
    private User performedBy;
    // Các phòng xử lý phụ
    @ManyToMany
    @JoinTable(name = "document_history_collaborating_departments", joinColumns = @JoinColumn(name = "document_history_id"), inverseJoinColumns = @JoinColumn(name = "department_id"))
    @Builder.Default
    private Set<Department> collaboratingDepartments = new HashSet<>();

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
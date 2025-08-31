package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "work_cases")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "case_code", unique = true)
    private String caseCode;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "status")
    private String status;

    @Column(name = "priority")
    private String priority;

    @Column(name = "deadline")
    private LocalDateTime deadline;
    
    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;
    
    @Column(name = "last_modified_date", nullable = false)
    private LocalDateTime lastModifiedDate;
    
    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private User assignedTo;
    
    @Column(name = "progress")
    private Integer progress;
    
    @Column(name = "tags")
    private String tags;

    @ManyToMany
    @JoinTable(
        name = "workcase_documents",
        joinColumns = @JoinColumn(name = "workcase_id"),
        inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
    
    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        lastModifiedDate = LocalDateTime.now();
        if (progress == null) {
            progress = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastModifiedDate = LocalDateTime.now();
    }
    
    public void addDocument(Document document) {
        this.documents.add(document);
    }
    
    public void removeDocument(Document document) {
        this.documents.remove(document);
    }
}
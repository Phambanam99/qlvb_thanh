package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing the relationship between documents and departments.
 * Used to track which departments a document has been distributed to,
 * with designation of primary vs. collaborating departments.
 */
@Entity
@Table(name = "document_department")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentDepartment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonBackReference("document-departments")
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;


    @ManyToOne
    @JsonBackReference("department-documents")
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /**
     * Indicates if this department is the primary processor (true)
     * or just a collaborating department (false)
     */
    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    /**
     * Optional comments or notes about this assignment
     */
    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;


    /**
     * When the document was assigned to this department
     */
    @Column(name = "assigned_date", nullable = false)
    private LocalDateTime assignedDate;

    /**
     * Optional deadline for this department to complete processing
     */
    @Column(name = "due_date")
    private LocalDateTime dueDate;

    /**
     * ID of the user who made this assignment
     */
    @ManyToOne
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    /**
     * Current processing status of this document-department relationship
     */
    @Column(name = "processing_status")
    private String processingStatus;

    @PrePersist
    protected void onCreate() {
        if (assignedDate == null) {
            assignedDate = LocalDateTime.now();
        }
    }
}
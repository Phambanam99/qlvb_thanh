package com.managementcontent.model;

import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
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
public class IncomingDocument extends Document {

    @Column
    private String issuingAuthority;

    @Column
    private String urgencyLevel;

    @Column
    private Integer computeValue;

    @Column
    private LocalDateTime signingDate;

    @Column
    private String closureRequest;

    @Column
    private String emailSource;

    @Column
    private String sendingDepartmentText;

    // Trong IncomingDocument.java
    @OneToMany(mappedBy = "incomingDocument")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("incoming-relationships")
    private Set<DocumentRelationship> relatedOutgoingDocuments = new HashSet<>();

    /**
     * Độ mật của công văn (NORMAL, CONFIDENTIAL, SECRET, TOP_SECRET)
     */
    @Column
    private String securityLevel;

    /**
     * Tóm tắt nội dung chính của công văn
     */
    @Column
    private String summary;

    /**
     * Ghi chú bổ sung về công văn
     */
    @Column
    private String notes;

    @Column
    private String storageLocation;

    @Column
    private LocalDateTime receivedDate;

    /**
     * Số thu - số thứ tự thu thập công văn
     */
    @Column
    private String receiptNumber;

    /**
     * Cán bộ xử lý - người được phân công xử lý công văn
     */
    @ManyToOne
    @JoinColumn(name = "processing_officer_id")
    private User processingOfficer;

}
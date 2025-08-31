package com.managementcontent.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_relationship")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentRelationship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "incoming_document_id")
    @JsonBackReference("incoming-relationships")
    private IncomingDocument incomingDocument;

    @ManyToOne
    @JoinColumn(name = "outgoing_document_id")
    @JsonBackReference("outgoing-relationships")
    private OutgoingDocument outgoingDocument;

    @Column(name = "relationship_type")
    private String relationshipType; // "RESPONSE", "REFERENCE", v.v.

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by_id")
    private Long createdById;

    @Column(name = "comments")
    private String comments;
}
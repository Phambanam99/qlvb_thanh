package com.managementcontent.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Model class for document comments
 */
@Entity
@Table(name = "document_comments")
@Data
@NoArgsConstructor
public class DocumentComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(nullable = false)
    @CreationTimestamp
    private LocalDateTime created;

    @Column(name = "comment_type", length = 50)
    private String commentType = "comment"; // Options: comment, instruction, feedback, approval
}
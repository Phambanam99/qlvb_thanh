package com.managementcontent.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing a Guide File in the document management system.
 * Guide files are instructional documents that help users understand processes and procedures.
 */
@Entity
@Table(name = "guide_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideFile {

    /**
     * Primary identifier for the guide file
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Display name of the guide file
     */
    @Column(nullable = false)
    private String name;

    /**
     * Description of the guide file content
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Original filename when uploaded
     */
    @Column(name = "file_name", nullable = false)
    private String fileName;

    /**
     * MIME type of the file
     */
    @Column(name = "file_type", nullable = false)
    private String fileType;

    /**
     * Size of the file in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * URL or path to access the file
     */
    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    /**
     * Category of the guide file (e.g., "User Manual", "Process Guide", etc.)
     */
    @Column(nullable = false)
    private String category;

    /**
     * Whether the guide file is active and visible to users
     */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Timestamp when the guide file was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * Timestamp when the guide file was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    /**
     * ID of the user who created the guide file
     */
    @Column(name = "created_by_id")
    private Long createdById;

    /**
     * Name of the user who created the guide file
     */
    @Column(name = "created_by_name")
    private String createdByName;
} 
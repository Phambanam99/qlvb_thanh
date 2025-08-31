package com.managementcontent.repository;

import com.managementcontent.model.DocumentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentAttachmentRepository extends JpaRepository<DocumentAttachment, Long> {

    /**
     * Find all attachments for a specific document
     */
    List<DocumentAttachment> findByDocumentId(Long documentId);

    /**
     * Find all attachments for a specific document ordered by upload date
     */
    List<DocumentAttachment> findByDocumentIdOrderByUploadedDateDesc(Long documentId);

    /**
     * Count attachments for a specific document
     */
    long countByDocumentId(Long documentId);

    /**
     * Delete all attachments for a specific document
     */
    void deleteByDocumentId(Long documentId);

    /**
     * Find attachments by original filename for a specific document
     */
    List<DocumentAttachment> findByDocumentIdAndOriginalFilenameContainingIgnoreCase(Long documentId, String filename);

    /**
     * Get total file size for a document
     */
    @Query("SELECT COALESCE(SUM(a.fileSize), 0) FROM DocumentAttachment a WHERE a.document.id = :documentId")
    Long getTotalFileSizeByDocumentId(@Param("documentId") Long documentId);
} 
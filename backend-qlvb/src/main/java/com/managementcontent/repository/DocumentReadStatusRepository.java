package com.managementcontent.repository;

import com.managementcontent.model.DocumentReadStatus;
import com.managementcontent.model.DocumentReadStatus.DocumentType;
import com.managementcontent.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentReadStatusRepository extends JpaRepository<DocumentReadStatus, Long> {

    /**
     * Find read status for a specific document and user
     */
    Optional<DocumentReadStatus> findByDocumentIdAndDocumentTypeAndUser(
            Long documentId, DocumentType documentType, User user);

    /**
     * Find all read statuses for a user and document type
     */
    List<DocumentReadStatus> findByUserAndDocumentType(User user, DocumentType documentType);

    /**
     * Find all read statuses for a specific document
     */
    List<DocumentReadStatus> findByDocumentIdAndDocumentType(Long documentId, DocumentType documentType);

    /**
     * Check if a document is read by a specific user
     */
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM DocumentReadStatus r " +
           "WHERE r.documentId = :documentId " +
           "AND r.documentType = :documentType " +
           "AND r.user = :user " +
           "AND r.isRead = true")
    boolean isDocumentReadByUser(@Param("documentId") Long documentId, 
                                @Param("documentType") DocumentType documentType,
                                @Param("user") User user);

    /**
     * Count unread documents for a user and document type
     */
    @Query("SELECT COUNT(r) FROM DocumentReadStatus r " +
           "WHERE r.user = :user " +
           "AND r.documentType = :documentType " +
           "AND r.isRead = false")
    long countUnreadDocuments(@Param("user") User user, 
                             @Param("documentType") DocumentType documentType);

    /**
     * Get all unread document IDs for a user and document type
     */
    @Query("SELECT r.documentId FROM DocumentReadStatus r " +
           "WHERE r.user = :user " +
           "AND r.documentType = :documentType " +
           "AND r.isRead = false")
    List<Long> findUnreadDocumentIds(@Param("user") User user, 
                                    @Param("documentType") DocumentType documentType);

    /**
     * Delete read status records for a document
     */
    void deleteByDocumentIdAndDocumentType(Long documentId, DocumentType documentType);

    /**
     * Find read statuses for multiple documents
     */
    @Query("SELECT r FROM DocumentReadStatus r " +
           "WHERE r.documentId IN :documentIds " +
           "AND r.documentType = :documentType " +
           "AND r.user = :user")
    List<DocumentReadStatus> findByDocumentIdsAndDocumentTypeAndUser(
            @Param("documentIds") List<Long> documentIds,
            @Param("documentType") DocumentType documentType,
            @Param("user") User user);
}

package com.managementcontent.repository;

import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncomingDocumentRepository extends JpaRepository<IncomingDocument, Long> {
    Optional<IncomingDocument> findByDocumentNumber(String documentNumber);

    Page<IncomingDocument> findByReferenceNumberContaining(String referenceNumber, Pageable pageable);

    Page<IncomingDocument> findByIssuingAuthorityContaining(String issuingAuthority, Pageable pageable);

    Page<IncomingDocument> findByUrgencyLevel(String urgencyLevel, Pageable pageable);

    Page<IncomingDocument> findByStatus(DocumentProcessingStatus status, Pageable pageable);

    Page<IncomingDocument> findBySigningDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);



    @Query("SELECT d FROM IncomingDocument d WHERE " +
            "(:keyword IS NULL OR " +
            "LOWER(d.referenceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.issuingAuthority) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<IncomingDocument> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // Added for unified document view
    Page<IncomingDocument> findAllByOrderByCreatedDesc(Pageable pageable);

    // Count documents by status
    long countByStatus(Integer status);
    
    // Find documents by creator
    Page<IncomingDocument> findByCreator(com.managementcontent.model.User creator, Pageable pageable);
    
    // Find documents assigned to a user through DocumentHistory
    @Query("SELECT d FROM IncomingDocument d " +
           "WHERE d.id IN (" +
           "    SELECT DISTINCT h.document.id FROM DocumentHistory h " +
           "    WHERE h.assignedTo = :user AND h.action = 'ASSIGNMENT'" +
           ") " +
           "ORDER BY d.changed DESC")
    Page<IncomingDocument> findByAssignedUser(@Param("user") com.managementcontent.model.User user, Pageable pageable);
}
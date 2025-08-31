package com.managementcontent.repository;

import com.managementcontent.model.Document;
import com.managementcontent.model.OutgoingDocument;
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
public interface OutgoingDocumentRepository extends JpaRepository<OutgoingDocument, Long> {
    Optional<OutgoingDocument> findByDocumentNumber(String documentNumber);

    Page<OutgoingDocument> findByReferenceNumberContaining(String referenceNumber, Pageable pageable);

    Page<OutgoingDocument> findByDocumentTypeContaining(String documentType, Pageable pageable);

    Page<OutgoingDocument> findBySigningDateBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    List<OutgoingDocument> findBySignerId(Long userId);


    Page<OutgoingDocument> findByReceivingDepartmentTextContaining(String receivingDepartmentText, Pageable pageable);

    // Added for unified document view
    Page<OutgoingDocument> findAllByOrderByCreatedDesc(Pageable pageable);

    /**
     * Tìm các văn bản dựa trên giá trị trường relatedDocuments
     * Sử dụng @Query để kiểm soát cách tìm kiếm chính xác hơn
     */
    @Query("SELECT d FROM OutgoingDocument d WHERE d.relatedDocuments = :relatedDocs OR d.relatedDocuments LIKE %:relatedDocs%")
    List<OutgoingDocument> findByRelatedDocuments(@Param("relatedDocs") String relatedDocuments);
    // Count documents by status
    long countByStatus(Integer status);

    // Search by keyword across multiple fields
    @Query("SELECT d FROM OutgoingDocument d WHERE " +
            "(:keyword IS NULL OR " +
            "LOWER(d.referenceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.documentType) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<OutgoingDocument> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Document> findByDraftingDepartment(String name);
}
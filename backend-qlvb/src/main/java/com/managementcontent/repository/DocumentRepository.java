package com.managementcontent.repository;

import com.managementcontent.model.Document;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DocumentRepository<T extends Document> extends JpaRepository<Document, Long> {
    Page<Document> findByType(String type, Pageable pageable);

    Page<Document> findByTitleContaining(String title, Pageable pageable);

    Page<Document> findByCreatorId(Long userId, Pageable pageable);

    Page<Document> findByCreatedBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.title LIKE %?1% OR d.type LIKE %?2%")
    Page<Document> searchDocuments(String title, String type, Pageable pageable);

    long countByStatus(DocumentProcessingStatus status);

    @Query("SELECT d.type, COUNT(d) FROM Document d GROUP BY d.type")
    List<Object[]> countByType();

    List<T> findByStatusIn(List<DocumentProcessingStatus> list);

    long countByCreatedBetween(LocalDateTime startOfMonth, LocalDateTime endOfMonth);

    long countByStatusIn(List<DocumentProcessingStatus> list);

    // Public portal helpers
    Page<Document> findByIsPublicTrue(Pageable pageable);

    Page<Document> findByIsPublicTrueAndTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("select d from Document d join d.categories c where d.isPublic = true and c.id = :categoryId")
    Page<Document> findPublicByCategoryId(Long categoryId, Pageable pageable);

    // Flexible filtered search for public documents
    @Query("select d from Document d where d.isPublic = true " +
            "and (:q is null or lower(d.title) like lower(concat('%', :q, '%'))) " +
            "and (:issuingAgency is null or lower(d.issuingAgency) like lower(concat('%', :issuingAgency, '%'))) " +
            "and (:start is null or (d.publishedAt between :start and :end))")
    Page<Document> searchPublic(
            @Param("q") String q,
            @Param("issuingAgency") String issuingAgency,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);

    @Query("select d from Document d join d.categories c where d.isPublic = true and c.id = :categoryId " +
            "and (:q is null or lower(d.title) like lower(concat('%', :q, '%'))) " +
            "and (:issuingAgency is null or lower(d.issuingAgency) like lower(concat('%', :issuingAgency, '%'))) " +
            "and (:start is null or (d.publishedAt between :start and :end))")
    Page<Document> searchPublicByCategory(
            @Param("categoryId") Long categoryId,
            @Param("q") String q,
            @Param("issuingAgency") String issuingAgency,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);
}
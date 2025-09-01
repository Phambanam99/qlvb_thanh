package com.managementcontent.repository;

import com.managementcontent.model.InternalDocument;
import com.managementcontent.model.InternalDocument.Priority;
import com.managementcontent.model.User;
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
public interface InternalDocumentRepository extends JpaRepository<InternalDocument, Long> {

        // Find by document number
        Optional<InternalDocument> findByDocumentNumber(String documentNumber);

        // Find documents sent by a user
        Page<InternalDocument> findBySenderOrderByCreatedAtDesc(User sender, Pageable pageable);

        // Find all documents sent by a user (no pagination)
        List<InternalDocument> findAllBySenderOrderByCreatedAtDesc(User sender);

        // Find documents received by a user (directly or through department)
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findDocumentsReceivedByUser(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds,
                        Pageable pageable);

        // Find all documents received by a user (no pagination)
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "ORDER BY d.createdAt DESC")
        List<InternalDocument> findAllDocumentsReceivedByUser(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds);

        // Find unread documents for a user
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "AND r.isRead = false " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findUnreadDocumentsForUser(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds,
                        Pageable pageable);

        // Find all unread documents for a user (no pagination)
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "AND r.isRead = false " +
                        "ORDER BY d.createdAt DESC")
        List<InternalDocument> findAllUnreadDocumentsForUser(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds);

        // Count unread documents for a user
        @Query("SELECT COUNT(DISTINCT d) FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "AND r.isRead = false")
        Long countUnreadDocumentsForUser(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds);

        // Find documents by date range
        Page<InternalDocument> findByCreatedAtBetweenOrderByCreatedAtDesc(
                        LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

        // Find documents sent by a user within a specific year
        @Query("SELECT d FROM InternalDocument d " +
                        "WHERE d.sender = :sender " +
                        "AND YEAR(d.createdAt) = :year " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findBySenderAndYear(
                        @Param("sender") User sender, 
                        @Param("year") int year, 
                        Pageable pageable);

        // Find documents sent by a user within a specific month and year
        @Query("SELECT d FROM InternalDocument d " +
                        "WHERE d.sender = :sender " +
                        "AND YEAR(d.createdAt) = :year " +
                        "AND MONTH(d.createdAt) = :month " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findBySenderAndYearAndMonth(
                        @Param("sender") User sender, 
                        @Param("year") int year,
                        @Param("month") int month,
                        Pageable pageable);

        // Find documents received by a user within a specific year
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "AND YEAR(d.createdAt) = :year " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findDocumentsReceivedByUserAndYear(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds,
                        @Param("year") int year,
                        Pageable pageable);

        // Find documents received by a user within a specific month and year
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "AND YEAR(d.createdAt) = :year " +
                        "AND MONTH(d.createdAt) = :month " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findDocumentsReceivedByUserAndYearAndMonth(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds,
                        @Param("year") int year,
                        @Param("month") int month,
                        Pageable pageable);

        // Search documents by title or content
        @Query("SELECT d FROM InternalDocument d " +
                        "WHERE LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(d.summary) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(d.notes) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(d.issuingAgency) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(d.documentNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "OR LOWER(d.sender.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

        // Find replies to a document
        Page<InternalDocument> findByReplyToOrderByCreatedAtDesc(InternalDocument replyTo, Pageable pageable);

        // Find documents by document type
        Page<InternalDocument> findByDocumentTypeOrderByCreatedAtDesc(String documentType, Pageable pageable);

        // Find recent documents (last 30 days)
        @Query("SELECT d FROM InternalDocument d " +
                        "WHERE d.createdAt >= :thirtyDaysAgo " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findRecentDocuments(@Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo,
                        Pageable pageable);

        // Find documents that need attention (high priority and unread)
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "JOIN d.recipients r " +
                        "WHERE (r.user = :user OR " +
                        "(r.department.id IN :departmentIds AND r.user IS NULL)) " +
                        "AND r.isRead = false " +
                        "AND d.urgencyLevel IN ('HIGH', 'URGENT') " +
                        "ORDER BY d.urgencyLevel DESC, d.createdAt DESC")
        Page<InternalDocument> findUrgentUnreadDocumentsForUser(
                        @Param("user") User user,
                        @Param("departmentIds") List<Long> departmentIds,
                        Pageable pageable);

        // Advanced search with multiple filters
        @Query("SELECT DISTINCT d FROM InternalDocument d " +
                        "LEFT JOIN d.recipients r " +
                        "WHERE (:senderId IS NULL OR d.sender.id = :senderId) " +
                        "AND (:recipientUserId IS NULL OR r.user.id = :recipientUserId) " +
                        "AND (:recipientDepartmentId IS NULL OR r.department.id = :recipientDepartmentId) " +
                        "AND (:priority IS NULL OR d.urgencyLevel = :priority) " +
                        "AND (:documentType IS NULL OR d.documentType = :documentType) " +
                        "AND (:startDate IS NULL OR d.createdAt >= :startDate) " +
                        "AND (:endDate IS NULL OR d.createdAt <= :endDate) " +
                        "AND (:keyword IS NULL OR " +
                        "     LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "     LOWER(d.summary) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                        "ORDER BY d.createdAt DESC")
        Page<InternalDocument> findWithFilters(
                        @Param("senderId") Long senderId,
                        @Param("recipientUserId") Long recipientUserId,
                        @Param("recipientDepartmentId") Long recipientDepartmentId,
                        @Param("priority") Priority priority,
                        @Param("documentType") String documentType,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        @Param("keyword") String keyword,
                        Pageable pageable);

}
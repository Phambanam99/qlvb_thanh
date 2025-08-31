package com.managementcontent.repository;

import com.managementcontent.model.InternalDocument;
import com.managementcontent.model.InternalDocumentRecipient;
import com.managementcontent.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InternalDocumentRecipientRepository extends JpaRepository<InternalDocumentRecipient, Long> {

    // Find recipients by document
    List<InternalDocumentRecipient> findByDocument(InternalDocument document);

    // Find specific recipient for a document and user
    Optional<InternalDocumentRecipient> findByDocumentAndUser(InternalDocument document, User user);

    // Find recipients by document and department (for department-wide sending)
    List<InternalDocumentRecipient> findByDocumentAndDepartmentIdAndUserIsNull(InternalDocument document,
            Long departmentId);

    // Check if user has received a document (directly or through department)
    @Query("SELECT r FROM InternalDocumentRecipient r " +
            "WHERE r.document = :document " +
            "AND (r.user = :user OR " +
            "(r.department.id IN :departmentIds AND r.user IS NULL))")
    List<InternalDocumentRecipient> findRecipientRecordsForUserAndDocument(
            @Param("document") InternalDocument document,
            @Param("user") User user,
            @Param("departmentIds") List<Long> departmentIds);

    // Find unread recipients for a document
    List<InternalDocumentRecipient> findByDocumentAndIsReadFalse(InternalDocument document);

    // Count unread recipients for a document
    Long countByDocumentAndIsReadFalse(InternalDocument document);

    // Find recipients by user
    List<InternalDocumentRecipient> findByUserOrderByReceivedAtDesc(User user);

    // Find recipients by department (where user is null - department-wide)
    List<InternalDocumentRecipient> findByDepartmentIdAndUserIsNullOrderByReceivedAtDesc(Long departmentId);
}
package com.managementcontent.repository;

import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentHistory;
import com.managementcontent.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentHistoryRepository extends JpaRepository<DocumentHistory, Long> {
    List<DocumentHistory> findByDocument(Document document);

    List<DocumentHistory> findByDocumentOrderByTimestampDesc(Document document);

    List<DocumentHistory> findByDocumentAndActionOrderByTimestampDesc(Document document, String action);

//    List<DocumentHistory> findByActor(User actor);

    List<DocumentHistory> findByAssignedTo(User assignedTo);

    List<DocumentHistory> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    Page<DocumentHistory> findPageableByDocumentOrderByTimestampDesc(Document document, Pageable pageable);

    List<DocumentHistory> findByNewStatus(String s);

    Collection<DocumentHistory> findByDocumentAndNewStatusOrderByTimestampAsc(Document document, String s);

//    List<DocumentHistory> findByActorIdAndNewStatus(Long userId, String s);

    Collection<DocumentHistory> findByDocumentAndActionAndAssignedTo_id(Document document, String assignment,
                                                                        Long userId);

    Optional<DocumentHistory> findFirstByDocumentAndActionOrderByTimestampDesc(Document document, String assignment);

    List<DocumentHistory> getAssignedUserByDocumentId(Long id);

    /**
     * Find the latest document history by performed_by_id
     * 
     * @param performedById ID of the user who performed the action
     * @return Optional containing the latest document history
     */
    Optional<DocumentHistory> findFirstByPerformedBy_IdOrderByTimestampDesc(Long performedById);

    /**
     * Find all document histories by performed_by_id ordered by timestamp
     * 
     * @param performedById ID of the user who performed the action
     * @return List of document histories ordered by timestamp descending
     */
    List<DocumentHistory> findByPerformedBy_IdOrderByTimestampDesc(Long performedById);

    /**
     * Find the latest document history for a specific document by performed_by_id
     * 
     * @param document      The document
     * @param performedById ID of the user who performed the action
     * @return Optional containing the latest document history
     */
    Optional<DocumentHistory> findFirstByDocumentAndPerformedBy_IdOrderByTimestampDesc(Document document, Long performedById);

    /**
     * Find the latest document history by performed_by_id and new status
     * 
     * @param performedById ID of the user who performed the action
     * @param newStatus     The new status to filter by
     * @return Optional containing the latest document history
     */
    Optional<DocumentHistory> findFirstByPerformedBy_IdAndNewStatusOrderByTimestampDesc(Long performedById, String newStatus);
}
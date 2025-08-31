package com.managementcontent.repository;

import com.managementcontent.model.WorkCase;
import com.managementcontent.model.Document;
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
public interface WorkCaseRepository extends JpaRepository<WorkCase, Long> {
    Optional<WorkCase> findByCaseCode(String caseCode);
    
    List<WorkCase> findByCreatedBy(User createdBy);
    
    List<WorkCase> findByAssignedTo(User assignedTo);
    
    List<WorkCase> findByStatus(String status);
    
    List<WorkCase> findByPriority(String priority);
    
    List<WorkCase> findByDeadlineBefore(LocalDateTime deadline);
    
    @Query("SELECT w FROM WorkCase w WHERE w.deadline BETWEEN :startDate AND :endDate")
    List<WorkCase> findByDeadlineBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT w FROM WorkCase w JOIN w.documents d WHERE d = :document")
    List<WorkCase> findByDocument(@Param("document") Document document);
    
    @Query("SELECT w FROM WorkCase w WHERE " +
           "LOWER(w.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(w.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(w.caseCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(w.tags) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<WorkCase> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT COUNT(w) FROM WorkCase w WHERE w.status = :status")
    Long countByStatus(@Param("status") String status);
    
    @Query("SELECT COUNT(w) FROM WorkCase w WHERE w.deadline < CURRENT_TIMESTAMP AND w.status <> 'COMPLETED' AND w.status <> 'ARCHIVED'")
    Long countOverdueCases();
}
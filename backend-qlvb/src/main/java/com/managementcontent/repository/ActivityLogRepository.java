package com.managementcontent.repository;

import com.managementcontent.model.ActivityLog;
import com.managementcontent.model.Document;
import com.managementcontent.model.User;
import com.managementcontent.model.WorkCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUser(User user);
    
    List<ActivityLog> findByDocument(Document document);
    
    List<ActivityLog> findByWorkCase(WorkCase workCase);
    
    List<ActivityLog> findByActionType(String actionType);
    
    List<ActivityLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    Page<ActivityLog> findByOrderByTimestampDesc(Pageable pageable);
    
    @Query("SELECT a FROM ActivityLog a WHERE a.user = :user AND a.timestamp BETWEEN :start AND :end")
    List<ActivityLog> findByUserAndTimeRange(@Param("user") User user, 
                                            @Param("start") LocalDateTime start, 
                                            @Param("end") LocalDateTime end);
    
    @Query("SELECT a FROM ActivityLog a WHERE a.document = :document AND a.actionType = :actionType")
    List<ActivityLog> findByDocumentAndActionType(@Param("document") Document document, 
                                                 @Param("actionType") String actionType);
    
    @Query("SELECT u.id, COUNT(a) FROM ActivityLog a JOIN a.user u GROUP BY u.id ORDER BY COUNT(a) DESC")
    List<Object[]> findMostActiveUsers(Pageable pageable);

    @Query(value = "SELECT EXTRACT(YEAR FROM al.timestamp) as year, " +
            "EXTRACT(MONTH FROM al.timestamp) as month, " +
            "COUNT(al.id) " +
            "FROM activity_logs al " +
            "WHERE al.timestamp BETWEEN :start AND :end " +
            "AND al.document_id IS NOT NULL " +
            "GROUP BY 1, 2 " +
            "ORDER BY 1, 2",
            nativeQuery = true)
    List<Object[]> countDocumentActivityByMonth(@Param("start") LocalDateTime start,
                                                @Param("end") LocalDateTime end);
    @Query("SELECT a.actionType, COUNT(a) FROM ActivityLog a GROUP BY a.actionType")
    List<Object[]> countByActionType();
}
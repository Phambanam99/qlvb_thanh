package com.managementcontent.repository;

import com.managementcontent.model.WorkPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkPlanRepository extends JpaRepository<WorkPlan, Long> {
    List<WorkPlan> findByDepartmentId(Long departmentId);
    
    List<WorkPlan> findByCreatedById(Long createdById);
    
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy")
    List<WorkPlan> findAllWithDepartmentAndCreator();
    
    // Query theo năm
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy " +
           "WHERE EXTRACT(year FROM wp.startDate) = :year OR EXTRACT(year FROM wp.endDate) = :year")
    Page<WorkPlan> findByYear(@Param("year") int year, Pageable pageable);
    
    // Query theo năm và tháng
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy " +
           "WHERE (EXTRACT(year FROM wp.startDate) = :year AND EXTRACT(month FROM wp.startDate) = :month) " +
           "OR (EXTRACT(year FROM wp.endDate) = :year AND EXTRACT(month FROM wp.endDate) = :month)")
    Page<WorkPlan> findByYearAndMonth(@Param("year") int year, @Param("month") int month, Pageable pageable);
    
    // Query theo năm và tuần - sử dụng EXTRACT cho PostgreSQL
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy " +
           "WHERE (EXTRACT(year FROM wp.startDate) = :year AND EXTRACT(week FROM wp.startDate) = :week) " +
           "OR (EXTRACT(year FROM wp.endDate) = :year AND EXTRACT(week FROM wp.endDate) = :week)")
    Page<WorkPlan> findByYearAndWeek(@Param("year") int year, @Param("week") int week, Pageable pageable);
    
    // Query theo phòng ban và năm (bao gồm department con)
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy " +
           "WHERE wp.department.id IN :departmentIds " +
           "AND (EXTRACT(year FROM wp.startDate) = :year OR EXTRACT(year FROM wp.endDate) = :year)")
    Page<WorkPlan> findByDepartmentIdsAndYear(@Param("departmentIds") List<Long> departmentIds, 
                                             @Param("year") int year, Pageable pageable);
    
    // Query theo phòng ban, năm và tháng (bao gồm department con)
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy " +
           "WHERE wp.department.id IN :departmentIds " +
           "AND ((EXTRACT(year FROM wp.startDate) = :year AND EXTRACT(month FROM wp.startDate) = :month) " +
           "OR (EXTRACT(year FROM wp.endDate) = :year AND EXTRACT(month FROM wp.endDate) = :month))")
    Page<WorkPlan> findByDepartmentIdsAndYearAndMonth(@Param("departmentIds") List<Long> departmentIds,
                                                     @Param("year") int year, @Param("month") int month, 
                                                     Pageable pageable);
    
    // Query theo phòng ban, năm và tuần (bao gồm department con) - sử dụng EXTRACT
    @Query("SELECT wp FROM WorkPlan wp JOIN FETCH wp.department JOIN FETCH wp.createdBy " +
           "WHERE wp.department.id IN :departmentIds " +
           "AND ((EXTRACT(year FROM wp.startDate) = :year AND EXTRACT(week FROM wp.startDate) = :week) " +
           "OR (EXTRACT(year FROM wp.endDate) = :year AND EXTRACT(week FROM wp.endDate) = :week))")
    Page<WorkPlan> findByDepartmentIdsAndYearAndWeek(@Param("departmentIds") List<Long> departmentIds,
                                                    @Param("year") int year, @Param("week") int week, 
                                                    Pageable pageable);
}
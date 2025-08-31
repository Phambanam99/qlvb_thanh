package com.managementcontent.repository;

import com.managementcontent.model.Schedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByDepartmentId(Long departmentId);

    List<Schedule> findByCreatedById(Long createdById);

    List<Schedule> findByStatus(String status);

    @Query("SELECT s FROM Schedule s WHERE s.department.id = :departmentId AND s.status = :status")
    List<Schedule> findByDepartmentIdAndStatus(Long departmentId, String status);

    @Query("SELECT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy")
    List<Schedule> findAllWithDepartmentAndCreator();

    @Query("SELECT s FROM Schedule s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    Page<Schedule> findByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    // Query theo năm - sử dụng ScheduleEvent.date
    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy " +
           "JOIN s.events e WHERE EXTRACT(year FROM e.date) = :year")
    Page<Schedule> findByYear(@Param("year") int year, Pageable pageable);
    
    // Query theo năm và tháng - sử dụng ScheduleEvent.date
    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy " +
           "JOIN s.events e WHERE EXTRACT(year FROM e.date) = :year AND EXTRACT(month FROM e.date) = :month")
    Page<Schedule> findByYearAndMonth(@Param("year") int year, @Param("month") int month, Pageable pageable);
    
    // Query theo năm và tuần - sử dụng EXTRACT cho PostgreSQL
    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy " +
           "JOIN s.events e WHERE EXTRACT(year FROM e.date) = :year " +
           "AND EXTRACT(week FROM e.date) = :week")
    Page<Schedule> findByYearAndWeek(@Param("year") int year, @Param("week") int week, Pageable pageable);
    
    // Query theo phòng ban và năm (bao gồm department con)
    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy " +
           "JOIN s.events e WHERE s.department.id IN :departmentIds AND EXTRACT(year FROM e.date) = :year")
    Page<Schedule> findByDepartmentIdsAndYear(@Param("departmentIds") List<Long> departmentIds, 
                                             @Param("year") int year, Pageable pageable);
    
    // Query theo phòng ban, năm và tháng (bao gồm department con)
    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy " +
           "JOIN s.events e WHERE s.department.id IN :departmentIds " +
           "AND EXTRACT(year FROM e.date) = :year AND EXTRACT(month FROM e.date) = :month")
    Page<Schedule> findByDepartmentIdsAndYearAndMonth(@Param("departmentIds") List<Long> departmentIds,
                                                     @Param("year") int year, @Param("month") int month, 
                                                     Pageable pageable);
    
    // Query theo phòng ban, năm và tuần (bao gồm department con)
    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.department JOIN FETCH s.createdBy " +
           "JOIN s.events e WHERE s.department.id IN :departmentIds " +
           "AND EXTRACT(year FROM e.date) = :year AND EXTRACT(week FROM e.date) = :week")
    Page<Schedule> findByDepartmentIdsAndYearAndWeek(@Param("departmentIds") List<Long> departmentIds,
                                                    @Param("year") int year, @Param("week") int week, 
                                                    Pageable pageable);

    /**
     * Find schedules by department ID, period, and excluding a specific ID
     */
    List<Schedule> findByDepartmentIdAndPeriodAndIdNot(Long departmentId, String period, Long id);

    /**
     * Find schedules by department ID and excluding a specific ID
     */
    List<Schedule> findByDepartmentIdAndIdNot(Long departmentId, Long id);

    /**
     * Find schedules by period and excluding a specific ID
     */
    List<Schedule> findByPeriodAndIdNot(String period, Long id);
}
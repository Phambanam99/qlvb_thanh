package com.managementcontent.repository;

import com.managementcontent.model.ScheduleEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, Long> {

    List<ScheduleEvent> findByScheduleId(Long scheduleId);

    List<ScheduleEvent> findByDate(LocalDate date);

    @Query("SELECT e FROM ScheduleEvent e WHERE e.date BETWEEN :startDate AND :endDate")
    List<ScheduleEvent> findByDateRange(LocalDate startDate, LocalDate endDate);

    @Query("SELECT e FROM ScheduleEvent e WHERE e.date = :date AND e.schedule.department.id = :departmentId")
    List<ScheduleEvent> findByDateAndDepartmentId(LocalDate date, Long departmentId);

    @Query("SELECT e FROM ScheduleEvent e JOIN e.participants p WHERE e.date = :date AND p = :userId")
    List<ScheduleEvent> findByDateAndParticipant(LocalDate date, Long userId);

    @Query("SELECT e FROM ScheduleEvent e JOIN e.schedule s WHERE s.department.id = :departmentId")
    List<ScheduleEvent> findByDepartmentId(Long departmentId);

    @Query(value = "SELECT e.* FROM schedule_events e " +
            "JOIN schedule_event_participants p ON e.id = p.event_id " +
            "WHERE p.user_id = :userId", nativeQuery = true)
    List<ScheduleEvent> findByParticipantId(Long userId);
}
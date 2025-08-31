package com.managementcontent.repository;

import com.managementcontent.model.ScheduleEventAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleEventAttendanceRepository extends JpaRepository<ScheduleEventAttendance, Long> {

    List<ScheduleEventAttendance> findByEventId(Long eventId);

    List<ScheduleEventAttendance> findByUserId(Long userId);

    Optional<ScheduleEventAttendance> findByEventIdAndUserId(Long eventId, Long userId);

    List<ScheduleEventAttendance> findByEventIdAndStatus(Long eventId, String status);

    long countByEventIdAndStatus(Long eventId, String status);
}
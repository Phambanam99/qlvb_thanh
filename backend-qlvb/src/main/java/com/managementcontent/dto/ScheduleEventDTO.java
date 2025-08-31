package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleEventDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String location;
    private String type;
    private String notes;
    private Set<Long> participants = new HashSet<>();
    private Set<String> participantNames = new HashSet<>();
    private Long scheduleId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
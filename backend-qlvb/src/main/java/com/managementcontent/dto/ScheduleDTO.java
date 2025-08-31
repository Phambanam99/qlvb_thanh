package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDTO {
    private Long id;
    private String title;
    private String description;
    private Long departmentId;
    private String departmentName;
    private String status;
    private String period;
    private Long createdById;
    private String createdByName;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime approvalDate;
    private String approvalComments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ScheduleEventDTO> events = new ArrayList<>();
}
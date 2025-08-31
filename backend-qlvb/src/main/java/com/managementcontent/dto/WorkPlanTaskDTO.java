package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkPlanTaskDTO {
    private Long id;
    private String title;
    private String description;
    private String assignee;
    private Long assigneeId;
    private String assigneeName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private String priority;
    private Integer progress;
    private String notes;
    private String statusComments;
    private Long workPlanId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
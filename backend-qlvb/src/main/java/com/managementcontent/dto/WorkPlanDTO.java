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
public class WorkPlanDTO {
    private Long id;
    private String title;
    private String description;
    private String department;
    private Long departmentId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private String createdBy;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<WorkPlanTaskDTO> tasks = new ArrayList<>();
    private List<DocumentLinkDTO> documents = new ArrayList<>();
}
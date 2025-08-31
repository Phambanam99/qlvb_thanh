package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalDocumentHistoryDTO {
    private Long id;
    private String action;
    private String details;
    private Long performedById;
    private String performedByName;
    private String performedByDepartment;
    private LocalDateTime performedAt;
}
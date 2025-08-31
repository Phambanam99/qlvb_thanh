package com.managementcontent.dto;

import lombok.*;

/**
 * DTO representing user activity statistics.
 */
@Getter
@AllArgsConstructor
@Setter
@Data
@Builder
@NoArgsConstructor
public class UserActivityDTO {
    /** ID of the user */
    private Long userId;

    /** Full name of the user */
    private String userName;

    /** Count of documents processed by the user */
    private Long documentsProcessed;

    /** Average time taken to process documents (in hours) */
    private Double averageProcessingTime;

    /** Count of documents currently assigned to the user */
    private Long currentAssignments;
}
package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomRoleDTO {
    private Long id;
    private String name;
    private String description;
    private boolean systemRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdById;
    private String createdByName;
    @Builder.Default
    private Set<PermissionDTO> permissions = new HashSet<>();
}
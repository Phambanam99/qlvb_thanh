package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UnitNodeDTO {
    private Long id;
    private String name;
    private String type; // "HQ", "DEPARTMENT", "BATTALION", "COMPANY"
    private List<UnitNodeDTO> children;
}

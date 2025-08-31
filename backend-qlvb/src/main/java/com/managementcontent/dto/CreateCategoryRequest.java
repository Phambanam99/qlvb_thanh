package com.managementcontent.dto;

import lombok.Data;

@Data
public class CreateCategoryRequest {
    private String name;
    private Long parentId; // optional
}

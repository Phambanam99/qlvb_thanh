package com.managementcontent.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicCategoryDTO {
    private Long id;
    private String name;
    private String slug;
    private Long parentId;

    @Builder.Default
    private List<PublicCategoryDTO> children = new ArrayList<>();
}

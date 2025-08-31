package com.managementcontent.service;

import com.managementcontent.dto.PublicCategoryDTO;
import com.managementcontent.model.DocumentCategory;
import com.managementcontent.repository.DocumentCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentCategoryService {
    private final DocumentCategoryRepository categoryRepository;

    public List<PublicCategoryDTO> getTree() {
        return categoryRepository.findByParentIsNull()
                .stream()
                .map(this::toDtoRecursive)
                .collect(Collectors.toList());
    }

    private PublicCategoryDTO toDtoRecursive(DocumentCategory c) {
        PublicCategoryDTO dto = PublicCategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .slug(c.getSlug())
                .parentId(c.getParent() != null ? c.getParent().getId() : null)
                .build();
        if (c.getChildren() != null && !c.getChildren().isEmpty()) {
            dto.setChildren(c.getChildren().stream().map(this::toDtoRecursive).collect(Collectors.toList()));
        }
        return dto;
    }
}

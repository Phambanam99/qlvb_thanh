package com.managementcontent.repository;

import com.managementcontent.model.DocumentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentCategoryRepository extends JpaRepository<DocumentCategory, Long> {
    Optional<DocumentCategory> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<DocumentCategory> findByParentIsNull();

    List<DocumentCategory> findByParent_Id(Long parentId);
}

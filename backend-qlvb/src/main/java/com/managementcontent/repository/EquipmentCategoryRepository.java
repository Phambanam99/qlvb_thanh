package com.managementcontent.repository;

import com.managementcontent.model.EquipmentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentCategoryRepository extends JpaRepository<EquipmentCategory, Long> {
    List<EquipmentCategory> findByIsActiveTrue();

    boolean existsByCode(String code);
}

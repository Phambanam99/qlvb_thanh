package com.managementcontent.repository;

import com.managementcontent.model.EquipmentCondition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentConditionRepository extends JpaRepository<EquipmentCondition, Long> {
    List<EquipmentCondition> findByIsActiveTrue();

    boolean existsByCode(String code);
}

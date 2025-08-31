package com.managementcontent.repository;

import com.managementcontent.model.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentStatusRepository extends JpaRepository<EquipmentStatus, Long> {
    List<EquipmentStatus> findByIsActiveTrue();

    boolean existsByCode(String code);
}

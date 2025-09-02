package com.managementcontent.repository;

import com.managementcontent.model.PositionHolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PositionHolderRepository extends JpaRepository<PositionHolder, Long> {
    
    List<PositionHolder> findByUnitIdAndIsActiveTrueOrderBySortOrder(Long unitId);
    
    @Query("SELECT ph FROM PositionHolder ph WHERE ph.unit.id = :unitId AND ph.isActive = true ORDER BY ph.sortOrder")
    List<PositionHolder> findByUnitIdOrderBySortOrder(@Param("unitId") Long unitId);
    
    @Query("SELECT ph FROM PositionHolder ph WHERE ph.unit.id = :unitId AND ph.isActive = true")
    List<PositionHolder> findActiveByUnitId(@Param("unitId") Long unitId);
}

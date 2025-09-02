package com.managementcontent.repository;

import com.managementcontent.model.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UnitRepository extends JpaRepository<Unit, Long> {
    
    List<Unit> findByParentUnitIsNullAndIsActiveTrueOrderBySortOrder();
    
    List<Unit> findByParentUnitIdAndIsActiveTrueOrderBySortOrder(Long parentUnitId);
    
    Optional<Unit> findByIdAndIsActiveTrue(Long id);
    
    @Query("SELECT u FROM Unit u WHERE u.isActive = true ORDER BY u.sortOrder")
    List<Unit> findAllActiveOrderBySortOrder();
    
    @Query("SELECT u FROM Unit u WHERE u.parentUnit IS NULL AND u.isActive = true ORDER BY u.sortOrder")
    List<Unit> findRootUnits();
}

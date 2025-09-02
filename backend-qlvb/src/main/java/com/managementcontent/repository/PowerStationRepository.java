package com.managementcontent.repository;

import com.managementcontent.model.PowerStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PowerStationRepository extends JpaRepository<PowerStation, Long> {
    
    List<PowerStation> findByIsActiveTrue();
    
    @Query("SELECT ps FROM PowerStation ps WHERE ps.isActive = true AND " +
           "(LOWER(ps.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ps.fuel) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ps.qualityLevel) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ps.purpose) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ps.status) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ps.unitName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<PowerStation> searchPowerStations(@Param("query") String query);
    
    @Query("SELECT ps FROM PowerStation ps WHERE ps.isActive = true")
    List<PowerStation> findAllActive();
}

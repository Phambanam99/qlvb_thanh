package com.managementcontent.repository;

import com.managementcontent.model.Ammunition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmmunitionRepository extends JpaRepository<Ammunition, Long> {
    
    List<Ammunition> findByIsActiveTrue();
    
    @Query("SELECT a FROM Ammunition a WHERE a.isActive = true AND " +
           "(LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.unit) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.grade) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Ammunition> searchAmmunitions(@Param("query") String query);
    
    @Query("SELECT a FROM Ammunition a WHERE a.isActive = true")
    List<Ammunition> findAllActive();
}

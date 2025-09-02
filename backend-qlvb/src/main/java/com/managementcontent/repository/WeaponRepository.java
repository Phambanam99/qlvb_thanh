package com.managementcontent.repository;

import com.managementcontent.model.Weapon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeaponRepository extends JpaRepository<Weapon, Long> {
    
    List<Weapon> findByIsActiveTrue();
    
    @Query("SELECT w FROM Weapon w WHERE w.isActive = true AND " +
           "(LOWER(w.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(w.origin) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(w.unit) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(w.grade) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Weapon> searchWeapons(@Param("query") String query);
    
    @Query("SELECT w FROM Weapon w WHERE w.isActive = true")
    List<Weapon> findAllActive();
}

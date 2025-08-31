package com.managementcontent.repository;

import com.managementcontent.model.CustomRole;
import com.managementcontent.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomRoleRepository extends JpaRepository<CustomRole, Long> {
    Optional<CustomRole> findByName(String name);
    List<CustomRole> findByCreatedBy(User createdBy);
    List<CustomRole> findByIsSystemRole(boolean isSystemRole);
    
    @Query("SELECT r FROM CustomRole r JOIN r.permissions p WHERE p.name = :permissionName")
    List<CustomRole> findByPermission(@Param("permissionName") String permissionName);
}
package com.managementcontent.repository;

import com.managementcontent.model.Equipment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    Page<Equipment> findByDepartment_Id(Long departmentId, Pageable pageable);

    @Query("select e.category as key, count(e) as cnt from Equipment e where (:deptId is null or e.department.id = :deptId) group by e.category")
    List<Object[]> countByCategory(@Param("deptId") Long departmentId);

    @Query("select e.status as key, count(e) as cnt from Equipment e where (:deptId is null or e.department.id = :deptId) group by e.status")
    List<Object[]> countByStatus(@Param("deptId") Long departmentId);
}

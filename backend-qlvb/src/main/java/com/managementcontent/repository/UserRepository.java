package com.managementcontent.repository;

import com.managementcontent.model.User;
import com.managementcontent.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByName(String username);

    boolean existsByName(String username);

    boolean existsByMail(String email);

    // Fix: Change return type to long for count operation
    int countByDepartmentId(Long departmentId);

    // Add method to find users by department
    List<User> findByDepartmentId(Long departmentId);

    // method to find users by department id and roles
    // user thì có nhiều role và tôi muốn lấy ra users có một trong những role tôi
    // đưa vào
    // và department id của user đó là department_id chính là user hiện tại
    @Query("SELECT u FROM User u JOIN u.roles r WHERE u.department.id = :department_id AND r.name IN :roles")
    // @Query("SELECT u FROM User u JOIN u.roles r WHERE u.department.id =
    // :department_id AND r IN :roles")
    List<User> findByDepartmentIdAndRoles(Long department_id, Set<String> roles);

    /**
     * Find users who are commanders in a specific department
     * 
     * @param departmentId The department ID
     * @return List of users who are commanders in that department
     */
    List<User> findByDepartmentIdAndIsCommanderOfUnitTrue(Long departmentId);

    /**
     * Find all users who are commanders of any unit
     * 
     * @return List of all users who are commanders
     */
    List<User> findByIsCommanderOfUnitTrue();

}
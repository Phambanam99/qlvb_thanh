package com.managementcontent.repository;

import com.managementcontent.model.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.nio.channels.FileChannel;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Department entity.
 * Provides methods to access and manipulate department data in the database.
 */
@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Find a department by its name
     * 
     * @param name The department name to search for
     * @return Optional with the found department or empty
     */
    Optional<Department> findByName(String name);

    /**
     * Find a department by its abbreviation
     * 
     * @param abbreviation The department abbreviation to search for
     * @return Optional with the found department or empty
     */
    Optional<Department> findByAbbreviation(String abbreviation);

    /**
     * Find departments by type
     * 
     * @param typeCode The department type code
     * @param pageable Pagination information
     * @return A page of departments with the specified type
     */
    Page<Department> findByTypeCode(Integer typeCode, Pageable pageable);

    /**
     * Search departments by name or abbreviation containing the keyword
     * 
     * @param keyword  The search keyword
     * @param pageable Pagination information
     * @return A page of departments matching the search criteria
     */
    @Query("SELECT d FROM Department d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(d.abbreviation) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Department> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Find departments by group
     * 
     * @param group    The department group
     * @param pageable Pagination information
     * @return A page of departments in the specified group
     */
    Page<Department> findByGroup(String group, Pageable pageable);

    /**
     * Count departments by type
     * 
     * @param code The department type code
     * @return The count of departments with the specified type
     */
    long countByTypeCode(int code);

    /**
     * Find root departments
     * 
     * @return List of root departments
     */
    @Query("SELECT d FROM Department d WHERE d.parentDepartment IS NULL")
    List<Department> findRootDepartments();

    /**
     * Find departments by parent department
     * 
     * @param parent The parent department
     * @return List of departments with the specified parent
     */
    List<Department> findByParentDepartment(Department parent);
}

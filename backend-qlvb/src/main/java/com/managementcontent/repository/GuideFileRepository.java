package com.managementcontent.repository;

import com.managementcontent.model.GuideFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for GuideFile entities.
 * Provides database operations for guide file management.
 */
@Repository
public interface GuideFileRepository extends JpaRepository<GuideFile, Long> {

    /**
     * Find all active guide files
     * 
     * @return List of active guide files
     */
    List<GuideFile> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Find all guide files ordered by creation date
     * 
     * @return List of all guide files
     */
    List<GuideFile> findAllByOrderByCreatedAtDesc();

    /**
     * Find guide files by category
     * 
     * @param category The category to search for
     * @return List of guide files in the specified category
     */
    List<GuideFile> findByCategoryOrderByCreatedAtDesc(String category);

    /**
     * Find active guide files by category
     * 
     * @param category The category to search for
     * @return List of active guide files in the specified category
     */
    List<GuideFile> findByCategoryAndIsActiveTrueOrderByCreatedAtDesc(String category);

    /**
     * Find guide files with pagination
     * 
     * @param pageable Pagination information
     * @return Page of guide files
     */
    @Query("SELECT g FROM GuideFile g ORDER BY g.createdAt DESC")
    Page<GuideFile> findAllWithPagination(Pageable pageable);

    /**
     * Find active guide files with pagination
     * 
     * @param pageable Pagination information
     * @return Page of active guide files
     */
    @Query("SELECT g FROM GuideFile g WHERE g.isActive = true ORDER BY g.createdAt DESC")
    Page<GuideFile> findActiveWithPagination(Pageable pageable);

    /**
     * Check if guide file exists by name
     * 
     * @param name The name to check
     * @return true if exists, false otherwise
     */
    boolean existsByName(String name);

    /**
     * Check if guide file exists by name excluding specific id
     * 
     * @param name The name to check
     * @param id   The id to exclude
     * @return true if exists, false otherwise
     */
    boolean existsByNameAndIdNot(String name, Long id);

    /**
     * Search guide files by name or description
     * 
     * @param searchTerm The search term
     * @param pageable   Pagination information
     * @return Page of matching guide files
     */
    @Query("SELECT g FROM GuideFile g WHERE " +
           "LOWER(g.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY g.createdAt DESC")
    Page<GuideFile> searchByNameOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Search active guide files by name or description
     * 
     * @param searchTerm The search term
     * @param pageable   Pagination information
     * @return Page of matching active guide files
     */
    @Query("SELECT g FROM GuideFile g WHERE g.isActive = true AND (" +
           "LOWER(g.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY g.createdAt DESC")
    Page<GuideFile> searchActiveByNameOrDescription(@Param("searchTerm") String searchTerm, Pageable pageable);
} 
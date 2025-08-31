package com.managementcontent.service;

import com.managementcontent.dto.DepartmentDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.enums.DepartmentType;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.DocumentDepartmentRepository;
import com.managementcontent.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing department operations.
 * Provides methods for creating, retrieving, updating, and deleting
 * departments,
 * as well as searching and filtering departments.
 */
@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final DocumentDepartmentRepository documentDepartmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository, UserRepository userRepository,
            DocumentDepartmentRepository documentDepartmentRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.documentDepartmentRepository = documentDepartmentRepository;

    }

    /**
     * Get all departments with pagination
     *
     * @param pageable Pagination information
     * @return Page of department DTOs
     */
    public Page<DepartmentDTO> getAllDepartments(Pageable pageable) {
        return departmentRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    /**
     * Get a department by ID
     *
     * @param id Department ID
     * @return Optional with the department DTO if found
     */
    public Optional<DepartmentDTO> getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .map(this::convertToDTO);
    }

    /**
     * Create a new department
     *
     * @param departmentDTO Department data
     * @return Created department DTO
     */
    @Transactional
    public DepartmentDTO createDepartment(DepartmentDTO departmentDTO) {
        Department department = convertToEntity(departmentDTO);
        if (departmentDTO.getParentDepartmentId() != null) {
            Department parent = departmentRepository.findById(departmentDTO.getParentDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid parent department ID"));
            department.setParentDepartment(parent);
        }
        Department savedDepartment = departmentRepository.save(department);
        return convertToDTO(savedDepartment);
    }

    /**
     * Update an existing department
     *
     * @param id            Department ID
     * @param departmentDTO Department data to update
     * @return Updated department DTO if found, empty if not found
     */
    @Transactional
    public Optional<DepartmentDTO> updateDepartment(Long id, DepartmentDTO departmentDTO) {
        return departmentRepository.findById(id)
                .map(existingDepartment -> {
                    // Update fields
                    if (departmentDTO.getName() != null) {
                        existingDepartment.setName(departmentDTO.getName());
                    }
                    if (departmentDTO.getAbbreviation() != null) {
                        existingDepartment.setAbbreviation(departmentDTO.getAbbreviation());
                    }
                    if (departmentDTO.getStorageLocation() != null) {
                        existingDepartment.setStorageLocation(departmentDTO.getStorageLocation());
                    }
                    if (departmentDTO.getCodeDepartment() != null){
                        existingDepartment.setCodeDepartment(departmentDTO.getCodeDepartment());
                    }
                    if (departmentDTO.getEmail() != null) {
                        existingDepartment.setEmail(departmentDTO.getEmail());
                    }
                    if (departmentDTO.getType() != null) {
                        existingDepartment.setType(departmentDTO.getType());
                    }
                    if (departmentDTO.getExternalId() != null) {
                        existingDepartment.setExternalId(departmentDTO.getExternalId());
                    }
                    if (departmentDTO.getGroup() != null) {
                        existingDepartment.setGroup(departmentDTO.getGroup());
                    }
                    if (departmentDTO.getParentDepartmentId() != null) {
                        Department parent = departmentRepository.findById(departmentDTO.getParentDepartmentId())
                                .orElseThrow(() -> new IllegalArgumentException("Invalid parent department ID"));
                        existingDepartment.setParentDepartment(parent);
                    } else {
                        existingDepartment.setParentDepartment(null);
                    }

                    Department updatedDepartment = departmentRepository.save(existingDepartment);
                    return convertToDTO(updatedDepartment);
                });
    }

    /**
     * Delete a department by ID
     *
     * @param id Department ID
     * @return true if deleted, false if not found
     */
    @Transactional
    public boolean deleteDepartment(Long id) {
        if (departmentRepository.existsById(id)) {
            departmentRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Search departments by keyword (name or abbreviation)
     *
     * @param keyword  Search keyword
     * @param pageable Pagination information
     * @return Page of matching department DTOs
     */
    public Page<DepartmentDTO> searchDepartments(String keyword, Pageable pageable) {
        return departmentRepository.searchByKeyword(keyword, pageable)
                .map(this::convertToDTO);
    }

    /**
     * Find departments by type
     *
     * @param type     Department type
     * @param pageable Pagination information
     * @return Page of matching department DTOs
     */
    public Page<DepartmentDTO> findDepartmentsByType(DepartmentType type, Pageable pageable) {
        return departmentRepository.findByTypeCode(type.getCode(), pageable)
                .map(this::convertToDTO);
    }

    /**
     * Find departments by group
     *
     * @param group    Department group
     * @param pageable Pagination information
     * @return Page of matching department DTOs
     */
    public Page<DepartmentDTO> findDepartmentsByGroup(String group, Pageable pageable) {
        return departmentRepository.findByGroup(group, pageable)
                .map(this::convertToDTO);
    }

    /**
     * Get departments statistics by type
     *
     * @return A map with statistics by department type
     */
    public Map<DepartmentType, Long> getDepartmentStatistics() {
        Map<DepartmentType, Long> statistics = new EnumMap<>(DepartmentType.class);

        for (DepartmentType type : DepartmentType.values()) {
            long count = departmentRepository.countByTypeCode(type.getCode());
            statistics.put(type, count);
        }

        return statistics;
    }

    /**
     * Convert Department entity to DepartmentDTO
     *
     * @param department Department entity
     * @return Department DTO
     */
    public DepartmentDTO convertToDTO(Department department) {
        if (department == null) {
            return null;
        }

        DepartmentDTO dto = DepartmentDTO.builder()
                .id(department.getId())
                .name(department.getName())
                .abbreviation(department.getAbbreviation())
                .storageLocation(department.getStorageLocation())
                .codeDepartment(department.getCodeDepartment())
                .email(department.getEmail())
                .type(department.getType())
                .externalId(department.getExternalId())
                .group(department.getGroup())
                .userCount(countUsersInDepartment(department.getId()))
                .assignedDocumentsCount(countAssignedDocuments(department))
                .parentDepartmentId(
                        department.getParentDepartment() != null ? department.getParentDepartment().getId() : null)
                .parentDepartmentName(
                        department.getParentDepartment() != null ? department.getParentDepartment().getName() : null)
                .build();

        // Add child departments if they exist
        if (department.getChildDepartments() != null && !department.getChildDepartments().isEmpty()) {
            // To avoid infinite recursion, we'll create simplified DTOs for children
            Set<DepartmentDTO> childDtos = department.getChildDepartments().stream()
                    .map(child -> {
                        return DepartmentDTO.builder()
                                .id(child.getId())
                                .name(child.getName())
                                .abbreviation(child.getAbbreviation())
                                .storageLocation(child.getStorageLocation())

                                .codeDepartment(child.getCodeDepartment())
                                .parentDepartmentId(department.getId())
                                .parentDepartmentName(department.getName())
                                .build();
                    })
                    .collect(Collectors.toSet());

            dto.setChildDepartments(childDtos);
        }

        return dto;
    }

    /**
     * Convert DepartmentDTO to Department entity
     *
     * @param departmentDTO Department DTO
     * @return Department entity
     */
    private Department convertToEntity(DepartmentDTO departmentDTO) {
        if (departmentDTO == null) {
            return null;
        }
       //convert co to type

        Department department = Department.builder()
                .name(departmentDTO.getName())
                .abbreviation(departmentDTO.getAbbreviation())
                .storageLocation(departmentDTO.getStorageLocation())
                .codeDepartment(departmentDTO.getCodeDepartment())
                .email(departmentDTO.getEmail())
                .typeCode(departmentDTO.getType() != null ? departmentDTO.getType().getCode() : null)
                .externalId(departmentDTO.getExternalId())
                .group(departmentDTO.getGroup())
                .build();

        // Set ID if this is an update operation
        if (departmentDTO.getId() != null) {
            department.setId(departmentDTO.getId());
        }

        // Handle child departments if they exist
        if (departmentDTO.getChildDepartments() != null && !departmentDTO.getChildDepartments().isEmpty()) {
            Set<Department> childDepartments = new HashSet<>();

            for (DepartmentDTO childDto : departmentDTO.getChildDepartments()) {
                // Skip creating children with missing or invalid data
                if (childDto.getId() == null && (childDto.getName() == null || childDto.getName().trim().isEmpty())) {
                    continue;
                }

                // If it has an ID, fetch the existing department
                Department childDepartment;
                if (childDto.getId() != null) {
                    childDepartment = departmentRepository.findById(childDto.getId())
                            .orElse(null);

                    if (childDepartment == null) {
                        continue; // Skip if department not found
                    }
                } else {
                    // Create a new department entity for children without IDs
                    childDepartment = convertToEntity(childDto);
                }

                // Set the bidirectional relationship
                childDepartment.setParentDepartment(department);
                childDepartments.add(childDepartment);
            }

            department.setChildDepartments(childDepartments);
        }

        return department;
    }

    /**
     * Count users belonging to a department
     *
     * @param departmentId The department ID
     * @return Count of users in the department
     */
    private Integer countUsersInDepartment(Long departmentId) {
        // This would need to be implemented based on your User-Department relationship
        // For now, returning a placeholder value
        return userRepository.countByDepartmentId(departmentId);
    }

    /**
     * Count documents assigned to a department
     *
     * @param department The department entity
     * @return Count of assigned documents
     */
    private Integer countAssignedDocuments(Department department) {
        if (department == null) {
            return 0;
        }
        if (department.getAssignedDocuments() == null) {
            return 0;
        }
        return department.getAssignedDocuments().size();
    }

    /**
     * Get all available department types
     *
     * @return Map of department types with codes and display names
     */
    public Map<Integer, String> getDepartmentTypes() {
        Map<Integer, String> types = new HashMap<>();

        for (DepartmentType type : DepartmentType.values()) {
            types.put(type.getCode(), type.getDisplayName());
        }

        return types;
    }
}
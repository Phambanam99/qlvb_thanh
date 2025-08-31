package com.managementcontent.service;

import com.managementcontent.dto.DepartmentDTO;
import com.managementcontent.dto.DocumentDepartmentDTO;
import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentDepartment;
import com.managementcontent.model.enums.NotificationType;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.DocumentDepartmentRepository;
import com.managementcontent.repository.DocumentRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing document-department relationships
 */
@Service
@RequiredArgsConstructor
public class DocumentDepartmentService {

    private final DocumentDepartmentRepository documentDepartmentRepository;
    private final DocumentRepository<Document> documentRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final DepartmentService departmentService;
    private final NotificationService notificationService;

    /**
     * Assign a document to a department
     *
     * @param documentId   ID of the document
     * @param departmentId ID of the department
     * @param actorId      ID of the user making the assignment
     * @param isPrimary    whether this department is the primary processor
     * @param comments     optional comments
     * @param dueDate      optional deadline
     */
    @Transactional
    public void assignDocumentToDepartment(
            Long documentId,
            Long departmentId,
            Long actorId,
            boolean isPrimary,
            String comments,
            LocalDateTime dueDate) {

        // Find the document, department, and actor
        documentRepository.findById(documentId)
                .flatMap(document -> departmentRepository.findById(departmentId)
                        .flatMap(department -> userRepository.findById(actorId)
                                .map(actor -> {
                                    // Check if assignment already exists
                                    Optional<DocumentDepartment> existingAssignment = documentDepartmentRepository
                                            .findByDocument(document)
                                            .stream()
                                            .filter(dd -> dd.getDepartment().getId().equals(departmentId))
                                            .findFirst();

                                    DocumentDepartment assignment;
                                    if (existingAssignment.isPresent()) {
                                        // Update existing assignment
                                        assignment = existingAssignment.get();
                                        assignment.setPrimary(isPrimary);
                                        assignment.setComments(comments);
                                        assignment.setDueDate(dueDate);
                                        assignment.setAssignedBy(actor);
                                        assignment.setAssignedDate(LocalDateTime.now());
                                    } else {
                                        // Create new assignment
                                        assignment = document.addDepartment(department, isPrimary, actor, comments);
                                        assignment.setDueDate(dueDate);
                                    }

                                    // Primary department is exclusive, ensure only one exists
                                    if (isPrimary) {
                                        List<DocumentDepartment> existingPrimaryDepts = documentDepartmentRepository
                                                .findByDocumentAndIsPrimaryTrue(document);

                                        // Get the department we're currently assigning
                                        Long currentDeptId = department.getId();

                                        for (DocumentDepartment primaryDept : existingPrimaryDepts) {
                                            Long existingPrimaryDeptId = primaryDept.getDepartment().getId();

                                            // If it's the same assignment we're currently updating, skip
                                            if (primaryDept.getId().equals(assignment.getId())) {
                                                continue;
                                            }

                                            // Check parent-child relationship
                                            boolean isChildOfExistingPrimary = isChildDepartment(currentDeptId,
                                                    existingPrimaryDeptId);
                                            boolean isParentOfExistingPrimary = isChildDepartment(existingPrimaryDeptId,
                                                    currentDeptId);

                                            // Only demote to collaborating if not in parent-child relationship
                                            if (!isChildOfExistingPrimary && !isParentOfExistingPrimary) {
                                                primaryDept.setPrimary(false);
                                                documentDepartmentRepository.save(primaryDept);
                                            }
                                        }
                                    }

                                    DocumentDepartment savedAssignment = documentDepartmentRepository.save(assignment);
                                    notificationService.createAndSendNotification(
                                            document,
                                            actor,
                                            NotificationType.ASSIGNMENT,
                                            "Bạn được phân công xử lý công văn " + document.getTitle());
                                    return convertToDTO(savedAssignment);
                                })));
    }

    /**
     * Get all departments assigned to a document
     * 
     * @param documentId ID of the document
     * @return list of assignments as DTOs
     */
    public List<DocumentDepartmentDTO> getDepartmentsByDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .map(document -> documentDepartmentRepository.findByDocument(document)
                        .stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    /**
     * Get the primary department for a document
     * 
     * @param documentId ID of the document
     * @return the primary department assignment as DTO, if exists
     */
    public Optional<DocumentDepartmentDTO> getPrimaryDepartmentForDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .flatMap(document -> {
                    List<DocumentDepartment> primaryDepts = documentDepartmentRepository
                            .findByDocumentAndIsPrimaryTrue(document);
                    if (primaryDepts.isEmpty()) {
                        return Optional.empty();
                    }
                    // Return the first primary department if multiple exist
                    return Optional.of(convertToDTO(primaryDepts.get(0)));
                });
    }

    public List<DepartmentDTO> getDepartmentsByDocumentId(Long documentId) {
        List<Long> departmentIds = documentDepartmentRepository.findDepartmentIdsByDocumentId(documentId);
        List<DepartmentDTO> departments = departmentIds.stream()
                .map(departmentRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(departmentService::convertToDTO)
                .toList();
        return departments;

    }

    /**
     * Get all collaborating departments for a document
     * 
     * @param documentId ID of the document
     * @return list of collaborating department assignments as DTOs
     */
    public List<DocumentDepartmentDTO> getCollaboratingDepartmentsForDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .map(document -> documentDepartmentRepository.findByDocumentAndIsPrimaryFalse(document)
                        .stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    /**
     * Remove a department assignment from a document
     * 
     * @param documentId   ID of the document
     * @param departmentId ID of the department
     * @return true if successful, false if not found
     */
    @Transactional
    public boolean removeDepartmentFromDocument(Long documentId, Long departmentId) {
        return documentRepository.findById(documentId)
                .flatMap(document -> departmentRepository.findById(departmentId)
                        .map(department -> {
                            boolean removed = false;

                            Optional<DocumentDepartment> assignmentOpt = documentDepartmentRepository
                                    .findByDocument(document)
                                    .stream()
                                    .filter(dd -> dd.getDepartment().getId().equals(departmentId))
                                    .findFirst();

                            if (assignmentOpt.isPresent()) {
                                documentDepartmentRepository.delete(assignmentOpt.get());
                                document.getAssignedDepartments().remove(assignmentOpt.get());
                                removed = true;
                            }

                            return removed;
                        }))
                .orElse(false);
    }

    /**
     * Get all Document with a specific department
     * 
     * @param departmentId ID of the department
     * @return list of document assignments as DTOs
     *
     */
    public List<DocumentDepartmentDTO> getDocumentsByDepartment(Long departmentId) {
        return departmentRepository.findById(departmentId)
                .map(department -> documentDepartmentRepository.findByDepartment(department)
                        .stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    /**
     * Convert a DocumentDepartment entity to DTO
     */
    private DocumentDepartmentDTO convertToDTO(DocumentDepartment documentDepartment) {
        DocumentDepartmentDTO dto = new DocumentDepartmentDTO();
        dto.setId(documentDepartment.getId());

        if (documentDepartment.getDocument() != null) {
            dto.setDocumentId(documentDepartment.getDocument().getId());
            dto.setDocumentTitle(documentDepartment.getDocument().getTitle());
        }

        if (documentDepartment.getDepartment() != null) {
            dto.setDepartmentId(documentDepartment.getDepartment().getId());
            dto.setDepartmentName(documentDepartment.getDepartment().getName());
        }

        dto.setPrimary(documentDepartment.isPrimary());
        dto.setComments(documentDepartment.getComments());
        dto.setAssignedDate(documentDepartment.getAssignedDate());
        dto.setDueDate(documentDepartment.getDueDate());
        dto.setProcessingStatus(documentDepartment.getProcessingStatus());

        if (documentDepartment.getAssignedBy() != null) {
            dto.setAssignedById(documentDepartment.getAssignedBy().getId());
            dto.setAssignedByName(documentDepartment.getAssignedBy().getName());
        }

        return dto;
    }

    /**
     * Check if one department is a child of another
     * 
     * @param childDeptId  ID of the potential child department
     * @param parentDeptId ID of the potential parent department
     * @return true if childDeptId is a child of parentDeptId, false otherwise
     */
    private boolean isChildDepartment(Long childDeptId, Long parentDeptId) {
        if (childDeptId.equals(parentDeptId)) {
            return false; // Same department
        }

        Optional<com.managementcontent.model.Department> childDeptOpt = departmentRepository.findById(childDeptId);
        if (childDeptOpt.isEmpty()) {
            return false;
        }

        com.managementcontent.model.Department childDept = childDeptOpt.get();

        // Check if parent is in the ancestry chain
        com.managementcontent.model.Department currentDept = childDept.getParentDepartment();
        while (currentDept != null) {
            if (currentDept.getId().equals(parentDeptId)) {
                return true; // Found parent in the ancestry chain
            }
            currentDept = currentDept.getParentDepartment();
        }

        return false; // No parent-child relationship found
    }
}
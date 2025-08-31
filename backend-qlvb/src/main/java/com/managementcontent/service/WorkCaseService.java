package com.managementcontent.service;

import com.managementcontent.dto.WorkCaseDTO;
import com.managementcontent.model.Document;
import com.managementcontent.model.User;
import com.managementcontent.model.WorkCase;
import com.managementcontent.repository.DocumentRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.repository.WorkCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkCaseService {
    
    private final WorkCaseRepository workCaseRepository;
    private final DocumentRepository<Document> documentRepository;
    private final UserRepository userRepository;
    
    public Page<WorkCaseDTO> getAllWorkCases(Pageable pageable) {
        return workCaseRepository.findAll(pageable)
                .map(this::convertToDTO);
    }
    
    public Optional<WorkCaseDTO> getWorkCaseById(Long id) {
        return workCaseRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    public Optional<WorkCaseDTO> getWorkCaseByCaseCode(String caseCode) {
        return workCaseRepository.findByCaseCode(caseCode)
                .map(this::convertToDTO);
    }
    
    public List<WorkCaseDTO> getWorkCasesByAssignee(Long assigneeId) {
        User assignee = userRepository.findById(assigneeId).orElse(null);
        if (assignee == null) {
            return Collections.emptyList();
        }
        
        return workCaseRepository.findByAssignedTo(assignee).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<WorkCaseDTO> getWorkCasesByCreator(Long creatorId) {
        User creator = userRepository.findById(creatorId).orElse(null);
        if (creator == null) {
            return Collections.emptyList();
        }
        
        return workCaseRepository.findByCreatedBy(creator).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<WorkCaseDTO> getWorkCasesByStatus(String status) {
        return workCaseRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<WorkCaseDTO> getWorkCasesByPriority(String priority) {
        return workCaseRepository.findByPriority(priority).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<WorkCaseDTO> getOverdueCases() {
        return workCaseRepository.findByDeadlineBefore(LocalDateTime.now()).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Page<WorkCaseDTO> searchWorkCases(String keyword, Pageable pageable) {
        return workCaseRepository.searchByKeyword(keyword, pageable)
                .map(this::convertToDTO);
    }
    
    @Transactional
    public WorkCaseDTO createWorkCase(WorkCaseDTO workCaseDTO) {
        WorkCase workCase = new WorkCase();
        updateWorkCaseFromDTO(workCase, workCaseDTO);
        
        // Generate a unique case code if not provided
        if (workCase.getCaseCode() == null || workCase.getCaseCode().isEmpty()) {
            workCase.setCaseCode(generateUniqueCaseCode());
        }
        
        WorkCase savedWorkCase = workCaseRepository.save(workCase);
        return convertToDTO(savedWorkCase);
    }
    
    @Transactional
    public Optional<WorkCaseDTO> updateWorkCase(Long id, WorkCaseDTO workCaseDTO) {
        return workCaseRepository.findById(id)
                .map(workCase -> {
                    updateWorkCaseFromDTO(workCase, workCaseDTO);
                    WorkCase updatedWorkCase = workCaseRepository.save(workCase);
                    return convertToDTO(updatedWorkCase);
                });
    }
    
    @Transactional
    public boolean deleteWorkCase(Long id) {
        if (!workCaseRepository.existsById(id)) {
            return false;
        }
        workCaseRepository.deleteById(id);
        return true;
    }
    
    @Transactional
    public Optional<WorkCaseDTO> addDocumentToCase(Long caseId, Long documentId) {
        Optional<WorkCase> workCaseOpt = workCaseRepository.findById(caseId);
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        
        if (workCaseOpt.isPresent() && documentOpt.isPresent()) {
            WorkCase workCase = workCaseOpt.get();
            Document document = documentOpt.get();
            
            workCase.addDocument(document);
            WorkCase updatedWorkCase = workCaseRepository.save(workCase);
            return Optional.of(convertToDTO(updatedWorkCase));
        }
        
        return Optional.empty();
    }
    
    @Transactional
    public Optional<WorkCaseDTO> removeDocumentFromCase(Long caseId, Long documentId) {
        Optional<WorkCase> workCaseOpt = workCaseRepository.findById(caseId);
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        
        if (workCaseOpt.isPresent() && documentOpt.isPresent()) {
            WorkCase workCase = workCaseOpt.get();
            Document document = documentOpt.get();
            
            workCase.removeDocument(document);
            WorkCase updatedWorkCase = workCaseRepository.save(workCase);
            return Optional.of(convertToDTO(updatedWorkCase));
        }
        
        return Optional.empty();
    }
    
    public List<WorkCaseDTO> getWorkCasesByDocument(Long documentId) {
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        
        if (documentOpt.isPresent()) {
            Document document = documentOpt.get();
            return workCaseRepository.findByDocument(document).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        return Collections.emptyList();
    }
    
    private void updateWorkCaseFromDTO(WorkCase workCase, WorkCaseDTO dto) {
        workCase.setTitle(dto.getTitle());
        
        if (dto.getCaseCode() != null && !dto.getCaseCode().isEmpty()) {
            workCase.setCaseCode(dto.getCaseCode());
        }
        
        workCase.setDescription(dto.getDescription());
        workCase.setStatus(dto.getStatus());
        workCase.setPriority(dto.getPriority());
        workCase.setDeadline(dto.getDeadline());
        workCase.setProgress(dto.getProgress());
        workCase.setTags(dto.getTags());
        
        if (dto.getCreatedById() != null) {
            userRepository.findById(dto.getCreatedById())
                    .ifPresent(workCase::setCreatedBy);
        }
        
        if (dto.getAssignedToId() != null) {
            userRepository.findById(dto.getAssignedToId())
                    .ifPresent(workCase::setAssignedTo);
        }
        
        // Handle document associations
        if (dto.getDocumentIds() != null && !dto.getDocumentIds().isEmpty()) {
            Set<Document> documents = dto.getDocumentIds().stream()
                    .map(documentRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toSet());
            
            workCase.setDocuments(documents);
        }
    }
    
    private WorkCaseDTO convertToDTO(WorkCase workCase) {
        WorkCaseDTO dto = new WorkCaseDTO();
        dto.setId(workCase.getId());
        dto.setTitle(workCase.getTitle());
        dto.setCaseCode(workCase.getCaseCode());
        dto.setDescription(workCase.getDescription());
        dto.setStatus(workCase.getStatus());
        dto.setPriority(workCase.getPriority());
        dto.setDeadline(workCase.getDeadline());
        dto.setCreatedDate(workCase.getCreatedDate());
        dto.setLastModifiedDate(workCase.getLastModifiedDate());
        dto.setProgress(workCase.getProgress());
        dto.setTags(workCase.getTags());
        
        if (workCase.getCreatedBy() != null) {
            dto.setCreatedById(workCase.getCreatedBy().getId());
            dto.setCreatedByName(workCase.getCreatedBy().getName());
        }
        
        if (workCase.getAssignedTo() != null) {
            dto.setAssignedToId(workCase.getAssignedTo().getId());
            dto.setAssignedToName(workCase.getAssignedTo().getName());
        }
        
        // Extract document IDs
        Set<Long> documentIds = workCase.getDocuments().stream()
                .map(Document::getId)
                .collect(Collectors.toSet());
        dto.setDocumentIds(documentIds);
        
        return dto;
    }
    
    private String generateUniqueCaseCode() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        String month = String.format("%02d", LocalDateTime.now().getMonthValue());
        
        // Get current count of cases in the system and add 1
        long caseCount = workCaseRepository.count() + 1;
        
        // Format: WC-YYYY-MM-XXXX (where XXXX is a sequential number)
        return String.format("WC-%s-%s-%04d", year, month, caseCount);
    }
}
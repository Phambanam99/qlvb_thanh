package com.managementcontent.service;

import com.managementcontent.dto.ActivityLogDTO;
import com.managementcontent.model.ActivityLog;
import com.managementcontent.model.Document;
import com.managementcontent.model.User;
import com.managementcontent.model.WorkCase;
import com.managementcontent.repository.ActivityLogRepository;
import com.managementcontent.repository.DocumentRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.repository.WorkCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {
    
    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final DocumentRepository<Document> documentRepository;
    private final WorkCaseRepository workCaseRepository;
    
    @Transactional
    public ActivityLogDTO logActivity(String actionType, String actionDescription, Long userId, 
                                     Long documentId, Long workCaseId, String ipAddress, 
                                     String additionalData) {
        ActivityLog log = new ActivityLog();
        log.setActionType(actionType);
        log.setActionDescription(actionDescription);
        log.setIpAddress(ipAddress);
        log.setAdditionalData(additionalData);
        
        // Set user if provided
        if (userId != null) {
            userRepository.findById(userId).ifPresent(log::setUser);
        }
        
        // Set document if provided
        if (documentId != null) {
            documentRepository.findById(documentId).ifPresent(log::setDocument);
        }
        
        // Set work case if provided
        if (workCaseId != null) {
            workCaseRepository.findById(workCaseId).ifPresent(log::setWorkCase);
        }
        
        ActivityLog savedLog = activityLogRepository.save(log);
        return convertToDTO(savedLog);
    }
    
    public List<ActivityLogDTO> getLogsByUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return activityLogRepository.findByUser(user).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        return List.of();
    }
    
    public List<ActivityLogDTO> getLogsByDocument(Long documentId) {
        Optional<Document> documentOpt = documentRepository.findById(documentId);
        
        if (documentOpt.isPresent()) {
            Document document = documentOpt.get();
            return activityLogRepository.findByDocument(document).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        return List.of();
    }
    
    public List<ActivityLogDTO> getLogsByWorkCase(Long workCaseId) {
        Optional<WorkCase> workCaseOpt = workCaseRepository.findById(workCaseId);
        
        if (workCaseOpt.isPresent()) {
            WorkCase workCase = workCaseOpt.get();
            return activityLogRepository.findByWorkCase(workCase).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        return List.of();
    }
    
    public List<ActivityLogDTO> getLogsByActionType(String actionType) {
        return activityLogRepository.findByActionType(actionType).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<ActivityLogDTO> getLogsByDateRange(LocalDateTime start, LocalDateTime end) {
        return activityLogRepository.findByTimestampBetween(start, end).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Page<ActivityLogDTO> getRecentActivities(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return activityLogRepository.findByOrderByTimestampDesc(pageable)
                .map(this::convertToDTO);
    }
    
    public List<ActivityLogDTO> getUserActivitiesByDateRange(Long userId, LocalDateTime start, LocalDateTime end) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return activityLogRepository.findByUserAndTimeRange(user, start, end).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        return List.of();
    }
    
    public List<Object[]> getMostActiveUsers(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return activityLogRepository.findMostActiveUsers(pageable);
    }
    
    public List<Object[]> getDocumentActivityByMonth(LocalDateTime start, LocalDateTime end) {
        return activityLogRepository.countDocumentActivityByMonth(start, end);
    }
    
    public List<Object[]> getActionTypeCounts() {
        return activityLogRepository.countByActionType();
    }
    
    private ActivityLogDTO convertToDTO(ActivityLog activityLog) {
        ActivityLogDTO dto = new ActivityLogDTO();
        dto.setId(activityLog.getId());
        dto.setActionType(activityLog.getActionType());
        dto.setActionDescription(activityLog.getActionDescription());
        dto.setTimestamp(activityLog.getTimestamp());
        
        if (activityLog.getUser() != null) {
            dto.setUserId(activityLog.getUser().getId());
            dto.setUsername(activityLog.getUser().getName());
        }
        
        if (activityLog.getDocument() != null) {
            dto.setDocumentId(activityLog.getDocument().getId());
            dto.setDocumentTitle(activityLog.getDocument().getTitle());
        }
        
        if (activityLog.getWorkCase() != null) {
            dto.setWorkCaseId(activityLog.getWorkCase().getId());
            dto.setWorkCaseTitle(activityLog.getWorkCase().getTitle());
        }
        
        return dto;
    }
}
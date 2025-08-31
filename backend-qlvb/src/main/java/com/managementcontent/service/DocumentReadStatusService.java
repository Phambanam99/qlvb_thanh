package com.managementcontent.service;

import com.managementcontent.dto.DocumentReaderDTO;
import com.managementcontent.model.DocumentReadStatus;
import com.managementcontent.model.DocumentReadStatus.DocumentType;
import com.managementcontent.model.User;
import com.managementcontent.repository.DocumentReadStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentReadStatusService {

    private final DocumentReadStatusRepository readStatusRepository;
    private final UserService userService;

    /**
     * Mark a document as read for the current user
     */
    @Transactional
    public void markAsRead(Long documentId, DocumentType documentType) {
        User currentUser = getCurrentUser();
        markAsRead(documentId, documentType, currentUser);
    }

    /**
     * Mark a document as read for a specific user
     */
    @Transactional
    public void markAsRead(Long documentId, DocumentType documentType, User user) {
        DocumentReadStatus readStatus = readStatusRepository
                .findByDocumentIdAndDocumentTypeAndUser(documentId, documentType, user)
                .orElse(DocumentReadStatus.builder()
                        .documentId(documentId)
                        .documentType(documentType)
                        .user(user)
                        .isRead(false)
                        .build());

        if (!readStatus.getIsRead()) {
            readStatus.markAsRead();
            readStatusRepository.save(readStatus);
            log.info("Marked document {} of type {} as read for user {}",
                    documentId, documentType, user.getName());
        }
    }

    /**
     * Mark a document as unread for the current user
     */
    @Transactional
    public void markAsUnread(Long documentId, DocumentType documentType) {
        User currentUser = getCurrentUser();
        markAsUnread(documentId, documentType, currentUser);
    }

    /**
     * Mark a document as unread for a specific user
     */
    @Transactional
    public void markAsUnread(Long documentId, DocumentType documentType, User user) {
        DocumentReadStatus readStatus = readStatusRepository
                .findByDocumentIdAndDocumentTypeAndUser(documentId, documentType, user)
                .orElse(DocumentReadStatus.builder()
                        .documentId(documentId)
                        .documentType(documentType)
                        .user(user)
                        .isRead(true)
                        .build());

        if (readStatus.getIsRead()) {
            readStatus.markAsUnread();
            readStatusRepository.save(readStatus);
            log.info("Marked document {} of type {} as unread for user {}",
                    documentId, documentType, user.getName());
        }
    }

    /**
     * Check if a document is read by the current user
     */
    public boolean isDocumentRead(Long documentId, DocumentType documentType) {
        User currentUser = getCurrentUser();
        return readStatusRepository.isDocumentReadByUser(documentId, documentType, currentUser);
    }

    /**
     * Get read status for multiple documents for the current user
     */
    public Map<Long, Boolean> getReadStatusForDocuments(List<Long> documentIds, DocumentType documentType) {
        User currentUser = getCurrentUser();
        List<DocumentReadStatus> readStatuses = readStatusRepository
                .findByDocumentIdsAndDocumentTypeAndUser(documentIds, documentType, currentUser);
        System.out.println(readStatuses);
        Map<Long, Boolean> readStatusMap = readStatuses.stream()
                .collect(Collectors.toMap(
                        DocumentReadStatus::getDocumentId,
                        DocumentReadStatus::getIsRead));

        // Fill in missing documents as unread
        documentIds.forEach(id -> readStatusMap.putIfAbsent(id, false));

        return readStatusMap;
    }

    /**
     * Count unread documents for the current user
     */
    public long countUnreadDocuments(DocumentType documentType) {
        User currentUser = getCurrentUser();
        return readStatusRepository.countUnreadDocuments(currentUser, documentType);
    }

    /**
     * Get unread document IDs for the current user
     */
    public List<Long> getUnreadDocumentIds(DocumentType documentType) {
        User currentUser = getCurrentUser();
        return readStatusRepository.findUnreadDocumentIds(currentUser, documentType);
    }

    /**
     * Initialize read status for a new document for all relevant users
     * This should be called when a new document is created
     */
    @Transactional
    public void initializeReadStatusForDocument(Long documentId, DocumentType documentType, List<User> users) {
        for (User user : users) {
            DocumentReadStatus readStatus = DocumentReadStatus.builder()
                    .documentId(documentId)
                    .documentType(documentType)
                    .user(user)
                    .isRead(false)
                    .build();
            readStatusRepository.save(readStatus);
        }
        log.info("Initialized read status for document {} of type {} for {} users",
                documentId, documentType, users.size());
    }

    /**
     * Delete read status records for a document
     */
    @Transactional
    public void deleteReadStatusForDocument(Long documentId, DocumentType documentType) {
        readStatusRepository.deleteByDocumentIdAndDocumentType(documentId, documentType);
        log.info("Deleted read status records for document {} of type {}", documentId, documentType);
    }

    /**
     * Get list of users who have read a document with their details
     */
    public List<DocumentReaderDTO> getDocumentReaders(Long documentId, DocumentType documentType) {
        List<DocumentReadStatus> readStatuses = readStatusRepository
                .findByDocumentIdAndDocumentType(documentId, documentType);

        return readStatuses.stream()
                .map(this::mapToDocumentReaderDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get list of users who have read a document (only those who actually read it)
     */
    public List<DocumentReaderDTO> getDocumentReadersOnly(Long documentId, DocumentType documentType) {
        List<DocumentReadStatus> readStatuses = readStatusRepository
                .findByDocumentIdAndDocumentType(documentId, documentType);

        return readStatuses.stream()
                .filter(DocumentReadStatus::getIsRead)
                .map(this::mapToDocumentReaderDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get read statistics for a document
     */
    public Map<String, Object> getDocumentReadStatistics(Long documentId, DocumentType documentType) {
        List<DocumentReadStatus> readStatuses = readStatusRepository
                .findByDocumentIdAndDocumentType(documentId, documentType);

        long totalUsers = readStatuses.size();
        long readUsers = readStatuses.stream()
                .mapToLong(status -> status.getIsRead() ? 1 : 0)
                .sum();
        long unreadUsers = totalUsers - readUsers;

        double readPercentage = totalUsers > 0 ? (double) readUsers / totalUsers * 100 : 0;

        return Map.of(
                "totalUsers", totalUsers,
                "readUsers", readUsers,
                "unreadUsers", unreadUsers,
                "readPercentage", Math.round(readPercentage * 100.0) / 100.0);
    }

    /**
     * Map DocumentReadStatus to DocumentReaderDTO
     */
    private DocumentReaderDTO mapToDocumentReaderDTO(DocumentReadStatus readStatus) {
        User user = readStatus.getUser();

        // Get user's roles as comma-separated string
        String roles = user.getRoles().stream()
                .map(role -> role.getName().replace("ROLE_", ""))
                .collect(Collectors.joining(", "));

        return DocumentReaderDTO.builder()
                .userId(user.getId())
                .userName(user.getFullName() != null ? user.getFullName() : user.getName())
                .username(user.getName())
                .email(user.getMail())
                .position(roles) // Use roles as position for now
                .departmentId(user.getDepartment() != null ? user.getDepartment().getId() : null)
                .departmentName(user.getDepartment() != null ? user.getDepartment().getName() : null)
                .roles(roles)
                .isRead(readStatus.getIsRead())
                .readAt(readStatus.getReadAt())
                .createdAt(readStatus.getCreatedAt())
                .updatedAt(readStatus.getUpdatedAt())
                .phoneNumber(user.getPhone())
                .isActive(user.getUserStatus().getValue() == 1) // Active if status is 1
                .build();
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Check if authentication exists
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("No authentication context found");
        }

        String username = authentication.getName();
        return userService.findByName(username)
                .orElseThrow(() -> new RuntimeException("Current user not found: " + username));
    }

    /**
     * Get read time for a document by the current user
     */
    public LocalDateTime getDocumentReadTime(Long documentId, DocumentType documentType) {
        User currentUser = getCurrentUser();
        return readStatusRepository.findByDocumentIdAndDocumentTypeAndUser(documentId, documentType, currentUser)
                .map(DocumentReadStatus::getReadAt)
                .orElse(null);
    }
}

package com.managementcontent.service;

import com.managementcontent.dto.CreateInternalDocumentDTO;
import com.managementcontent.dto.InternalDocumentDTO;
import com.managementcontent.dto.InternalDocumentHistoryDTO;
import com.managementcontent.dto.DepartmentDTO;
import com.managementcontent.dto.UserDTO;
import com.managementcontent.model.*;
import com.managementcontent.model.InternalDocument.Priority;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.model.enums.DistributionType;
import com.managementcontent.model.enums.NotificationType;
import com.managementcontent.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.UrlResource;
import com.managementcontent.service.DocumentReadStatusService;
import com.managementcontent.model.DocumentReadStatus.DocumentType;
import com.managementcontent.util.RoleGroupUtil;
import com.managementcontent.util.DateTimeRange;

import java.io.IOException;
import java.io.FileNotFoundException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InternalDocumentService {

        private final InternalDocumentRepository internalDocumentRepository;
        private final InternalDocumentRecipientRepository recipientRepository;
        private final UserRepository userRepository;
        private final DepartmentRepository departmentRepository;
        private final FileStorageService fileStorageService;
        private final DepartmentService departmentService;
        private final UserService userService;
        private final DocumentReadStatusService documentReadStatusService;
        private final NotificationService notificationService;
        private final DocumentAccessControlService accessControlService;
        private final DocumentAuthorizationService authorizationService;

        // Create new internal document
        public InternalDocumentDTO createDocument(CreateInternalDocumentDTO createDTO) {
                User currentUser = accessControlService.getCurrentUser();
                InternalDocument document = buildBaseDocument(createDTO, currentUser);
                document = internalDocumentRepository.save(document);
                // Collect users for DocumentReadStatus initialization
                List<User> recipients = processRecipients(document, createDTO);
                // Initialize DocumentReadStatus for all recipients
                documentReadStatusService.initializeReadStatusForDocument(
                                document.getId(), DocumentType.OUTGOING_INTERNAL, recipients);
                // Add history
                document.addHistory(InternalDocumentHistory.ACTION_CREATED,
                                "Tạo công văn nội bộ", currentUser);
                document = internalDocumentRepository.save(document);

                // Send notifications to recipients
                sendNotificationsToRecipients(document, recipients, currentUser);

                log.info("Created internal document {} by user {}", document.getDocumentNumber(),
                                currentUser.getName());

                return convertToDTO(document, currentUser);
        }

        public boolean checkDocumentNumber(String documentNumber) {
                return internalDocumentRepository.findByDocumentNumber(documentNumber).isPresent();
        }

        // Create new internal document with attachments
        public InternalDocumentDTO createDocumentWithAttachments(CreateInternalDocumentDTO createDTO,
                        MultipartFile[] files, String[] descriptions) {
                User currentUser = accessControlService.getCurrentUser();
                // Create document using common builder
                InternalDocument document = buildBaseDocument(createDTO, currentUser);
                document.setStatus(DocumentProcessingStatus.DRAFT);
                document = internalDocumentRepository.save(document);
                // Process recipients using common method
                List<User> recipients = processRecipients(document, createDTO);
                // Add files if provided
                if (files != null && files.length > 0) {
                        for (int i = 0; i < files.length; i++) {
                                try {
                                        MultipartFile file = files[i];
                                        if (!file.isEmpty()) {
                                                // Store file
                                                String filename = storeInternalDocumentFile(file, document);
                                                // Add attachment record
                                                document.addAttachment(file.getOriginalFilename(), filename,
                                                                file.getContentType(), file.getSize());
                                                // Add history for attachment
                                                document.addHistory(InternalDocumentHistory.ACTION_ATTACHMENT_ADDED,
                                                                "Đính kèm file: " + file.getOriginalFilename(),
                                                                currentUser);
                                        }
                                } catch (IOException e) {
                                        log.error("Failed to upload file: {}", e.getMessage());
                                        // Continue with other files, don't fail the entire operation
                                }
                        }
                }

                // Add creation history
                document.addHistory(InternalDocumentHistory.ACTION_CREATED,
                                "Cập nhật công văn nội bộ" + (files != null && files.length > 0
                                                ? " với " + files.length + " file đính kèm"
                                                : ""),
                                currentUser);
                document = internalDocumentRepository.save(document);

                // Send notifications to recipients
                sendNotificationsToRecipients(document, recipients, currentUser);

                log.info("Created internal document {} by user {} with {} attachments",
                                document.getDocumentNumber(), currentUser.getName(),
                                files != null ? files.length : 0);

                return convertToDTO(document, currentUser);
        }

        @Transactional
        public boolean updateDocumentWithAttachments(Long id, CreateInternalDocumentDTO createDTO,
                        MultipartFile[] files, String[] descriptions) {
                User currentUser = accessControlService.getCurrentUser();

                // Create document using common builder

                Optional<InternalDocument> internalDocumentOptional = internalDocumentRepository.findById(id);
                if (internalDocumentOptional.isEmpty()) {
                        return false;
                }
                InternalDocument internalDocument = internalDocumentOptional.get();

                // Update existing document instead of creating new one
                // Copy new values from DTO to existing document
                InternalDocument document = updateDocumentFields(internalDocument, createDTO, currentUser);
                document.setStatus(DocumentProcessingStatus.DRAFT); // Keep as DRAFT for updates
                document.setUpdatedAt(LocalDateTime.now());

                // Process recipients using common method
                List<User> recipients = processRecipients(internalDocument, createDTO);
                // Add files if provided
                if (files != null && files.length > 0) {
                        for (int i = 0; i < files.length; i++) {
                                try {
                                        MultipartFile file = files[i];
                                        if (!file.isEmpty()) {
                                                // Store file
                                                String filename = storeInternalDocumentFile(file, document);
                                                // Add attachment record
                                                document.addAttachment(file.getOriginalFilename(), filename,
                                                                file.getContentType(), file.getSize());
                                                // Add history for attachment
                                                document.addHistory(InternalDocumentHistory.ACTION_ATTACHMENT_ADDED,
                                                                "Đính kèm file: " + file.getOriginalFilename(),
                                                                currentUser);
                                        }
                                } catch (IOException e) {
                                        log.error("Failed to upload file: {}", e.getMessage());
                                        // Continue with other files, don't fail the entire operation
                                }
                        }
                }

                // Add update history
                document.addHistory(InternalDocumentHistory.ACTION_UPDATED,
                                "Chỉnh sửa công văn nội bộ" + (files != null && files.length > 0
                                                ? " với " + files.length + " file đính kèm"
                                                : ""),
                                currentUser);

                document = internalDocumentRepository.save(document);

                // Send notifications to recipients
                updateNotificationsToRecipients(document, recipients, currentUser);

                log.info("Update internal document {} by user {} with {} attachments",
                                document.getDocumentNumber(), currentUser.getName(),
                                files != null ? files.length : 0);

                return true;

        }

        // Get document by ID
        @Transactional
        public Optional<InternalDocumentDTO> getDocumentById(Long id) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);
                notificationService.markAsRead(id);
                return internalDocumentRepository.findById(id)
                                .filter(doc -> accessControlService.canUserAccessDocument(doc, currentUser,
                                                userDepartmentIds))
                                .map(doc -> {
                                        // Mark as read using unified DocumentReadStatusService
                                        documentReadStatusService.markAsRead(id, DocumentType.OUTGOING_INTERNAL);
                                        return convertToDTO(doc, currentUser);
                                });
        }

        // Get documents sent by current user
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getSentDocuments(Pageable pageable) {
                User currentUser = accessControlService.getCurrentUser();

                return authorizationService.executeWithRoleBasedAccess(
                                currentUser,
                                pageable,
                                roleGroup -> authorizationService.getSentDocumentsByRole(currentUser, roleGroup,
                                                pageable),
                                doc -> convertToDTO(doc, currentUser));
        }

        // Get all documents sent by current user (no pagination)
        @Transactional(readOnly = true)
        public List<InternalDocumentDTO> getAllSentDocuments() {
                User currentUser = accessControlService.getCurrentUser();
                List<InternalDocument> documents = internalDocumentRepository
                                .findAllBySenderOrderByCreatedAtDesc(currentUser);
                return documents.stream()
                                .map(doc -> convertToDTO(doc, currentUser))
                                .collect(Collectors.toList());
        }

        // Get documents sent by current user within a specific year
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getSentDocumentsByYear(int year, Pageable pageable) {
                return getSentDocumentsByYearAndMonth(year, null, pageable);
        }

        // Get documents sent by current user within a specific year and optional month
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getSentDocumentsByYearAndMonth(int year, Integer month, Pageable pageable) {
                User currentUser = accessControlService.getCurrentUser();
                DateTimeRange dateRange = DateTimeRange.of(year, month);

                return authorizationService.executeWithRoleBasedAccess(
                                currentUser,
                                pageable,
                                roleGroup -> authorizationService.getSentDocumentsByYearAndRole(
                                                currentUser, roleGroup, dateRange, pageable, year, month),
                                doc -> convertToDTO(doc, currentUser));
        }

        // Get documents received by current user
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getReceivedDocuments(Pageable pageable) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                return authorizationService.executeWithRoleBasedAccess(
                                currentUser,
                                pageable,
                                roleGroup -> authorizationService.getReceivedDocumentsByRole(
                                                currentUser, roleGroup, userDepartmentIds, pageable),
                                doc -> convertToDTO(doc, currentUser));
        }

        // Get all documents received by current user (no pagination)
        @Transactional(readOnly = true)
        public List<InternalDocumentDTO> getAllReceivedDocuments() {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);
                List<InternalDocument> documents = internalDocumentRepository.findAllDocumentsReceivedByUser(
                                currentUser, userDepartmentIds);
                return documents.stream()
                                .map(doc -> convertToDTO(doc, currentUser))
                                .collect(Collectors.toList());
        }

        // Get documents received by current user within a specific year
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getReceivedDocumentsByYear(int year, Pageable pageable) {
                return getReceivedDocumentsByYearAndMonth(year, null, pageable);
        }

        // Get documents received by current user within a specific year and optional
        // month
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getReceivedDocumentsByYearAndMonth(int year, Integer month,
                        Pageable pageable) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);
                DateTimeRange dateRange = DateTimeRange.of(year, month);

                return authorizationService.executeWithRoleBasedAccess(
                                currentUser,
                                pageable,
                                roleGroup -> authorizationService.getReceivedDocumentsByYearAndRole(
                                                currentUser, roleGroup, userDepartmentIds, dateRange, pageable, year,
                                                month),
                                doc -> convertToDTO(doc, currentUser));
        }

        // Get unread documents for current user
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> getUnreadDocuments(Pageable pageable) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                Page<InternalDocument> documents = internalDocumentRepository.findUnreadDocumentsForUser(
                                currentUser, userDepartmentIds, pageable);
                return documents.map(doc -> convertToDTO(doc, currentUser));
        }

        // Get all unread documents for current user (no pagination)
        @Transactional(readOnly = true)
        public List<InternalDocumentDTO> getAllUnreadDocuments() {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                List<InternalDocument> documents = internalDocumentRepository.findAllUnreadDocumentsForUser(
                                currentUser, userDepartmentIds);
                return documents.stream()
                                .map(doc -> convertToDTO(doc, currentUser))
                                .collect(Collectors.toList());
        }

        // Count unread documents for current user
        @Transactional(readOnly = true)
        public Long countUnreadDocuments() {
                // Use unified DocumentReadStatusService instead of internal count
                return documentReadStatusService.countUnreadDocuments(DocumentType.OUTGOING_INTERNAL);
        }

        // Search documents
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> searchDocuments(String keyword, Pageable pageable) {
                User currentUser = accessControlService.getCurrentUser();
                Page<InternalDocument> documents = internalDocumentRepository.searchByKeyword(keyword, pageable);

                // Filter documents that user can access
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);
                List<InternalDocument> accessibleDocs = documents.getContent().stream()
                                .filter(doc -> accessControlService.canUserAccessDocument(doc, currentUser,
                                                userDepartmentIds))
                                .collect(Collectors.toList());

                Page<InternalDocument> filteredDocs = new PageImpl<>(accessibleDocs, pageable, accessibleDocs.size());
                return filteredDocs.map(doc -> convertToDTO(doc, currentUser));
        }

        // Reply to a document
        public InternalDocumentDTO replyToDocument(Long documentId, CreateInternalDocumentDTO replyDTO) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                InternalDocument originalDocument = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new RuntimeException("Document not found"));

                if (!accessControlService.canUserAccessDocument(originalDocument, currentUser, userDepartmentIds)) {
                        throw new RuntimeException("Access denied");
                }

                // Set reply information
                replyDTO.setReplyToId(documentId);

                // Auto-add original sender as recipient if not already included
                boolean senderIncluded = replyDTO.getRecipients().stream()
                                .anyMatch(r -> Objects.equals(r.getUserId(), originalDocument.getSender().getId()));

                if (!senderIncluded) {
                        CreateInternalDocumentDTO.RecipientRequest senderRecipient = CreateInternalDocumentDTO.RecipientRequest
                                        .builder()
                                        .departmentId(originalDocument.getSender().getDepartment().getId())
                                        .userId(originalDocument.getSender().getId())
                                        .notes("Trả lời công văn")
                                        .build();
                        replyDTO.getRecipients().add(senderRecipient);
                }

                InternalDocumentDTO reply = createDocument(replyDTO);

                // Add history to the document being replied to
                originalDocument.addHistory(InternalDocumentHistory.ACTION_REPLIED,
                                "Có công văn trả lời: " + reply.getTitle(), currentUser);
                internalDocumentRepository.save(originalDocument);

                // Find and update the root document (first document in the chain)
                InternalDocument rootDocument = findRootDocument(originalDocument);
                if (!rootDocument.equals(originalDocument)) {
                        rootDocument.addHistory(InternalDocumentHistory.ACTION_REPLIED,
                                        "Có công văn trả lời lồng nhau: " + reply.getTitle() +
                                                        " (trả lời cho " + originalDocument.getTitle() + ")",
                                        currentUser);
                        internalDocumentRepository.save(rootDocument);
                }

                return reply;
        }

        // Reply to a document with attachments
        public InternalDocumentDTO replyToDocumentWithAttachments(Long documentId, CreateInternalDocumentDTO replyDTO,
                        MultipartFile[] files, String[] descriptions) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                InternalDocument originalDocument = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new RuntimeException("Document not found"));

                if (!accessControlService.canUserAccessDocument(originalDocument, currentUser, userDepartmentIds)) {
                        throw new RuntimeException("Access denied");
                }

                // Set reply information
                replyDTO.setReplyToId(documentId);

                // Auto-add original sender as recipient if not already included
                boolean senderIncluded = replyDTO.getRecipients().stream()
                                .anyMatch(r -> Objects.equals(r.getUserId(), originalDocument.getSender().getId()));

                if (!senderIncluded) {
                        CreateInternalDocumentDTO.RecipientRequest senderRecipient = CreateInternalDocumentDTO.RecipientRequest
                                        .builder()
                                        .departmentId(originalDocument.getSender().getDepartment().getId())
                                        .userId(originalDocument.getSender().getId())
                                        .notes("Trả lời công văn")
                                        .build();
                        replyDTO.getRecipients().add(senderRecipient);
                }

                // Create reply with attachments - this ensures separate files for each document
                InternalDocumentDTO reply = createDocumentWithAttachments(replyDTO, files, descriptions);

                // Add history to the document being replied to
                originalDocument.addHistory(InternalDocumentHistory.ACTION_REPLIED,
                                "Có công văn trả lời: " + reply.getTitle(), currentUser);
                internalDocumentRepository.save(originalDocument);

                // Find and update the root document (first document in the chain)
                InternalDocument rootDocument = findRootDocument(originalDocument);
                if (!rootDocument.equals(originalDocument)) {
                        rootDocument.addHistory(InternalDocumentHistory.ACTION_REPLIED,
                                        "Có công văn trả lời lồng nhau: " + reply.getTitle() +
                                                        " (trả lời cho " + originalDocument.getTitle() + ")",
                                        currentUser);
                        internalDocumentRepository.save(rootDocument);
                }

                return reply;
        }

        // Mark document as read
        @Transactional
        public void markAsRead(Long documentId) {
                User currentUser = accessControlService.getCurrentUser();

                // Use unified DocumentReadStatusService instead of internal read status
                documentReadStatusService.markAsRead(documentId, DocumentType.OUTGOING_INTERNAL);

                // Get document to send notification to sender
                Optional<InternalDocument> documentOpt = internalDocumentRepository.findById(documentId);
                if (documentOpt.isPresent()) {
                        InternalDocument document = documentOpt.get();
                        User sender = document.getSender();

                        // Don't send notification if the reader is the sender
                        if (!sender.getId().equals(currentUser.getId())) {
                                String notificationContent = String.format(
                                                "%s đã đọc công văn nội bộ '%s' của bạn",
                                                currentUser.getName(),
                                                document.getTitle());

                                notificationService.createAndSendNotification(
                                                document.getId(),
                                                "internal_document",
                                                sender,
                                                NotificationType.INTERNAL_DOCUMENT_READ,
                                                notificationContent);

                                log.info("Đã gửi thông báo đọc công văn cho người gửi: {} -> {}",
                                                currentUser.getName(), sender.getName());
                        }
                }
        }

        // Add attachment to document
        public InternalDocumentDTO addAttachment(Long documentId, MultipartFile file, String description)
                        throws IOException {
                User currentUser = accessControlService.getCurrentUser();

                InternalDocument document = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new RuntimeException("Document not found"));

                if (!document.getSender().equals(currentUser)) {
                        throw new RuntimeException("Only document sender can add attachments");
                }

                // Store file
                String filename = storeInternalDocumentFile(file, document);

                // Add attachment record
                document.addAttachment(file.getOriginalFilename(), filename,
                                file.getContentType(), file.getSize());

                // Add history
                document.addHistory(InternalDocumentHistory.ACTION_ATTACHMENT_ADDED,
                                "Đính kèm file: " + file.getOriginalFilename(), currentUser);

                document = internalDocumentRepository.save(document);

                return convertToDTO(document, currentUser);
        }

        // Download attachment
        public ResponseEntity<Resource> downloadAttachment(Long documentId, Long attachmentId) throws IOException {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                InternalDocument document = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new FileNotFoundException("Document not found"));

                if (!accessControlService.canUserAccessDocument(document, currentUser, userDepartmentIds)) {
                        throw new AccessDeniedException("Access denied");
                }

                InternalDocumentAttachment attachment = document.getAttachments().stream()
                                .filter(att -> att.getId().equals(attachmentId))
                                .findFirst()
                                .orElseThrow(() -> new FileNotFoundException("Attachment not found"));

                Resource resource;
                try {
                        resource = loadFileAsResource(attachment.getFilePath());
                } catch (IOException e) {
                        throw new FileNotFoundException("File not found: " + attachment.getFilePath());
                }

                return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(attachment.getContentType()))
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\"" + attachment.getFilename() + "\"")
                                .body(resource);
        }

        // Advanced search with filters
        @Transactional(readOnly = true)
        public Page<InternalDocumentDTO> searchWithFilters(
                        Long senderId, Long recipientUserId, Long recipientDepartmentId,
                        Priority priority, String documentType, LocalDateTime startDate,
                        LocalDateTime endDate, String keyword, Pageable pageable) {

                User currentUser = accessControlService.getCurrentUser();
                Page<InternalDocument> documents = internalDocumentRepository.findWithFilters(
                                senderId, recipientUserId, recipientDepartmentId, priority,
                                documentType, startDate, endDate, keyword, pageable);

                // Filter documents that user can access
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);
                List<InternalDocument> accessibleDocs = documents.getContent().stream()
                                .filter(doc -> accessControlService.canUserAccessDocument(doc, currentUser,
                                                userDepartmentIds))
                                .collect(Collectors.toList());

                Page<InternalDocument> filteredDocs = new PageImpl<>(accessibleDocs, pageable, accessibleDocs.size());
                return filteredDocs.map(doc -> convertToDTO(doc, currentUser));
        }

        // Get document history
        @Transactional(readOnly = true)
        public List<InternalDocumentHistoryDTO> getDocumentHistory(Long documentId) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                InternalDocument document = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new RuntimeException("Document not found"));

                if (!accessControlService.canUserAccessDocument(document, currentUser, userDepartmentIds)) {
                        throw new RuntimeException("Access denied");
                }

                return document.getHistory().stream()
                                .sorted((h1, h2) -> h2.getPerformedAt().compareTo(h1.getPerformedAt())) // Latest first
                                .map(this::convertHistoryToDTO)
                                .collect(Collectors.toList());
        }

        // Get document replies
        @Transactional(readOnly = true)
        public List<InternalDocumentDTO> getDocumentReplies(Long documentId) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                InternalDocument document = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new RuntimeException("Document not found"));

                if (!accessControlService.canUserAccessDocument(document, currentUser, userDepartmentIds)) {
                        throw new RuntimeException("Access denied");
                }

                return document.getReplies().stream()
                                .filter(reply -> accessControlService.canUserAccessDocument(reply, currentUser,
                                                userDepartmentIds))
                                .sorted((r1, r2) -> r1.getCreatedAt().compareTo(r2.getCreatedAt())) // Chronological
                                                                                                    // order
                                .map(reply -> convertToDTO(reply, currentUser))
                                .collect(Collectors.toList());
        }

        // Get document thread (original + all replies in chronological order)
        @Transactional(readOnly = true)
        public List<InternalDocumentDTO> getDocumentThread(Long documentId) {
                User currentUser = accessControlService.getCurrentUser();
                List<Long> userDepartmentIds = accessControlService.getUserDepartmentIds(currentUser);

                InternalDocument document = internalDocumentRepository.findById(documentId)
                                .orElseThrow(() -> new RuntimeException("Document not found"));

                if (!accessControlService.canUserAccessDocument(document, currentUser, userDepartmentIds)) {
                        throw new RuntimeException("Access denied");
                }

                // Find the root document (the original document in the thread)
                InternalDocument rootDocument = document;
                while (rootDocument.getReplyTo() != null) {
                        rootDocument = rootDocument.getReplyTo();
                }

                // Collect all documents in the thread
                List<InternalDocument> threadDocuments = new ArrayList<>();
                collectThreadDocuments(rootDocument, threadDocuments, currentUser, userDepartmentIds);

                return threadDocuments.stream()
                                .sorted((d1, d2) -> d1.getCreatedAt().compareTo(d2.getCreatedAt()))
                                .map(doc -> convertToDTO(doc, currentUser))
                                .collect(Collectors.toList());
        }

        // Helper method to recursively collect all documents in a thread
        private void collectThreadDocuments(InternalDocument document, List<InternalDocument> result,
                        User currentUser, List<Long> userDepartmentIds) {
                if (accessControlService.canUserAccessDocument(document, currentUser, userDepartmentIds)) {
                        result.add(document);
                }

                // Add all replies recursively
                for (InternalDocument reply : document.getReplies()) {
                        collectThreadDocuments(reply, result, currentUser, userDepartmentIds);
                }
        }

        // Helper method to convert history to DTO
        private InternalDocumentHistoryDTO convertHistoryToDTO(InternalDocumentHistory history) {
                return InternalDocumentHistoryDTO.builder()
                                .id(history.getId())
                                .action(history.getAction())
                                .details(history.getDetails())
                                .performedById(history.getPerformedBy().getId())
                                .performedByName(history.getPerformedBy().getFullName())
                                .performedByDepartment(history.getPerformedBy().getDepartment() != null
                                                ? history.getPerformedBy().getDepartment().getName()
                                                : null)
                                .performedAt(history.getPerformedAt())
                                .build();
        }

        private InternalDocumentDTO convertToDTO(InternalDocument document, User currentUser) {
                // Use unified DocumentReadStatusService instead of internal read status
                boolean isRead = documentReadStatusService.isDocumentRead(document.getId(),
                                DocumentType.OUTGOING_INTERNAL);

                LocalDateTime readAt = documentReadStatusService.getDocumentReadTime(document.getId(),
                                DocumentType.OUTGOING_INTERNAL);

                // Convert distribution type to display name
                String distributionTypeDisplayName = null;
                if (document.getDistributionType() != null) {
                        switch (document.getDistributionType()) {
                                case REGULAR -> distributionTypeDisplayName = "Đi thường";
                                case CONFIDENTIAL -> distributionTypeDisplayName = "Đi mật";
                                case COPY_BOOK -> distributionTypeDisplayName = "Sổ sao";
                                case PARTY -> distributionTypeDisplayName = "Đi đảng";
                                case STEERING_COMMITTEE -> distributionTypeDisplayName = "Đi ban chỉ đạo";
                        }
                }

                return InternalDocumentDTO.builder()
                                .id(document.getId())
                                .documentNumber(document.getDocumentNumber())
                                .numberReceived(document.getNumberReceive())
                                .title(document.getTitle())
                                .summary(document.getSummary())
                                .documentType(document.getDocumentType())
                                .signingDate(document.getSigningDate())
                                .priority(document.getUrgencyLevel())
                                .notes(document.getNotes())
                                .status(document.getStatus())
                                .signer(document.getSigner())
                                .senderId(document.getSender().getId())
                                .senderName(document.getSender().getFullName())
                                .senderDepartment(
                                                document.getSender().getDepartment() != null
                                                                ? document.getSender().getDepartment().getName()
                                                                : null)
                                // New fields
                                .draftingDepartment(document.getDraftingDepartment() != null
                                                ? departmentService.convertToDTO(document.getDraftingDepartment())
                                                : null)
                                .securityLevel(document.getSecurityLevel())
                                .documentSigner(document.getDocumentSigner() != null
                                                ? userService.convertToDTO(document.getDocumentSigner())
                                                : null)
                                .isSecureTransmission(document.getIsSecureTransmission())
                                .processingDeadline(document.getProcessingDeadline())
                                .issuingAgency(document.getIssuingAgency())
                                .distributionType(document.getDistributionType())
                                .distributionTypeDisplayName(distributionTypeDisplayName)
                                .numberOfCopies(document.getNumberOfCopies())
                                .numberOfPages(document.getNumberOfPages())
                                .noPaperCopy(document.getNoPaperCopy())
                                .recipients(document.getRecipients().stream()
                                                .map(this::convertRecipientToDTO)
                                                .collect(Collectors.toList()))
                                .attachments(document.getAttachments().stream()
                                                .map(this::convertAttachmentToDTO)
                                                .collect(Collectors.toList()))
                                .replyToId(document.getReplyTo() != null ? document.getReplyTo().getId() : null)
                                .replyToTitle(document.getReplyTo() != null ? document.getReplyTo().getTitle() : null)
                                .replyCount(document.getReplies().size())
                                .createdAt(document.getCreatedAt())
                                .updatedAt(document.getUpdatedAt())
                                .isRead(isRead)
                                .readAt(readAt)
                                .build();
        }

        private InternalDocumentDTO.RecipientDTO convertRecipientToDTO(InternalDocumentRecipient recipient) {
                return InternalDocumentDTO.RecipientDTO.builder()
                                .id(recipient.getId())
                                .departmentId(recipient.getDepartment().getId())
                                .departmentName(recipient.getDepartment().getName())
                                .userId(recipient.getUser() != null ? recipient.getUser().getId() : null)
                                .userName(recipient.getUser() != null ? recipient.getUser().getFullName() : null)
                                .isRead(recipient.getIsRead())
                                .readAt(recipient.getReadAt())
                                .receivedAt(recipient.getReceivedAt())
                                .notes(recipient.getNotes())
                                .build();
        }

        private InternalDocumentDTO.AttachmentDTO convertAttachmentToDTO(InternalDocumentAttachment attachment) {
                return InternalDocumentDTO.AttachmentDTO.builder()
                                .id(attachment.getId())
                                .filename(attachment.getFilename())
                                .contentType(attachment.getContentType())
                                .fileSize(attachment.getFileSize())
                                .uploadedAt(attachment.getUploadedAt())
                                .uploadedByName(attachment.getUploadedBy() != null
                                                ? attachment.getUploadedBy().getFullName()
                                                : null)
                                .description(attachment.getDescription())
                                .build();
        }

        // Helper method to store file for InternalDocument
        private String storeInternalDocumentFile(MultipartFile file, InternalDocument document) throws IOException {
                // Get current date for folder structure
                LocalDate now = LocalDate.now();
                String year = String.valueOf(now.getYear());
                String month = String.format("%02d", now.getMonthValue());
                String day = String.format("%02d", now.getDayOfMonth());

                // Create year/month/day directory structure
                String relativePath = year + "/" + month + "/" + day;
                Path uploadPath = Paths.get("./document-uploads", year, month, day).toAbsolutePath().normalize();

                if (!Files.exists(uploadPath)) {
                        Files.createDirectories(uploadPath);
                }

                // Generate unique filename using document ID and UUID to prevent conflicts
                String originalFilename = file.getOriginalFilename();
                String fileExtension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }

                // Use document ID + timestamp + UUID to ensure uniqueness
                String uniqueIdentifier = document.getId() != null ? document.getId().toString() : "temp";
                String timestamp = String.valueOf(System.currentTimeMillis());
                String uuid = UUID.randomUUID().toString();
                String filename = "doc_" + uniqueIdentifier + "_" + timestamp + "_" + uuid + fileExtension;

                // Save file
                Path targetLocation = uploadPath.resolve(filename);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                // Return path relative to upload directory (year/month/day/filename)
                return relativePath + "/" + filename;
        }

        // Helper method to get file path for InternalDocument
        private Path getInternalDocumentFilePath(String relativePath) {
                Path uploadPath = Paths.get("./document-uploads").toAbsolutePath().normalize();
                return uploadPath.resolve(relativePath);
        }

        // Helper method to load file as resource
        private Resource loadFileAsResource(String filePath) throws IOException {
                try {
                        Path fileStoragePath = getInternalDocumentFilePath(filePath);
                        Resource resource = new UrlResource(fileStoragePath.toUri());

                        if (resource.exists()) {
                                return resource;
                        } else {
                                throw new IOException("File not found: " + filePath);
                        }
                } catch (Exception ex) {
                        throw new IOException("File not found: " + filePath, ex);
                }
        }

        private InternalDocument findRootDocument(InternalDocument document) {
                InternalDocument rootDocument = document;
                while (rootDocument.getReplyTo() != null) {
                        rootDocument = rootDocument.getReplyTo();
                }
                return rootDocument;
        }

        /**
         * Gửi công văn nội bộ đến danh sách người nhận và gửi thông báo
         * 
         * @param internalDocId    ID của công văn nội bộ
         * @param recipientUserIds Danh sách ID người nhận
         * @param sender           Người gửi
         * @return true nếu gửi thành công
         */
        @Transactional
        public boolean sendInternalDocument(Long internalDocId, List<Long> recipientUserIds, User sender) {
                log.info("Bắt đầu gửi công văn nội bộ ID: {} từ người gửi: {}", internalDocId, sender.getName());

                Optional<InternalDocument> docOpt = internalDocumentRepository.findById(internalDocId);
                if (docOpt.isEmpty()) {
                        log.error("Không tìm thấy công văn nội bộ với ID: {}", internalDocId);
                        return false;
                }

                InternalDocument document = docOpt.get();

                // Kiểm tra quyền gửi (chỉ người tạo mới có thể gửi)
                if (!document.getSender().getId().equals(sender.getId())) {
                        log.error("Người dùng {} không có quyền gửi công văn ID: {}", sender.getName(), internalDocId);
                        return false;
                }

                int successfulSends = 0;

                for (Long recipientId : recipientUserIds) {
                        Optional<User> recipientOpt = userRepository.findById(recipientId);
                        if (recipientOpt.isEmpty()) {
                                log.warn("Không tìm thấy người nhận với ID: {}", recipientId);
                                continue;
                        }

                        User recipient = recipientOpt.get();

                        try {
                                // Gửi thông báo đến người nhận
                                String notificationContent = String.format(
                                                "Bạn đã nhận được công văn nội bộ '%s' từ %s (%s)",
                                                document.getTitle(),
                                                sender.getName(),
                                                sender.getDepartment() != null ? sender.getDepartment().getName()
                                                                : "N/A");

                                notificationService.createAndSendNotification(
                                                document.getId(),
                                                "internal_document",
                                                recipient,
                                                NotificationType.INTERNAL_DOCUMENT_RECEIVED,
                                                notificationContent);

                                successfulSends++;
                                log.debug("Đã gửi thành công công văn đến: {}", recipient.getName());

                        } catch (Exception e) {
                                log.error("Lỗi khi gửi công văn đến người nhận ID: {}", recipientId, e);
                        }
                }

                log.info("Hoàn thành gửi công văn nội bộ ID: {}. Thành công: {}/{}",
                                internalDocId, successfulSends, recipientUserIds.size());

                return successfulSends > 0;
        }

        /**
         * Đánh dấu công văn nội bộ đã được đọc và gửi thông báo cho người gửi
         * 
         * @param internalDocId ID của công văn nội bộ
         * @param currentUser   Người đọc công văn
         * @return true nếu đánh dấu thành công
         */
        @Transactional
        public boolean markInternalDocumentAsRead(Long internalDocId, User currentUser) {
                log.info("Người dùng {} đánh dấu đã đọc công văn nội bộ ID: {}", currentUser.getName(), internalDocId);

                Optional<InternalDocument> docOpt = internalDocumentRepository.findById(internalDocId);
                if (docOpt.isEmpty()) {
                        log.error("Không tìm thấy công văn nội bộ với ID: {}", internalDocId);
                        return false;
                }

                InternalDocument document = docOpt.get();

                // Tìm bản ghi người nhận
                Optional<InternalDocumentRecipient> recipientOpt = recipientRepository
                                .findByDocumentAndUser(document, currentUser);

                if (recipientOpt.isEmpty()) {
                        log.error("Người dùng {} không phải là người nhận công văn ID: {}", currentUser.getName(),
                                        internalDocId);
                        return false;
                }

                InternalDocumentRecipient recipient = recipientOpt.get();

                // Nếu đã đọc rồi thì không cần làm gì
                if (recipient.getIsRead()) {
                        log.debug("công văn ID: {} đã được đánh dấu đọc trước đó bởi {}", internalDocId,
                                        currentUser.getName());
                        return true;
                }

                try {
                        // Cập nhật trạng thái đã đọc
                        recipient.setIsRead(true);
                        recipient.setReadAt(LocalDateTime.now());
                        recipientRepository.save(recipient);

                        // Gửi thông báo ngược về cho người gửi
                        String notificationContent = String.format(
                                        "%s (%s) đã đọc công văn nội bộ '%s' của bạn",
                                        currentUser.getName(),
                                        currentUser.getDepartment() != null ? currentUser.getDepartment().getName()
                                                        : "N/A",
                                        document.getTitle());

                        notificationService.createAndSendNotification(
                                        document.getId(),
                                        "internal_document",
                                        document.getSender(),
                                        NotificationType.INTERNAL_DOCUMENT_READ,
                                        notificationContent);

                        log.info("Đã đánh dấu công văn ID: {} là đã đọc bởi {}", internalDocId, currentUser.getName());
                        return true;

                } catch (Exception e) {
                        log.error("Lỗi khi đánh dấu công văn đã đọc", e);
                        return false;
                }
        }

        /**
         * Kiểm tra xem người dùng có quyền truy cập công văn không
         * 
         * @param internalDocId ID của công văn
         * @param user          Người dùng cần kiểm tra
         * @return true nếu có quyền truy cập
         */
        public boolean hasAccessToDocument(Long internalDocId, User user) {
                Optional<InternalDocument> docOpt = internalDocumentRepository.findById(internalDocId);
                if (docOpt.isEmpty()) {
                        return false;
                }

                InternalDocument document = docOpt.get();

                // Người gửi luôn có quyền truy cập
                if (document.getSender().getId().equals(user.getId())) {
                        return true;
                }

                // Kiểm tra xem có phải là người nhận không
                return recipientRepository
                                .findByDocumentAndUser(document, user)
                                .isPresent();
        }

        /**
         * Helper method để build base document từ DTO
         */
        private InternalDocument buildBaseDocument(CreateInternalDocumentDTO createDTO, User currentUser) {
                // Resolve department and signer references if provided
                Department draftingDepartment = createDTO.getDraftingDepartmentId() != null
                                ? departmentRepository.findById(createDTO.getDraftingDepartmentId()).orElse(null)
                                : null;

                User documentSigner = createDTO.getDocumentSignerId() != null
                                ? userRepository.findById(createDTO.getDocumentSignerId()).orElse(null)
                                : null;

                return InternalDocument.builder()
                                .signer(createDTO.getSigner())
                                .documentNumber(createDTO.getDocumentNumber())
                                .numberReceive(createDTO.getNumberReceive())
                                .title(createDTO.getTitle())
                                .summary(createDTO.getSummary())
                                .documentType(createDTO.getDocumentType())
                                .signingDate(createDTO.getSigningDate())
                                .urgencyLevel(createDTO.getUrgencyLevel())
                                .notes(createDTO.getNotes())
                                .sender(currentUser)
                                .draftingDepartment(draftingDepartment)
                                .securityLevel(createDTO.getSecurityLevel())
                                .documentSigner(documentSigner)
                                .isSecureTransmission(createDTO.getIsSecureTransmission())
                                .processingDeadline(createDTO.getProcessingDeadline())
                                .issuingAgency(createDTO.getIssuingAgency())
                                .distributionType(createDTO.getDistributionType())
                                .numberOfCopies(createDTO.getNumberOfCopies())
                                .numberOfPages(createDTO.getNumberOfPages())
                                .noPaperCopy(createDTO.getNoPaperCopy())
                                .replyTo(createDTO.getReplyToId() != null
                                                ? internalDocumentRepository.findById(createDTO.getReplyToId())
                                                                .orElse(null)
                                                : null)
                                .build();
        }

        /**
         * Helper method để process recipients và return list of users
         */
        private List<User> processRecipients(InternalDocument document, CreateInternalDocumentDTO createDTO) {
                List<User> recipients = new ArrayList<>();

                for (CreateInternalDocumentDTO.RecipientRequest recipientRequest : createDTO.getRecipients()) {
                        Department department = departmentRepository.findById(recipientRequest.getDepartmentId())
                                        .orElseThrow(
                                                        () -> new RuntimeException("Department not found: "
                                                                        + recipientRequest.getDepartmentId()));

                        if (recipientRequest.getUserId() != null) {
                                // Send to specific user
                                User user = userRepository.findById(recipientRequest.getUserId())
                                                .orElseThrow(() -> new RuntimeException(
                                                                "User not found: " + recipientRequest.getUserId()));
                                document.addRecipient(department, user);
                                recipients.add(user);
                        } else {
                                // Send to all users in department
                                document.addRecipient(department, null);
                                // Add all users in department to recipients list
                                List<User> deptUsers = userRepository.findByDepartmentId(department.getId());
                                recipients.addAll(deptUsers);
                        }
                }

                return recipients;
        }

        /**
         * Helper method để gửi thông báo đến danh sách người nhận
         * Trích xuất từ logic sendInternalDocument để tái sử dụng
         */
        private void sendNotificationsToRecipients(InternalDocument document, List<User> recipients, User sender) {
                log.info("Bắt đầu gửi thông báo công văn '{}' đến {} người nhận",
                                document.getTitle(), recipients.size());

                int successfulSends = 0;

                for (User recipient : recipients) {
                        try {
                                // Gửi thông báo đến người nhận
                                String notificationContent = String.format(
                                                "Bạn đã nhận được công văn nội bộ '%s' từ %s (%s)",
                                                document.getTitle(),
                                                sender.getName(),
                                                sender.getDepartment() != null ? sender.getDepartment().getName()
                                                                : "N/A");

                                notificationService.createAndSendNotification(
                                                document.getId(),
                                                "internal_document",
                                                recipient,
                                                NotificationType.INTERNAL_DOCUMENT_RECEIVED,
                                                notificationContent);

                                successfulSends++;
                                log.debug("Đã gửi thành công thông báo công văn đến: {}", recipient.getName());

                        } catch (Exception e) {
                                log.error("Lỗi khi gửi thông báo công văn đến người nhận ID: {}", recipient.getId(), e);
                        }
                }

                log.info("Hoàn thành gửi thông báo công văn ID: {}. Thành công: {}/{}",
                                document.getId(), successfulSends, recipients.size());
        }

        private void updateNotificationsToRecipients(InternalDocument document, List<User> recipients, User sender) {
                log.info("Bắt đầu gửi thông báo công văn đã update '{}' đến {} người nhận",
                                document.getTitle(), recipients.size());

                int successfulSends = 0;

                for (User recipient : recipients) {
                        try {
                                // Gửi thông báo đến người nhận
                                String notificationContent = String.format(
                                                "công văn nội bộ đã đươc thay đổi '%s' từ %s (%s)",
                                                document.getTitle(),
                                                sender.getName(),
                                                sender.getDepartment() != null ? sender.getDepartment().getName()
                                                                : "N/A");

                                notificationService.createAndSendNotification(
                                                document.getId(),
                                                "internal_document",
                                                recipient,
                                                NotificationType.INTERNAL_DOCUMENT_UPDATED,
                                                notificationContent);

                                successfulSends++;
                                log.debug("Đã gửi thành công thông báo công văn đến: {}", recipient.getName());

                        } catch (Exception e) {
                                log.error("Lỗi khi gửi thông báo công văn đến người nhận ID: {}", recipient.getId(), e);
                        }
                }

                log.info("Hoàn thành gửi thông báo công văn ID: {}. Thành công: {}/{}",
                                document.getId(), successfulSends, recipients.size());
        }

        /**
         * Helper method để update các trường của document từ DTO
         */
        private InternalDocument updateDocumentFields(InternalDocument document, CreateInternalDocumentDTO createDTO,
                        User currentUser) {
                // Resolve department and signer references if provided
                Department draftingDepartment = createDTO.getDraftingDepartmentId() != null
                                ? departmentRepository.findById(createDTO.getDraftingDepartmentId()).orElse(null)
                                : null;

                User documentSigner = createDTO.getDocumentSignerId() != null
                                ? userRepository.findById(createDTO.getDocumentSignerId()).orElse(null)
                                : null;

                // Update document fields
                document.setSigner(createDTO.getSigner());
                document.setDocumentNumber(createDTO.getDocumentNumber());
                document.setNumberReceive(createDTO.getNumberReceive());
                document.setTitle(createDTO.getTitle());
                document.setSummary(createDTO.getSummary());
                document.setDocumentType(createDTO.getDocumentType());
                document.setSigningDate(createDTO.getSigningDate());
                document.setUrgencyLevel(createDTO.getUrgencyLevel());
                document.setNotes(createDTO.getNotes());
                document.setDraftingDepartment(draftingDepartment);
                document.setSecurityLevel(createDTO.getSecurityLevel());
                document.setDocumentSigner(documentSigner);
                document.setIsSecureTransmission(createDTO.getIsSecureTransmission());
                document.setProcessingDeadline(createDTO.getProcessingDeadline());
                document.setIssuingAgency(createDTO.getIssuingAgency());
                document.setDistributionType(createDTO.getDistributionType());
                document.setNumberOfCopies(createDTO.getNumberOfCopies());
                document.setNumberOfPages(createDTO.getNumberOfPages());
                document.setNoPaperCopy(createDTO.getNoPaperCopy());

                // Set reply-to document if provided
                if (createDTO.getReplyToId() != null) {
                        internalDocumentRepository.findById(createDTO.getReplyToId())
                                        .ifPresent(document::setReplyTo);
                }
                return document;
        }

}
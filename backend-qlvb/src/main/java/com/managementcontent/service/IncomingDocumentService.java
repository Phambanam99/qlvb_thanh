package com.managementcontent.service;

import com.managementcontent.dto.DocumentDepartmentDTO;
import com.managementcontent.dto.IncomingDocumentDTO;
import com.managementcontent.model.*;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.DocumentTypeRepository;
import com.managementcontent.repository.IncomingDocumentRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.util.RoleGroupUtil;

import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;

@Service
@AllArgsConstructor
public class IncomingDocumentService {

    private IncomingDocumentRepository incomingDocumentRepository;

    private UserRepository userRepository;

    private UserService userService;
    // Inject FileStorageService in the constructor

    private FileStorageService fileStorageService;

    private DocumentWorkflowService documentWorkflowService;

    private DepartmentRepository departmentRepository;

    private DepartmentService departmentService;

    private DocumentDepartmentService documentDepartmentService;

    private DocumentTypeRepository documentTypeRepository;

    private DocumentClassificationService documentClassificationService;

    private DocumentAttachmentService documentAttachmentService;

    public Page<IncomingDocumentDTO> getAllIncomingDocuments(Pageable pageable) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            // Nếu không có user hiện tại, trả về empty page
            return Page.empty(pageable);
        }

        // Lấy tất cả role codes của user hiện tại
        Set<String> userRoles = currentUser.getRoles().stream()
                .map(Role::getName)
                .collect(java.util.stream.Collectors.toSet());

        // Xác định nhóm role cao nhất của user
        RoleGroupUtil.RoleGroup highestRoleGroup = RoleGroupUtil.getHighestRoleGroup(userRoles);

        if (highestRoleGroup == null) {
            // Nếu không xác định được role group, trả về empty page
            return Page.empty(pageable);
        }

        // Áp dụng logic phân quyền theo nhóm role
        switch (highestRoleGroup) {
            case CHI_HUY_CUC:
                // Chỉ huy cục: Xem tất cả văn bản
                return incomingDocumentRepository.findAll(pageable)
                        .map(this::convertToDTO);

            case CHI_HUY_DON_VI:
                // Chỉ huy đơn vị: Xem văn bản của phòng ban mình và các phòng ban cấp dưới
                if (currentUser.getDepartment() != null) {
                    return getAllDocumentsByDepartmentId(currentUser.getDepartment().getId(), pageable);
                } else {
                    // Nếu không có department, xem tất cả (fallback)
                    return incomingDocumentRepository.findAll(pageable)
                            .map(this::convertToDTO);
                }

            case VAN_THU:
                // Văn thư: Xem tất cả văn bản để quản lý
                return incomingDocumentRepository.findAll(pageable)
                        .map(this::convertToDTO);

            case NHAN_VIEN:
                // Nhân viên/Trợ lý: Chỉ xem văn bản được phân công cho họ hoặc do họ tạo
                // Lấy văn bản được phân công cho user
                System.out.println("hehehehehehehheeeeeeeeeeeeeeeee");
                Page<IncomingDocument> assignedDocs = incomingDocumentRepository.findByAssignedUser(currentUser,
                        pageable);

                // Lấy văn bản do user tạo
                Page<IncomingDocument> createdDocs = incomingDocumentRepository.findByCreator(currentUser, pageable);

                // Kết hợp cả hai danh sách (ưu tiên văn bản được phân công)
                List<IncomingDocument> combinedDocs = new ArrayList<>();
                combinedDocs.addAll(assignedDocs.getContent());

                // Thêm văn bản do user tạo (tránh trùng lặp)
                for (IncomingDocument createdDoc : createdDocs.getContent()) {
                    if (!combinedDocs.contains(createdDoc)) {
                        combinedDocs.add(createdDoc);
                    }
                }

                // Tạo Page mới từ danh sách kết hợp
                Page<IncomingDocument> combinedPage = new PageImpl<>(combinedDocs, pageable, combinedDocs.size());
                return combinedPage.map(this::convertToDTO);

            default:
                // Fallback: trả về empty page
                return Page.empty(pageable);
        }
    }

    public Optional<IncomingDocumentDTO> getIncomingDocumentById(Long id) {
        return incomingDocumentRepository.findById(id)
                .map(this::convertToDTO);
    }

    public Page<IncomingDocumentDTO> searchIncomingDocuments(String keyword, Pageable pageable) {
        return incomingDocumentRepository.findByReferenceNumberContaining(keyword, pageable)
                .map(this::convertToDTO);
    }

    public Page<IncomingDocumentDTO> findByUrgencyLevel(String urgencyLevel, Pageable pageable) {
        return incomingDocumentRepository.findByUrgencyLevel(urgencyLevel, pageable)
                .map(this::convertToDTO);
    }

    public Page<IncomingDocumentDTO> findByProcessingStatus(String status, Pageable pageable) {
        DocumentProcessingStatus documentProcessingStatus = DocumentProcessingStatus.fromCode(status);
        return incomingDocumentRepository.findByStatus(documentProcessingStatus, pageable)
                .map(this::convertToDTO);
    }

    public Page<IncomingDocumentDTO> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return incomingDocumentRepository.findBySigningDateBetween(start, end, pageable)
                .map(this::convertToDTO);
    }

    @Transactional
    public IncomingDocumentDTO createIncomingDocument(IncomingDocumentDTO documentDTO) {
        IncomingDocument document = new IncomingDocument();
        document.setTitle(documentDTO.getTitle());

        // Convert String to Integer for documentNumber if not null
        if (documentDTO.getDocumentNumber() != null) {
            try {
                document.setDocumentNumber(documentDTO.getDocumentNumber());
            } catch (NumberFormatException e) {
                // Handle or log the exception
            }
        }
        document.setStorageLocation(documentDTO.getStorageLocation());
        document.setReferenceNumber(documentDTO.getReferenceNumber());
        document.setIssuingAuthority(documentDTO.getIssuingAuthority());
        document.setUrgencyLevel(documentDTO.getUrgencyLevel());

        // Xử lý các trường mới bổ sung
        document.setSecurityLevel(documentDTO.getSecurityLevel());
        document.setSummary(documentDTO.getSummary());
        document.setNotes(documentDTO.getNotes());

        // Xử lý documentType, khác với type trong Document cha
        if (documentDTO.getDocumentType() != null) {
            documentTypeRepository.findByName(documentDTO.getDocumentType())
                    .ifPresent(document::setDocumentType);
        } else {
            // Nếu không có documentTypeId, có thể tạo mới hoặc xử lý theo logic khác
            document.setDocumentType(null); // Hoặc xử lý theo yêu cầu
        }

        // Luôn đặt type của entity để phân loại loại đối tượng
        document.setType("incoming_document");
        if (documentDTO.getClosureDeadline() != null) {
            document.setProcessDeadline(documentDTO.getClosureDeadline());
        }
        // Convert LocalDate to LocalDateTime for signingDate
        if (documentDTO.getSigningDate() != null) {
            document.setSigningDate(documentDTO.getSigningDate().atStartOfDay());
        }
        // Convert LocalDate to LocalDateTime for signingDate
        if (documentDTO.getReceivedDate() != null) {
            document.setReceivedDate(documentDTO.getReceivedDate().atStartOfDay());
        }
        document.setStatus(DocumentProcessingStatus.REGISTERED);

        // Convert Boolean to String for closureRequest
        if (documentDTO.getClosureRequest() != null) {
            document.setClosureRequest(documentDTO.getClosureRequest().toString());
        }

        // Set creator
        if (documentDTO.getPrimaryProcessDepartmentId() != null) {
            userRepository.findById(documentDTO.getPrimaryProcessDepartmentId())
                    .ifPresent(document::setCreator);
        }

        // Ánh xạ các trường mới
        // Số thu
        if (documentDTO.getReceiptNumber() != null) {
            document.setReceiptNumber(documentDTO.getReceiptNumber());
        }

        // Cán bộ xử lý
        if (documentDTO.getProcessingOfficerId() != null) {
            userRepository.findById(documentDTO.getProcessingOfficerId())
                    .ifPresent(document::setProcessingOfficer);
        }

        IncomingDocument savedDocument = incomingDocumentRepository.save(document);
        documentWorkflowService.canChangeStatus(savedDocument.getId(), DocumentProcessingStatus.REGISTERED);
        return convertToDTO(savedDocument);
    }

    @Transactional
    public Optional<IncomingDocumentDTO> updateIncomingDocument(Long id, IncomingDocumentDTO documentDTO) {
        return incomingDocumentRepository.findById(id)
                .map(document -> {
                    if (documentDTO.getTitle() != null) {
                        document.setTitle(documentDTO.getTitle());
                    }
                    if (documentDTO.getDocumentNumber() != null) {
                        try {
                            document.setDocumentNumber(documentDTO.getDocumentNumber());
                        } catch (NumberFormatException e) {
                            // Handle or log the exception
                        }
                    }
                    if (documentDTO.getReferenceNumber() != null) {
                        document.setReferenceNumber(documentDTO.getReferenceNumber());
                    }
                    if (documentDTO.getIssuingAuthority() != null) {
                        document.setIssuingAuthority(documentDTO.getIssuingAuthority());
                    }
                    if (documentDTO.getUrgencyLevel() != null) {
                        document.setUrgencyLevel(documentDTO.getUrgencyLevel());
                    }

                    // Cập nhật các trường mới
                    if (documentDTO.getSecurityLevel() != null) {
                        document.setSecurityLevel(documentDTO.getSecurityLevel());
                    }
                    if (documentDTO.getSummary() != null) {
                        document.setSummary(documentDTO.getSummary());
                    }
                    if (documentDTO.getNotes() != null) {
                        document.setNotes(documentDTO.getNotes());
                    }
                    document.setStorageLocation(documentDTO.getStorageLocation());
                    // Xử lý documentType, khác với type trong Document cha
                    if (documentDTO.getDocumentType() != null) {
                        documentTypeRepository.findByName(documentDTO.getDocumentType())
                                .ifPresent(document::setDocumentType);
                    } else {
                        // Nếu không có documentTypeId, có thể tạo mới hoặc xử lý theo logic khác
                        document.setDocumentType(null); // Hoặc xử lý theo yêu cầu
                    }

                    if (documentDTO.getSigningDate() != null) {
                        document.setSigningDate(documentDTO.getSigningDate().atStartOfDay());
                    }
                    if (documentDTO.getReceivedDate() != null) {
                        document.setReceivedDate(documentDTO.getReceivedDate().atStartOfDay());
                    }

                    if (documentDTO.getProcessingStatus() != null) {
                        document.setStatus(Objects
                                .requireNonNull(DocumentProcessingStatus.fromCode(documentDTO.getProcessingStatus())));
                    }
                    if (documentDTO.getClosureRequest() != null) {
                        document.setClosureRequest(documentDTO.getClosureRequest().toString());
                    }
                    if (documentDTO.getClosureDeadline() != null) {
                        document.setProcessDeadline(documentDTO.getClosureDeadline());
                    }
                    if (documentDTO.getSendingDepartmentName() != null) {
                        document.setSendingDepartmentText(documentDTO.getSendingDepartmentName());
                    }
                    if (documentDTO.getEmailSource() != null) {
                        document.setEmailSource(documentDTO.getEmailSource());
                    }

                    // Cập nhật các trường mới
                    // Số thu
                    if (documentDTO.getReceiptNumber() != null) {
                        document.setReceiptNumber(documentDTO.getReceiptNumber());
                    }

                    // Cán bộ xử lý
                    if (documentDTO.getProcessingOfficerId() != null) {
                        userRepository.findById(documentDTO.getProcessingOfficerId())
                                .ifPresent(document::setProcessingOfficer);
                    }

                    IncomingDocument updatedDocument = incomingDocumentRepository.save(document);
                    return convertToDTO(updatedDocument);
                });
    }

    @Transactional
    public boolean deleteIncomingDocument(Long id) {
        if (!incomingDocumentRepository.existsById(id)) {
            return false;
        }
        incomingDocumentRepository.deleteById(id);
        return true;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        String username = auth.getName();
        return userRepository.findByName(username).orElse(null);
    }

    private IncomingDocumentDTO convertToDTO(IncomingDocument document) {
        IncomingDocumentDTO dto = new IncomingDocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());
        dto.setAttachmentFilename(document.getAttachmentFilename());
        dto.setStorageLocation(document.getStorageLocation());
        // Convert Integer to String for documentNumber
        if (document.getDocumentNumber() != null) {
            dto.setDocumentNumber(document.getDocumentNumber().toString());
        }
        if (document.getUserPrimaryProcessor() != null) {
            dto.setUserPrimaryProcessor(
                    userService.convertToDTO(document.getUserPrimaryProcessor()));
        }
        dto.setClosureDeadline(document.getProcessDeadline());
        dto.setReferenceNumber(document.getReferenceNumber());
        dto.setIssuingAuthority(document.getIssuingAuthority());
        dto.setUrgencyLevel(document.getUrgencyLevel());

        // Ánh xạ các trường mới
        dto.setSecurityLevel(document.getSecurityLevel());
        dto.setSummary(document.getSummary());
        dto.setNotes(document.getNotes());
        dto.setDocumentType(document.getDocumentType().getName());

        // Convert LocalDateTime to LocalDate for signingDate
        if (document.getSigningDate() != null) {
            dto.setSigningDate(document.getSigningDate().toLocalDate());
        }
        if (document.getReceivedDate() != null) {
            dto.setReceivedDate(document.getReceivedDate().toLocalDate());
        }

        DocumentProcessingStatus status = documentClassificationService.classifyDocumentForUser(document,
                Objects.requireNonNull(getCurrentUser()));
        dto.setProcessingStatus(document.getStatus().getCode());
        dto.setDisplayStatus(document.getStatus().getDisplayName());

        // Set tracking status based on current processing status
        dto.setTrackingStatus(status.toString());
        dto.setTrackingStatusDisplayName(status.getDisplayName());

        // Convert String to Boolean for closureRequest
        if (document.getClosureRequest() != null) {
            dto.setClosureRequest(Boolean.valueOf(document.getClosureRequest()));
        }

        dto.setSendingDepartmentName(document.getSendingDepartmentText());
        dto.setCreated(document.getCreated());
        dto.setChanged(document.getChanged());
        dto.setCollaboratingDepartmentNames(
                document.getAssignedDepartments().stream()
                        .map(ad -> ad.getDepartment().getName())
                        .collect(Collectors.toSet()));
        dto.setCollaboratingDepartmentIds(
                document.getAssignedDepartments().stream()
                        .map(ad -> ad.getDepartment().getId())
                        .collect(Collectors.toSet()));
        dto.setPrimaryProcessDepartmentId(
                document.getAssignedDepartments().stream()
                        .filter(ad -> ad.getDepartment().getId() != null && ad.isPrimary())
                        .map(ad -> ad.getDepartment().getId())
                        .findFirst()
                        .orElse(null));

        // Ánh xạ các trường mới
        dto.setReceiptNumber(document.getReceiptNumber());

        // Ánh xạ cán bộ xử lý
        if (document.getProcessingOfficer() != null) {
            dto.setProcessingOfficer(userService.convertToDTO(document.getProcessingOfficer()));
            dto.setProcessingOfficerId(document.getProcessingOfficer().getId());
        }

        return dto;
    }

    // Add these methods
    @Transactional
    public Optional<IncomingDocumentDTO> addAttachment(Long id, MultipartFile file) throws IOException {
        return incomingDocumentRepository.findById(id)
                .map(document -> {
                    try {
                        // Delete old file if it exists
                        if (document.getAttachmentFilename() != null) {
                            fileStorageService.deleteFile(document.getAttachmentFilename());
                        }

                        // Store new file
                        String filename = fileStorageService.storeFile(file, document);
                        document.setAttachmentFilename(filename);

                        IncomingDocument updatedDocument = incomingDocumentRepository.save(document);
                        return convertToDTO(updatedDocument);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to store file", e);
                    }
                });
    }

    public ResponseEntity<Resource> getAttachment(Long id) throws IOException {
        Optional<IncomingDocument> documentOpt = incomingDocumentRepository.findById(id);
        if (documentOpt.isPresent() && documentOpt.get().getAttachmentFilename() != null) {
            IncomingDocument document = documentOpt.get();
            Path filePath = fileStorageService.getFilePath(document.getAttachmentFilename());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + document.getAttachmentFilename() + "\"")
                        .body(resource);
            }
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Deletes an attachment from an incoming document
     * 
     * @param id ID of the document
     * @return true if attachment was deleted, false if document or attachment was
     *         not found
     * @throws IOException if there was an error deleting the file
     */
    @Transactional
    public boolean deleteAttachment(Long id) throws IOException {
        return incomingDocumentRepository.findById(id)
                .map(document -> {
                    if (document.getAttachmentFilename() != null && !document.getAttachmentFilename().isEmpty()) {
                        try {
                            // Delete the file from storage
                            fileStorageService.deleteFile(document.getAttachmentFilename());

                            // Clear attachment reference in document
                            document.setAttachmentFilename(null);
                            incomingDocumentRepository.save(document);

                            return true;
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to delete attachment", e);
                        }
                    }
                    return false;
                })
                .orElse(false);
    }

    // Methods that return raw entities for use by the unified document controller
    public Page<IncomingDocument> getAllIncomingDocumentsRaw(Pageable pageable) {
        return incomingDocumentRepository.findAll(pageable);
    }

    public Optional<IncomingDocument> findIncomingDocumentById(Long id) {
        return incomingDocumentRepository.findById(id);
    }

    public Optional<IncomingDocument> findByDocumentNumber(String documentNumber) {
        return incomingDocumentRepository.findByDocumentNumber(documentNumber);
    }

    public Page<IncomingDocument> searchIncomingDocumentsRaw(String keyword, Pageable pageable) {
        return incomingDocumentRepository.searchByKeyword(keyword, pageable);
    }

    public Page<IncomingDocument> getRecentIncomingDocuments(Pageable pageable) {
        return incomingDocumentRepository.findAllByOrderByCreatedDesc(pageable);
    }

    /**
     * Find incoming documents by date range (raw entities)
     * 
     * @param start    Start date (inclusive)
     * @param end      End date (inclusive)
     * @param pageable Pagination parameters
     * @return Page of IncomingDocument entities
     */
    public Page<IncomingDocument> findIncomingDocumentsByDateRange(LocalDateTime start, LocalDateTime end,
            Pageable pageable) {
        return incomingDocumentRepository.findBySigningDateBetween(start, end, pageable);
    }

    /**
     * Get all document by department Id
     * 
     * @param departmentId
     */
    public Page<IncomingDocumentDTO> getAllDocumentsByDepartmentId(Long departmentId, Pageable pageable) {
        List<DocumentDepartmentDTO> documentDepartments = documentDepartmentService
                .getDocumentsByDepartment(departmentId);
        List<IncomingDocumentDTO> documents = documentDepartments.stream()
                .filter(dto -> dto.getDocumentId() != null)
                .map(dto -> incomingDocumentRepository.findById(dto.getDocumentId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(this::convertToDTO)
                .toList();

        final int start = (int) pageable.getOffset();
        final int end = Math.min((start + pageable.getPageSize()), documents.size());
        final List<IncomingDocumentDTO> pageContent = start < end ? documents.subList(start, end) : List.of();

        return new PageImpl<>(pageContent, pageable, documents.size());
    }

    /**
     * Add multiple attachments to an incoming document using the new
     * DocumentAttachmentService
     */
    @Transactional
    public List<DocumentAttachment> addMultipleAttachments(Long documentId, List<MultipartFile> files, User uploadedBy)
            throws IOException {
        return incomingDocumentRepository.findById(documentId)
                .map(document -> {
                    try {
                        return documentAttachmentService.addMultipleAttachments(document, files, uploadedBy);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to store multiple attachments", e);
                    }
                })
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + documentId));
    }

    /**
     * Get all attachments for an incoming document
     */
    public List<DocumentAttachment> getDocumentAttachments(Long documentId) {
        return documentAttachmentService.getAttachmentsByDocument(documentId);
    }

    /**
     * Delete a specific attachment
     */
    @Transactional
    public boolean deleteDocumentAttachment(Long attachmentId) throws IOException {
        return documentAttachmentService.deleteAttachment(attachmentId);
    }

    /**
     * Get attachment count and total size for a document
     */
    public AttachmentSummary getAttachmentSummary(Long documentId) {
        long count = documentAttachmentService.countAttachments(documentId);
        Long totalSize = documentAttachmentService.getTotalFileSize(documentId);
        return new AttachmentSummary(count, totalSize != null ? totalSize : 0L);
    }

    /**
     * Download a specific attachment by attachment ID
     */
    public ResponseEntity<Resource> downloadSpecificAttachment(Long documentId, Long attachmentId) throws IOException {
        return documentAttachmentService.downloadAttachment(attachmentId);
    }

    /**
     * Inner class for attachment summary
     */
    public static class AttachmentSummary {
        private final long count;
        private final long totalSize;

        public AttachmentSummary(long count, long totalSize) {
            this.count = count;
            this.totalSize = totalSize;
        }

        public long getCount() {
            return count;
        }

        public long getTotalSize() {
            return totalSize;
        }

        public String getFormattedSize() {
            if (totalSize < 1024)
                return totalSize + " B";
            if (totalSize < 1024 * 1024)
                return String.format("%.1f KB", totalSize / 1024.0);
            if (totalSize < 1024 * 1024 * 1024)
                return String.format("%.1f MB", totalSize / (1024.0 * 1024));
            return String.format("%.1f GB", totalSize / (1024.0 * 1024 * 1024));
        }
    }
}
package com.managementcontent.service;

import com.managementcontent.dto.FullOutgoingDocumentDTO;
import com.managementcontent.dto.OutgoingDocumentDTO;
import com.managementcontent.dto.DepartmentDTO;
import com.managementcontent.dto.UserDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.DocumentAttachment;
import com.managementcontent.model.OutgoingDocument;
import com.managementcontent.model.Role;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.DocumentTypeRepository;
import com.managementcontent.repository.OutgoingDocumentRepository;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.managementcontent.util.RoleGroupUtil;

import static com.managementcontent.util.RoleGroupUtil.isNhanVien;
import static java.util.spi.ToolProvider.findFirst;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutgoingDocumentService {

    private static final Logger logger = LoggerFactory.getLogger(OutgoingDocumentService.class);

    private final FileStorageService fileStorageService;
    private final OutgoingDocumentRepository outgoingDocumentRepository;
    private final UserRepository userRepository;
    private final DocumentRelationshipService documentRelationshipService;
    private final DocumentWorkflowService documentWorkflowService;
    private final DepartmentRepository departmentRepository;
    private final DocumentTypeRepository documentTypeRepository;
    private final DocumentAttachmentService documentAttachmentService;
    private final UserService userService;
    private final DepartmentService departmentService;

    public Page<OutgoingDocumentDTO> getAllOutgoingDocuments(Pageable pageable) {
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
                // Chỉ huy cục: Xem tất cả công văn
                return outgoingDocumentRepository.findAll(pageable)
                        .map(this::convertToDTO);

            case CHI_HUY_DON_VI:
                // Chỉ huy đơn vị: Xem công văn của phòng ban mình và các phòng ban cấp dưới
                if (currentUser.getDepartment() != null) {
                    return getAllDocumentsByDepartmentId(currentUser.getDepartment().getId(), pageable);
                } else {
                    // Nếu không có department, xem tất cả (fallback)
                    return outgoingDocumentRepository.findAll(pageable)
                            .map(this::convertToDTO);
                }

            case VAN_THU:
                // Văn thư: Xem tất cả công văn để quản lý
                return outgoingDocumentRepository.findAll(pageable)
                        .map(this::convertToDTO);

            case NHAN_VIEN:
                // Nhân viên/Trợ lý: Chỉ xem công văn do họ tạo hoặc được phân công
                List<OutgoingDocument> userDocs = outgoingDocumentRepository.findAll().stream()
                    .filter(doc -> {
                        // Check if created by user
                        boolean createdByUser = doc.getCreator() != null &&
                            doc.getCreator().getId().equals(currentUser.getId());
                        
                        // Check if assigned to user's department
                        boolean assignedToDept = currentUser.getDepartment() != null &&
                            ((doc.getDraftingDepartmentEntity() != null && 
                              doc.getDraftingDepartmentEntity().getId().equals(currentUser.getDepartment().getId())) ||
                             (doc.getAssignedDepartments() != null &&
                              doc.getAssignedDepartments().stream()
                                .anyMatch(ad -> ad.getDepartment().getId().equals(currentUser.getDepartment().getId()))));
                        
                        return createdByUser || assignedToDept;
                    })
                    .toList();

                // Create paginated result
                final int start = (int) pageable.getOffset();
                final int end = Math.min((start + pageable.getPageSize()), userDocs.size());
                final List<OutgoingDocument> pageContent = start < end ? userDocs.subList(start, end) : List.of();
                
                Page<OutgoingDocument> userPage = new PageImpl<>(pageContent, pageable, userDocs.size());
                return userPage.map(this::convertToDTO);

            default:
                // Fallback: trả về empty page
                return Page.empty(pageable);
        }
    }

    public Optional<OutgoingDocumentDTO> getOutgoingDocumentById(Long id) {
        return outgoingDocumentRepository.findById(id)
                .map(this::convertToDTO);
    }

    public Page<OutgoingDocumentDTO> searchOutgoingDocuments(String keyword, Pageable pageable) {
        return outgoingDocumentRepository.findByReferenceNumberContaining(keyword, pageable)
                .map(this::convertToDTO);
    }

    public Page<OutgoingDocumentDTO> findByDocumentType(String documentType, Pageable pageable) {
        return outgoingDocumentRepository.findByDocumentTypeContaining(documentType, pageable)
                .map(this::convertToDTO);
    }

    public Page<OutgoingDocumentDTO> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return outgoingDocumentRepository.findBySigningDateBetween(start, end, pageable)
                .map(this::convertToDTO);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByName(auth.getName()).orElse(null);
    }

    /**
     * Get all documents by department ID for CHI_HUY_DON_VI users
     */
    private Page<OutgoingDocumentDTO> getAllDocumentsByDepartmentId(Long departmentId, Pageable pageable) {
        List<OutgoingDocument> documents = outgoingDocumentRepository.findAll().stream()
            .filter(doc -> {
                // Check if created by department user
                boolean createdByDeptUser = doc.getCreator() != null && 
                    doc.getCreator().getDepartment() != null &&
                    doc.getCreator().getDepartment().getId().equals(departmentId);
                
                // Check if drafted by department  
                boolean draftedByDept = doc.getDraftingDepartmentEntity() != null &&
                    doc.getDraftingDepartmentEntity().getId().equals(departmentId);
                
                // Check if assigned to department
                boolean assignedToDept = doc.getAssignedDepartments() != null &&
                    doc.getAssignedDepartments().stream()
                        .anyMatch(ad -> ad.getDepartment().getId().equals(departmentId));
                
                return createdByDeptUser || draftedByDept || assignedToDept;
            })
            .toList();

        final int start = (int) pageable.getOffset();
        final int end = Math.min((start + pageable.getPageSize()), documents.size());
        final List<OutgoingDocument> pageContent = start < end ? documents.subList(start, end) : List.of();

        Page<OutgoingDocument> page = new PageImpl<>(pageContent, pageable, documents.size());
        return page.map(this::convertToDTO);
    }

    @Transactional
    public OutgoingDocumentDTO createOutgoingDocument(OutgoingDocumentDTO documentDTO) {
        OutgoingDocument document = getOutgoingDocument(documentDTO);
        System.out.println(1.1);
        // Set signer if provided
        if (documentDTO.getSignerId() != null) {
            userRepository.findById(documentDTO.getSignerId())
                    .ifPresent(document::setSigner);
        }
        System.out.println(1.2);
        // Set creator (usually the same as signer in outgoing documents)

        document.setCreator(getCurrentUser());
        System.out.println(1.3);
        document.setDraftingDepartment(getCurrentUser().getDepartment().getName());
        System.out.println(1.4);
        OutgoingDocument savedDocument = outgoingDocumentRepository.save(document);

        return convertToDTO(savedDocument);
    }

    private OutgoingDocument getOutgoingDocument(OutgoingDocumentDTO documentDTO) {
        OutgoingDocument document = new OutgoingDocument();
        document.setTitle(documentDTO.getTitle());
        // Xử lý documentType, khác với type trong Document cha
        if (documentDTO.getDocumentType() != null) {
            documentTypeRepository.findByName(documentDTO.getDocumentType())
                    .ifPresent(document::setDocumentType);
        } else {
            // Nếu không có documentTypeId, có thể tạo mới hoặc xử lý theo logic khác
            document.setDocumentType(null); // Hoặc xử lý theo yêu cầu
        }

        document.setDocumentNumber(documentDTO.getDocumentNumber());
        document.setSummary(documentDTO.getSummary());
        document.setReferenceNumber(documentDTO.getReferenceNumber());
        document.setSigningDate(documentDTO.getSigningDate());

        document.setRelatedDocuments(documentDTO.getRelatedDocuments());
        document.setStorageLocation(documentDTO.getStorageLocation());
        document.setDocumentVolume(documentDTO.getDocumentVolume());
        document.setEmailAddress(documentDTO.getEmailAddress());
        document.setReceivingDepartmentText(documentDTO.getReceivingDepartmentText());
        document.setType("outgoing_document");

        // Set internal document flag and status based on it
        if (documentDTO.getIsInternal() != null && documentDTO.getIsInternal()) {
            document.setIsInternal(true);
            // For internal documents, set status directly to PUBLISHED to skip approval
            // workflow
            document.setStatus(DocumentProcessingStatus.PUBLISHED);
        } else {
            document.setIsInternal(false);
            // Default status for external documents remains DRAFT
            document.setStatus(DocumentProcessingStatus.DRAFT);
        }

        // Ánh xạ các trường mới từ DTO
        // Đơn vị soạn thảo entity
        if (documentDTO.getDraftingDepartmentEntityId() != null) {
            departmentRepository.findById(documentDTO.getDraftingDepartmentEntityId())
                    .ifPresent(document::setDraftingDepartmentEntity);
        }

        // Độ mật
        if (documentDTO.getSecurityLevel() != null) {
            document.setSecurityLevel(
                    com.managementcontent.model.enums.SecurityLevel.fromCode(documentDTO.getSecurityLevel()));
        }

        // Người ký công văn
        if (documentDTO.getDocumentSignerId() != null) {
            userRepository.findById(documentDTO.getDocumentSignerId())
                    .ifPresent(document::setDocumentSigner);
        }

        // Chuyển bằng điện mật
        if (documentDTO.getIsSecureTransmission() != null) {
            document.setIsSecureTransmission(documentDTO.getIsSecureTransmission());
        }

        // Hạn xử lý
        if (documentDTO.getProcessingDeadline() != null) {
            document.setProcessingDeadline(documentDTO.getProcessingDeadline());
        }

        // Cơ quan ban hành
        if (documentDTO.getIssuingAgency() != null) {
            document.setIssuingAgency(documentDTO.getIssuingAgency());
        }

        // Khối phát hành
        if (documentDTO.getDistributionType() != null) {
            document.setDistributionType(
                    com.managementcontent.model.enums.DistributionType.fromCode(documentDTO.getDistributionType()));
        }

        // Số bản
        if (documentDTO.getNumberOfCopies() != null) {
            document.setNumberOfCopies(documentDTO.getNumberOfCopies());
        }

        // Số tờ
        if (documentDTO.getNumberOfPages() != null) {
            document.setNumberOfPages(documentDTO.getNumberOfPages());
        }

        // Không gửi bản giấy
        if (documentDTO.getNoPaperCopy() != null) {
            document.setNoPaperCopy(documentDTO.getNoPaperCopy());
        }

        return document;
    }

    @Transactional
    public Optional<OutgoingDocumentDTO> updateOutgoingDocument(Long id, OutgoingDocumentDTO documentDTO) {
        return outgoingDocumentRepository.findById(id)
                .map(document -> {
                    if (documentDTO.getTitle() != null) {
                        document.setTitle(documentDTO.getTitle());
                    }
                    // Xử lý documentType, khác với type trong Document cha
                    if (documentDTO.getDocumentType() != null) {
                        documentTypeRepository.findByName(documentDTO.getDocumentType())
                                .ifPresent(document::setDocumentType);
                    } else {
                        // Nếu không có documentTypeId, có thể tạo mới hoặc xử lý theo logic khác
                        document.setDocumentType(null); // Hoặc xử lý theo yêu cầu
                    }
                    if (documentDTO.getDocumentNumber() != null) {
                        document.setDocumentNumber(documentDTO.getDocumentNumber());
                    }
                    if (documentDTO.getReferenceNumber() != null) {
                        document.setReferenceNumber(documentDTO.getReferenceNumber());
                    }
                    if (documentDTO.getSummary() != null) {
                        document.setSummary(documentDTO.getSummary());
                    }

                    if (documentDTO.getSigningDate() != null) {
                        document.setSigningDate(documentDTO.getSigningDate());
                    }
                    if (documentDTO.getDraftingDepartment() != null) {
                        document.setDraftingDepartment(documentDTO.getDraftingDepartment());
                    }
                    if (documentDTO.getRelatedDocuments() != null) {
                        document.setRelatedDocuments(documentDTO.getRelatedDocuments());
                    }
                    if (documentDTO.getStorageLocation() != null) {
                        document.setStorageLocation(documentDTO.getStorageLocation());
                    }
                    if (documentDTO.getDocumentVolume() != null) {
                        document.setDocumentVolume(documentDTO.getDocumentVolume());
                    }
                    if (documentDTO.getEmailAddress() != null) {
                        document.setEmailAddress(documentDTO.getEmailAddress());
                    }
                    if (documentDTO.getReceivingDepartmentText() != null) {
                        document.setReceivingDepartmentText(documentDTO.getReceivingDepartmentText());
                    }

                    // Update signer if provided
                    if (documentDTO.getSignerId() != null) {
                        userRepository.findById(documentDTO.getSignerId())
                                .ifPresent(document::setSigner);
                    }

                    // Cập nhật các trường mới
                    // Đơn vị soạn thảo entity
                    if (documentDTO.getDraftingDepartmentEntityId() != null) {
                        departmentRepository.findById(documentDTO.getDraftingDepartmentEntityId())
                                .ifPresent(document::setDraftingDepartmentEntity);
                    }

                    // Độ mật
                    if (documentDTO.getSecurityLevel() != null) {
                        document.setSecurityLevel(
                                com.managementcontent.model.enums.SecurityLevel
                                        .fromCode(documentDTO.getSecurityLevel()));
                    }

                    // Người ký công văn
                    if (documentDTO.getDocumentSignerId() != null) {
                        userRepository.findById(documentDTO.getDocumentSignerId())
                                .ifPresent(document::setDocumentSigner);
                    }

                    // Chuyển bằng điện mật
                    if (documentDTO.getIsSecureTransmission() != null) {
                        document.setIsSecureTransmission(documentDTO.getIsSecureTransmission());
                    }

                    // Hạn xử lý
                    if (documentDTO.getProcessingDeadline() != null) {
                        document.setProcessingDeadline(documentDTO.getProcessingDeadline());
                    }

                    // Cơ quan ban hành
                    if (documentDTO.getIssuingAgency() != null) {
                        document.setIssuingAgency(documentDTO.getIssuingAgency());
                    }

                    // Khối phát hành
                    if (documentDTO.getDistributionType() != null) {
                        document.setDistributionType(
                                com.managementcontent.model.enums.DistributionType
                                        .fromCode(documentDTO.getDistributionType()));
                    }

                    // Số bản
                    if (documentDTO.getNumberOfCopies() != null) {
                        document.setNumberOfCopies(documentDTO.getNumberOfCopies());
                    }

                    // Số tờ
                    if (documentDTO.getNumberOfPages() != null) {
                        document.setNumberOfPages(documentDTO.getNumberOfPages());
                    }

                    // Không gửi bản giấy
                    if (documentDTO.getNoPaperCopy() != null) {
                        document.setNoPaperCopy(documentDTO.getNoPaperCopy());
                    }

                    OutgoingDocument updatedDocument = outgoingDocumentRepository.save(document);

                    return convertToDTO(updatedDocument);
                });
    }

    @Transactional
    public boolean deleteOutgoingDocument(Long id) {
        if (!outgoingDocumentRepository.existsById(id)) {
            return false;
        }
        outgoingDocumentRepository.deleteById(id);
        return true;
    }

    private OutgoingDocumentDTO convertToDTO(OutgoingDocument document) {
        OutgoingDocumentDTO dto = new OutgoingDocumentDTO();
        dto.setId(document.getId());
        dto.setTitle(document.getTitle());

        // Add null check before accessing DocumentType properties
        if (document.getDocumentType() != null) {
            dto.setDocumentType(document.getDocumentType().getName());
        } else {
            dto.setDocumentType(null); // or set a default value like "" if needed
        }

        dto.setDocumentNumber(document.getDocumentNumber());
        dto.setReferenceNumber(document.getReferenceNumber());
        dto.setSigningDate(document.getSigningDate());
        dto.setDraftingDepartment(document.getDraftingDepartment());
        System.out.println("Drafting Department: " + document.getDraftingDepartment());
        Department department = departmentRepository.findByName(document.getDraftingDepartment()).orElse(null);
        System.out.println("Drafting Department 1: " + document.getDraftingDepartment());
        if (department != null) {
            dto.setDraftingDepartmentId(department.getId());
        }
        dto.setRelatedDocuments(document.getRelatedDocuments());
        dto.setStorageLocation(document.getStorageLocation());
        dto.setDocumentVolume(document.getDocumentVolume());
        dto.setEmailAddress(document.getEmailAddress());
        dto.setReceivingDepartmentText(document.getReceivingDepartmentText());

        // Set internal document flag
        dto.setIsInternal(document.getIsInternal());

        dto.setCreated(document.getCreated());
        dto.setChanged(document.getChanged());
        dto.setCreator(document.getCreator());
        dto.setAttachmentFilename(document.getAttachmentFilename());
        System.out.println("Attachment filename: " + document.getAttachmentFilename());

        // Ánh xạ các trường mới
        // Đơn vị soạn thảo entity
        if (document.getDraftingDepartmentEntity() != null) {
            dto.setDraftingDepartmentEntity(departmentService.convertToDTO(document.getDraftingDepartmentEntity()));
            dto.setDraftingDepartmentEntityId(document.getDraftingDepartmentEntity().getId());
        }

        // Độ mật
        if (document.getSecurityLevel() != null) {
            dto.setSecurityLevel(document.getSecurityLevel().getCode());
            dto.setSecurityLevelDisplayName(document.getSecurityLevel().getDisplayName());
        }

        // Người ký công văn
        if (document.getDocumentSigner() != null) {
            dto.setDocumentSigner(userService.convertToDTO(document.getDocumentSigner()));
            dto.setDocumentSignerId(document.getDocumentSigner().getId());
        }

        // Chuyển bằng điện mật
        dto.setIsSecureTransmission(document.getIsSecureTransmission());

        // Hạn xử lý
        dto.setProcessingDeadline(document.getProcessingDeadline());

        // Cơ quan ban hành
        dto.setIssuingAgency(document.getIssuingAgency());

        // Khối phát hành
        if (document.getDistributionType() != null) {
            dto.setDistributionType(document.getDistributionType().getCode());
            dto.setDistributionTypeDisplayName(document.getDistributionType().getDisplayName());
        }

        // Số bản
        dto.setNumberOfCopies(document.getNumberOfCopies());

        // Số tờ
        dto.setNumberOfPages(document.getNumberOfPages());

        // Không gửi bản giấy
        dto.setNoPaperCopy(document.getNoPaperCopy());
        // Map signer
        User signer = document.getSigner();
        if (signer != null) {
            dto.setSignerId(signer.getId());
            dto.setSignerName(signer.getFullName());
            dto.setSignerPosition(signer.getRoles().stream()
                    .findFirst()
                    .map(Role::getDisplayName)

                    .orElse(null));
        }
        dto.setSummary(document.getSummary());
        // Mapping trạng thái
        if (document.getStatus() != null) {
            dto.setStatus(document.getStatus().getCode());
            dto.setStatusDisplayName(document.getStatus().getDisplayName());

            // Set tracking status based on current processing status
            setTrackingStatus(dto, document.getStatus());
        }
        return dto;
    }

    /**
     * Sets the tracking status on the DTO based on the document's processing status
     * 
     * @param dto    The document DTO to update
     * @param status The document's current processing status
     */
    private void setTrackingStatus(OutgoingDocumentDTO dto, DocumentProcessingStatus status) {
        if (status == null) {
            dto.setTrackingStatus(DocumentProcessingStatus.NOT_PROCESSED.getCode());
            dto.setTrackingStatusDisplayName(DocumentProcessingStatus.NOT_PROCESSED.getDisplayName());
            return;
        }

        // Set tracking status based on processing status
        switch (status) {
            case DRAFT:
            case FORMAT_CORRECTION:
                // Document is not yet being processed
                dto.setTrackingStatus(DocumentProcessingStatus.NOT_PROCESSED.getCode());
                dto.setTrackingStatusDisplayName(DocumentProcessingStatus.NOT_PROCESSED.getDisplayName());
                break;

            case PUBLISHED:
            case COMPLETED:
            case ARCHIVED:
                // Document has been fully processed
                dto.setTrackingStatus(DocumentProcessingStatus.PROCESSED.getCode());
                dto.setTrackingStatusDisplayName(DocumentProcessingStatus.PROCESSED.getDisplayName());
                break;

            default:
                // Any other status indicates document is in the process of being handled
                dto.setTrackingStatus(DocumentProcessingStatus.IN_PROCESS.getCode());
                dto.setTrackingStatusDisplayName(DocumentProcessingStatus.IN_PROCESS.getDisplayName());
                break;
        }
    }

    // find by related documents
    public List<OutgoingDocumentDTO> findByRelatedDocuments(String relatedDocumentId) {
        return outgoingDocumentRepository.findByRelatedDocuments(relatedDocumentId).stream()
                .map(this::convertToDTO).toList();
    }

    // Add these methods
    @Transactional
    public Optional<OutgoingDocumentDTO> addAttachment(Long id, MultipartFile file) throws IOException {
        return outgoingDocumentRepository.findById(id)
                .map(document -> {
                    try {
                        // Delete old file if it exists
                        if (document.getAttachmentFilename() != null && !document.getAttachmentFilename().isEmpty()) {
                            fileStorageService.deleteFile(document.getAttachmentFilename());
                        }

                        // Store new file
                        String filename = fileStorageService.storeFile(file, document);
                        document.setAttachmentFilename(filename);

                        OutgoingDocument updatedDocument = outgoingDocumentRepository.save(document);
                        return convertToDTO(updatedDocument);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to store file", e);
                    }
                });
    }

    public ResponseEntity<Resource> getAttachment(Long id) throws IOException {
        Optional<OutgoingDocument> documentOpt = outgoingDocumentRepository.findById(id);
        if (documentOpt.isPresent() && documentOpt.get().getAttachmentFilename() != null
                && !documentOpt.get().getAttachmentFilename().isEmpty()) {
            OutgoingDocument document = documentOpt.get();
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
     * Deletes an attachment from an outgoing document
     * 
     * @param id ID of the document
     * @return true if attachment was deleted, false if document or attachment was
     *         not found
     * @throws IOException if there was an error deleting the file
     */
    @Transactional
    public boolean deleteAttachment(Long id) throws IOException {
        return outgoingDocumentRepository.findById(id)
                .map(document -> {
                    if (document.getAttachmentFilename() != null && !document.getAttachmentFilename().isEmpty()) {
                        try {
                            // Delete the file from storage
                            fileStorageService.deleteFile(document.getAttachmentFilename());

                            // Clear attachment reference in document
                            document.setAttachmentFilename(null);
                            outgoingDocumentRepository.save(document);

                            return true;
                        } catch (IOException e) {
                            throw new RuntimeException("Failed to delete attachment", e);
                        }
                    }
                    return false;
                })
                .orElse(false);
    }

    /**
     * Add multiple attachments to an outgoing document using the new
     * DocumentAttachmentService
     */
    @Transactional
    public List<DocumentAttachment> addMultipleAttachments(Long documentId, List<MultipartFile> files, User uploadedBy)
            throws IOException {
        return outgoingDocumentRepository.findById(documentId)
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
     * Get all attachments for an outgoing document
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
     * Download a specific attachment by attachment ID
     */
    public ResponseEntity<Resource> downloadSpecificAttachment(Long documentId, Long attachmentId) throws IOException {
        return documentAttachmentService.downloadAttachment(attachmentId);
    }

    // Methods that return raw entities for the unified document controller
    public Page<OutgoingDocument> getAllOutgoingDocumentsRaw(Pageable pageable) {
        return outgoingDocumentRepository.findAll(pageable);
    }

    public Optional<OutgoingDocument> findOutgoingDocumentById(Long id) {
        return outgoingDocumentRepository.findById(id);
    }

    public Page<OutgoingDocument> searchOutgoingDocumentsRaw(String keyword, Pageable pageable) {
        return outgoingDocumentRepository.searchByKeyword(keyword, pageable);
    }

    public Page<OutgoingDocument> getRecentOutgoingDocuments(Pageable pageable) {
        return outgoingDocumentRepository.findAllByOrderByCreatedDesc(pageable);
    }

    /**
     * Find outgoing documents by date range (raw entities)
     * 
     * @param start    Start date (inclusive)
     * @param end      End date (inclusive)
     * @param pageable Pagination parameters
     * @return Page of OutgoingDocument entities
     */
    public Page<OutgoingDocument> findOutgoingDocumentsByDateRange(LocalDateTime start, LocalDateTime end,
            Pageable pageable) {
        return outgoingDocumentRepository.findBySigningDateBetween(start, end, pageable);
    }

    /**
     * Create a response document for an incoming document
     * Handles all operations in a single transaction to prevent rollback issues
     * 
     * @param incomingDocId - ID of the incoming document being responded to
     * @param data          - Full outgoing document data
     * @param file          - Optional attachment file
     * @param currentUser   - Current authenticated user
     * @param uploadInfo    - Map to store upload information (will be populated by
     *                      this method)
     * @return Created OutgoingDocumentDTO
     * @throws IOException If file upload fails
     */
    @Transactional
    public OutgoingDocumentDTO createResponseDocument(
            Long incomingDocId,
            FullOutgoingDocumentDTO data,
            MultipartFile file,
            User currentUser,
            Map<String, Object> uploadInfo) throws IOException {
        // 1. Set up relationship with incoming document
        data.getDocument().setRelatedDocuments(incomingDocId.toString());
        System.out.println("1 ");
        // 2. Create the outgoing document
        OutgoingDocumentDTO createdDocument = createOutgoingDocument(data.getDocument());
        System.out.println(2);
        // 3. Create relationship between incoming and outgoing documents
        documentRelationshipService.createRelationship(incomingDocId, createdDocument.getId(), "RESPONSE");
        System.out.println(3);
        // 4. Register the document with workflow (set initial status)
        documentWorkflowService.registerOutgoingDocument(
                createdDocument.getId(),
                currentUser,
                data.getWorkflow() != null && data.getWorkflow().getComments() != null
                        ? data.getWorkflow().getComments()
                        : "Tạo công văn trả lời cho công văn đến #" + incomingDocId);
        System.out.println(4);
        // 5. Upload attachment if provided
        if (file != null) {
            List<String> uploadedFiles = new ArrayList<>();
            List<String> failedFiles = new ArrayList<>();

            try {
                addAttachment(createdDocument.getId(), file);
                uploadedFiles.add(file.getOriginalFilename());
            } catch (Exception e) {
                failedFiles.add(file.getOriginalFilename() + ": " + e.getMessage());
                // Log the error but don't throw exception to prevent transaction rollback
                logger.error("Failed to upload attachment: {}", e.getMessage());
            }

            uploadInfo.put("uploadedFiles", uploadedFiles);
            uploadInfo.put("failedFiles", failedFiles);
        }

        // 6. Mark incoming document as responded
        documentWorkflowService.updateIncomingDocumentAsResponded(
                incomingDocId,
                currentUser,
                "Đã trả lời bằng công văn đi #" + createdDocument.getDocumentNumber());

        return createdDocument;
    }

    /**
     * Create a response document for an incoming document with multiple attachments
     * Handles all operations in a single transaction to prevent rollback issues
     * 
     * @param incomingDocId - ID of the incoming document being responded to
     * @param data          - Full outgoing document data
     * @param files         - Optional multiple attachment files
     * @param currentUser   - Current authenticated user
     * @param uploadInfo    - Map to store upload information (will be populated by
     *                      this method)
     * @return Created OutgoingDocumentDTO
     * @throws IOException If file upload fails
     */
    @Transactional
    public OutgoingDocumentDTO createResponseDocumentWithMultipleAttachments(
            Long incomingDocId,
            FullOutgoingDocumentDTO data,
            List<MultipartFile> files,
            User currentUser,
            Map<String, Object> uploadInfo) throws IOException {

        // 1. Set up relationship with incoming document
        data.getDocument().setRelatedDocuments(incomingDocId.toString());
        System.out.println("1 - Setting up relationship");

        // 2. Create the outgoing document
        OutgoingDocumentDTO createdDocument = createOutgoingDocument(data.getDocument());
        System.out.println("2 - Document created with ID: " + createdDocument.getId());

        // 3. Create relationship between incoming and outgoing documents
        documentRelationshipService.createRelationship(incomingDocId, createdDocument.getId(), "RESPONSE");
        System.out.println("3 - Relationship created");

        // 4. Register the document with workflow (set initial status)
        documentWorkflowService.registerOutgoingDocument(
                createdDocument.getId(),
                currentUser,
                data.getWorkflow() != null && data.getWorkflow().getComments() != null
                        ? data.getWorkflow().getComments()
                        : "Tạo công văn trả lời cho công văn đến #" + incomingDocId);
        System.out.println("4 - Workflow registered");

        // 5. Upload multiple attachments if provided
        List<String> uploadedFiles = new ArrayList<>();
        List<String> failedFiles = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            try {
                List<DocumentAttachment> attachments = addMultipleAttachments(createdDocument.getId(), files,
                        currentUser);
                for (DocumentAttachment attachment : attachments) {
                    uploadedFiles.add(attachment.getOriginalFilename());
                    System.out.println("5 - Uploaded file: " + attachment.getOriginalFilename());
                }
            } catch (Exception e) {
                // If batch upload fails, try individual uploads
                for (MultipartFile file : files) {
                    if (file != null && !file.isEmpty()) {
                        try {
                            addAttachment(createdDocument.getId(), file);
                            uploadedFiles.add(file.getOriginalFilename());
                            System.out.println("5 - Uploaded file (fallback): " + file.getOriginalFilename());
                        } catch (Exception ex) {
                            failedFiles.add(file.getOriginalFilename() + ": " + ex.getMessage());
                            logger.error("Failed to upload attachment {}: {}", file.getOriginalFilename(),
                                    ex.getMessage());
                        }
                    }
                }
            }
        }

        uploadInfo.put("uploadedFiles", uploadedFiles);
        uploadInfo.put("failedFiles", failedFiles);
        uploadInfo.put("totalFiles", files != null ? files.size() : 0);
        uploadInfo.put("successfulUploads", uploadedFiles.size());
        uploadInfo.put("failedUploads", failedFiles.size());

        // 6. Mark incoming document as responded
        documentWorkflowService.updateIncomingDocumentAsResponded(
                incomingDocId,
                currentUser,
                "Đã trả lời bằng công văn đi #" + createdDocument.getDocumentNumber());
        System.out.println("6 - Incoming document marked as responded");

        return createdDocument;
    }

    /**
     * Cập nhật công văn đi kèm theo quy trình workflow
     * Phương thức này bao gồm:
     * 1. Cập nhật thông tin công văn
     * 2. Cập nhật file đính kèm (nếu có)
     * 3. Thêm bản ghi lịch sử vào workflow
     * 
     * @param documentId      ID của công văn cần cập nhật
     * @param fullDocumentDTO Dữ liệu cập nhật cho công văn
     * @param file            File đính kèm mới (nếu có)
     * @param currentUser     Người dùng hiện tại thực hiện việc cập nhật
     * @return Map chứa thông tin về kết quả cập nhật
     * @throws IOException Nếu có lỗi khi xử lý file
     */
    @Transactional
    public Map<String, Object> updateOutgoingDocumentWorkflow(
            Long documentId,
            FullOutgoingDocumentDTO fullDocumentDTO,
            MultipartFile file,
            User currentUser) throws IOException {

        // Kiểm tra công văn tồn tại
        Optional<OutgoingDocument> outgoingDocOpt = findOutgoingDocumentById(documentId);
        if (outgoingDocOpt.isEmpty()) {
            throw new RuntimeException("Document not found with ID: " + documentId);
        }

        OutgoingDocument outgoingDoc = outgoingDocOpt.get();
        String originalDocumentNumber = outgoingDoc.getDocumentNumber();

        // Cập nhật thông tin công văn
        Optional<OutgoingDocumentDTO> updatedDocument = updateOutgoingDocument(
                documentId,
                fullDocumentDTO.getDocument());

        if (updatedDocument.isEmpty()) {
            throw new RuntimeException("Failed to update document with ID: " + documentId);
        }

        // Tạo nội dung chi tiết về việc cập nhật
        StringBuilder detailedComments = new StringBuilder();
        detailedComments.append("công văn số ").append(originalDocumentNumber).append(" đã được chỉnh sửa");

        // Thêm thông tin người chỉnh sửa
        String editorInfo = " bởi " + currentUser.getFullName();
        if (currentUser.getDepartment() != null) {
            editorInfo += " (" + currentUser.getDepartment().getName() + ")";
        }
        detailedComments.append(editorInfo).append(".");

        // Thêm nội dung chỉnh sửa nếu có
        if (fullDocumentDTO.getWorkflow() != null &&
                fullDocumentDTO.getWorkflow().getComments() != null &&
                !fullDocumentDTO.getWorkflow().getComments().isEmpty()) {
            detailedComments.append(" Nội dung chỉnh sửa: ").append(fullDocumentDTO.getWorkflow().getComments());
        }

        // Cập nhật file đính kèm nếu có
        if (file != null && !file.isEmpty()) {
            try {
                // Cập nhật file đính kèm
                addAttachment(documentId, file);

                // Thêm thông tin về việc cập nhật file vào ghi chú
                detailedComments.append(". Đã cập nhật file đính kèm: ")
                        .append(file.getOriginalFilename());

            } catch (IOException e) {
                logger.error("Error updating attachment for document {}: {}", documentId, e.getMessage());
                throw e;
            }
        }

        // Thêm vào lịch sử công văn
        documentWorkflowService.addDocumentHistoryEntry(
                documentId,
                "UPDATE",
                currentUser,
                detailedComments.toString());
        boolean isNhanvien = currentUser.getRoles().stream().anyMatch(
                role -> isNhanVien(role.getName())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("documentId", documentId);
        response.put("document", updatedDocument.get());
        response.put("message", "Document successfully updated");

        return response;
    }
}
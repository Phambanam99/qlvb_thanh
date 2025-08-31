package com.managementcontent.service;

import com.managementcontent.dto.DocumentAttachmentDTO;
import com.managementcontent.dto.DocumentCommentDTO;
import com.managementcontent.dto.UnifiedDocumentDTO;
import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentHistory;
import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.OutgoingDocument;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.DocumentHistoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for mapping between document entity models and DTOs
 */
@Service
public class DocumentMapperService {

    private final DocumentHistoryRepository documentHistoryRepository;
    private final FileStorageService fileStorageService;

    public DocumentMapperService(DocumentHistoryRepository documentHistoryRepository,
            FileStorageService fileStorageService) {
        this.documentHistoryRepository = documentHistoryRepository;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Maps any Document to a unified DTO format
     */
    public UnifiedDocumentDTO mapToUnifiedDTO(Document document) {
        if (document instanceof IncomingDocument) {
            return mapIncomingDocumentToDTO((IncomingDocument) document);
        } else if (document instanceof OutgoingDocument) {
            return mapOutgoingDocumentToDTO((OutgoingDocument) document);
        } else {
            throw new IllegalArgumentException("Unsupported document type: " + document.getClass().getName());
        }
    }

    /**
     * Map an incoming document to unified format
     */
    public UnifiedDocumentDTO mapIncomingDocumentToDTO(IncomingDocument document) {
        UnifiedDocumentDTO dto = new UnifiedDocumentDTO();

        // Map common fields
        mapCommonFields(document, dto);

        // Map incoming-specific fields
        dto.setIssuingAgency(document.getIssuingAuthority());
        dto.setUrgencyLevel(document.getUrgencyLevel());

        return dto;
    }

    /**
     * Map an outgoing document to unified format
     */
    public UnifiedDocumentDTO mapOutgoingDocumentToDTO(OutgoingDocument document) {
        UnifiedDocumentDTO dto = new UnifiedDocumentDTO();

        // Map common fields
        mapCommonFields(document, dto);

        // Map outgoing-specific fields
        if (document.getSigner() != null) {
            dto.setIssuingAgency(document.getSigner().getName());
        }

        return dto;
    }

    /**
     * Map common document fields to DTO
     */
    private void mapCommonFields(Document document, UnifiedDocumentDTO dto) {
        dto.setId(document.getId());
        dto.setSubject(document.getTitle());

        // Handle document number
        if (document.getDocumentNumber() != null) {
            dto.setNumber(document.getDocumentNumber().toString());
        }

        // Handle reference number
        if (document.getReferenceNumber() != null) {
            dto.setReferenceNumber(document.getReferenceNumber());
        }

        // Map dates
        if (document.getSigningDate() != null) {
            dto.setReferenceDate(document.getSigningDate().toLocalDate().toString());
        }
        if (document.getCreated() != null) {
            dto.setReceivedDate(document.getCreated().toLocalDate().toString());
            dto.setReceivedTime(document.getCreated().toLocalTime().toString());
        }

        // Map status
        mapDocumentStatus(document, dto);

        // Map document type
        mapDocumentType(document, dto);

        // Map attachments - fixing isEmpty() method call on String
        dto.setHasAttachment(
                document.getAttachmentFilename() != null && !document.getAttachmentFilename().trim().isEmpty());
        if (dto.isHasAttachment()) {
            // Map attachment details if needed
            mapAttachments(document, dto);
        }

        // Map assigned users and comments
        mapAssignedUsers(document, dto);
        mapDocumentComments(document, dto);
    }

    /**
     * Map document type information to DTO
     */
    private void mapDocumentType(Document document, UnifiedDocumentDTO dto) {
        if (document.getDocumentType() != null) {
            dto.setDocumentTypeId(document.getDocumentType().getId());
            dto.setDocumentTypeName(document.getDocumentType().getName());
        }
    }

    /**
     * Map document status to frontend format
     */
    private void mapDocumentStatus(Document document, UnifiedDocumentDTO dto) {
        if (document.getStatus() != null) {
            DocumentProcessingStatus status = document.getStatus();
            switch (status) {
                case DRAFT:
                    dto.setStatus("draft");
                    break;
                case REGISTERED:
                case DISTRIBUTED:
                    dto.setStatus("waiting");
                    break;
                case DEPT_ASSIGNED:
                case SPECIALIST_PROCESSING:
                case SPECIALIST_SUBMITTED:
                case LEADER_REVIEWING:
                case LEADER_COMMENTED:
                case HEADER_DEPARTMENT_REVIEWING:
                case HEADER_DEPARTMENT_COMMENTED:
                    dto.setStatus("in-progress");
                    break;
                case LEADER_APPROVED:
                case HEADER_DEPARTMENT_APPROVED:
                case COMPLETED:
                    dto.setStatus("processed");
                    break;
                case PUBLISHED:
                    dto.setStatus("published");
                    break;
                default:
                    dto.setStatus("waiting");
            }
        }
    }

    private void mapAttachments(Document document, UnifiedDocumentDTO dto) {
        List<DocumentAttachmentDTO> attachments = new ArrayList<>();

        // Fixed String check
        if (document.getAttachmentFilename() != null && !document.getAttachmentFilename().trim().isEmpty()) {
            DocumentAttachmentDTO attachment = new DocumentAttachmentDTO();
            attachment.setId(document.getId()); // Using document ID as attachment ID for simplicity

            // Extract filename from path
            String path = document.getAttachmentFilename();
            String name = path.substring(path.lastIndexOf('/') + 1);
            attachment.setName(name);

            // Other fields would require additional metadata
            attachment.setUploadDate(document.getChanged() != null ? document.getChanged().toLocalDate().toString()
                    : LocalDateTime.now().toLocalDate().toString());

            if (document.getCreator() != null) {
                attachment.setUploadedBy(document.getCreator().getName());
            }

            attachments.add(attachment);
        }

        dto.setAttachments(attachments);
    }

    private void mapAssignedUsers(Document document, UnifiedDocumentDTO dto) {
        // Fixing the repository method call
        List<DocumentHistory> assignments = documentHistoryRepository
                .findByDocumentAndActionOrderByTimestampDesc(document, "ASSIGNMENT");
        if (!assignments.isEmpty()) {
            List<String> assignedUsers = assignments.stream()
                    .filter(history -> history.getAssignedTo() != null)
                    .map(history -> history.getAssignedTo().getName())
                    .distinct()
                    .collect(Collectors.toList());
            dto.setAssignedUsers(assignedUsers);
        }
    }

    private void mapDocumentComments(Document document, UnifiedDocumentDTO dto) {
        List<DocumentHistory> history = documentHistoryRepository.findByDocumentOrderByTimestampDesc(document);
        if (!history.isEmpty()) {
            List<DocumentCommentDTO> comments = history.stream()
                    .filter(h -> h.getComments() != null && !h.getComments().isEmpty())
                    .map(this::mapHistoryToCommentDTO)
                    .collect(Collectors.toList());
            dto.setComments(comments);
        }
    }

    private DocumentCommentDTO mapHistoryToCommentDTO(DocumentHistory history) {
        DocumentCommentDTO comment = new DocumentCommentDTO();
        comment.setId(history.getId());

        // if (history.getActor() != null) {
        // comment.setUserId(history.getActor().getId());
        // comment.setUserName(history.getActor().getName());
        // }

        comment.setCreated(history.getTimestamp());
        comment.setContent(history.getComments());

        // Determine comment type
        determineCommentType(history, comment);

        return comment;
    }

    /**
     * Determine the type of comment based on the history action
     * 
     * @param history The document history entry
     * @param comment The comment DTO to update
     */
    private void determineCommentType(DocumentHistory history, DocumentCommentDTO comment) {
        String action = history.getAction();
        if (action == null) {
            comment.setType("comment");
            return;
        }

        switch (action) {
            case "LEADER_COMMENT":
            case "HEADER_DEPARTMENT_COMMENTED":
                comment.setType("feedback");
                break;
            case "ASSIGNMENT":
                comment.setType("instruction");
                break;
            case "LEADER_APPROVED":
            case "HEADER_DEPARTMENT_APPROVED":
                comment.setType("approval");
                break;
            case "DOCUMENT_TYPE_CHANGE":
                comment.setType("update");
                break;
            default:
                comment.setType("comment");
        }
    }
}
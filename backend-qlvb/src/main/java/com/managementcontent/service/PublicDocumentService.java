package com.managementcontent.service;

import com.managementcontent.dto.PublicDocumentDTO;
import com.managementcontent.dto.PublicDocumentDetailDTO;
import com.managementcontent.model.DocumentAttachment;
import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentCategory;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicDocumentService {
    private final DocumentRepository<Document> documentRepository;
    private final DocumentAttachmentService documentAttachmentService;

    public Page<PublicDocumentDTO> listPublic(String q, Pageable pageable) {
        Page<Document> page = (q == null || q.isBlank())
                ? documentRepository.findByIsPublicTrue(pageable)
                : documentRepository.findByIsPublicTrueAndTitleContainingIgnoreCase(q, pageable);
        return page.map(this::toDto);
    }

    public Page<PublicDocumentDTO> searchPublic(String q, String issuingAgency, Integer year, Pageable pageable) {
        java.time.LocalDateTime start = null;
        java.time.LocalDateTime end = null;
        if (year != null) {
            start = java.time.LocalDateTime.of(year, 1, 1, 0, 0);
            end = java.time.LocalDateTime.of(year, 12, 31, 23, 59, 59);
        }
        Page<Document> page = documentRepository.searchPublic(
                (q != null && !q.isBlank()) ? q : null,
                (issuingAgency != null && !issuingAgency.isBlank()) ? issuingAgency : null,
                start,
                end,
                pageable);
        return page.map(this::toDto);
    }

    public Page<PublicDocumentDTO> listByCategory(Long categoryId, Pageable pageable) {
        return documentRepository.findPublicByCategoryId(categoryId, pageable).map(this::toDto);
    }

    public Page<PublicDocumentDTO> searchByCategory(Long categoryId, String q, String issuingAgency, Integer year,
            Pageable pageable) {
        java.time.LocalDateTime start = null;
        java.time.LocalDateTime end = null;
        if (year != null) {
            start = java.time.LocalDateTime.of(year, 1, 1, 0, 0);
            end = java.time.LocalDateTime.of(year, 12, 31, 23, 59, 59);
        }
        return documentRepository.searchPublicByCategory(
                categoryId,
                (q != null && !q.isBlank()) ? q : null,
                (issuingAgency != null && !issuingAgency.isBlank()) ? issuingAgency : null,
                start,
                end,
                pageable).map(this::toDto);
    }

    public Document publish(Long id) {
        Document d = documentRepository.findById(id).orElseThrow();
        d.setIsPublic(true);
        d.setPublishedAt(LocalDateTime.now());
        d.setStatus(DocumentProcessingStatus.PUBLISHED);
        return documentRepository.save(d);
    }

    public PublicDocumentDetailDTO detail(Long id) {
        Document d = documentRepository.findById(id).orElseThrow();
        List<String> categoryNames = (d.getCategories() == null) ? List.of()
                : d.getCategories().stream()
                        .map(DocumentCategory::getName)
                        .filter(n -> n != null && !n.isBlank())
                        .collect(Collectors.toList());
        PublicDocumentDetailDTO.PublicDocumentDetailDTOBuilder builder = PublicDocumentDetailDTO.builder()
                .id(d.getId())
                .title(d.getTitle())
                .type(d.getType())
                .documentNumber(d.getDocumentNumber())
                .issuingAgency(d.getIssuingAgency())
                .uploaderName(d.getUploaderName())
                .downloadCount(d.getDownloadCount())
                .publishedAt(d.getPublishedAt())
                .isPublic(Boolean.TRUE.equals(d.getIsPublic()))
                .categoryNames(categoryNames);
        // Include attachments for public detail
        List<DocumentAttachment> atts = documentAttachmentService.getAttachmentsByDocument(d.getId());
        List<PublicDocumentDetailDTO.AttachmentDTO> attDtos = atts.stream()
                .map(a -> PublicDocumentDetailDTO.AttachmentDTO.builder()
                        .id(a.getId())
                        .filename(a.getOriginalFilename())
                        .size(a.getFileSize())
                        .contentType(a.getContentType())
                        .build())
                .toList();
        return builder.attachments(attDtos).build();
    }

    private PublicDocumentDTO toDto(Document d) {
        List<String> categoryNames = (d.getCategories() == null) ? List.of()
                : d.getCategories().stream()
                        .map(DocumentCategory::getName)
                        .filter(n -> n != null && !n.isBlank())
                        .collect(Collectors.toList());
        return PublicDocumentDTO.builder()
                .id(d.getId())
                .title(d.getTitle())
                .type(d.getType())
                .documentNumber(d.getDocumentNumber())
                .issuingAgency(d.getIssuingAgency())
                .uploaderName(d.getUploaderName())
                .downloadCount(d.getDownloadCount())
                .publishedAt(d.getPublishedAt())
                .isPublic(Boolean.TRUE.equals(d.getIsPublic()))
                .categoryNames(categoryNames)
                .build();
    }
}

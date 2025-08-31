package com.managementcontent.controller;

import com.managementcontent.dto.PublicCategoryDTO;
import com.managementcontent.dto.CreateCategoryRequest;
import com.managementcontent.dto.PublicDocumentDTO;
import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.User;
import com.managementcontent.service.DocumentCategoryService;
import com.managementcontent.service.DocumentAttachmentService;
import com.managementcontent.repository.DocumentCategoryRepository;
import com.managementcontent.repository.DocumentRepository;
import com.managementcontent.model.Document;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.service.UserService;
import com.managementcontent.service.NotificationService;
import com.managementcontent.model.enums.NotificationType;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import com.managementcontent.service.PublicDocumentService;
import com.managementcontent.model.DocumentDownloadLog;
import com.managementcontent.repository.DocumentDownloadLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
// import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Tag(name = "Public Portal", description = "Public browsing and upload endpoints")
public class PublicPortalController {

    private final DocumentCategoryService categoryService;
    private final PublicDocumentService publicDocumentService;
    private final DocumentAttachmentService documentAttachmentService;
    private final DocumentRepository<Document> documentRepository;
    private final DocumentCategoryRepository categoryRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final DocumentDownloadLogRepository downloadLogRepository;

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

    @GetMapping("/categories/tree")
    @Operation(summary = "Get category tree")
    public ResponseEntity<ResponseDTO<List<PublicCategoryDTO>>> tree() {
        return ResponseEntity.ok(ResponseDTO.success(categoryService.getTree()));
    }

    @PostMapping("/categories")
    // @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    @Operation(summary = "Create a document category")
    public ResponseEntity<ResponseDTO<?>> createCategory(@RequestBody CreateCategoryRequest req) {
        try {
            if (req.getName() == null || req.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ResponseDTO.error("Category name is required"));
            }
            String baseSlug = slugify(req.getName());
            String slug = baseSlug;
            int i = 1;
            while (categoryRepository.existsBySlug(slug)) {
                slug = baseSlug + "-" + (++i);
            }

            var cat = com.managementcontent.model.DocumentCategory.builder()
                    .name(req.getName().trim())
                    .slug(slug)
                    .build();
            if (req.getParentId() != null) {
                categoryRepository.findById(req.getParentId()).ifPresent(cat::setParent);
            }
            var saved = categoryRepository.save(cat);
            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(Map.of(
                    "id", saved.getId(),
                    "name", saved.getName(),
                    "slug", saved.getSlug(),
                    "parentId", saved.getParent() != null ? saved.getParent().getId() : null)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseDTO.error(e.getMessage()));
        }
    }

    private static String slugify(String input) {
        String s = input.toLowerCase().trim();
        s = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        s = s.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        if (s.isEmpty())
            s = "cat";
        return s;
    }

    @GetMapping("/documents")
    @Operation(summary = "List public documents")
    public ResponseEntity<ResponseDTO<Page<PublicDocumentDTO>>> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String issuingAgency,
            Pageable pageable) {
        if (year != null || (issuingAgency != null && !issuingAgency.isBlank())) {
            return ResponseEntity
                    .ok(ResponseDTO.success(publicDocumentService.searchPublic(q, issuingAgency, year, pageable)));
        }
        return ResponseEntity.ok(ResponseDTO.success(publicDocumentService.listPublic(q, pageable)));
    }

    @GetMapping("/categories/{id}/documents")
    @Operation(summary = "List public documents by category")
    public ResponseEntity<ResponseDTO<Page<PublicDocumentDTO>>> byCategory(@PathVariable Long id,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String issuingAgency,
            Pageable pageable) {
        if (year != null || (issuingAgency != null && !issuingAgency.isBlank()) || (q != null && !q.isBlank())) {
            return ResponseEntity.ok(
                    ResponseDTO.success(publicDocumentService.searchByCategory(id, q, issuingAgency, year, pageable)));
        }
        return ResponseEntity.ok(ResponseDTO.success(publicDocumentService.listByCategory(id, pageable)));
    }

    @GetMapping("/documents/{id}")
    @Operation(summary = "Public document detail")
    public ResponseEntity<ResponseDTO<?>> detail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(publicDocumentService.detail(id)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ResponseDTO.error(e.getMessage()));
        }
    }

    @PostMapping(value = "/documents/upload", consumes = { "multipart/form-data" })
    @Operation(summary = "Anonymous public upload")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> upload(
            @RequestParam("title") String title,
            @RequestParam(value = "issuingAgency", required = false) String issuingAgency,
            @RequestParam(value = "documentNumber", required = false) String documentNumber,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(value = "categoryIds", required = false) List<Long> categoryIds,
            @RequestParam(value = "uploaderName", required = false) String uploaderName,
            @RequestParam(value = "uploaderEmail", required = false) String uploaderEmail) {
        try {
            Document doc = new Document();
            doc.setTitle(title);
            doc.setType("PUBLIC");
            doc.setStatus(DocumentProcessingStatus.DRAFT);
            doc.setIsPublic(true);
            User currentUser = getCurrentUser();
            // Prefer provided uploaderName if present, else current user fullName
            doc.setUploaderName(
                    (uploaderName != null && !uploaderName.isBlank()) ? uploaderName : currentUser.getFullName());
            doc.setUploaderEmail(uploaderEmail);
            if (issuingAgency != null && !issuingAgency.isBlank()) {
                doc.setIssuingAgency(issuingAgency);
            }
            if (documentNumber != null && !documentNumber.isBlank()) {
                doc.setDocumentNumber(documentNumber);
            }
            // Link categories if provided
            if (categoryIds != null && !categoryIds.isEmpty()) {
                for (Long cid : categoryIds) {
                    categoryRepository.findById(cid).ifPresent(cat -> doc.getCategories().add(cat));
                }
            }
            Document saved = documentRepository.save(doc);

            // Save attachments in one transactional call to reduce overhead
            if (files != null && !files.isEmpty()) {
                documentAttachmentService.addMultipleAttachments(saved, files, currentUser);
            }
            // Notify all users about new public document
            try {
                List<User> users = userService.findAll();
                for (User u : users) {
                    notificationService.createAndSendNotification(
                            saved.getId(),
                            "public_document",
                            u,
                            NotificationType.PUBLIC_DOCUMENT_UPLOADED,
                            "Tài liệu công khai mới: " + saved.getTitle());
                }
            } catch (Exception ex) {
                // swallow notification errors to not fail upload
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success(Map.of(
                            "id", saved.getId(),
                            "message", "Uploaded. Pending moderation")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseDTO.error(e.getMessage()));
        }
    }

    @PostMapping("/documents/{id}/publish")
    @Operation(summary = "Publish a document to public portal")
    public ResponseEntity<ResponseDTO<?>> publish(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(publicDocumentService.publish(id)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseDTO.error(e.getMessage()));
        }
    }

    @GetMapping("/documents/{documentId}/attachments/{attachmentId}/download")
    @Operation(summary = "Public download attachment")
    public ResponseEntity<?> download(@PathVariable Long documentId, @PathVariable Long attachmentId,
            HttpServletRequest request) {
        try {
            // Increment document download count and optionally log downloader
            var docOpt = documentRepository.findById(documentId);
            docOpt.ifPresent(d -> {
                Long c = d.getDownloadCount() == null ? 0L : d.getDownloadCount();
                d.setDownloadCount(c + 1);
                documentRepository.save(d);
            });

            // Save simple download log
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getName() != null) {
                    userService.findByName(auth.getName()).ifPresent(u -> {
                        // inner lambda can't set outer vars if not effectively final, so use array
                    });
                }
                // Build log entry
                DocumentDownloadLog log = DocumentDownloadLog.builder()
                        .documentId(documentId)
                        .attachmentId(attachmentId)
                        .downloadedAt(java.time.LocalDateTime.now())
                        .build();
                if (auth != null && auth.getName() != null) {
                    var userOpt = userService.findByName(auth.getName());
                    if (userOpt.isPresent()) {
                        var u = userOpt.get();
                        log.setUserId(u.getId());
                        log.setUserName(u.getFullName());
                    } else {
                        log.setUserName(auth.getName());
                    }
                }
                try {
                    String xfwd = request.getHeader("X-Forwarded-For");
                    String ip = (xfwd != null && !xfwd.isBlank()) ? xfwd.split(",")[0].trim() : request.getRemoteAddr();
                    log.setIpAddress(ip);
                } catch (Exception ignored) {
                }
                downloadLogRepository.save(log);
            } catch (Exception ignore) {
            }
            return documentAttachmentService.downloadAttachment(attachmentId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ResponseDTO.error(e.getMessage()));
        }
    }

    @GetMapping("/documents/{documentId}/downloads")
    @Operation(summary = "List download logs for a document")
    public ResponseEntity<ResponseDTO<Page<DocumentDownloadLog>>> downloadLogs(@PathVariable Long documentId,
            Pageable pageable) {
        return ResponseEntity.ok(ResponseDTO.success(downloadLogRepository.findByDocumentId(documentId, pageable)));
    }
}

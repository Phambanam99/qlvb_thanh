package com.managementcontent.controller;

import com.managementcontent.dto.OutgoingDocumentDTO;
import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.DocumentAttachment;
import com.managementcontent.model.User;
import com.managementcontent.service.OutgoingDocumentService;
import com.managementcontent.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.managementcontent.service.FileStorageService;
import com.managementcontent.service.IncomingDocumentService;
import org.springframework.context.ApplicationContext;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/documents/outgoing")
@RequiredArgsConstructor
@Tag(name = "Outgoing Documents", description = "APIs for managing outgoing documents")
public class OutgoingDocumentController {

    private final OutgoingDocumentService outgoingDocumentService;
    private final FileStorageService fileStorageService;
    private final ApplicationContext applicationContext;
    private final UserService userService;

    @Operation(summary = "Get all outgoing documents", description = "Returns a paginated list of all outgoing documents")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view documents")
    })
    @GetMapping
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<OutgoingDocumentDTO>>> getAllOutgoingDocuments(Pageable pageable) {
        try {
            Page<OutgoingDocumentDTO> documents = outgoingDocumentService.getAllOutgoingDocuments(pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách công văn đi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get outgoing document by ID", description = "Returns a single outgoing document by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved document"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view this document")
    })
    @GetMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<OutgoingDocumentDTO>> getOutgoingDocumentById(
            @Parameter(description = "ID of the document to retrieve") @PathVariable Long id) {
        try {
            return outgoingDocumentService.getOutgoingDocumentById(id)
                    .map(doc -> ResponseEntity.ok(ResponseDTO.success(doc)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy công văn")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin công văn: " + e.getMessage()));
        }
    }

    @Operation(summary = "Search outgoing documents", description = "Search outgoing documents by keyword")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search completed successfully")
    })
    @GetMapping("/search")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<OutgoingDocumentDTO>>> searchOutgoingDocuments(
            @Parameter(description = "Keyword to search for") @RequestParam String keyword,
            Pageable pageable) {
        try {
            Page<OutgoingDocumentDTO> documents = outgoingDocumentService.searchOutgoingDocuments(keyword, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tìm kiếm công văn: " + e.getMessage()));
        }
    }

    @Operation(summary = "Find documents by type", description = "Returns documents matching a specific document type")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents")
    })
    @GetMapping("/document-type")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<OutgoingDocumentDTO>>> findByDocumentType(
            @Parameter(description = "Document type to filter by") @RequestParam String type,
            Pageable pageable) {
        try {
            Page<OutgoingDocumentDTO> documents = outgoingDocumentService.findByDocumentType(type, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lọc công văn theo loại: " + e.getMessage()));
        }
    }

    @Operation(summary = "Find documents by date range", description = "Returns documents within a specific date range")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents")
    })
    @GetMapping("/date-range")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<OutgoingDocumentDTO>>> findByDateRange(
            @Parameter(description = "Start date (ISO format)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @Parameter(description = "End date (ISO format)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            Pageable pageable) {
        try {
            Page<OutgoingDocumentDTO> documents = outgoingDocumentService.findByDateRange(start, end, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lọc công văn theo khoảng thời gian: " + e.getMessage()));
        }
    }

    @Operation(summary = "Create new outgoing document", description = "Creates a new outgoing document")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document successfully created"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create documents")
    })
    @PostMapping
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<OutgoingDocumentDTO>> createOutgoingDocument(
            @Parameter(description = "Document details", required = true) @RequestBody OutgoingDocumentDTO documentDTO) {
        try {
            OutgoingDocumentDTO createdDocument = outgoingDocumentService.createOutgoingDocument(documentDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo công văn đi thành công", createdDocument));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tạo công văn đi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update outgoing document", description = "Updates an existing outgoing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully updated"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update documents")
    })
    @PutMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<OutgoingDocumentDTO>> updateOutgoingDocument(
            @Parameter(description = "ID of the document to update") @PathVariable Long id,
            @Parameter(description = "Updated document details", required = true) @RequestBody OutgoingDocumentDTO documentDTO) {
        try {
            return outgoingDocumentService.updateOutgoingDocument(id, documentDTO)
                    .map(doc -> ResponseEntity.ok(ResponseDTO.success("Cập nhật công văn thành công", doc)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy công văn")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể cập nhật công văn: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete outgoing document", description = "Deletes an outgoing document by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete documents")
    })
    @DeleteMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deleteOutgoingDocument(
            @Parameter(description = "ID of the document to delete") @PathVariable Long id) {
        try {
            boolean deleted = outgoingDocumentService.deleteOutgoingDocument(id);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa công văn thành công"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy công văn"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể xóa công văn: " + e.getMessage()));
        }
    }

    @Operation(summary = "Upload document attachment", description = "Uploads a file attachment for an outgoing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File successfully uploaded"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
            @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
    })
    @PostMapping(value = "/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<OutgoingDocumentDTO>> uploadOutgoingDocumentAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long id,
            @Parameter(description = "File to upload", required = true, content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)) @RequestPart("file") MultipartFile file) {
        try {
            return outgoingDocumentService.addAttachment(id, file)
                    .map(doc -> ResponseEntity.ok(ResponseDTO.success("Tải lên tệp đính kèm thành công", doc)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy công văn")));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải lên tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tải lên tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Download document attachment", description = "Downloads a file attachment for an outgoing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File ready for download"),
            @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during download"),
            @ApiResponse(responseCode = "403", description = "Not authorized to download attachments")
    })
    @GetMapping("/{id}/attachment")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Resource>> downloadOutgoingDocumentAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long id) {
        try {
            ResponseEntity<Resource> resource = outgoingDocumentService.getAttachment(id);
            return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tải xuống tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Upload multiple document attachments", description = "Uploads multiple file attachments for an outgoing document using the new DocumentAttachmentService")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Files successfully uploaded"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
            @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
    })
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> uploadMultipleAttachments(
            @Parameter(description = "ID of the document") @PathVariable Long id,
            @Parameter(description = "Files to upload", required = true) @RequestPart("files") MultipartFile[] files) {

        try {
            // Check if document exists
            if (!outgoingDocumentService.findOutgoingDocumentById(id).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn"));
            }

            // Get current user
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Convert array to list and use the new service method
            List<MultipartFile> fileList = Arrays.asList(files);
            List<DocumentAttachment> attachments = outgoingDocumentService.addMultipleAttachments(id, fileList,
                    currentUser);

            // Create result object with detailed information
            Map<String, Object> result = new HashMap<>();
            result.put("documentId", id);
            result.put("totalFiles", files.length);
            result.put("successfulUploads", attachments.size());
            result.put("message", "Successfully uploaded " + attachments.size() + " out of " + files.length + " files");

            return ResponseEntity.ok(ResponseDTO.success("Tải lên nhiều tệp đính kèm thành công", result));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải lên tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi không mong muốn: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get all attachments for a document", description = "Returns a list of all attachments for an outgoing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved attachments"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view attachments")
    })
    @GetMapping("/{id}/attachments")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<List<DocumentAttachment>>> getDocumentAttachments(
            @Parameter(description = "ID of the document") @PathVariable Long id) {

        try {
            // Check if document exists
            if (!outgoingDocumentService.findOutgoingDocumentById(id).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn"));
            }

            List<DocumentAttachment> attachments = outgoingDocumentService.getDocumentAttachments(id);
            return ResponseEntity.ok(ResponseDTO.success(attachments));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Download specific attachment", description = "Downloads a specific attachment by attachment ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File ready for download"),
            @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during download"),
            @ApiResponse(responseCode = "403", description = "Not authorized to download attachments")
    })
    @GetMapping("/{documentId}/attachments/{attachmentId}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Resource>> downloadSpecificAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "ID of the attachment") @PathVariable Long attachmentId) {

        try {
            // Check if document exists
            if (!outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn"));
            }

            ResponseEntity<Resource> resource = outgoingDocumentService.downloadSpecificAttachment(documentId,
                    attachmentId);
            return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete specific attachment", description = "Deletes a specific attachment by attachment ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Attachment successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during deletion"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete attachments")
    })
    @DeleteMapping("/{documentId}/attachments/{attachmentId}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<String>> deleteSpecificAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "ID of the attachment") @PathVariable Long attachmentId) {

        try {
            // Check if document exists
            if (!outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn"));
            }

            boolean deleted = outgoingDocumentService.deleteDocumentAttachment(attachmentId);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa tệp đính kèm thành công"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy tệp đính kèm"));
            }

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi xóa tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi không mong muốn: " + e.getMessage()));
        }
    }

    /**
     * Helper method to get current authenticated user
     */
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userService.findByName(auth.getName()).orElse(null);
    }

    /**
     * Tải xuống tệp đính kèm của công văn đến liên quan đến công văn đi
     */
    @Operation(summary = "Download incoming document attachment", description = "Downloads a file attachment from a related incoming document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File ready for download"),
            @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during download"),
            @ApiResponse(responseCode = "403", description = "Not authorized to download attachments")
    })
    @GetMapping("/incoming-attachment/{incomingDocumentId}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Resource>> downloadIncomingAttachment(
            @Parameter(description = "ID of the incoming document") @PathVariable Long incomingDocumentId) {
        try {
            // Lấy IncomingDocumentService từ ApplicationContext
            IncomingDocumentService incomingDocumentService = applicationContext.getBean(IncomingDocumentService.class);

            // Gọi getAttachment từ IncomingDocumentService
            ResponseEntity<Resource> resource = incomingDocumentService.getAttachment(incomingDocumentId);
            return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy tệp đính kèm"));
        }
    }

    // get by related documents
    @Operation(summary = "Get related documents", description = "Returns a list of related documents")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved related documents"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view related documents")
    })
    @GetMapping("/related")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<List<OutgoingDocumentDTO>>> getRelatedDocuments(
            @Parameter(description = "Related documents to search for (encoded if contains commas)") @RequestParam(value = "relatedDocuments", required = true) String relatedDocuments) {
        // Xử lý tham số nếu có dấu phẩy hoặc ký tự đặc biệt
        try {
            List<OutgoingDocumentDTO> documents = outgoingDocumentService.findByRelatedDocuments(relatedDocuments);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tìm kiếm công văn liên quan: " + e.getMessage()));
        }
    }
}
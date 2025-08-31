package com.managementcontent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.managementcontent.dto.DepartmentDTO;
import com.managementcontent.dto.FullIncomingDocumentDTO;
import com.managementcontent.dto.IncomingDocumentDTO;
import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.DocumentAttachment;
import com.managementcontent.service.DocumentDepartmentService;
import com.managementcontent.service.DocumentWorkflowService;
import com.managementcontent.service.FileStorageService;
import com.managementcontent.service.IncomingDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/documents/incoming")
@RequiredArgsConstructor
@Tag(name = "Incoming Documents", description = "APIs for managing incoming documents")
public class IncomingDocumentController {

    private final IncomingDocumentService incomingDocumentService;
    private final FileStorageService fileStorageService;
    private final DocumentDepartmentService documentDepartmentService;
    private final DocumentWorkflowService documentWorkflowService;

    @Operation(summary = "Get all incoming documents", description = "Returns a paginated list of all incoming documents")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view documents")
    })
    @GetMapping
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<IncomingDocumentDTO>>> getAllIncomingDocuments(Pageable pageable) {
        try {
            Page<IncomingDocumentDTO> documents = incomingDocumentService.getAllIncomingDocuments(pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách văn bản đến: " + e.getMessage()));
        }
    }
    
    @Operation(summary = "Get departments assignt document by ID", description = "Returns a list of departments by document ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved document"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view this document")
    })
    @GetMapping("/{documentId}/departments")
    public ResponseEntity<ResponseDTO<List<DepartmentDTO>>> getDepartmentsByDocumentId(@PathVariable Long documentId) {
        try {
            List<DepartmentDTO> departments = documentDepartmentService.getDepartmentsByDocumentId(documentId);
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách phòng ban: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get incoming document by ID", description = "Returns a single incoming document by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved document"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view this document")
    })
    @GetMapping("/{id}")
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<IncomingDocumentDTO>> getIncomingDocumentById(
            @Parameter(description = "ID of the document to retrieve") @PathVariable Long id) {
        try {
            return incomingDocumentService.getIncomingDocumentById(id)
                    .map(doc -> ResponseEntity.ok(ResponseDTO.success(doc)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Search incoming documents", description = "Search incoming documents by keyword")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search completed successfully")
    })
    @GetMapping("/search")
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<IncomingDocumentDTO>>> searchIncomingDocuments(
            @Parameter(description = "Keyword to search for") @RequestParam String keyword,
            Pageable pageable) {
        try {
            Page<IncomingDocumentDTO> documents = incomingDocumentService.searchIncomingDocuments(keyword, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tìm kiếm văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Find documents by urgency level", description = "Returns documents matching a specific urgency level")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents")
    })
    @GetMapping("/urgency-level")
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<IncomingDocumentDTO>>> findByUrgencyLevel(
            @Parameter(description = "Urgency level to filter by") @RequestParam String level,
            Pageable pageable) {
        try {
            Page<IncomingDocumentDTO> documents = incomingDocumentService.findByUrgencyLevel(level, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lọc văn bản theo độ khẩn cấp: " + e.getMessage()));
        }
    }

    @Operation(summary = "Find documents by processing status", description = "Returns documents with a specific processing status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents")
    })
    @GetMapping("/processing-status")
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<IncomingDocumentDTO>>> findByProcessingStatus(
            @Parameter(description = "Processing status to filter by") @RequestParam String status,
            Pageable pageable) {
        try {
            Page<IncomingDocumentDTO> documents = incomingDocumentService.findByProcessingStatus(status, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lọc văn bản theo trạng thái xử lý: " + e.getMessage()));
        }
    }

    @Operation(summary = "Find documents by date range", description = "Returns documents within a specific date range")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents")
    })
    @GetMapping("/date-range")
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<IncomingDocumentDTO>>> findByDateRange(
            @Parameter(description = "Start date (ISO format)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @Parameter(description = "End date (ISO format)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            Pageable pageable) {
        try {
            Page<IncomingDocumentDTO> documents = incomingDocumentService.findByDateRange(start, end, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lọc văn bản theo khoảng thời gian: " + e.getMessage()));
        }
    }

    @Operation(summary = "Create new incoming document", description = "Creates a new incoming document")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document successfully created"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create documents")
    })
    @PostMapping
//    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<IncomingDocumentDTO>> createIncomingDocument(
            @Parameter(description = "Document details", required = true) @RequestBody IncomingDocumentDTO documentDTO) {
        try {
            IncomingDocumentDTO createdDocument = incomingDocumentService.createIncomingDocument(documentDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo văn bản đến thành công", createdDocument));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tạo văn bản đến: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update incoming document", description = "Updates an existing incoming document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully updated"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update documents")
    })
    @PutMapping("/{id}")
//    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<IncomingDocumentDTO>> updateIncomingDocument(
            @Parameter(description = "ID of the document to update") @PathVariable Long id,
            @Parameter(description = "Updated document details", required = true) @RequestBody IncomingDocumentDTO documentDTO) {
        try {
            return incomingDocumentService.updateIncomingDocument(id, documentDTO)
                    .map(doc -> ResponseEntity.ok(ResponseDTO.success("Cập nhật văn bản thành công", doc)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể cập nhật văn bản: " + e.getMessage()));
        }
    }
    
    //Get all Document with department Id
    @Operation(summary = "Get all documents by department ID", description = "Returns a list of documents assigned to a specific department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved documents"),
            @ApiResponse(responseCode = "404", description = "Department not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view this department's documents")
    })
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ResponseDTO<Page<IncomingDocumentDTO>>> getAllDocumentsByDepartmentId(
            @Parameter(description = "ID of the department") @PathVariable Long departmentId,
            Pageable pageable) {
        try {
            Page<IncomingDocumentDTO> documents = incomingDocumentService.getAllDocumentsByDepartmentId(departmentId, pageable);
            return ResponseEntity.ok(ResponseDTO.success(documents));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy văn bản theo phòng ban: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete incoming document", description = "Deletes an incoming document by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Document successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete documents")
    })
    @DeleteMapping("/{id}")
//    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deleteIncomingDocument(
            @Parameter(description = "ID of the document to delete") @PathVariable Long id) {
        try {
            boolean deleted = incomingDocumentService.deleteIncomingDocument(id);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa văn bản thành công"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy văn bản"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể xóa văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Upload document attachment", description = "Uploads a file attachment for an incoming document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File successfully uploaded"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
            @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
    })
    @PostMapping(value = "/{id}/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<IncomingDocumentDTO>> uploadIncomingDocumentAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long id,
            @Parameter(description = "File to upload", required = true, content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)) @RequestPart("file") MultipartFile file) {
        try {
            return incomingDocumentService.addAttachment(id, file)
                    .map(doc -> ResponseEntity.ok(ResponseDTO.success("Tải lên tệp đính kèm thành công", doc)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải lên tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tải lên tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Download document attachment", description = "Downloads a file attachment for an incoming document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File ready for download"),
            @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during download"),
            @ApiResponse(responseCode = "403", description = "Not authorized to download attachments")
    })
    @GetMapping("/{id}/attachment")
//    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Resource>> downloadIncomingDocumentAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long id) {
        try {
            ResponseEntity<Resource> resource = incomingDocumentService.getAttachment(id);
            return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tải xuống tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Upload multiple document attachments", description = "Uploads multiple file attachments for an incoming document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Files successfully uploaded"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
            @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
    })
    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<ResponseDTO<java.util.Map<String, Object>>> uploadMultipleAttachments(
            @Parameter(description = "ID of the document") @PathVariable Long id,
            @Parameter(description = "Files to upload", required = true) @RequestPart("files") MultipartFile[] files) {

        try {
            // Check if document exists
            if (incomingDocumentService.findIncomingDocumentById(id).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy văn bản"));
            }

            // Track successful and failed uploads
            java.util.List<String> uploadedFiles = new java.util.ArrayList<>();
            java.util.List<String> failedFiles = new java.util.ArrayList<>();

            for (MultipartFile file : files) {
                try {
                    incomingDocumentService.addAttachment(id, file);
                    uploadedFiles.add(file.getOriginalFilename());
                } catch (Exception e) {
                    failedFiles.add(file.getOriginalFilename() + ": " + e.getMessage());
                }
            }

            // Create result object
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("documentId", id);
            result.put("uploadedFiles", uploadedFiles);
            result.put("failedFiles", failedFiles);

            return ResponseEntity.ok(ResponseDTO.success("Tải lên nhiều tệp đính kèm thành công", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tải lên nhiều tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get document attachments", description = "Get all attachments for an incoming document using the new multi-attachment system")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved attachments"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view attachments")
    })
    @GetMapping("/{id}/attachments")
    public ResponseEntity<ResponseDTO<List<DocumentAttachment>>> getDocumentAttachments(
            @Parameter(description = "ID of the document") @PathVariable Long id) {
        
        try {
            // Check if document exists
            if (incomingDocumentService.findIncomingDocumentById(id).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy văn bản"));
            }

            List<DocumentAttachment> attachments = incomingDocumentService.getDocumentAttachments(id);
            return ResponseEntity.ok(ResponseDTO.success(attachments));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete specific attachment", description = "Delete a specific attachment by attachment ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Attachment successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during deletion")
    })
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<ResponseDTO<String>> deleteSpecificAttachment(
            @Parameter(description = "ID of the attachment to delete") @PathVariable Long attachmentId) {
        try {
            boolean deleted = incomingDocumentService.deleteDocumentAttachment(attachmentId);
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể xóa tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get attachment summary", description = "Get attachment count and total size for a document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved attachment summary"),
            @ApiResponse(responseCode = "404", description = "Document not found")
    })
    @GetMapping("/{id}/attachments/summary")
    public ResponseEntity<ResponseDTO<IncomingDocumentService.AttachmentSummary>> getAttachmentSummary(
            @Parameter(description = "ID of the document") @PathVariable Long id) {
        
        try {
            // Check if document exists
            if (incomingDocumentService.findIncomingDocumentById(id).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy văn bản"));
            }

            IncomingDocumentService.AttachmentSummary summary = incomingDocumentService.getAttachmentSummary(id);
            return ResponseEntity.ok(ResponseDTO.success(summary));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê tệp đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Download specific attachment", description = "Download a specific attachment file by attachment ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File ready for download"),
            @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error during download")
    })
    @GetMapping("/{documentId}/attachments/{attachmentId}")
    public ResponseEntity<ResponseDTO<Resource>> downloadSpecificAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "ID of the attachment") @PathVariable Long attachmentId) {
        
        try {
            // Check if document exists
            if (incomingDocumentService.findIncomingDocumentById(documentId).isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy văn bản"));
            }

            ResponseEntity<Resource> resource = incomingDocumentService.downloadSpecificAttachment(documentId, attachmentId);
            return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp đính kèm: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Không thể tải xuống tệp đính kèm: " + e.getMessage()));
        }
    }

}
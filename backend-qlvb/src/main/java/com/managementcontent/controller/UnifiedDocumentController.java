package com.managementcontent.controller;

import com.managementcontent.dto.*;
import com.managementcontent.model.*;
import com.managementcontent.service.DocumentMapperService;
import com.managementcontent.service.IncomingDocumentService;
import com.managementcontent.service.OutgoingDocumentService;
import com.managementcontent.service.DocumentStatsService;
import com.managementcontent.service.DocumentWorkflowService;
import com.managementcontent.service.DocumentCommentService;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.util.PaginationUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents/unified")
@RequiredArgsConstructor
@Tag(name = "Unified Documents", description = "APIs for accessing documents in a frontend-friendly format")
public class UnifiedDocumentController {

        private final IncomingDocumentService incomingDocumentService;
        private final OutgoingDocumentService outgoingDocumentService;
        private final DocumentMapperService documentMapperService;
        private final DocumentStatsService documentStatsService;
        private final DocumentWorkflowService documentWorkflowService;
        private final DocumentCommentService documentCommentService;
        private final UserRepository userRepository;
        private final PaginationUtil paginationUtil;

        @Operation(summary = "Get all documents", description = "Returns a paginated list of all documents in unified format")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved documents"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view documents")
        })
        @GetMapping
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<UnifiedDocumentDTO>>> getAllDocuments(Pageable pageable) {
                try {
                        // Get properly paginated and sorted documents using the pagination utility
                        Page<UnifiedDocumentDTO> resultPage = paginationUtil.getUnifiedDocumentsPage(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(resultPage));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách công văn: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get document by ID", description = "Returns a single document in unified format")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved document"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view this document")
        })
        @GetMapping("/{id}")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<UnifiedDocumentDTO>> getDocumentById(@PathVariable Long id) {
                try {
                        // Try to find as incoming document first
                        Optional<IncomingDocument> incomingDoc = incomingDocumentService.findIncomingDocumentById(id);
                        if (incomingDoc.isPresent()) {
                                UnifiedDocumentDTO dto = documentMapperService
                                                .mapIncomingDocumentToDTO(incomingDoc.get());
                                return ResponseEntity.ok(ResponseDTO.success(dto));
                        }

                        // If not found, try as outgoing document
                        Optional<OutgoingDocument> outgoingDoc = outgoingDocumentService.findOutgoingDocumentById(id);
                        if (outgoingDoc.isPresent()) {
                                UnifiedDocumentDTO dto = documentMapperService
                                                .mapOutgoingDocumentToDTO(outgoingDoc.get());
                                return ResponseEntity.ok(ResponseDTO.success(dto));
                        }

                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy công văn"));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy thông tin công văn: " + e.getMessage()));
                }
        }

        @Operation(summary = "Search documents", description = "Search all documents by keyword")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Search completed successfully")
        })
        @GetMapping("/search")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<UnifiedDocumentDTO>>> searchDocuments(
                        @Parameter(description = "Keyword to search for") @RequestParam String keyword,
                        Pageable pageable) {
                try {
                        // Search with proper pagination using the pagination utility
                        Page<UnifiedDocumentDTO> resultPage = paginationUtil.searchUnifiedDocuments(keyword, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(resultPage));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi tìm kiếm công văn: " + e.getMessage()));
                }
        }

        @Operation(summary = "Find documents by date range", description = "Find all documents within a date range")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Search completed successfully")
        })
        @GetMapping("/by-date")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<UnifiedDocumentDTO>>> findByDateRange(
                        @Parameter(description = "Start date (inclusive)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
                        @Parameter(description = "End date (inclusive)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
                        Pageable pageable) {
                try {
                        // Find by date range with proper pagination using the pagination utility
                        Page<UnifiedDocumentDTO> resultPage = paginationUtil.getUnifiedDocumentsByDateRange(start, end,
                                        pageable);
                        return ResponseEntity.ok(ResponseDTO.success(resultPage));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lọc công văn theo khoảng thời gian: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get document statistics", description = "Get document counts by type and status")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved statistics"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view statistics")
        })
        @GetMapping("/stats")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentStats() {
                try {
                        Map<String, Object> stats = documentStatsService.getDocumentStats();
                        return ResponseEntity.ok(ResponseDTO.success(stats));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy thống kê công văn: " + e.getMessage()));
                }
        }

        @Operation(summary = "Upload document attachment", description = "Uploads a file attachment for any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "File successfully uploaded"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
        })
        @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//        @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
        public ResponseEntity<ResponseDTO<Object>> uploadDocumentAttachment(
                        @Parameter(description = "ID of the document") @PathVariable Long id,
                        @Parameter(description = "File to upload", required = true) @RequestPart("file") MultipartFile file) {

                try {
                        // Try as incoming document first
                        Optional<IncomingDocument> incomingDoc = incomingDocumentService.findIncomingDocumentById(id);
                        if (incomingDoc.isPresent()) {
                                return incomingDocumentService.addAttachment(id, file)
                                                .map(doc -> ResponseEntity.ok(ResponseDTO
                                                                .success("Tải lên tệp đính kèm thành công", (Object)doc )))
                                                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                                .body(ResponseDTO.error("Không tìm thấy công văn")));
                        }

                        // If not found, try as outgoing document
                        Optional<OutgoingDocument> outgoingDoc = outgoingDocumentService.findOutgoingDocumentById(id);
                        if (outgoingDoc.isPresent()) {
                                return outgoingDocumentService.addAttachment(id, file)
                                                .map(doc -> ResponseEntity.ok(ResponseDTO
                                                                .success("Tải lên tệp đính kèm thành công",(Object) doc)))
                                                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                                .body(ResponseDTO.error("Không tìm thấy công văn")));
                        }

                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy công văn"));
                } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi tải lên tệp đính kèm: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể tải lên tệp đính kèm: " + e.getMessage()));
                }
        }

        @Operation(summary = "Upload multiple document attachments", description = "Uploads multiple file attachments for any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Files successfully uploaded"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
        })
        @PostMapping(value = "/{id}/multiple-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> uploadMultipleAttachments(
                        @Parameter(description = "ID of the document") @PathVariable Long id,
                        @Parameter(description = "Files to upload", required = true) @RequestPart("files") MultipartFile[] files) {

                try {
                        // Check if document exists
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(id).isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(id).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        List<String> uploadedFiles = new ArrayList<>();
                        List<String> failedFiles = new ArrayList<>();

                        for (MultipartFile file : files) {
                                try {
                                        // Try as incoming document first
                                        Optional<IncomingDocument> incomingDoc = incomingDocumentService
                                                        .findIncomingDocumentById(id);
                                        if (incomingDoc.isPresent()) {
                                                incomingDocumentService.addAttachment(id, file);
                                                uploadedFiles.add(file.getOriginalFilename());
                                                continue;
                                        }

                                        // If not found, try as outgoing document
                                        Optional<OutgoingDocument> outgoingDoc = outgoingDocumentService
                                                        .findOutgoingDocumentById(id);
                                        if (outgoingDoc.isPresent()) {
                                                outgoingDocumentService.addAttachment(id, file);
                                                uploadedFiles.add(file.getOriginalFilename());
                                                continue;
                                        }

                                } catch (Exception e) {
                                        failedFiles.add(file.getOriginalFilename() + ": " + e.getMessage());
                                }
                        }

                        Map<String, Object> result = new HashMap<>();
                        result.put("uploadedFiles", uploadedFiles);
                        result.put("failedFiles", failedFiles);

                        return ResponseEntity.ok(ResponseDTO.success("Tải lên nhiều tệp đính kèm thành công", result));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi tải lên nhiều tệp đính kèm: " + e.getMessage()));
                }
        }

        @Operation(summary = "Download document attachment", description = "Downloads a file attachment for any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "File ready for download"),
                        @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during download"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to download attachments")
        })
        @GetMapping("/{id}/attachments")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Object>> downloadDocumentAttachment(
                        @Parameter(description = "ID of the document") @PathVariable Long id) {

                try {
                        // Try as incoming document first
                        Optional<IncomingDocument> incomingDoc = incomingDocumentService.findIncomingDocumentById(id);
                        if (incomingDoc.isPresent()) {
                                ResponseEntity<?> resource = incomingDocumentService.getAttachment(id);
                                return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));
                        }

                        // If not found, try as outgoing document
                        Optional<OutgoingDocument> outgoingDoc = outgoingDocumentService.findOutgoingDocumentById(id);
                        if (outgoingDoc.isPresent()) {
                                ResponseEntity<?> resource = outgoingDocumentService.getAttachment(id);
                                return ResponseEntity.ok(ResponseDTO.success(resource.getBody()));
                        }

                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy công văn"));
                } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi tải xuống tệp đính kèm: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể tải xuống tệp đính kèm: " + e.getMessage()));
                }
        }

        @Operation(summary = "Delete document attachment", description = "Deletes a file attachment from any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "204", description = "Attachment successfully deleted"),
                        @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during deletion"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to delete attachments")
        })
        @DeleteMapping("/{id}/attachments")
        @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
        public ResponseEntity<ResponseDTO<String>> deleteDocumentAttachment(
                        @Parameter(description = "ID of the document") @PathVariable Long id) {

                try {
                        // Try as incoming document first
                        Optional<IncomingDocument> incomingDoc = incomingDocumentService.findIncomingDocumentById(id);
                        if (incomingDoc.isPresent()) {
                                boolean deleted = incomingDocumentService.deleteAttachment(id);
                                if (deleted) {
                                        return ResponseEntity.ok(ResponseDTO.success("Xóa tệp đính kèm thành công"));
                                } else {
                                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy tệp đính kèm"));
                                }
                        }

                        // If not found, try as outgoing document
                        Optional<OutgoingDocument> outgoingDoc = outgoingDocumentService.findOutgoingDocumentById(id);
                        if (outgoingDoc.isPresent()) {
                                boolean deleted = outgoingDocumentService.deleteAttachment(id);
                                if (deleted) {
                                        return ResponseEntity.ok(ResponseDTO.success("Xóa tệp đính kèm thành công"));
                                } else {
                                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy tệp đính kèm"));
                                }
                        }

                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy công văn"));
                } catch (IOException e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi xóa tệp đính kèm: " + e.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể xóa tệp đính kèm: " + e.getMessage()));
                }
        }

        // ==================== Workflow Integration Endpoints ====================

        /**
         * Get document workflow status
         */
        @Operation(summary = "Get document workflow status", description = "Returns the current workflow status of a document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved document status"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view document status")
        })
        @GetMapping("/{documentId}/workflow/status")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentWorkflowStatus(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId) {

                try {
                        // Determine if document exists first
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(documentId)
                                        .isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        var status = documentWorkflowService.getDocumentStatus(documentId);
                        if (status == null) {
                                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                .body(ResponseDTO.error("Không thể xác định trạng thái công văn"));
                        }

                        Map<String, Object> response = new HashMap<>();
                        response.put("documentId", documentId);
                        response.put("statusCode", status.ordinal());
                        response.put("statusName", status.name());
                        response.put("displayName", status.getDisplayName());

                        // Add assignees if available
                        List<User> assignees = documentWorkflowService.getDocumentAssignees(documentId);
                        if (!assignees.isEmpty()) {
                                List<Map<String, Object>> assigneeList = assignees.stream()
                                                .map(user -> {
                                                        Map<String, Object> userInfo = new HashMap<>();
                                                        userInfo.put("id", user.getId());
                                                        userInfo.put("name", user.getName());
                                                        return userInfo;
                                                })
                                                .collect(Collectors.toList());
                                response.put("assignees", assigneeList);
                        }

                        return ResponseEntity.ok(ResponseDTO.success(response));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy trạng thái workflow: " + e.getMessage()));
                }
        }

        /**
         * Get document workflow history
         */
        @Operation(summary = "Get document workflow history", description = "Returns the workflow history of a document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved document history"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view document history")
        })
        @GetMapping("/{documentId}/workflow/history")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<List<Map<String, Object>>>> getDocumentWorkflowHistory(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId) {

                try {
                        // Determine if document exists first
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(documentId)
                                        .isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        List<DocumentHistory> history = documentWorkflowService.getDocumentHistory(documentId);

                        // Transform history to frontend-friendly format
                        List<Map<String, Object>> historyItems = history.stream()
                                        .map(item -> {
                                                Map<String, Object> historyItem = new HashMap<>();
                                                historyItem.put("id", item.getId());
                                                historyItem.put("timestamp", item.getTimestamp());
                                                historyItem.put("action", item.getAction());
                                                historyItem.put("previousStatus", item.getPreviousStatus());
                                                historyItem.put("newStatus", item.getNewStatus());
                                                historyItem.put("comments", item.getComments());

                                                if (item.getAssignedTo() != null) {
                                                        Map<String, Object> assignedTo = new HashMap<>();
                                                        assignedTo.put("id", item.getAssignedTo().getId());
                                                        assignedTo.put("name", item.getAssignedTo().getName());
                                                        historyItem.put("assignedTo", assignedTo);
                                                }

                                                return historyItem;
                                        })
                                        .collect(Collectors.toList());

                        return ResponseEntity.ok(ResponseDTO.success(historyItems));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy lịch sử workflow: " + e.getMessage()));
                }
        }

        /**
         * Change document workflow status
         */
        @Operation(summary = "Change document workflow status", description = "Changes the workflow status of a document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Status successfully changed"),
                        @ApiResponse(responseCode = "400", description = "Invalid status transition"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to change document status")
        })
        @PostMapping("/{documentId}/workflow/status")
        @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> changeDocumentWorkflowStatus(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Status change details") @RequestBody Map<String, Object> request) {

                try {
                        // Determine if document exists first
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(documentId)
                                        .isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        // Extract parameters
                        Integer statusValue = (Integer) request.get("status");
                        String comments = (String) request.get("comments");
                        Long actorId = Long.valueOf(request.get("actorId").toString());
                        String action = (String) request.get("action");
                        if (statusValue == null || actorId == null) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Thiếu tham số bắt buộc: status và actorId"));
                        }

                        // Get current user
                        User actor = userRepository.findById(actorId).orElse(null);
                        if (actor == null) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Không tìm thấy người dùng"));
                        }

                        // Convert status value to enum
                        DocumentProcessingStatus targetStatus = DocumentProcessingStatus.values()[statusValue];

                        // Check if transition is allowed
                        if (documentWorkflowService.canChangeStatus(documentId, targetStatus)) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Chuyển đổi trạng thái không hợp lệ"));
                        }

                        // Change status
                        Optional<Document> updatedDocument = documentWorkflowService.changeDocumentStatus(documentId,
                                        targetStatus, actor, comments);

                        if (updatedDocument.isPresent()) {
                                Map<String, Object> response = new HashMap<>();
                                response.put("documentId", documentId);
                                response.put("status", targetStatus.ordinal());
                                response.put("statusName", targetStatus.name());
                                response.put("displayName", targetStatus.getDisplayName());
                                return ResponseEntity
                                                .ok(ResponseDTO.success("Cập nhật trạng thái thành công", response));
                        } else {
                                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                .body(ResponseDTO.error("Không thể cập nhật trạng thái công văn"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi cập nhật trạng thái: " + e.getMessage()));
                }
        }

        /**
         * Assign document to user
         */
        @Operation(summary = "Assign document to user", description = "Assigns a document to a user for processing")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document successfully assigned"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to assign documents")
        })
        @PostMapping("/{documentId}/workflow/assign")
        @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> assignDocumentToUser(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Assignment details") @RequestBody Map<String, Object> request) {

                try {
                        // Determine if document exists first
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(documentId)
                                        .isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        // Extract parameters
                        Long assignedToId = Long.valueOf(request.get("assignedToId").toString());
                        Long actorId = Long.valueOf(request.get("actorId").toString());
                        String comments = (String) request.get("comments");

                        if (assignedToId == null || actorId == null) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error(
                                                                "Thiếu tham số bắt buộc: assignedToId và actorId"));
                        }

                        // Get users
                        User actor = userRepository.findById(actorId).orElse(null);
                        User assignee = userRepository.findById(assignedToId).orElse(null);

                        if (actor == null || assignee == null) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Không tìm thấy người dùng"));
                        }

                        // Assign document
                        Optional<DocumentHistory> history = documentWorkflowService.assignDocument(documentId, assignee,
                                        actor, comments);

                        if (history.isPresent()) {
                                Map<String, Object> response = new HashMap<>();
                                response.put("documentId", documentId);
                                response.put("assignedToId", assignee.getId());
                                response.put("assignedToName", assignee.getName());
                                response.put("actorId", actor.getId());
                                response.put("actorName", actor.getName());
                                response.put("timestamp", history.get().getTimestamp());
                                return ResponseEntity.ok(ResponseDTO.success("Phân công công văn thành công", response));
                        } else {
                                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                .body(ResponseDTO.error("Không thể phân công công văn"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi phân công công văn: " + e.getMessage()));
                }
        }

        // ==================== Document Comments APIs ====================

        /**
         * Add a comment to a document
         */
        @Operation(summary = "Add comment to document", description = "Adds a comment to any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Comment successfully added"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "400", description = "Invalid comment data"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to add comments")
        })
        @PostMapping("/{documentId}/comments")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<DocumentCommentDTO>> addDocumentComment(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Comment data") @RequestBody Map<String, Object> commentData) {

                try {
                        // Validate input
                        String content = (String) commentData.get("content");
                        Long userId = Long.valueOf(commentData.get("userId").toString());
                        String commentType = (String) commentData.getOrDefault("type", "comment");

                        if (content == null || content.trim().isEmpty()) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Nội dung bình luận không được để trống"));
                        }

                        // Determine if document exists
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(documentId)
                                        .isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        // Use document comment service to add comment
                        DocumentCommentDTO savedComment = documentCommentService.addComment(documentId, userId, content,
                                        commentType);
                        return ResponseEntity.ok(ResponseDTO.success("Thêm bình luận thành công", savedComment));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi thêm bình luận: " + e.getMessage()));
                }
        }

        /**
         * Get all comments for a document
         */
        @Operation(summary = "Get document comments", description = "Retrieves all comments for any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Comments successfully retrieved"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view comments")
        })
        @GetMapping("/{documentId}/comments")
        @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<List<DocumentCommentDTO>>> getDocumentComments(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Comment type filter") @RequestParam(required = false) String type) {

                try {
                        // Determine if document exists
                        boolean documentExists = incomingDocumentService.findIncomingDocumentById(documentId)
                                        .isPresent() ||
                                        outgoingDocumentService.findOutgoingDocumentById(documentId).isPresent();

                        if (!documentExists) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy công văn"));
                        }

                        List<DocumentCommentDTO> comments;

                        // If type is specified, filter by type
                        if (type != null && !type.trim().isEmpty()) {
                                comments = documentCommentService.getCommentsByDocumentIdAndType(documentId, type);
                        } else {
                                comments = documentCommentService.getCommentsByDocumentId(documentId);
                        }

                        return ResponseEntity.ok(ResponseDTO.success(comments));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách bình luận: " + e.getMessage()));
                }
        }

        /**
         * Delete a comment
         */
        @Operation(summary = "Delete document comment", description = "Deletes a comment from any document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "204", description = "Comment successfully deleted"),
                        @ApiResponse(responseCode = "404", description = "Comment not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to delete comments")
        })
        @DeleteMapping("/comments/{commentId}")
        @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
        public ResponseEntity<ResponseDTO<String>> deleteDocumentComment(
                        @Parameter(description = "ID of the comment") @PathVariable Long commentId) {

                try {
                        boolean deleted = documentCommentService.deleteComment(commentId);

                        if (deleted) {
                                return ResponseEntity.ok(ResponseDTO.success("Xóa bình luận thành công"));
                        } else {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy bình luận"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi xóa bình luận: " + e.getMessage()));
                }
        }
}
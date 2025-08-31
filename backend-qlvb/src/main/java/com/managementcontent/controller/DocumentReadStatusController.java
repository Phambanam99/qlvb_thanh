package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.DocumentReaderDTO;
import com.managementcontent.model.DocumentReadStatus.DocumentType;
import com.managementcontent.service.DocumentReadStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents/read-status")
@RequiredArgsConstructor
@Tag(name = "Document Read Status", description = "APIs for managing document read status across all document types")
public class DocumentReadStatusController {

        private final DocumentReadStatusService readStatusService;

        @Operation(summary = "Mark document as read", description = "Marks a document as read for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document marked as read successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @PostMapping("/{documentId}/mark-read")
        public ResponseEntity<ResponseDTO<String>> markAsRead(
                        @Parameter(description = "ID of the document to mark as read") @PathVariable Long documentId,
                        @Parameter(description = "Type of document") @RequestParam DocumentType documentType) {

                try {
                        readStatusService.markAsRead(documentId, documentType);
                        return ResponseEntity.ok(ResponseDTO.success("Đánh dấu văn bản đã đọc thành công"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi đánh dấu văn bản đã đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Mark document as unread", description = "Marks a document as unread for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document marked as unread successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @PostMapping("/{documentId}/mark-unread")
        public ResponseEntity<ResponseDTO<String>> markAsUnread(
                        @Parameter(description = "ID of the document to mark as unread") @PathVariable Long documentId,
                        @Parameter(description = "Type of document") @RequestParam DocumentType documentType) {

                try {
                        readStatusService.markAsUnread(documentId, documentType);
                        return ResponseEntity.ok(ResponseDTO.success("Đánh dấu văn bản chưa đọc thành công"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO
                                                        .error("Lỗi khi đánh dấu văn bản chưa đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Check if document is read", description = "Checks if a document has been read by the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Read status retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/{documentId}/is-read")
        public ResponseEntity<ResponseDTO<Map<String, Boolean>>> isDocumentRead(
                        @Parameter(description = "ID of the document to check") @PathVariable Long documentId,
                        @Parameter(description = "Type of document") @RequestParam DocumentType documentType) {

                try {
                        boolean isRead = readStatusService.isDocumentRead(documentId, documentType);
                        return ResponseEntity.ok(ResponseDTO.success(Map.of("isRead", isRead)));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi kiểm tra trạng thái đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get read status for multiple documents", description = "Gets read status for multiple documents for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Read statuses retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @PostMapping("/batch-status")
        public ResponseEntity<ResponseDTO<Map<Long, Boolean>>> getReadStatusForDocuments(
                        @Parameter(description = "List of document IDs") @RequestBody List<Long> documentIds,
                        @Parameter(description = "Type of documents") @RequestParam DocumentType documentType) {

                try {
                        Map<Long, Boolean> readStatuses = readStatusService.getReadStatusForDocuments(documentIds,
                                        documentType);
                        return ResponseEntity.ok(ResponseDTO.success(readStatuses));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy trạng thái đọc của nhiều văn bản: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get read status for multiple documents (GET)", description = "Gets read status for multiple documents (comma separated IDs) for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Read statuses retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/batch-status")
        public ResponseEntity<ResponseDTO<Map<Long, Boolean>>> getReadStatusForDocumentsGet(
                        @Parameter(description = "Comma separated list of document IDs, e.g. 1,2,3") @RequestParam String documentIds,
                        @Parameter(description = "Type of documents") @RequestParam DocumentType documentType) {

                try {
                        if (documentIds == null || documentIds.isBlank()) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Thiếu danh sách ID văn bản"));
                        }

                        List<Long> ids = java.util.Arrays.stream(documentIds.split(","))
                                        .map(String::trim)
                                        .filter(s -> !s.isEmpty())
                                        .map(Long::valueOf)
                                        .toList();

                        if (ids.isEmpty()) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Danh sách ID văn bản trống"));
                        }

                        Map<Long, Boolean> readStatuses = readStatusService.getReadStatusForDocuments(ids,
                                        documentType);
                        return ResponseEntity.ok(ResponseDTO.success(readStatuses));
                } catch (NumberFormatException nfe) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Định dạng ID văn bản không hợp lệ: " + nfe.getMessage()));
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(
                                        ResponseDTO.error("Lỗi khi lấy trạng thái đọc của nhiều văn bản: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Count unread documents", description = "Returns the count of unread documents for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Unread count retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/unread/count")
        public ResponseEntity<ResponseDTO<Map<String, Long>>> countUnreadDocuments(
                        @Parameter(description = "Type of documents") @RequestParam DocumentType documentType) {

                try {
                        long unreadCount = readStatusService.countUnreadDocuments(documentType);
                        return ResponseEntity.ok(ResponseDTO.success(Map.of("unreadCount", unreadCount)));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi đếm số văn bản chưa đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get unread document IDs", description = "Returns list of unread document IDs for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Unread document IDs retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/unread/ids")
        public ResponseEntity<ResponseDTO<List<Long>>> getUnreadDocumentIds(
                        @Parameter(description = "Type of documents") @RequestParam DocumentType documentType) {

                try {
                        List<Long> unreadIds = readStatusService.getUnreadDocumentIds(documentType);
                        return ResponseEntity.ok(ResponseDTO.success(unreadIds));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách ID văn bản chưa đọc: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get document readers", description = "Returns list of all users who should read the document with their read status")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document readers retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/{documentId}/readers")
        public ResponseEntity<ResponseDTO<List<DocumentReaderDTO>>> getDocumentReaders(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Type of document") @RequestParam DocumentType documentType) {

                try {
                        List<DocumentReaderDTO> readers = readStatusService.getDocumentReaders(documentId,
                                        documentType);
                        return ResponseEntity.ok(ResponseDTO.success(readers));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách người đọc văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get document readers who have read", description = "Returns list of users who have actually read the document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document readers retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/{documentId}/readers/read-only")
        public ResponseEntity<ResponseDTO<List<DocumentReaderDTO>>> getDocumentReadersOnly(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Type of document") @RequestParam DocumentType documentType) {

                try {
                        List<DocumentReaderDTO> readers = readStatusService.getDocumentReadersOnly(documentId,
                                        documentType);
                        return ResponseEntity.ok(ResponseDTO.success(readers));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách người đã đọc văn bản: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get document read statistics", description = "Returns read statistics for a document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized")
        })
        @GetMapping("/{documentId}/statistics")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentReadStatistics(
                        @Parameter(description = "ID of the document") @PathVariable Long documentId,
                        @Parameter(description = "Type of document") @RequestParam DocumentType documentType) {

                try {
                        Map<String, Object> statistics = readStatusService.getDocumentReadStatistics(documentId,
                                        documentType);
                        return ResponseEntity.ok(ResponseDTO.success(statistics));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy thống kê đọc văn bản: " + e.getMessage()));
                }
        }
}

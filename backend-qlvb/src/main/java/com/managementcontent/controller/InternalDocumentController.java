package com.managementcontent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.managementcontent.dto.CreateInternalDocumentDTO;
import com.managementcontent.dto.InternalDocumentDTO;
import com.managementcontent.dto.InternalDocumentHistoryDTO;
import com.managementcontent.dto.DocumentReaderDTO;
import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.InternalDocument.Priority;
import com.managementcontent.model.DocumentReadStatus.DocumentType;
import com.managementcontent.model.User;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.service.InternalDocumentService;
import com.managementcontent.service.DocumentReadStatusService;
import com.managementcontent.service.InternalDocumentDemoService;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/internal-documents")
@RequiredArgsConstructor
@Tag(name = "Internal Documents", description = "APIs for managing internal documents")
public class InternalDocumentController {

        private final InternalDocumentService internalDocumentService;
        private final DocumentReadStatusService documentReadStatusService;
        private final InternalDocumentDemoService demoService;
        private final ObjectMapper objectMapper;
        private final UserRepository userRepository;

        @Operation(summary = "Create new internal document", description = "Creates a new internal document with recipients and optional file attachments")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Document successfully created"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to create documents")
        })
        @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE })
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")

        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> createDocument(
                        @Parameter(description = "Document details as JSON string", required = true) @RequestPart("document") String documentJson,
                        @Parameter(description = "Files to attach (optional)", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)) @RequestPart(value = "files", required = false) MultipartFile[] files,
                        @Parameter(description = "File descriptions (optional)") @RequestPart(value = "descriptions", required = false) String[] descriptions) {

                try {
                        CreateInternalDocumentDTO createDTO = objectMapper.readValue(documentJson,
                                        CreateInternalDocumentDTO.class);

                        if (internalDocumentService.checkDocumentNumber(createDTO.getDocumentNumber())) {
                                System.out.println("loiiiiiiiiiiiiiiiiiii");
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Số văn bản đã tồn tại"));
                        }

                        InternalDocumentDTO createdDocument = internalDocumentService.createDocumentWithAttachments(
                                        createDTO, files, descriptions);

                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Tạo văn bản thành công", createdDocument));
                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể tạo văn bản: " + e.getMessage()));
                }
        }
        @Operation(summary = "Create new internal document", description = "Update a new internal document with recipients and optional file attachments")
        @ApiResponses({
                @ApiResponse(responseCode = "201", description = "Document successfully update"),
                @ApiResponse(responseCode = "400", description = "Invalid input data"),
                @ApiResponse(responseCode = "403", description = "Not authorized to create documents")
        })
        @PutMapping(value = "/{id}",consumes = { MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE })
        // @PreAut

        public ResponseEntity<ResponseDTO<Boolean>> updateDocument(
                @Parameter(description = "ID of the document to retrieve") @PathVariable Long id,
                @Parameter(description = "Document details as JSON string", required = true) @RequestPart("document") String documentJson,
                @Parameter(description = "Files to attach (optional)", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)) @RequestPart(value = "files", required = false) MultipartFile[] files,
                @Parameter(description = "File descriptions (optional)") @RequestPart(value = "descriptions", required = false) String[] descriptions) {

                try {
                        CreateInternalDocumentDTO createDTO = objectMapper.readValue(documentJson,
                                CreateInternalDocumentDTO.class);
                        Boolean createdDocument = internalDocumentService.updateDocumentWithAttachments(id,
                                createDTO, files, descriptions);

                        return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ResponseDTO.success("Sửa bản thành công", createdDocument));
                } catch (Exception e) {
                        e.printStackTrace();
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(ResponseDTO.error("Không thể sửa văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Create new internal document (JSON only)", description = "Creates a new internal document with recipients (without file attachments)")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Document successfully created"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to create documents")
        })
        @PostMapping(value = "/json", consumes = MediaType.APPLICATION_JSON_VALUE)
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> createDocumentJson(
                        @Parameter(description = "Document details", required = true) @Valid @RequestBody CreateInternalDocumentDTO createDTO) {
                try {
                        InternalDocumentDTO createdDocument = internalDocumentService.createDocument(createDTO);
                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Tạo văn bản thành công", createdDocument));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể tạo văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get internal document by ID", description = "Returns a single internal document by ID. Marks as read if user is recipient.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved document"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view this document")
        })
        @GetMapping("/{id}")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> getDocumentById(
                        @Parameter(description = "ID of the document to retrieve") @PathVariable Long id) {
                try {
                        return internalDocumentService.getDocumentById(id)
                                        .map(doc -> ResponseEntity.ok(ResponseDTO.success(doc)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy văn bản")));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy thông tin văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get documents sent by current user", description = "Returns a paginated list of documents sent by the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved sent documents")
        })
        @GetMapping("/sent")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getSentDocuments(Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.getSentDocuments(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách văn bản đã gửi: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get all documents sent by current user", description = "Returns all documents sent by the current user (no pagination)")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved all sent documents")
        })
        @GetMapping("/sent/all")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<List<InternalDocumentDTO>>> getAllSentDocuments() {
                try {
                        List<InternalDocumentDTO> documents = internalDocumentService.getAllSentDocuments();
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy tất cả văn bản đã gửi: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get documents sent by current user within a specific year", description = "Returns a paginated list of documents sent by the current user within the specified year")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved sent documents by year"),
                        @ApiResponse(responseCode = "400", description = "Invalid year parameter")
        })
        @GetMapping("/sent/by-year/{year}")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getSentDocumentsByYear(
                        @Parameter(description = "Year to filter documents (e.g., 2024, 2025)") @PathVariable int year,
                        @Parameter(description = "Month to filter documents (optional, 1-12)") @RequestParam(required = false) Integer month,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2200) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error(
                                                                "Năm không hợp lệ. Vui lòng nhập năm từ 1900 đến 2100"));
                        }
                        if (month != null && (month < 1 || month > 12)) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error(
                                                                "Tháng không hợp lệ. Vui lòng nhập tháng từ 1 đến 12"));
                        }

                        Page<InternalDocumentDTO> documents = internalDocumentService
                                        .getSentDocumentsByYearAndMonth(year, month, pageable);
                        String message = month != null
                                        ? String.format("Lấy danh sách văn bản đã gửi tháng %d/%d thành công", month,
                                                        year)
                                        : String.format("Lấy danh sách văn bản đã gửi năm %d thành công", year);
                        return ResponseEntity.ok(ResponseDTO.success(message, documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách văn bản đã gửi: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get documents received by current user", description = "Returns a paginated list of documents received by the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved received documents")
        })
        @GetMapping("/received")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getReceivedDocuments(Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.getReceivedDocuments(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách văn bản đã nhận: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get all documents received by current user", description = "Returns all documents received by the current user (no pagination)")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved all received documents")
        })
        @GetMapping("/received/all")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<List<InternalDocumentDTO>>> getAllReceivedDocuments() {
                try {
                        List<InternalDocumentDTO> documents = internalDocumentService.getAllReceivedDocuments();
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy tất cả văn bản đã nhận: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get documents received by current user within a specific year", description = "Returns a paginated list of documents received by the current user within the specified year")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved received documents by year"),
                        @ApiResponse(responseCode = "400", description = "Invalid year parameter")
        })
        @GetMapping("/received/by-year/{year}")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getReceivedDocumentsByYear(
                        @Parameter(description = "Year to filter documents (e.g., 2024, 2025)") @PathVariable int year,
                        @Parameter(description = "Month to filter documents (optional, 1-12)") @RequestParam(required = false) Integer month,
                        Pageable pageable) {
                try {
                        if (year < 1900 || year > 2100) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error(
                                                                "Năm không hợp lệ. Vui lòng nhập năm từ 1900 đến 2100"));
                        }
                        if (month != null && (month < 1 || month > 12)) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error(
                                                                "Tháng không hợp lệ. Vui lòng nhập tháng từ 1 đến 12"));
                        }

                        Page<InternalDocumentDTO> documents = internalDocumentService
                                        .getReceivedDocumentsByYearAndMonth(year, month, pageable);
                        String message = month != null
                                        ? String.format("Lấy danh sách văn bản đã nhận tháng %d/%d thành công", month,
                                                        year)
                                        : String.format("Lấy danh sách văn bản đã nhận năm %d thành công", year);
                        return ResponseEntity.ok(ResponseDTO.success(message, documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách văn bản đã nhận: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get unread documents for current user", description = "Returns a paginated list of unread documents for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved unread documents")
        })
        @GetMapping("/unread")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getUnreadDocuments(Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.getUnreadDocuments(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách văn bản chưa đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get all unread documents for current user", description = "Returns all unread documents for the current user (no pagination)")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved all unread documents")
        })
        @GetMapping("/unread/all")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<List<InternalDocumentDTO>>> getAllUnreadDocuments() {
                try {
                        List<InternalDocumentDTO> documents = internalDocumentService.getAllUnreadDocuments();
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy tất cả văn bản chưa đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Count unread documents", description = "Returns the count of unread documents for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved unread count")
        })
        @GetMapping("/unread/count")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Long>> countUnreadDocuments() {
                try {
                        Long count = internalDocumentService.countUnreadDocuments();
                        return ResponseEntity.ok(ResponseDTO.success(count));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi đếm số văn bản chưa đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Search internal documents", description = "Search internal documents by keyword in title, summary, or notes")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Search completed successfully")
        })
        @GetMapping("/search")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> searchDocuments(
                        @Parameter(description = "Keyword to search for") @RequestParam String keyword,
                        Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.searchDocuments(keyword,
                                        pageable);
                        System.out.println(documents.getSize());
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi tìm kiếm văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Advanced search with filters", description = "Search documents with multiple filter criteria")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Search completed successfully")
        })
        @GetMapping("/search/advanced")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> searchWithFilters(
                        @Parameter(description = "Sender user ID") @RequestParam(required = false) Long senderId,
                        @Parameter(description = "Recipient user ID") @RequestParam(required = false) Long recipientUserId,
                        @Parameter(description = "Recipient department ID") @RequestParam(required = false) Long recipientDepartmentId,
                        @Parameter(description = "Document priority") @RequestParam(required = false) Priority priority,
                        @Parameter(description = "Document type") @RequestParam(required = false) String documentType,
                        @Parameter(description = "Start date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                        @Parameter(description = "End date (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
                        @Parameter(description = "Keyword to search for") @RequestParam(required = false) String keyword,
                        Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.searchWithFilters(
                                        senderId, recipientUserId, recipientDepartmentId, priority,
                                        documentType, startDate, endDate, keyword, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi tìm kiếm nâng cao: " + e.getMessage()));
                }
        }

        @Operation(summary = "Reply to a document", description = "Creates a reply to an existing internal document")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Reply successfully created"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "404", description = "Original document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to reply to this document")
        })
        @PostMapping("/{id}/reply")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> replyToDocument(
                        @Parameter(description = "ID of the document to reply to") @PathVariable Long id,
                        @Parameter(description = "Reply document details", required = true) @Valid @RequestBody CreateInternalDocumentDTO replyDTO) {

                try {
                        InternalDocumentDTO reply = internalDocumentService.replyToDocument(id, replyDTO);
                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Trả lời văn bản thành công", reply));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể trả lời văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Reply to a document with attachments", description = "Creates a reply to an existing internal document with file attachments")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Reply with attachments successfully created"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "404", description = "Original document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to reply to this document")
        })
        @PostMapping(value = "/{id}/reply-with-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> replyToDocumentWithAttachments(
                        @Parameter(description = "ID of the document to reply to") @PathVariable Long id,
                        @Parameter(description = "Reply document details as JSON string", required = true) @RequestPart("document") String documentJson,
                        @Parameter(description = "Files to attach (optional)", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)) @RequestPart(value = "files", required = false) MultipartFile[] files,
                        @Parameter(description = "File descriptions (optional)") @RequestPart(value = "descriptions", required = false) String[] descriptions) {

                try {
                        CreateInternalDocumentDTO replyDTO = objectMapper.readValue(documentJson,
                                        CreateInternalDocumentDTO.class);
                        /// check document number is already or not
                        if (internalDocumentService.checkDocumentNumber(replyDTO.getDocumentNumber())) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                                .body(ResponseDTO.error("Số văn bản đã tồn tại"));
                        }
                        InternalDocumentDTO reply = internalDocumentService.replyToDocumentWithAttachments(
                                        id, replyDTO, files, descriptions);

                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Trả lời văn bản thành công", reply));
                } catch (Exception e) {
                        System.err.println("Error in replyToDocumentWithAttachments: " + e.getMessage());
                        e.printStackTrace();

                        if (e instanceof org.springframework.web.multipart.MultipartException) {
                                throw (org.springframework.web.multipart.MultipartException) e;
                        }

                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Không thể trả lời văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Upload document attachment", description = "Uploads a file attachment for an internal document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "File successfully uploaded"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
        })
        @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> uploadAttachment(
                        @Parameter(description = "ID of the document") @PathVariable Long id,
                        @Parameter(description = "File to upload", required = true) @RequestPart("file") MultipartFile file,
                        @Parameter(description = "File description") @RequestPart(value = "description", required = false) String description) {
                try {
                        InternalDocumentDTO updatedDocument = internalDocumentService.addAttachment(id, file,
                                        description);
                        return ResponseEntity
                                        .ok(ResponseDTO.success("Tải lên tệp đính kèm thành công", updatedDocument));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi tải lên tệp đính kèm: " + e.getMessage()));
                }
        }

        @Operation(summary = "Upload multiple document attachments", description = "Uploads multiple file attachments for an internal document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Files successfully uploaded"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during upload"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to upload attachments")
        })
        @PostMapping(value = "/{id}/attachments/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<InternalDocumentDTO>> uploadMultipleAttachments(
                        @Parameter(description = "ID of the document") @PathVariable Long id,
                        @Parameter(description = "Files to upload", required = true) @RequestPart("files") MultipartFile[] files,
                        @Parameter(description = "File descriptions") @RequestPart(value = "descriptions", required = false) String[] descriptions) {
                try {
                        InternalDocumentDTO updatedDocument = null;
                        for (int i = 0; i < files.length; i++) {
                                String description = (descriptions != null && i < descriptions.length) ? descriptions[i]
                                                : null;
                                updatedDocument = internalDocumentService.addAttachment(id, files[i], description);
                        }
                        return ResponseEntity.ok(
                                        ResponseDTO.success("Tải lên nhiều tệp đính kèm thành công", updatedDocument));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi tải lên nhiều tệp đính kèm: " + e.getMessage()));
                }
        }

        @Operation(summary = "Download document attachment", description = "Downloads a file attachment from an internal document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "File ready for download"),
                        @ApiResponse(responseCode = "404", description = "Document or attachment not found"),
                        @ApiResponse(responseCode = "500", description = "Internal server error during download"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to download attachments")
        })
        @GetMapping("/{id}/attachments/{attachmentId}")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<?> downloadAttachment(
                        @Parameter(description = "ID of the document") @PathVariable Long id,
                        @Parameter(description = "ID of the attachment") @PathVariable Long attachmentId) {
                try {
                        return internalDocumentService.downloadAttachment(id,
                                        attachmentId);
                } catch (FileNotFoundException e) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found");
                } catch (AccessDeniedException e) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body("Error downloading file: " + e.getMessage());
                }
        }

        @Operation(summary = "Get document statistics", description = "Returns statistics about internal documents for the current user")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved statistics")
        })
        @GetMapping("/statistics")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentStatistics() {
                try {
                        Long unreadCount = internalDocumentService.countUnreadDocuments();
                        Map<String, Object> statistics = Map.of(
                                        "unreadCount", unreadCount,
                                        "timestamp", LocalDateTime.now());
                        return ResponseEntity.ok(ResponseDTO.success(statistics));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy thống kê văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get document by priority", description = "Returns documents filtered by priority level")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved documents by priority")
        })
        @GetMapping("/priority/{priority}")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getDocumentsByPriority(
                        @Parameter(description = "Priority level") @PathVariable Priority priority,
                        Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.searchWithFilters(
                                        null, null, null, priority, null, null, null, null, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy văn bản theo độ ưu tiên: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get documents by date range", description = "Returns documents within a specific date range")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved documents by date range")
        })
        @GetMapping("/date-range")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getDocumentsByDateRange(
                        @Parameter(description = "Start date (ISO format)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                        @Parameter(description = "End date (ISO format)") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
                        Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.searchWithFilters(
                                        null, null, null, null, null, startDate, endDate, null, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy văn bản theo khoảng thời gian: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get documents by type", description = "Returns documents filtered by document type")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved documents by type")
        })
        @GetMapping("/type/{documentType}")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Page<InternalDocumentDTO>>> getDocumentsByType(
                        @Parameter(description = "Document type") @PathVariable String documentType,
                        Pageable pageable) {
                try {
                        Page<InternalDocumentDTO> documents = internalDocumentService.searchWithFilters(
                                        null, null, null, null, documentType, null, null, null, pageable);
                        return ResponseEntity.ok(ResponseDTO.success(documents));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy văn bản theo loại: " + e.getMessage()));
                }
        }

        /**
         * Get document history
         */
        @GetMapping("/{id}/history")
        public ResponseEntity<ResponseDTO<List<InternalDocumentHistoryDTO>>> getDocumentHistory(@PathVariable Long id) {
                try {
                        List<InternalDocumentHistoryDTO> history = internalDocumentService.getDocumentHistory(id);
                        return ResponseEntity.ok(ResponseDTO.success(history));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy lịch sử văn bản: " + e.getMessage()));
                }
        }

        /**
         * Get document replies
         */
        @GetMapping("/{id}/replies")
        public ResponseEntity<ResponseDTO<List<InternalDocumentDTO>>> getDocumentReplies(@PathVariable Long id) {
                try {
                        List<InternalDocumentDTO> replies = internalDocumentService.getDocumentReplies(id);
                        return ResponseEntity.ok(ResponseDTO.success(replies));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách trả lời: " + e.getMessage()));
                }
        }

        /**
         * Get document thread (original + all replies in chronological order)
         */
        @GetMapping("/{id}/thread")
        public ResponseEntity<ResponseDTO<List<InternalDocumentDTO>>> getDocumentThread(@PathVariable Long id) {
                try {
                        List<InternalDocumentDTO> thread = internalDocumentService.getDocumentThread(id);
                        return ResponseEntity.ok(ResponseDTO.success(thread));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy chuỗi văn bản: " + e.getMessage()));
                }
        }

        /**
         * Get document statistics including reply count, read status, etc.
         */
        @GetMapping("/{id}/stats")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentStats(@PathVariable Long id) {
                try {
                        Optional<InternalDocumentDTO> document = internalDocumentService.getDocumentById(id);
                        if (document.isPresent()) {
                                List<InternalDocumentDTO> replies = internalDocumentService.getDocumentReplies(id);
                                List<InternalDocumentHistoryDTO> history = internalDocumentService
                                                .getDocumentHistory(id);

                                Map<String, Object> stats = new HashMap<>();
                                stats.put("replyCount", replies.size());
                                stats.put("historyCount", history.size());
                                stats.put("isRead", document.get().getIsRead());
                                stats.put("readAt", document.get().getReadAt());
                                stats.put("createdAt", document.get().getCreatedAt());
                                stats.put("lastActivity", history.isEmpty() ? document.get().getCreatedAt()
                                                : history.get(0).getPerformedAt());

                                return ResponseEntity.ok(ResponseDTO.success(stats));
                        } else {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy văn bản"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy thống kê văn bản: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get document readers", description = "Returns list of all users who should read the document with their read status")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document readers retrieved successfully"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view document readers")
        })
        @GetMapping("/{id}/readers")
        public ResponseEntity<ResponseDTO<List<DocumentReaderDTO>>> getDocumentReaders(@PathVariable Long id) {
                try {
                        Optional<InternalDocumentDTO> document = internalDocumentService.getDocumentById(id);
                        if (document.isPresent()) {
                                List<DocumentReaderDTO> readers = documentReadStatusService.getDocumentReaders(id,
                                                DocumentType.OUTGOING_INTERNAL);
                                return ResponseEntity.ok(ResponseDTO.success(readers));
                        } else {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy văn bản"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách người đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get document readers who have read", description = "Returns list of users who have actually read the document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Document readers retrieved successfully"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view document readers")
        })
        @GetMapping("/{id}/readers/read-only")
        public ResponseEntity<ResponseDTO<List<DocumentReaderDTO>>> getDocumentReadersOnly(@PathVariable Long id) {
                try {
                        Optional<InternalDocumentDTO> document = internalDocumentService.getDocumentById(id);
                        if (document.isPresent()) {
                                List<DocumentReaderDTO> readers = documentReadStatusService.getDocumentReadersOnly(id,
                                                DocumentType.OUTGOING_INTERNAL);
                                return ResponseEntity.ok(ResponseDTO.success(readers));
                        } else {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy văn bản"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách người đã đọc: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get document read statistics", description = "Returns read statistics for a document")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully"),
                        @ApiResponse(responseCode = "404", description = "Document not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view document statistics")
        })
        @GetMapping("/{id}/read-statistics")
        public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentReadStatistics(@PathVariable Long id) {
                try {
                        Optional<InternalDocumentDTO> document = internalDocumentService.getDocumentById(id);
                        if (document.isPresent()) {
                                Map<String, Object> statistics = documentReadStatusService.getDocumentReadStatistics(id,
                                                DocumentType.OUTGOING_INTERNAL);
                                return ResponseEntity.ok(ResponseDTO.success(statistics));
                        } else {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy văn bản"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi lấy thống kê đọc: " + e.getMessage()));
                }
        }

        /**
         * Tạo 1000 văn bản nội bộ demo
         */
        @Operation(summary = "Tạo 1000 văn bản nội bộ demo", description = "Tạo 1000 văn bản nội bộ với dữ liệu ngẫu nhiên nhưng thực tế")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Tạo dữ liệu demo thành công"),
                        @ApiResponse(responseCode = "500", description = "Lỗi khi tạo dữ liệu demo")
        })
        @PostMapping("/demo/create")
        public ResponseEntity<ResponseDTO<String>> createDemoDocuments() {
                try {
                        demoService.createDemoInternalDocuments();
                        return ResponseEntity.ok(ResponseDTO.success("Đã tạo thành công 1000 văn bản nội bộ demo"));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi tạo dữ liệu demo: " + e.getMessage()));
                }
        }

        /**
         * Kiểm tra số lượng văn bản hiện có
         */
        @Operation(summary = "Kiểm tra số lượng văn bản", description = "Trả về tổng số văn bản nội bộ hiện có trong hệ thống")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Lấy thông tin thành công")
        })
        @GetMapping("/demo/count")
        public ResponseEntity<ResponseDTO<Long>> countDocuments() {
                try {
                        long count = demoService.countTotalDocuments();
                        return ResponseEntity.ok(ResponseDTO.success(count));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi đếm văn bản: " + e.getMessage()));
                }
        }

        // ================== NOTIFICATION ENDPOINTS ==================

        /**
         * Gửi văn bản nội bộ đến danh sách người nhận
         */
        @Operation(summary = "Gửi văn bản nội bộ", description = "Gửi văn bản nội bộ đến danh sách người nhận và tạo thông báo")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Gửi văn bản thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy văn bản"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền gửi văn bản"),
                        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ")
        })
        @PostMapping("/{id}/send")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<String>> sendInternalDocument(
                        @Parameter(description = "ID của văn bản nội bộ") @PathVariable Long id,
                        @Parameter(description = "Danh sách ID người nhận") @RequestBody List<Long> recipientUserIds) {

                try {
                        boolean success = internalDocumentService.sendInternalDocument(
                                        id, recipientUserIds, getCurrentUser());

                        if (success) {
                                return ResponseEntity.ok(ResponseDTO.success("Gửi văn bản thành công"));
                        } else {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Gửi văn bản thất bại"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi gửi văn bản: " + e.getMessage()));
                }
        }

        /**
         * Đánh dấu văn bản nội bộ đã đọc
         */
        @Operation(summary = "Đánh dấu đã đọc", description = "Đánh dấu văn bản nội bộ đã được đọc và gửi thông báo cho người gửi")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Đánh dấu đã đọc thành công"),
                        @ApiResponse(responseCode = "404", description = "Không tìm thấy văn bản"),
                        @ApiResponse(responseCode = "403", description = "Không có quyền đọc văn bản"),
                        @ApiResponse(responseCode = "400", description = "Văn bản đã được đọc trước đó")
        })
        @PostMapping("/{id}/mark-read")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<String>> markAsRead(
                        @Parameter(description = "ID của văn bản nội bộ") @PathVariable Long id) {

                try {
                        internalDocumentService.markAsRead(id);
                        return ResponseEntity.ok(ResponseDTO.success("Đã đánh dấu văn bản là đã đọc"));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(ResponseDTO.error("Lỗi khi đánh dấu đã đọc: " + e.getMessage()));
                }
        }

        /**
         * Kiểm tra quyền truy cập văn bản
         */
        @Operation(summary = "Kiểm tra quyền truy cập", description = "Kiểm tra xem người dùng hiện tại có quyền truy cập văn bản không")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Kiểm tra thành công")
        })
        @GetMapping("/{id}/access-check")
        // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
        public ResponseEntity<ResponseDTO<Boolean>> checkAccess(
                        @Parameter(description = "ID của văn bản nội bộ") @PathVariable Long id) {

                try {
                        boolean hasAccess = internalDocumentService.hasAccessToDocument(id, getCurrentUser());
                        return ResponseEntity.ok(ResponseDTO.success(hasAccess));
                } catch (Exception e) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ResponseDTO.error("Lỗi khi kiểm tra quyền truy cập: " + e.getMessage()));
                }
        }

        /**
         * Helper method to get current authenticated user
         */
        private User getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String username = authentication.getName();
                return userRepository.findByName(username)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        }
}
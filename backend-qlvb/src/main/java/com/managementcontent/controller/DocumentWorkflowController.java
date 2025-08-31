package com.managementcontent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.managementcontent.dto.*;
import com.managementcontent.model.*;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.model.DocumentAttachment;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.DocumentHistoryRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static com.managementcontent.util.RoleGroupUtil.isChiHuyDonVi;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
@Tag(name = "Document Workflow", description = "APIs for document workflow operations")
public class DocumentWorkflowController {

    private final DocumentWorkflowService documentWorkflowService;
    private final DocumentDepartmentService documentDepartmentService;
    private final UserRepository userRepository;
    private final IncomingDocumentService incomingDocumentService;
    private final UserService userService;
    private final DepartmentRepository departmentRepository;
    private final DocumentHistoryRepository documentHistoryRepository;
    private final OutgoingDocumentService outgoingDocumentService;
    private final DocumentRelationshipService documentRelationshipService;
    private final DepartmentService departmentService;

    @Operation(summary = "Change document status", description = "Changes the status of a document in the workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document status successfully changed"),
            @ApiResponse(responseCode = "400", description = "Invalid status transition"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to change document status")
    })
    @PutMapping("/{documentId}/status")
    public ResponseEntity<ResponseDTO<String>> changeDocumentStatus(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            // Get current authenticated user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User currentUser = userRepository.findByName(username).orElse(null);

            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Convert string status to enum
            DocumentProcessingStatus targetStatus = DocumentProcessingStatus.fromCode(workflowDTO.getStatus());
            if (targetStatus == null) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Trạng thái không hợp lệ"));
            }

            // Check if the status transition is valid
            if (documentWorkflowService.canChangeStatus(documentId, targetStatus)) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Chuyển trạng thái không hợp lệ"));
            }

            // Change status
            return documentWorkflowService.changeDocumentStatus(
                    documentId,
                    targetStatus,
                    currentUser,
                    workflowDTO.getComments())
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Cập nhật trạng thái văn bản thành công")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi thay đổi trạng thái văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Assign document", description = "Assigns a document to a user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully assigned"),
            @ApiResponse(responseCode = "404", description = "Document or user not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to assign document")
    })
    @PostMapping("/{documentId}/assign")
    public ResponseEntity<ResponseDTO<String>> assignDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            // Get current authenticated user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            User currentUser = userRepository.findByName(username).orElse(null);

            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Get assigned user
            User assignedTo = userRepository.findById(workflowDTO.getAssignedToId())
                    .orElse(null);

            if (assignedTo == null) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Không tìm thấy người được phân công"));
            }

            // Assign document
            return documentWorkflowService.assignDocument(
                    documentId,
                    assignedTo,
                    currentUser,
                    workflowDTO.getComments())
                    .map(history -> ResponseEntity.ok(ResponseDTO.success("Phân công văn bản thành công")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi phân công văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get document history", description = "Returns the workflow history of a document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved document history"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view document history")
    })
    @GetMapping("/{documentId}/history")
    public ResponseEntity<ResponseDTO<List<DocumentHistoryDTO>>> getDocumentHistory(
            @Parameter(description = "ID of the document") @PathVariable Long documentId) {

        try {
            List<DocumentHistory> history = documentWorkflowService.getDocumentHistory(documentId);

            if (history.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy lịch sử văn bản"));
            }

            List<DocumentHistoryDTO> historyDTOs = history.stream()
                    .map(this::convertToHistoryDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ResponseDTO.success(historyDTOs));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy lịch sử văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get document status", description = "Returns the current status of a document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved document status"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view document status")
    })
    @GetMapping("/{documentId}/status")
    public ResponseEntity<ResponseDTO<DocumentWorkflowDTO>> getDocumentStatus(
            @Parameter(description = "ID of the document") @PathVariable Long documentId) {

        try {
            DocumentProcessingStatus status = documentWorkflowService.getDocumentStatus(documentId);

            if (status == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy văn bản"));
            }

            DocumentWorkflowDTO dto = new DocumentWorkflowDTO();
            dto.setDocumentId(documentId);
            dto.setStatus(status.getCode());
            System.out.println("Status: " + status.getDisplayName());
            dto.setStatusDisplayName(status.getDisplayName());

            // Get assignees if needed
            List<User> assignees = documentWorkflowService.getDocumentAssignees(documentId);
            if (!assignees.isEmpty()) {
                User lastAssignee = assignees.get(0);
                dto.setAssignedToId(lastAssignee.getId());
                dto.setAssignedToName(lastAssignee.getName());
                dto.setAssignedToIds(assignees.stream()
                        .map(User::getId).collect(Collectors.toList()));
                dto.setAssignedToNames(assignees.stream()
                        .map(User::getFullName).collect(Collectors.toList()));

            }
            Department primaryDepartment = documentWorkflowService.getDocumentAssigneePrimary(documentId);

            if (primaryDepartment != null) {
                dto.setPrimaryDepartmentId(primaryDepartment.getId());
                dto.setPrimaryDepartmentName(primaryDepartment.getName());
            }

            Set<Department> collaboratingDepartments = documentWorkflowService.getDocumentAssigneesCollabs(documentId);
            if (!collaboratingDepartments.isEmpty()) {
                Set<Long> collaboratingDepartmentIds = collaboratingDepartments.stream()
                        .map(Department::getId)
                        .collect(Collectors.toSet());
                dto.setCollaboratingDepartmentIds(collaboratingDepartmentIds);
                dto.setCollaboratingDepartmentNames(
                        collaboratingDepartments.stream()
                                .map(Department::getName)
                                .collect(Collectors.toSet()));
            }
            return ResponseEntity.ok(ResponseDTO.success(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy trạng thái văn bản: " + e.getMessage()));
        }
    }

    // ==================== 1. Văn thư Endpoints ====================

    @Operation(summary = "Register incoming document", description = "Văn thư registers a newly received document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully registered"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to register document")
    })
    @PutMapping("/{documentId}/register")
    public ResponseEntity<ResponseDTO<String>> registerIncomingDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService.registerIncomingDocument(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Document successfully registered")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi đăng ký văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Publish outgoing document", description = "Văn thư publishes an outgoing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully published"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to publish document")
    })
    @PutMapping("/{documentId}/publish")
    public ResponseEntity<ResponseDTO<String>> publishOutgoingDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService.publishOutgoingDocument(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Document successfully published")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi xuất bản văn bản: " + e.getMessage()));
        }
    }

    // ==================== 2. Phân văn bản Endpoints ====================

    @Operation(summary = "Distribute document", description = "Distribute document to relevant departments")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully distributed"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to distribute document"),
            @ApiResponse(responseCode = "400", description = "Invalid request parameters")
    })
    @PutMapping("/{documentId}/distribute")
    public ResponseEntity<ResponseDTO<Object>> distributeDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Distribution details", required = true) @RequestBody Map<String, Object> request) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            String comments = request.containsKey("comments") ? (String) request.get("comments") : "";

            // Nếu có primaryDepartmentId và/hoặc collaboratingDepartmentIds, sử dụng phương
            // thức nâng cao
            if (request.containsKey("primaryDepartmentId") || request.containsKey("collaboratingDepartmentIds")) {

                Long primaryDepartmentId = null;
                if (request.containsKey("primaryDepartmentId") && request.get("primaryDepartmentId") != null) {
                    if (request.get("primaryDepartmentId") instanceof Integer) {
                        primaryDepartmentId = ((Integer) request.get("primaryDepartmentId")).longValue();
                    } else if (request.get("primaryDepartmentId") instanceof Long) {
                        primaryDepartmentId = (Long) request.get("primaryDepartmentId");
                    } else {
                        try {
                            primaryDepartmentId = Long.parseLong(request.get("primaryDepartmentId").toString());
                        } catch (NumberFormatException e) {
                            return ResponseEntity.badRequest()
                                    .body(ResponseDTO.error("Invalid primaryDepartmentId format"));
                        }
                    }
                }

                List<Long> collaboratingDepartmentIds = null;
                if (request.containsKey("collaboratingDepartmentIds")
                        && request.get("collaboratingDepartmentIds") != null) {
                    try {
                        collaboratingDepartmentIds = ((List<?>) request.get("collaboratingDepartmentIds"))
                                .stream()
                                .map(item -> {
                                    if (item instanceof Integer) {
                                        return ((Integer) item).longValue();
                                    } else if (item instanceof Long) {
                                        return (Long) item;
                                    } else {
                                        return Long.parseLong(item.toString());
                                    }
                                })
                                .collect(Collectors.toList());
                    } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                .body(ResponseDTO.error("Invalid collaboratingDepartmentIds format"));
                    }
                }

                // Phân phối văn bản đến các phòng ban
                Optional<Document> result = documentWorkflowService.distributeDocument(
                        documentId,
                        primaryDepartmentId,
                        collaboratingDepartmentIds,
                        currentUser,
                        comments);

                if (result.isPresent()) {
                    Map<String, Object> response = new HashMap<>();
                    response.put("documentId", documentId);
                    response.put("status", "DISTRIBUTED");

                    // Thêm thông tin về phòng ban xử lý chính
                    if (primaryDepartmentId != null) {
                        documentDepartmentService.getPrimaryDepartmentForDocument(documentId)
                                .ifPresent(dept -> {
                                    response.put("primaryDepartment", dept);
                                });
                    }

                    // Thêm thông tin về các phòng ban phối hợp
                    if (collaboratingDepartmentIds != null && !collaboratingDepartmentIds.isEmpty()) {
                        List<DocumentDepartmentDTO> collaborators = documentDepartmentService
                                .getCollaboratingDepartmentsForDocument(documentId);
                        response.put("collaboratingDepartments", collaborators);
                    }

                    return ResponseEntity.ok(ResponseDTO.success(response));
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản"));
                }
            } else {
                // Nếu không có thông tin phòng ban, sử dụng phương thức cũ
                return documentWorkflowService.distributeDocument(documentId, currentUser, comments)
                        .map(document -> ResponseEntity
                                .ok(ResponseDTO.success((Object) "Document successfully distributed")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi phân phối văn bản: " + e.getMessage()));
        }
    }

    /**
     * API để lấy danh sách phòng ban được phân công xử lý một văn bản
     */
    @Operation(summary = "Get document departments", description = "Get departments assigned to process a document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved department list"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view document departments")
    })
    @GetMapping("/{documentId}/departments")
    public ResponseEntity<ResponseDTO<List<DocumentDepartmentDTO>>> getDocumentDepartments(
            @Parameter(description = "ID of the document") @PathVariable Long documentId) {

        try {
            List<DocumentDepartmentDTO> departments = documentDepartmentService.getDepartmentsByDocument(documentId);
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách phòng ban: " + e.getMessage()));
        }
    }

    // ==================== 3. Trưởng phòng Endpoints ====================

    @Operation(summary = "Assign to specialist", description = "Department head assigns document to a specialist")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully assigned"),
            @ApiResponse(responseCode = "404", description = "Document or user not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to assign document")
    })
    @PostMapping("/{documentId}/assign-specialist")
    public ResponseEntity<ResponseDTO<String>> assignToSpecialist(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Get assigned user
            User specialist = userRepository.findById(workflowDTO.getAssignedToId())
                    .orElse(null);

            if (specialist == null) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Không tìm thấy người chuyên môn"));
            }
            // Assign deadline to document
            if (workflowDTO.getClosureDeadline() != null) {
                documentWorkflowService.setProcessDeadline(documentId, workflowDTO.getClosureDeadline());
            }

            return documentWorkflowService
                    .assignToSpecialist(documentId, specialist, currentUser, workflowDTO.getComments())
                    .map(history -> ResponseEntity
                            .ok(ResponseDTO.success("Phân công văn bản cho chuyên viên thành công")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi phân công văn bản cho chuyên viên: " + e.getMessage()));
        }
    }

    @Operation(summary = "Forward to leadership", description = "Department head forwards document for leader approval")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully forwarded"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to forward document")
    })
    @PutMapping("/{documentId}/forward-to-leadership")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<String>> forwardToLeadership(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService.forwardToLeadership(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity
                            .ok(ResponseDTO.success("Document successfully forwarded to leadership")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi chuyển văn bản cho lãnh đạo: " + e.getMessage()));
        }
    }

    // ==================== 4. Chuyên viên Endpoints ====================

    @Operation(summary = "Start processing document", description = "Specialist starts processing the document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document processing started"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to process document")
    })
    @PutMapping("/{documentId}/start-processing")
    public ResponseEntity<ResponseDTO<String>> startProcessingDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService.startProcessingDocument(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Document processing started")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi bắt đầu xử lý văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Submit to leadership", description = "Specialist submits document for leader approval")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully submitted"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to submit document")
    })
    @PutMapping("/{documentId}/submit")
    public ResponseEntity<ResponseDTO<String>> submitToLeadership(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService.submitToLeadership(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity
                            .ok(ResponseDTO.success("Document successfully submitted to leadership")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi gửi văn bản cho lãnh đạo: " + e.getMessage()));
        }
    }

    // ==================== 5. Lãnh đạo Endpoints ====================

    @Operation(summary = "Start reviewing document", description = "Leader starts reviewing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document review started"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to review document")
    })
    @PutMapping("/{documentId}/start-reviewing")
    public ResponseEntity<ResponseDTO<String>> startReviewingDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Comment leader/manager", required = true) @RequestBody String comment) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService.startReviewingDocument(documentId, currentUser, comment)
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Document review started")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi bắt đầu xem xét văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Provide feedback", description = "Leader provides feedback on document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Feedback provided successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to provide feedback")
    })
    @PutMapping("/{documentId}/provide-feedback")
    public ResponseEntity<ResponseDTO<String>> provideDocumentFeedback(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là thủ trưởng cục không
            boolean isLeader = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_CUC_TRUONG") ||
                            role.getName().equals("ROLE_CUC_PHO") ||
                            role.getName().equals("CHINH_UY") ||
                            role.getName().equals("PHO_CHINH_UY"));

            if (!isLeader) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ các chỉ huy cục có quyền sử dụng endpoint này"));
            }

            return documentWorkflowService.provideDocumentFeedback(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Feedback provided successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cung cấp phản hồi: " + e.getMessage()));
        }
    }

    /**
     * Thủ trưởng cục cho ý kiến/từ chối văn bản với file đính kèm (endpoint hợp
     * nhất)
     */
    @Operation(summary = "Leader feedback with attachment", description = "Leader provides feedback/rejection with attachment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Feedback with attachment provided successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to provide feedback")
    })
    @PutMapping(value = "/{documentId}/leader-feedback-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> leaderFeedbackWithAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Feedback comments") @RequestPart("comments") String comments,
            @Parameter(description = "Feedback attachment (optional)") @RequestPart(value = "file", required = false) MultipartFile file) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là thủ trưởng cục không
            boolean isLeader = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_CUC_TRUONG") ||
                            role.getName().equals("ROLE_CUC_PHO"));

            if (!isLeader) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ các trưởng phòng mới có quyền sử dụng endpoint này"));
            }

            try {
                // Xử lý trường hợp có file đính kèm
                String savedFilename;
                if (file != null && !file.isEmpty()) {
                    savedFilename = saveAttachmentFile(file, "leader_feedback_" + documentId + "_");
                } else {
                    savedFilename = null;
                }

                // Cập nhật trạng thái văn bản với hoặc không có file đính kèm
                return documentWorkflowService
                        .provideDocumentFeedbackWithAttachment(documentId, currentUser, comments, savedFilename)
                        .map(document -> ResponseEntity
                                .ok(ResponseDTO.success("Leader feedback provided successfully")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Failed to upload attachment: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cung cấp phản hồi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Provide feedback with attachment", description = "Leader provides feedback on document with attachment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Feedback with attachment provided successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to provide feedback")
    })
    @PutMapping(value = "/{documentId}/provide-feedback-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> provideDocumentFeedbackWithAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Feedback comments") @RequestPart("comments") String comments,
            @Parameter(description = "Feedback attachment") @RequestPart(value = "file", required = false) MultipartFile file) {
        System.out.println(comments);
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là thủ trưởng cục không
            boolean isLeader = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_CUC_TRUONG") ||
                            role.getName().equals("ROLE_CUC_PHO"));

            if (!isLeader) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ các trưởng phòng mới có quyền sử dụng endpoint này"));
            }

            try {
                // Lưu file đính kèm
                // Xử lý trường hợp có file đính kèm
                String savedFilename;
                if (file != null && !file.isEmpty()) {
                    savedFilename = saveAttachmentFile(file, "leader_feedback_" + documentId + "_");
                } else {
                    savedFilename = null;
                }

                // Cập nhật trạng thái văn bản với file đính kèm
                return documentWorkflowService
                        .provideDocumentFeedbackWithAttachment(documentId, currentUser, comments, savedFilename)

                        .map(document -> ResponseEntity
                                .ok(ResponseDTO.success("Feedback with attachment provided successfully")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Failed to upload attachment: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cung cấp phản hồi: " + e.getMessage()));
        }
    }

    @Operation(summary = "Approve document", description = "Leader approves document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document approved successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to approve document")
    })
    @PutMapping("/{documentId}/approve")
    public ResponseEntity<ResponseDTO<String>> approveDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là thủ trưởng cục không
            boolean isLeader = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_CUC_TRUONG") ||
                            role.getName().equals("ROLE_CUC_PHO"));

            if (!isLeader) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ các trưởng phòng mới có quyền phê duyệt văn bản"));
            }

            return documentWorkflowService.approveDocument(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity.ok(ResponseDTO.success("Document approved successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi phê duyệt văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Reject document with attachment", description = "Reject document with attachment file")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document rejected with attachment successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to reject document")
    })
    @PutMapping(value = "/{documentId}/reject-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> rejectDocumentWithAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Rejection comments") @RequestPart("comments") String comments,
            @Parameter(description = "Rejection attachment") @RequestPart("file") MultipartFile file) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            try {
                // Lưu file đính kèm
                String savedFilename = saveAttachmentFile(file, "rejection_" + documentId + "_");

                // Cập nhật trạng thái văn bản với file đính kèm
                return documentWorkflowService
                        .rejectDocumentWithAttachment(documentId, currentUser, comments, savedFilename)
                        .map(document -> ResponseEntity
                                .ok(ResponseDTO.success("Document rejected with attachment successfully")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Failed to upload attachment: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi từ chối văn bản: " + e.getMessage()));
        }
    }

    /**
     * Helper method to save attachment file
     * 
     * @param file   MultipartFile to save
     * @param prefix Prefix for the filename
     * @return Saved filename
     * @throws IOException If file cannot be saved
     */
    private String saveAttachmentFile(MultipartFile file, String prefix) throws IOException {
        // Tạo tên file duy nhất với prefix
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".pdf";
        String savedFilename = prefix + System.currentTimeMillis() + extension;

        // Lưu file vào hệ thống
        java.nio.file.Files.createDirectories(java.nio.file.Paths.get("uploads"));
        java.nio.file.Path path = java.nio.file.Paths.get("uploads/" + savedFilename);
        file.transferTo(path);

        return savedFilename;
    }

    /**
     * tạo full document với một request
     * 1,tạo văn bán đến
     * 2. đăng ký workflow
     * 3. Phân phối nếu có
     * 4. upload file
     */
    @Operation(summary = "Create full document with workflow and distribution", description = "Creates a full document with workflow and distribution")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document successfully created"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create documents"),
            @ApiResponse(responseCode = "500", description = "Internal server error during creation")
    })
    @PostMapping(value = "/full", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    @Transactional
    public ResponseEntity<ResponseDTO<String>> createFullIncomingDocument(
            @Parameter(description = "Document details", required = true) @RequestPart("data") FullIncomingDocumentDTO data,
            @Parameter(description = "File to upload") @RequestPart(value = "attachments", required = false) MultipartFile file) {
        try {
            // Log the request details for debugging
            System.out.println("Received request with data: " + data);
            if (file != null) {
                System.out.println("Received file: " + file.getOriginalFilename());
            }

            // 1. Validate document number không trùng lặp
            String documentNumber = data.getDocument().getDocumentNumber();
            if (documentNumber != null && !documentNumber.trim().isEmpty()) {
                // Check if document number already exists
                if (incomingDocumentService.findByDocumentNumber(documentNumber).isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(ResponseDTO.error("Số văn bản '" + documentNumber + "' đã tồn tại trong hệ thống"));
                }
            }

            // 2. Tạo document sau khi validate
            IncomingDocumentDTO document = incomingDocumentService.createIncomingDocument(data.getDocument());
            // 2. Đăng ký workflow
            User user = getCurrentUser();
            documentWorkflowService.registerIncomingDocument(document.getId(), user, data.getWorkflow().getComments());
            // 3. Phân phối nếu có
            // chuyen tu set<long> sang list<long>
            List<Long> collaboratingDepartmentIds = new ArrayList<>();
            if (data.getWorkflow().getCollaboratingDepartmentIds() != null) {
                collaboratingDepartmentIds = new ArrayList<>(data.getWorkflow().getCollaboratingDepartmentIds());
            }

            if (data.getWorkflow().getPrimaryDepartmentId() != null) {
                documentWorkflowService.distributeDocument(document.getId(),
                        data.getWorkflow().getPrimaryDepartmentId(),
                        collaboratingDepartmentIds,
                        user,
                        data.getWorkflow().getComments());
            }
            // Upload các file đính kèm (nếu có)
            if (file != null) {
                incomingDocumentService.addAttachment(document.getId(), file);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success("Document created successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tạo văn bản: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tạo văn bản: " + e.getMessage()));
        }
    }

    /**
     * Tạo full document với nhiều file đính kèm
     * 1. Tạo văn bản đến
     * 2. Đăng ký workflow
     * 3. Phân phối nếu có
     * 4. Upload nhiều file đính kèm
     */
    @Operation(summary = "Create full document with workflow, distribution and multiple attachments", description = "Creates a full document with workflow, distribution and supports multiple file attachments")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Document successfully created with attachments"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create documents"),
            @ApiResponse(responseCode = "500", description = "Internal server error during creation")
    })
    @PostMapping(value = "/full-multi-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<ResponseDTO<Object>> createFullIncomingDocumentWithMultipleAttachments(
            @Parameter(description = "Document details", required = true) @RequestPart("data") FullIncomingDocumentDTO data,
            @Parameter(description = "Multiple files to upload") @RequestPart(value = "attachments", required = false) List<MultipartFile> files) {
        try {
            // Log the request details for debugging
            System.out.println("Received request with data: " + data);
            if (files != null && !files.isEmpty()) {
                System.out.println("Received " + files.size() + " files:");
                for (int i = 0; i < files.size(); i++) {
                    System.out.println("File " + (i + 1) + ": " + files.get(i).getOriginalFilename());
                }
            }

            // 1. Validate document number không trùng lặp
            String documentNumber = data.getDocument().getDocumentNumber();
            if (documentNumber != null && !documentNumber.trim().isEmpty()) {
                // Check if document number already exists
                if (incomingDocumentService.findByDocumentNumber(documentNumber).isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(ResponseDTO.error("Số văn bản '" + documentNumber + "' đã tồn tại trong hệ thống"));
                }
            }

            // 2. Tạo document sau khi validate
            IncomingDocumentDTO document = incomingDocumentService.createIncomingDocument(data.getDocument());

            // 2. Đăng ký workflow
            User user = getCurrentUser();
            documentWorkflowService.registerIncomingDocument(document.getId(), user, data.getWorkflow().getComments());

            // 3. Phân phối nếu có
            List<Long> collaboratingDepartmentIds = new ArrayList<>();
            if (data.getWorkflow().getCollaboratingDepartmentIds() != null) {
                collaboratingDepartmentIds = new ArrayList<>(data.getWorkflow().getCollaboratingDepartmentIds());
            }

            if (data.getWorkflow().getPrimaryDepartmentId() != null) {
                documentWorkflowService.distributeDocument(document.getId(),
                        data.getWorkflow().getPrimaryDepartmentId(),
                        collaboratingDepartmentIds,
                        user,
                        data.getWorkflow().getComments());
            }

            // 4. Upload các file đính kèm (nhiều file) - sử dụng method mới
            List<String> uploadedFiles = new ArrayList<>();
            List<String> failedFiles = new ArrayList<>();

            if (files != null && !files.isEmpty()) {
                try {
                    // Sử dụng addMultipleAttachments thay vì addAttachment từng file
                    List<DocumentAttachment> attachments = incomingDocumentService.addMultipleAttachments(
                            document.getId(), files, user);

                    uploadedFiles = attachments.stream()
                            .map(attachment -> attachment.getOriginalFilename())
                            .collect(Collectors.toList());

                } catch (Exception e) {
                    // Nếu upload hàng loạt thất bại, thử từng file một
                    System.err.println("Bulk upload failed, trying individual uploads: " + e.getMessage());
                    for (MultipartFile file : files) {
                        if (file != null && !file.isEmpty()) {
                            try {
                                incomingDocumentService.addAttachment(document.getId(), file);
                                uploadedFiles.add(file.getOriginalFilename());
                            } catch (Exception individualError) {
                                failedFiles.add(
                                        file.getOriginalFilename() + " (Lỗi: " + individualError.getMessage() + ")");
                                System.err.println("Failed to upload file: " + file.getOriginalFilename() + ", Error: "
                                        + individualError.getMessage());
                            }
                        }
                    }
                }
            }

            // Chuẩn bị response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document created successfully");
            response.put("documentId", document.getId());
            response.put("uploadedFiles", uploadedFiles);

            if (!failedFiles.isEmpty()) {
                response.put("failedFiles", failedFiles);
                response.put("warning", "Một số file không thể upload được");
            }

            response.put("totalFiles", files != null ? files.size() : 0);
            response.put("successfulUploads", uploadedFiles.size());
            response.put("failedUploads", failedFiles.size());

            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(response));

        } catch (Exception e) {
            System.err.println("Error creating document: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tạo văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update outgoing document in workflow", description = "Updates an outgoing document as part of workflow")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully updated"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update document")
    })
    @PutMapping(value = "/{documentId}/update-outgoing", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<Object>> updateOutgoingDocumentWorkflow(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Updated document details and workflow info", required = true) @RequestPart("data") FullOutgoingDocumentDTO fullDocumentDTO,
            @Parameter(description = "File to replace existing attachment") @RequestPart(value = "attachment", required = false) MultipartFile file) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            try {
                // Sử dụng phương thức từ service thay vì xử lý logic trong controller
                Map<String, Object> result = outgoingDocumentService.updateOutgoingDocumentWorkflow(
                        documentId,
                        fullDocumentDTO,
                        file,
                        currentUser);

                return ResponseEntity.ok(ResponseDTO.success(result));

            } catch (RuntimeException e) {
                if (e.getMessage().contains("not found")) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản"));
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Lỗi khi cập nhật file đính kèm: " + e.getMessage()));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Lỗi khi cập nhật file đính kèm: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật văn bản: " + e.getMessage()));
        }
    }

    // Helper method to get current authenticated user
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        return userRepository.findByName(username).orElse(null);
    }

    // Helper method to convert DocumentHistory to DTO
    private DocumentHistoryDTO convertToHistoryDTO(DocumentHistory history) {
        DocumentHistoryDTO dto = new DocumentHistoryDTO();
        dto.setId(history.getId());
        dto.setDocumentId(history.getDocument().getId());
        dto.setDocumentTitle(history.getDocument().getTitle());
        dto.setAction(history.getAction());
        dto.setComments(history.getComments());
        dto.setAttachmentPath(history.getAttachmentPath());
        dto.setTimestamp(history.getTimestamp());
        // Xử lý trạng thái trước
        if (history.getPreviousStatus() != null) {
            try {
                int prevStatusOrdinal = Integer.parseInt(history.getPreviousStatus());
                DocumentProcessingStatus prevStatus = DocumentProcessingStatus.values()[prevStatusOrdinal];
                dto.setPreviousStatus(prevStatus.getCode());
                dto.setPreviousStatusDisplayName(prevStatus.getDisplayName());
            } catch (NumberFormatException | IndexOutOfBoundsException e) {
                dto.setPreviousStatus(history.getPreviousStatus());
                dto.setPreviousStatusDisplayName("Không xác định");
            }
        }

        // Xử lý trạng thái mới
        if (history.getNewStatus() != null) {
            try {
                int newStatusOrdinal = Integer.parseInt(history.getNewStatus());
                DocumentProcessingStatus newStatus = DocumentProcessingStatus.values()[newStatusOrdinal];
                dto.setNewStatus(newStatus.getCode());
                dto.setNewStatusDisplayName(newStatus.getDisplayName());
            } catch (NumberFormatException | IndexOutOfBoundsException e) {
                dto.setNewStatus(history.getNewStatus());
                dto.setNewStatusDisplayName("Không xác định");
            }
        }

        // Set user information
        // Lấy thông tin người thực hiện hành động từ trường performedBy
        if (history.getPerformedBy() != null) {
            dto.setActorId(history.getPerformedBy().getId());
            dto.setActorName(history.getPerformedBy().getFullName());
        }
        List<String> userNames = new ArrayList<>();
        documentHistoryRepository.getAssignedUserByDocumentId(history.getDocument().getId()).stream()
                .filter(documentHistory -> documentHistory.getAssignedTo() != null)
                .forEach(documentHistory -> userNames.add(documentHistory.getAssignedTo().getFullName()));
        if (history.getAssignedTo() != null) {
            dto.setAssignedToId(history.getAssignedTo().getId());
            dto.setAssignedToName(history.getAssignedTo().getName());
            dto.setAssignedToNames(userNames);
        }

        return dto;
    }

    @Operation(summary = "Tạo văn bản đi trả lời cho văn bản đến", description = "Tạo văn bản đi mới liên kết với văn bản đến, với đầy đủ quy trình trả lời")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Văn bản trả lời được tạo thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy văn bản đến"),
            @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ")
    })
    @PostMapping(value = "/incoming/{incomingDocId}/reply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<Object>> createResponseDocument(
            @PathVariable Long incomingDocId,
            @Parameter(description = "Document details", required = true) @RequestPart("data") FullOutgoingDocumentDTO data,
            @Parameter(description = "File to upload") @RequestPart(value = "attachments", required = false) MultipartFile file) {
        System.out.println("Creating response document for incomingDocId: " + incomingDocId);
        // Kiểm tra văn bản đến tồn tại
        Optional<IncomingDocument> incomingDocOpt = incomingDocumentService.findIncomingDocumentById(incomingDocId);
        if (incomingDocOpt.isEmpty()) {

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy văn bản đến"));
        }

        try {
            // Khởi tạo response info
            Map<String, Object> uploadInfo = new HashMap<>();
            Map<String, Object> response = new HashMap<>();
            System.out.println("Creating response document with data: " + data);
            // Execute all steps in a single transaction
            OutgoingDocumentDTO createdDocument = outgoingDocumentService.createResponseDocument(
                    incomingDocId,
                    data,
                    file,
                    getCurrentUser(),
                    uploadInfo);

            // Prepare response
            response.put("incomingDocumentId", incomingDocId);
            response.put("outgoingDocument", createdDocument);
            response.put("attachments", uploadInfo);
            response.put("status", "DRAFT");

            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(response));

        } catch (IOException e) {
            System.out.println("Error uploading file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi upload file: " + e.getMessage()));
        } catch (Exception e) {
            System.out.println("Error creating response document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tạo văn bản trả lời: " + e.getMessage()));
        }
    }

    @Operation(summary = "Tạo văn bản đi trả lời cho văn bản đến với nhiều file đính kèm", description = "Tạo văn bản đi mới liên kết với văn bản đến, với đầy đủ quy trình trả lời và hỗ trợ nhiều file đính kèm")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Văn bản trả lời được tạo thành công với nhiều file đính kèm"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy văn bản đến"),
            @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ")
    })
    @PostMapping(value = "/incoming/{incomingDocId}/reply-multi-attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<Object>> createResponseDocumentWithMultipleAttachments(
            @PathVariable Long incomingDocId,
            @Parameter(description = "Document details", required = true) @RequestPart("data") FullOutgoingDocumentDTO data,
            @Parameter(description = "Multiple files to upload") @RequestPart(value = "attachments", required = false) List<MultipartFile> files) {

        System.out.println("Creating response document with multiple attachments for incomingDocId: " + incomingDocId);

        // Kiểm tra văn bản đến tồn tại
        Optional<IncomingDocument> incomingDocOpt = incomingDocumentService.findIncomingDocumentById(incomingDocId);
        if (incomingDocOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy văn bản đến"));
        }

        try {
            // Khởi tạo response info
            Map<String, Object> uploadInfo = new HashMap<>();
            Map<String, Object> response = new HashMap<>();

            System.out.println("Creating response document with data: " + data);
            System.out.println("Number of files: " + (files != null ? files.size() : 0));

            // Execute all steps in a single transaction
            OutgoingDocumentDTO createdDocument = outgoingDocumentService.createResponseDocumentWithMultipleAttachments(
                    incomingDocId,
                    data,
                    files,
                    getCurrentUser(),
                    uploadInfo);

            // Prepare response
            response.put("incomingDocumentId", incomingDocId);
            response.put("outgoingDocument", createdDocument);
            response.put("attachments", uploadInfo);
            response.put("status", "DRAFT");

            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(response));

        } catch (IOException e) {
            System.out.println("Error uploading files: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi upload file: " + e.getMessage()));
        } catch (Exception e) {
            System.out.println("Error creating response document: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tạo văn bản trả lời: " + e.getMessage()));
        }
    }

    /**
     * Download attachment file from document history
     */
    @Operation(summary = "Download attachment", description = "Download attachment file from document history")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File downloaded successfully"),
            @ApiResponse(responseCode = "404", description = "File not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to download file")
    })
    @GetMapping("/history/{historyId}/attachment")
    public ResponseEntity<?> downloadAttachment(@PathVariable Long historyId) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentHistoryRepository.findById(historyId)
                    .map(history -> {
                        String attachmentPath = history.getAttachmentPath();
                        if (attachmentPath == null || attachmentPath.isEmpty()) {
                            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                    .body(ResponseDTO.error("Không tìm thấy file đính kèm cho lịch sử này"));
                        }

                        try {
                            // Lấy file từ đường dẫn
                            java.nio.file.Path path = java.nio.file.Paths.get(attachmentPath);
                            if (!java.nio.file.Files.exists(path)) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("File đính kèm không tồn tại"));
                            }

                            // Đọc nội dung file
                            byte[] data = java.nio.file.Files.readAllBytes(path);

                            // Lấy tên file từ đường dẫn
                            String filename = path.getFileName().toString();

                            // Xác định loại MIME
                            String contentType = determineContentType(filename);

                            // Trả về file
                            return ResponseEntity.ok()
                                    .contentType(MediaType.parseMediaType(contentType))
                                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                                    .body(data);
                        } catch (IOException e) {
                            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .body(ResponseDTO.error("Error reading attachment: " + e.getMessage()));
                        }
                    })
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy lịch sử văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tải file đính kèm: " + e.getMessage()));
        }
    }

    /**
     * Determine content type based on file extension
     */
    private String determineContentType(String filename) {
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        switch (extension) {
            case "pdf":
                return "application/pdf";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls":
                return "application/vnd.ms-excel";
            case "xlsx":
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "txt":
                return "text/plain";
            default:
                return "application/octet-stream";
        }
    }

    // ==================== Chỉ huy đơn vị Endpoints ====================

    @Operation(summary = "Start header department reviewing", description = "Department header starts reviewing document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document review started by department header"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to review document")
    })
    @PutMapping("/{documentId}/header-department-review")
    public ResponseEntity<ResponseDTO<String>> startHeaderDepartmentReviewing(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            return documentWorkflowService
                    .startHeaderDepartmentReviewing(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity
                            .ok(ResponseDTO.success("Document review started by department header")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi bắt đầu xem xét văn bản bởi trưởng phòng: " + e.getMessage()));
        }
    }

    @Operation(summary = "Department header provides feedback", description = "Department header provides feedback on document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Department header feedback provided successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to provide feedback")
    })
    @PutMapping("/{documentId}/header-department-comment")
    public ResponseEntity<ResponseDTO<String>> commentHeaderDepartment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là chỉ huy đơn vị không
            boolean isHeaderDepartment = currentUser.getRoles().stream()
                    .anyMatch(r ->isChiHuyDonVi(r.getName()));

            if (!isHeaderDepartment) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ trưởng phòng mới có quyền sử dụng endpoint này"));
            }

            return documentWorkflowService.commentHeaderDepartment(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity
                            .ok(ResponseDTO.success("Department header feedback provided successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cung cấp phản hồi từ trưởng phòng: " + e.getMessage()));
        }
    }

    @Operation(summary = "Department header provides feedback with attachment", description = "Department header provides feedback with attachment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Department header feedback with attachment provided successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to provide feedback")
    })
    @PutMapping(value = "/{documentId}/header-department-comment-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> commentHeaderDepartmentWithAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Feedback comments") @RequestPart("comments") String comments,
            @Parameter(description = "Feedback attachment") @RequestPart("file") MultipartFile file) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là chỉ huy đơn vị không
            boolean isHeaderDepartment = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_TRUONG_PHONG") ||
                            role.getName().equals("ROLE_PHO_PHONG") ||
                            role.getName().equals("ROLE_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_CUM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_CUM_TRUONG"));

            if (!isHeaderDepartment) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ trưởng phòng mới có quyền sử dụng endpoint này"));
            }

            try {
                // Lưu file đính kèm
                String savedFilename = saveAttachmentFile(file, "header_feedback_" + documentId + "_");

                // Cập nhật trạng thái văn bản với file đính kèm
                return documentWorkflowService
                        .commentHeaderDepartmentWithAttachment(documentId, currentUser, comments, savedFilename)
                        .map(document -> ResponseEntity.ok(ResponseDTO
                                .success("Department header feedback with attachment provided successfully")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Failed to upload attachment: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cung cấp phản hồi từ trưởng phòng: " + e.getMessage()));
        }
    }

    /**
     * Chỉ huy đơn vị cho ý kiến/từ chối văn bản với file đính kèm (endpoint hợp
     * nhất)
     */
    @Operation(summary = "Department header feedback with attachment", description = "Department header provides feedback/rejection with attachment")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Department header feedback with attachment provided successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to provide feedback")
    })
    @PutMapping(value = "/{documentId}/header-feedback-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> headerFeedbackWithAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Feedback comments") @RequestPart("comments") String comments,
            @Parameter(description = "Feedback attachment (optional)") @RequestPart(value = "file", required = false) MultipartFile file) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là chỉ huy đơn vị không
            boolean isHeaderDepartment = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_TRUONG_PHONG") ||
                            role.getName().equals("ROLE_PHO_PHONG") ||
                            role.getName().equals("ROLE_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_CUM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_CUM_TRUONG"));

            if (!isHeaderDepartment) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ trưởng phòng mới có quyền sử dụng endpoint này"));
            }

            try {
                // Xử lý trường hợp có file đính kèm
                String savedFilename;
                if (file != null && !file.isEmpty()) {
                    savedFilename = saveAttachmentFile(file, "header_feedback_" + documentId + "_");
                } else {
                    savedFilename = null;
                }

                // Cập nhật trạng thái văn bản với hoặc không có file đính kèm
                return documentWorkflowService
                        .commentHeaderDepartmentWithAttachment(documentId, currentUser, comments, savedFilename)
                        .map(document -> ResponseEntity
                                .ok(ResponseDTO.success("Department header feedback provided successfully")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Failed to upload attachment: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cung cấp phản hồi từ trưởng phòng: " + e.getMessage()));
        }
    }

    @Operation(summary = "Department header approves document", description = "Department header approves document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document approved by department header successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to approve document")
    })
    @PutMapping("/{documentId}/header-department-approve")
    public ResponseEntity<ResponseDTO<String>> approveHeaderDepartment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Workflow details", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là chỉ huy đơn vị không
            boolean isHeaderDepartment = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_TRUONG_PHONG") ||
                            role.getName().equals("ROLE_PHO_PHONG") ||
                            role.getName().equals("ROLE_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_CUM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_CUM_TRUONG"));

            if (!isHeaderDepartment) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ trưởng phòng mới có quyền phê duyệt văn bản"));
            }

            return documentWorkflowService.approveHeaderDepartment(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> ResponseEntity
                            .ok(ResponseDTO.success("Document approved by department header successfully")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi phê duyệt văn bản bởi trưởng phòng: " + e.getMessage()));
        }
    }

    @Operation(summary = "Department header rejects document with attachment", description = "Department header rejects document with attachment file")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document rejected with attachment by department header successfully"),
            @ApiResponse(responseCode = "404", description = "Document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to reject document")
    })
    @PutMapping(value = "/{documentId}/header-department-reject-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> headerDepartmentRejectDocumentWithAttachment(
            @Parameter(description = "ID of the document") @PathVariable Long documentId,
            @Parameter(description = "Rejection comments") @RequestPart("comments") String comments,
            @Parameter(description = "Rejection attachment") @RequestPart("file") MultipartFile file) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Kiểm tra xem người dùng có phải là chỉ huy đơn vị không
            boolean isHeaderDepartment = currentUser.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_TRUONG_PHONG") ||
                            role.getName().equals("ROLE_PHO_PHONG") ||
                            role.getName().equals("ROLE_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_TRAM_TRUONG") ||
                            role.getName().equals("ROLE_CUM_TRUONG") ||
                            role.getName().equals("ROLE_PHO_CUM_TRUONG"));

            if (!isHeaderDepartment) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Chỉ trưởng phòng mới có quyền từ chối văn bản"));
            }

            try {
                // Lưu file đính kèm
                String savedFilename = saveAttachmentFile(file, "header_rejection_" + documentId + "_");

                // Cập nhật trạng thái văn bản với file đính kèm
                return documentWorkflowService
                        .rejectDocumentWithAttachment(documentId, currentUser, comments, savedFilename)
                        .map(document -> ResponseEntity.ok(ResponseDTO
                                .success("Document rejected with attachment by department header successfully")))
                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(ResponseDTO.error("Không tìm thấy văn bản")));
            } catch (IOException e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(ResponseDTO.error("Failed to upload attachment: " + e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi từ chối văn bản bởi trưởng phòng: " + e.getMessage()));
        }
    }

    // ==================== Tạo văn bản đi độc lập ====================

    @Operation(summary = "Tạo văn bản đi độc lập", description = "Tạo văn bản đi mới không liên kết với văn bản đến nào")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Văn bản đi độc lập được tạo thành công"),
            @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @ApiResponse(responseCode = "403", description = "Không có quyền tạo văn bản")
    })
    @PostMapping(value = "/standalone-outgoing", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<ResponseDTO<Object>> createStandaloneOutgoingDocument(
            @Parameter(description = "Document details", required = true) @RequestPart("data") OutgoingDocumentDTO documentDTO,
            @Parameter(description = "Files to upload") @RequestPart(value = "attachments", required = false) List<MultipartFile> files) {
        System.out.println("Creating standalone outgoing document with data: " + documentDTO);
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ResponseDTO.error("Người dùng chưa được xác thực"));
        }

        // Validate required fields
        if (documentDTO.getTitle() == null || documentDTO.getTitle().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Tiêu đề văn bản không được để trống"));
        }

        if (documentDTO.getSummary() == null || documentDTO.getSummary().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Nội dung tóm tắt không được để trống"));
        }

        try {
            // 1. Tạo văn bản đi
            OutgoingDocumentDTO createdDocument = outgoingDocumentService.createOutgoingDocument(documentDTO);

            // 2. Thêm nhiều file đính kèm nếu có
            List<String> uploadedFiles = new ArrayList<>();
            List<String> failedFiles = new ArrayList<>();

            if (files != null && !files.isEmpty()) {
                try {
                    // Sử dụng DocumentAttachmentService để upload nhiều file cùng lúc
                    List<DocumentAttachment> attachments = outgoingDocumentService.addMultipleAttachments(
                            createdDocument.getId(), files, currentUser);

                    // Ghi lại thông tin các file đã upload thành công
                    for (DocumentAttachment attachment : attachments) {
                        uploadedFiles.add(attachment.getOriginalFilename());
                    }
                } catch (Exception e) {
                    // Nếu có lỗi, ghi lại các file thất bại
                    for (MultipartFile file : files) {
                        if (file != null && !file.isEmpty()) {
                            failedFiles.add(file.getOriginalFilename() + ": " + e.getMessage());
                        }
                    }
                }
            }

            // 3. Thiết lập trạng thái ban đầu cho văn bản đi độc lập
            String comments = documentDTO.getSummary() != null ? "Tạo văn bản đi độc lập: " + documentDTO.getSummary()
                    : "Tạo văn bản đi độc lập";

            documentWorkflowService.createStandaloneOutgoingDocument(
                    createdDocument.getId(),
                    currentUser,
                    comments);

            // 4. Chuẩn bị phản hồi
            Map<String, Object> response = new HashMap<>();
            response.put("document", createdDocument);
            response.put("message", "Văn bản đi độc lập đã được tạo thành công");
            response.put("status", "DRAFT");

            // Thông tin về file đính kèm
            if (!uploadedFiles.isEmpty() || !failedFiles.isEmpty()) {
                Map<String, Object> attachmentInfo = new HashMap<>();
                attachmentInfo.put("totalFiles", files != null ? files.size() : 0);
                attachmentInfo.put("successfulUploads", uploadedFiles.size());
                attachmentInfo.put("uploadedFiles", uploadedFiles);
                if (!failedFiles.isEmpty()) {
                    attachmentInfo.put("failedFiles", failedFiles);
                }
                response.put("attachments", attachmentInfo);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(ResponseDTO.success(response));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tạo văn bản đi: " + e.getMessage()));
        }
    }

    // ==================== Chức năng Văn thư từ chối văn bản đi để chỉnh sửa thể
    // thức ====================

    @Operation(summary = "Văn thư từ chối văn bản cần chỉnh sửa thể thức", description = "Văn thư từ chối văn bản để yêu cầu chỉnh sửa thể thức trước khi cấp số ban hành")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Văn bản đã được chuyển về trạng thái chỉnh sửa thể thức"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy văn bản"),
            @ApiResponse(responseCode = "403", description = "Không có quyền từ chối văn bản")
    })
    @PutMapping("/{documentId}/format-correction")
    public ResponseEntity<ResponseDTO<Object>> rejectForFormatCorrection(
            @Parameter(description = "ID của văn bản") @PathVariable Long documentId,
            @Parameter(description = "Chi tiết yêu cầu chỉnh sửa", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        System.out.println("workflowDTO: " + workflowDTO);
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ResponseDTO.error("Người dùng chưa được xác thực"));
        }

        // Kiểm tra xem người dùng có phải là văn thư không
        boolean isClerk = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_VAN_THU"));

        if (!isClerk) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ResponseDTO.error("Chỉ văn thư mới có quyền từ chối văn bản để yêu cầu chỉnh sửa thể thức"));
        }

        return documentWorkflowService.rejectForFormatCorrection(documentId, currentUser, workflowDTO.getComments())
                .map(document -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Văn bản đã được chuyển về trạng thái chỉnh sửa thể thức");
                    response.put("documentId", documentId);
                    response.put("status", "FORMAT_CORRECTION");
                    return ResponseEntity.ok(ResponseDTO.success((Object) response));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy văn bản")));
    }

    @Operation(summary = "Văn thư từ chối văn bản kèm file hướng dẫn", description = "Văn thư từ chối văn bản đi kèm file mẫu/hướng dẫn để yêu cầu chỉnh sửa thể thức")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Văn bản đã được từ chối thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy văn bản"),
            @ApiResponse(responseCode = "403", description = "Không có quyền từ chối văn bản")
    })
    @PutMapping(value = "/{documentId}/format-correction-with-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseDTO<String>> rejectForFormatCorrectionWithAttachment(
            @Parameter(description = "ID của văn bản") @PathVariable Long documentId,
            @Parameter(description = "Lý do từ chối") @RequestPart("comments") String comments,
            @Parameter(description = "File mẫu/hướng dẫn") @RequestPart("file") MultipartFile file) {

        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ResponseDTO.error("Người dùng chưa được xác thực"));
        }

        // Kiểm tra xem người dùng có phải là văn thư không
        boolean isClerk = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_VAN_THU"));

        if (!isClerk) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ResponseDTO.error("Chỉ văn thư mới có quyền từ chối văn bản để yêu cầu chỉnh sửa thể thức"));
        }

        try {
            // Lưu file đính kèm
            String savedFilename = saveAttachmentFile(file, "format_correction_" + documentId + "_");

            // Cập nhật trạng thái văn bản với file đính kèm
            return documentWorkflowService
                    .rejectForFormatCorrectionWithAttachment(documentId, currentUser, comments, savedFilename)
                    .map(document -> ResponseEntity.ok(ResponseDTO
                            .success("Văn bản đã được chuyển về trạng thái chỉnh sửa thể thức kèm file hướng dẫn")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải lên file đính kèm: " + e.getMessage()));
        }
    }

    @Operation(summary = "Tái trình văn bản sau khi chỉnh sửa thể thức", description = "Trợ lý/nhân viên gửi lại văn bản đã chỉnh sửa thể thức để văn thư xem xét cấp số và ban hành")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Văn bản đã được tái trình thành công"),
            @ApiResponse(responseCode = "404", description = "Văn bản không tồn tại"),
            @ApiResponse(responseCode = "403", description = "Không có quyền tái trình văn bản")
    })
    @PutMapping("/{documentId}/resubmit-after-correction")
    public ResponseEntity<ResponseDTO<Object>> resubmitAfterFormatCorrection(
            @Parameter(description = "ID của văn bản") @PathVariable Long documentId,
            @Parameter(description = "Chi tiết tái trình", required = true) @RequestBody DocumentWorkflowDTO workflowDTO) {

        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Người dùng chưa được xác thực"));
            }

            // Sử dụng trạng thái FORMAT_CORRECTED để đánh dấu văn bản đã được chỉnh sửa và
            // sẵn sàng cho văn thư xem xét
            // Trạng thái này cho phép văn thư biết văn bản đã được chỉnh sửa, và có thể cấp
            // số, ban hành mà không cần gửi lại cho lãnh đạo
            return documentWorkflowService
                    .resubmitAfterFormatCorrection(documentId, currentUser, workflowDTO.getComments())
                    .map(document -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("message",
                                "Văn bản đã được tái trình sau khi chỉnh sửa thể thức và sẵn sàng cho văn thư xem xét");
                        response.put("documentId", documentId);
                        response.put("status", "FORMAT_CORRECTED");
                        return ResponseEntity.ok(ResponseDTO.success((Object) response));
                    })
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy văn bản")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tái trình văn bản: " + e.getMessage()));
        }
    }

    // ==================== APIs for Department Hierarchy Management
    // ====================

    @Operation(summary = "Get child departments", description = "Returns all child departments for a specific department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved child departments"),
            @ApiResponse(responseCode = "404", description = "Parent department not found")
    })
    @GetMapping("/departments/{departmentId}/children")
    public ResponseEntity<ResponseDTO<List<DepartmentDTO>>> getChildDepartments(
            @Parameter(description = "ID of the parent department") @PathVariable Long departmentId) {

        try {
            Department parentDepartment = departmentRepository.findById(departmentId)
                    .orElse(null);

            if (parentDepartment == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy phòng ban cha"));
            }

            List<Department> childDepartments = departmentRepository.findByParentDepartment(parentDepartment);
            List<DepartmentDTO> childDepartmentDTOs = childDepartments.stream()
                    .map(departmentService::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ResponseDTO.success(childDepartmentDTOs));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách phòng ban con: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get commanders of child departments", description = "Returns all commanders/chiefs of child departments under a specific parent department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved commanders"),
            @ApiResponse(responseCode = "404", description = "Parent department not found")
    })
    @GetMapping("/departments/{departmentId}/children/commanders")
    public ResponseEntity<ResponseDTO<List<UserDTO>>> getChildDepartmentsCommanders(
            @Parameter(description = "ID of the parent department") @PathVariable Long departmentId) {

        try {
            Department parentDepartment = departmentRepository.findById(departmentId)
                    .orElse(null);

            if (parentDepartment == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy phòng ban cha"));
            }

            List<Department> childDepartments = departmentRepository.findByParentDepartment(parentDepartment);
            if (childDepartments.isEmpty()) {
                return ResponseEntity.ok(ResponseDTO.success(Collections.emptyList()));
            }

            // Get all department IDs
            List<Long> childDepartmentIds = childDepartments.stream()
                    .map(Department::getId)
                    .collect(Collectors.toList());

            // Get commanders from each child department
            List<UserDTO> commanders = new ArrayList<>();
            for (Long deptId : childDepartmentIds) {
                commanders.addAll(userRepository.findByDepartmentIdAndIsCommanderOfUnitTrue(deptId)
                        .stream()
                        .map(userService::convertToDTO)
                        .collect(Collectors.toList()));
            }

            return ResponseEntity.ok(ResponseDTO.success(commanders));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách trưởng phòng con: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get all users from child departments", description = "Returns all users from child departments of a specific parent department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved users"),
            @ApiResponse(responseCode = "404", description = "Parent department not found")
    })
    @GetMapping("/departments/{departmentId}/children/users")
    public ResponseEntity<ResponseDTO<List<UserDTO>>> getChildDepartmentsUsers(
            @Parameter(description = "ID of the parent department") @PathVariable Long departmentId) {

        try {
            Department parentDepartment = departmentRepository.findById(departmentId)
                    .orElse(null);

            if (parentDepartment == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy phòng ban cha"));
            }

            List<Department> childDepartments = departmentRepository.findByParentDepartment(parentDepartment);
            if (childDepartments.isEmpty()) {
                return ResponseEntity.ok(ResponseDTO.success(Collections.emptyList()));
            }

            // Get all department IDs
            List<Long> childDepartmentIds = childDepartments.stream()
                    .map(Department::getId)
                    .collect(Collectors.toList());

            // Get all users from child departments
            List<UserDTO> users = new ArrayList<>();
            for (Long deptId : childDepartmentIds) {
                users.addAll(userRepository.findByDepartmentId(deptId)
                        .stream()
                        .map(userService::convertToDTO)
                        .collect(Collectors.toList()));
            }

            return ResponseEntity.ok(ResponseDTO.success(users));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách người dùng trong phòng ban con: " + e.getMessage()));
        }
    }

    // lấy trang tái mới nhất cuả văn bản theo user
    @Operation(summary = "Get latest document activities by user", description = "Returns the latest document activities for a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved latest document activities"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/users/{userId}/latest-activities")
    public ResponseEntity<ResponseDTO<List<DocumentHistory>>> getLatestDocumentActivitiesByUser(
            @Parameter(description = "ID of the user") @PathVariable Long userId) {

        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy người dùng"));
            }

            // Get latest document activities assigned to this user
            List<DocumentHistory> latestActivities = documentHistoryRepository
                    .findByPerformedBy_IdOrderByTimestampDesc(user.getId());

            // Sort by timestamp descending to get the most recent activities first
            latestActivities.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

            return ResponseEntity.ok(ResponseDTO.success(latestActivities));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy lịch sử văn bản: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get latest document activities for current user", description = "Returns the latest document activities for the currently authenticated user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved latest document activities"),
            @ApiResponse(responseCode = "401", description = "User not authenticated")
    })
    @GetMapping("/my-latest-activities")
    public ResponseEntity<ResponseDTO<List<DocumentHistory>>> getMyLatestDocumentActivities() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User currentUser = userRepository.findByName(username).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseDTO.error("Người dùng chưa được xác thực"));
        }

        // Get latest document activities assigned to current user
        List<DocumentHistory> latestActivities = documentHistoryRepository
                .findByPerformedBy_IdOrderByTimestampDesc(currentUser.getId());
        // Sort by timestamp descending to get the most recent activities first
        latestActivities.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        return ResponseEntity.ok(ResponseDTO.success(latestActivities));
    }
}
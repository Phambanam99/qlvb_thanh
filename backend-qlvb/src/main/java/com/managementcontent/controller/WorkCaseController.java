package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.WorkCaseDTO;
import com.managementcontent.service.WorkCaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
@RequiredArgsConstructor
@Tag(name = "Work Cases", description = "APIs for managing work cases")
public class WorkCaseController {

    private final WorkCaseService workCaseService;

    @Operation(summary = "Get all work cases", description = "Returns a paginated list of all work cases")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view work cases")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<WorkCaseDTO>>> getAllWorkCases(Pageable pageable) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getAllWorkCases(pageable)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách hồ sơ công việc: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work case by ID", description = "Returns a single work case by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work case"),
            @ApiResponse(responseCode = "404", description = "Work case not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view this work case")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<WorkCaseDTO>> getWorkCaseById(
            @Parameter(description = "ID of the work case to retrieve") @PathVariable Long id) {
        try {
            return workCaseService.getWorkCaseById(id)
                    .map(workCase -> ResponseEntity.ok(ResponseDTO.success(workCase)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy hồ sơ công việc")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin hồ sơ công việc: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work case by case code", description = "Returns a single work case by case code")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work case"),
            @ApiResponse(responseCode = "404", description = "Work case not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view this work case")
    })
    @GetMapping("/code/{caseCode}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<WorkCaseDTO>> getWorkCaseByCaseCode(
            @Parameter(description = "Case code of the work case to retrieve") @PathVariable String caseCode) {
        try {
            return workCaseService.getWorkCaseByCaseCode(caseCode)
                    .map(workCase -> ResponseEntity.ok(ResponseDTO.success(workCase)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy hồ sơ công việc với mã: " + caseCode)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tìm hồ sơ công việc theo mã: " + e.getMessage()));
        }
    }

    @Operation(summary = "Search work cases", description = "Search work cases by keyword")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search completed successfully")
    })
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<WorkCaseDTO>>> searchWorkCases(
            @Parameter(description = "Keyword to search for") @RequestParam String keyword,
            Pageable pageable) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.searchWorkCases(keyword, pageable)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tìm kiếm hồ sơ công việc: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work cases by assignee", description = "Returns work cases assigned to a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases")
    })
    @GetMapping("/assignee/{assigneeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<List<WorkCaseDTO>>> getWorkCasesByAssignee(
            @Parameter(description = "ID of the assignee") @PathVariable Long assigneeId) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getWorkCasesByAssignee(assigneeId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy hồ sơ công việc theo người được giao: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work cases by creator", description = "Returns work cases created by a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases")
    })
    @GetMapping("/creator/{creatorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<List<WorkCaseDTO>>> getWorkCasesByCreator(
            @Parameter(description = "ID of the creator") @PathVariable Long creatorId) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getWorkCasesByCreator(creatorId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy hồ sơ công việc theo người tạo: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work cases by status", description = "Returns work cases with a specific status")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases")
    })
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<List<WorkCaseDTO>>> getWorkCasesByStatus(
            @Parameter(description = "Status to filter by") @PathVariable String status) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getWorkCasesByStatus(status)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy hồ sơ công việc theo trạng thái: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work cases by priority", description = "Returns work cases with a specific priority")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases")
    })
    @GetMapping("/priority/{priority}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<List<WorkCaseDTO>>> getWorkCasesByPriority(
            @Parameter(description = "Priority to filter by") @PathVariable String priority) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getWorkCasesByPriority(priority)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy hồ sơ công việc theo độ ưu tiên: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get overdue cases", description = "Returns work cases past their deadline")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases")
    })
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<List<WorkCaseDTO>>> getOverdueCases() {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getOverdueCases()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách hồ sơ quá hạn: " + e.getMessage()));
        }
    }

    @Operation(summary = "Create new work case", description = "Creates a new work case")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Work case successfully created"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create work cases")
    })
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<WorkCaseDTO>> createWorkCase(
            @Parameter(description = "Work case details", required = true) @RequestBody WorkCaseDTO workCaseDTO) {
        try {
            WorkCaseDTO createdCase = workCaseService.createWorkCase(workCaseDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo hồ sơ công việc thành công", createdCase));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tạo hồ sơ công việc: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update work case", description = "Updates an existing work case")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Work case successfully updated"),
            @ApiResponse(responseCode = "404", description = "Work case not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update work cases")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<WorkCaseDTO>> updateWorkCase(
            @Parameter(description = "ID of the work case to update") @PathVariable Long id,
            @Parameter(description = "Updated work case details", required = true) @RequestBody WorkCaseDTO workCaseDTO) {
        try {
            return workCaseService.updateWorkCase(id, workCaseDTO)
                    .map(workCase -> ResponseEntity
                            .ok(ResponseDTO.success("Cập nhật hồ sơ công việc thành công", workCase)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy hồ sơ công việc")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật hồ sơ công việc: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete work case", description = "Deletes a work case by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Work case successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Work case not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete work cases")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deleteWorkCase(
            @Parameter(description = "ID of the work case to delete") @PathVariable Long id) {
        try {
            boolean deleted = workCaseService.deleteWorkCase(id);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa hồ sơ công việc thành công"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy hồ sơ công việc"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi xóa hồ sơ công việc: " + e.getMessage()));
        }
    }

    @Operation(summary = "Add document to work case", description = "Adds a document to a work case")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully added to work case"),
            @ApiResponse(responseCode = "404", description = "Work case or document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to modify work cases")
    })
    @PostMapping("/{caseId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<WorkCaseDTO>> addDocumentToCase(
            @Parameter(description = "ID of the work case") @PathVariable Long caseId,
            @Parameter(description = "ID of the document to add") @PathVariable Long documentId) {
        try {
            return workCaseService.addDocumentToCase(caseId, documentId)
                    .map(workCase -> ResponseEntity
                            .ok(ResponseDTO.success("Thêm tài liệu vào hồ sơ thành công", workCase)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy hồ sơ hoặc tài liệu")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi thêm tài liệu vào hồ sơ: " + e.getMessage()));
        }
    }

    @Operation(summary = "Remove document from work case", description = "Removes a document from a work case")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Document successfully removed from work case"),
            @ApiResponse(responseCode = "404", description = "Work case or document not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to modify work cases")
    })
    @DeleteMapping("/{caseId}/documents/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<WorkCaseDTO>> removeDocumentFromCase(
            @Parameter(description = "ID of the work case") @PathVariable Long caseId,
            @Parameter(description = "ID of the document to remove") @PathVariable Long documentId) {
        try {
            return workCaseService.removeDocumentFromCase(caseId, documentId)
                    .map(workCase -> ResponseEntity
                            .ok(ResponseDTO.success("Xóa tài liệu khỏi hồ sơ thành công", workCase)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy hồ sơ hoặc tài liệu")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi xóa tài liệu khỏi hồ sơ: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get work cases by document", description = "Returns work cases related to a specific document")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved work cases")
    })
    @GetMapping("/by-document/{documentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<List<WorkCaseDTO>>> getWorkCasesByDocument(
            @Parameter(description = "ID of the document") @PathVariable Long documentId) {
        try {
            return ResponseEntity.ok(ResponseDTO.success(workCaseService.getWorkCasesByDocument(documentId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy hồ sơ theo tài liệu: " + e.getMessage()));
        }
    }
}
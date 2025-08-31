package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.DepartmentDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.enums.DepartmentType;
import com.managementcontent.service.DepartmentService;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST Controller for managing departments.
 * Provides endpoints for creating, retrieving, updating, and deleting
 * departments,
 * as well as searching and filtering departments.
 */
@RestController
@RequestMapping("/api/departments")
@Tag(name = "Departments", description = "APIs for managing departments")
@Validated
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    /**
     * Get all departments with pagination
     * 
     * @param pageable Pagination information
     * @return Page of departments
     */
    @Operation(summary = "Get all departments", description = "Returns a paginated list of all departments")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved departments"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view departments")
    })
    @GetMapping
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<DepartmentDTO>>> getAllDepartments(Pageable pageable) {
        try {
            Page<DepartmentDTO> departments = departmentService.getAllDepartments(pageable);
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Get department by ID
     * 
     * @param id Department ID
     * @return Department if found
     */
    @Operation(summary = "Get department by ID", description = "Returns a single department by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved department"),
            @ApiResponse(responseCode = "404", description = "Department not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view departments")
    })
    @GetMapping("/{id}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<DepartmentDTO>> getDepartmentById(
            @Parameter(description = "ID of the department to retrieve") @PathVariable Long id) {
        try {
            return departmentService.getDepartmentById(id)
                    .map(dept -> ResponseEntity.ok(ResponseDTO.success(dept)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy phòng ban")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Create a new department
     * 
     * @param departmentDTO Department data
     * @return Created department
     */
    @Operation(summary = "Create new department", description = "Creates a new department")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Department successfully created"),
            @ApiResponse(responseCode = "400", description = "Invalid department data"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create departments")
    })
    @PostMapping
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<DepartmentDTO>> createDepartment(
            @Parameter(description = "Department details", required = true) @RequestBody DepartmentDTO departmentDTO) {
        try {
            DepartmentDTO department = departmentService.createDepartment(departmentDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo phòng ban thành công", department));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tạo phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Update an existing department
     * 
     * @param id            Department ID
     * @param departmentDTO Updated department data
     * @return Updated department if found
     */
    @Operation(summary = "Update department", description = "Updates an existing department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Department successfully updated"),
            @ApiResponse(responseCode = "404", description = "Department not found"),
            @ApiResponse(responseCode = "400", description = "Invalid department data"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update departments")
    })
    @PutMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<DepartmentDTO>> updateDepartment(
            @Parameter(description = "ID of the department to update") @PathVariable Long id,
            @Parameter(description = "Updated department details", required = true) @RequestBody DepartmentDTO departmentDTO) {
        try {
            Optional<DepartmentDTO> updatedDept = departmentService.updateDepartment(id, departmentDTO);
            return updatedDept
                    .map(dept -> ResponseEntity.ok(ResponseDTO.success("Cập nhật phòng ban thành công", dept)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy phòng ban")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Delete a department
     * 
     * @param id Department ID
     * @return No content if deleted, not found if department doesn't exist
     */
    @Operation(summary = "Delete department", description = "Deletes a department by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Department successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Department not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete departments")
    })
    @DeleteMapping("/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deleteDepartment(
            @Parameter(description = "ID of the department to delete") @PathVariable Long id) {
        try {
            boolean deleted = departmentService.deleteDepartment(id);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa phòng ban thành công"));
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseDTO.error("Không tìm thấy phòng ban"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi xóa phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Search departments by keyword
     * 
     * @param keyword  Search keyword
     * @param pageable Pagination information
     * @return Matching departments
     */
    @Operation(summary = "Search departments", description = "Search departments by name or abbreviation")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search completed successfully"),
            @ApiResponse(responseCode = "403", description = "Not authorized to search departments")
    })
    @GetMapping("/search")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<DepartmentDTO>>> searchDepartments(
            @Parameter(description = "Keyword to search for") @RequestParam String keyword,
            Pageable pageable) {
        try {
            Page<DepartmentDTO> departments = departmentService.searchDepartments(keyword, pageable);
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tìm kiếm phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Get departments by type
     * 
     * @param typeCode Department type code
     * @param pageable Pagination information
     * @return Matching departments
     */
    @Operation(summary = "Find departments by type", description = "Returns departments matching a specific type")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved departments"),
            @ApiResponse(responseCode = "400", description = "Invalid department type"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view departments")
    })
    @GetMapping("/type/{typeCode}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<DepartmentDTO>>> findDepartmentsByType(
            @Parameter(description = "Department type code to filter by") @PathVariable Integer typeCode,
            Pageable pageable) {

        try {
            DepartmentType type = DepartmentType.fromCode(typeCode);
            if (type == null) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Mã loại phòng ban không hợp lệ"));
            }

            Page<DepartmentDTO> departments = departmentService.findDepartmentsByType(type, pageable);
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy phòng ban theo loại: " + e.getMessage()));
        }
    }

    /**
     * Get departments by group
     * 
     * @param group    Department group
     * @param pageable Pagination information
     * @return Matching departments
     */
    @Operation(summary = "Find departments by group", description = "Returns departments belonging to a specific group")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved departments"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view departments")
    })
    @GetMapping("/group/{group}")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<Page<DepartmentDTO>>> findDepartmentsByGroup(
            @Parameter(description = "Department group to filter by") @PathVariable String group,
            Pageable pageable) {
        try {
            Page<DepartmentDTO> departments = departmentService.findDepartmentsByGroup(group, pageable);
            return ResponseEntity.ok(ResponseDTO.success(departments));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy phòng ban theo nhóm: " + e.getMessage()));
        }
    }

    /**
     * Get department statistics
     * 
     * @return Statistics about departments
     */
    @Operation(summary = "Get department statistics", description = "Returns statistics about departments")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved statistics"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view statistics")
    })
    @GetMapping("/statistics")
    // @PreAuthorize("hasAnyRole('ADMIN', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getDepartmentStatistics() {
        try {
            Map<DepartmentType, Long> statistics = departmentService.getDepartmentStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("totalDepartments",
                    departmentService.getAllDepartments(Pageable.unpaged()).getTotalElements());

            Map<String, Object> detailedStats = new HashMap<>();
            statistics.forEach((type, count) -> {
                Map<String, Object> typeInfo = new HashMap<>();
                typeInfo.put("code", type.getCode());
                typeInfo.put("name", type.getDisplayName());
                typeInfo.put("count", count);

                detailedStats.put(type.name(), typeInfo);
            });

            response.put("byType", detailedStats);

            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê phòng ban: " + e.getMessage()));
        }
    }

    /**
     * Get list of department types
     * 
     * @return Map containing department types and their descriptions
     */
    @Operation(summary = "Get department types", description = "Returns a list of available department types and their descriptions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved department types"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view department types")
    })
    @GetMapping("/types")
    // @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ResponseDTO<List<Map<String, Object>>>> getDepartmentTypes() {
        try {
            List<Map<String, Object>> response = new ArrayList<>();

            for (DepartmentType type : DepartmentType.values()) {
                Map<String, Object> typeInfo = new HashMap<>();
                typeInfo.put("code", type.getCode());
                typeInfo.put("name", type.getDisplayName());

                response.add(typeInfo);
            }

            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách loại phòng ban: " + e.getMessage()));
        }
    }
}
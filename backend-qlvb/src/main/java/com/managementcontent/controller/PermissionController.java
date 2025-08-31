package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.PermissionDTO;
import com.managementcontent.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Tag(name = "Permissions", description = "APIs for managing permissions")
public class PermissionController {

    private final PermissionService permissionService;

    @Operation(summary = "Get all permissions", description = "Returns a list of all permissions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved permissions"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view permissions")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<List<PermissionDTO>>> getAllPermissions() {
        try {
            List<PermissionDTO> permissions = permissionService.getAllPermissions();
            return ResponseEntity.ok(ResponseDTO.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách quyền: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get permission by ID", description = "Returns a single permission by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved permission"),
            @ApiResponse(responseCode = "404", description = "Permission not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view permissions")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<PermissionDTO>> getPermissionById(
            @Parameter(description = "ID of the permission to retrieve") @PathVariable Long id) {
        try {
            return permissionService.getPermissionById(id)
                    .map(permission -> ResponseEntity.ok(ResponseDTO.success(permission)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy quyền")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin quyền: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get permission by name", description = "Returns a single permission by name")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved permission"),
            @ApiResponse(responseCode = "404", description = "Permission not found"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view permissions")
    })
    @GetMapping("/name/{name}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<PermissionDTO>> getPermissionByName(
            @Parameter(description = "Name of the permission to retrieve") @PathVariable String name) {
        try {
            return permissionService.getPermissionByName(name)
                    .map(permission -> ResponseEntity.ok(ResponseDTO.success(permission)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy quyền với tên: " + name)));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy quyền theo tên: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get permissions by category", description = "Returns permissions filtered by category")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved permissions"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view permissions")
    })
    @GetMapping("/category/{category}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<List<PermissionDTO>>> getPermissionsByCategory(
            @Parameter(description = "Category to filter by") @PathVariable String category) {
        try {
            List<PermissionDTO> permissions = permissionService.getPermissionsByCategory(category);
            return ResponseEntity.ok(ResponseDTO.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy quyền theo danh mục: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get system permissions", description = "Returns all system permissions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved permissions"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view permissions")
    })
    @GetMapping("/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<List<PermissionDTO>>> getSystemPermissions() {
        try {
            List<PermissionDTO> permissions = permissionService.getSystemPermissions();
            return ResponseEntity.ok(ResponseDTO.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy quyền hệ thống: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get custom permissions", description = "Returns all custom permissions")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved permissions"),
            @ApiResponse(responseCode = "403", description = "Not authorized to view permissions")
    })
    @GetMapping("/custom")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<List<PermissionDTO>>> getCustomPermissions() {
        try {
            List<PermissionDTO> permissions = permissionService.getCustomPermissions();
            return ResponseEntity.ok(ResponseDTO.success(permissions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy quyền tùy chỉnh: " + e.getMessage()));
        }
    }

    @Operation(summary = "Create a new permission", description = "Creates a new custom permission")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Permission successfully created"),
            @ApiResponse(responseCode = "403", description = "Not authorized to create permissions")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<PermissionDTO>> createPermission(
            @Parameter(description = "Permission details", required = true) @RequestBody PermissionDTO permissionDTO) {
        try {
            PermissionDTO createdPermission = permissionService.createPermission(permissionDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo quyền thành công", createdPermission));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tạo quyền: " + e.getMessage()));
        }
    }

    @Operation(summary = "Update a permission", description = "Updates an existing custom permission")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Permission successfully updated"),
            @ApiResponse(responseCode = "404", description = "Permission not found"),
            @ApiResponse(responseCode = "400", description = "Cannot update system permission"),
            @ApiResponse(responseCode = "403", description = "Not authorized to update permissions")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<PermissionDTO>> updatePermission(
            @Parameter(description = "ID of the permission to update") @PathVariable Long id,
            @Parameter(description = "Updated permission details", required = true) @RequestBody PermissionDTO permissionDTO) {
        try {
            return permissionService.updatePermission(id, permissionDTO)
                    .map(permission -> ResponseEntity.ok(ResponseDTO.success("Cập nhật quyền thành công", permission)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy quyền hoặc không thể cập nhật quyền hệ thống")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật quyền: " + e.getMessage()));
        }
    }

    @Operation(summary = "Delete a permission", description = "Deletes a custom permission")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Permission successfully deleted"),
            @ApiResponse(responseCode = "404", description = "Permission not found"),
            @ApiResponse(responseCode = "400", description = "Cannot delete system permission"),
            @ApiResponse(responseCode = "403", description = "Not authorized to delete permissions")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseDTO<String>> deletePermission(
            @Parameter(description = "ID of the permission to delete") @PathVariable Long id) {
        try {
            boolean deleted = permissionService.deletePermission(id);
            if (deleted) {
                return ResponseEntity.ok(ResponseDTO.success("Xóa quyền thành công"));
            } else {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Không thể xóa quyền hoặc không tìm thấy quyền"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi xóa quyền: " + e.getMessage()));
        }
    }
}
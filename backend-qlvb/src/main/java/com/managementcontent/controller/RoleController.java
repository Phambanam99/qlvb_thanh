package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.CreateRoleDTO;
import com.managementcontent.dto.RoleDTO;
import com.managementcontent.dto.UpdateRoleDTO;
import com.managementcontent.service.RoleService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Roles", description = "APIs for managing roles")
public class RoleController {

        private final RoleService roleService;

        @Operation(summary = "Get all roles", description = "Returns a list of all roles")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved roles"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
        })
        @GetMapping
        public ResponseEntity<ResponseDTO<List<RoleDTO>>> getAllRoles() {
                try {
                        List<RoleDTO> roles = roleService.getAllRoles();
                        return ResponseEntity.ok(ResponseDTO.success(roles));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách vai trò: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get paginated roles", description = "Returns a paginated list of roles")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved roles"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
        })
        @GetMapping("/paginated")
        public ResponseEntity<ResponseDTO<Page<RoleDTO>>> getPaginatedRoles(Pageable pageable) {
                try {
                        Page<RoleDTO> roles = roleService.getAllRolesPaginated(pageable);
                        return ResponseEntity.ok(ResponseDTO.success(roles));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách vai trò phân trang: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get role by ID", description = "Returns a single role by ID")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved role"),
                        @ApiResponse(responseCode = "404", description = "Role not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
        })
        @GetMapping("/{id}")
        public ResponseEntity<ResponseDTO<RoleDTO>> getRoleById(
                        @Parameter(description = "ID of the role to retrieve") @PathVariable Long id) {
                try {
                        return roleService.getRoleById(id)
                                        .map(role -> ResponseEntity.ok(ResponseDTO.success(role)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy vai trò")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy thông tin vai trò: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get role by name", description = "Returns a single role by name")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved role"),
                        @ApiResponse(responseCode = "404", description = "Role not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
        })
        @GetMapping("/name/{name}")
        public ResponseEntity<ResponseDTO<RoleDTO>> getRoleByName(
                        @Parameter(description = "Name of the role to retrieve") @PathVariable String name) {
                try {
                        return roleService.getRoleByName(name)
                                        .map(role -> ResponseEntity.ok(ResponseDTO.success(role)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error(
                                                                        "Không tìm thấy vai trò với tên: " + name)));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy vai trò theo tên: " + e.getMessage()));
                }
        }

        @Operation(summary = "Create a new role", description = "Creates a new role")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "Role successfully created"),
                        @ApiResponse(responseCode = "400", description = "Invalid role data or role already exists"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to create roles")
        })
        @PostMapping
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<RoleDTO>> createRole(
                        @Parameter(description = "Role details", required = true) @RequestBody CreateRoleDTO createRoleDTO) {
                try {
                        RoleDTO createdRole = roleService.createRole(createRoleDTO);
                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Tạo vai trò thành công", createdRole));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi tạo vai trò: " + e.getMessage()));
                }
        }

        @Operation(summary = "Update a role", description = "Updates an existing role")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Role successfully updated"),
                        @ApiResponse(responseCode = "404", description = "Role not found"),
                        @ApiResponse(responseCode = "400", description = "Invalid role data or name conflict"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to update roles")
        })
        @PutMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<RoleDTO>> updateRole(
                        @Parameter(description = "ID of the role to update") @PathVariable Long id,
                        @Parameter(description = "Updated role details", required = true) @RequestBody UpdateRoleDTO updateRoleDTO) {
                try {
                        return roleService.updateRole(id, updateRoleDTO)
                                        .map(role -> ResponseEntity
                                                        .ok(ResponseDTO.success("Cập nhật vai trò thành công", role)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy vai trò")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi cập nhật vai trò: " + e.getMessage()));
                }
        }

        @Operation(summary = "Delete a role", description = "Deletes a role")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Role successfully deleted"),
                        @ApiResponse(responseCode = "404", description = "Role not found"),
                        @ApiResponse(responseCode = "400", description = "Role cannot be deleted because it is assigned to users"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to delete roles")
        })
        @DeleteMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<String>> deleteRole(
                        @Parameter(description = "ID of the role to delete") @PathVariable Long id) {
                try {
                        boolean deleted = roleService.deleteRole(id);
                        if (deleted) {
                                return ResponseEntity.ok(ResponseDTO.success("Xóa vai trò thành công"));
                        } else {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy vai trò"));
                        }
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi xóa vai trò: " + e.getMessage()));
                }
        }
}
package com.managementcontent.controller;

import com.managementcontent.dto.CustomRoleDTO;
import com.managementcontent.service.CustomRoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles_custom")
@RequiredArgsConstructor
@Tag(name = "Roles", description = "APIs for managing custom roles")
public class CustomRoleController {

    private final CustomRoleService customRoleService;

    @Operation(summary = "Get all roles", description = "Returns a list of all roles")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved roles"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomRoleDTO>> getAllRoles() {
        return ResponseEntity.ok(customRoleService.getAllRoles());
    }

    @Operation(summary = "Get role by ID", description = "Returns a single role by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved role"),
        @ApiResponse(responseCode = "404", description = "Role not found"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomRoleDTO> getRoleById(
            @Parameter(description = "ID of the role to retrieve") @PathVariable Long id) {
        return customRoleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get role by name", description = "Returns a single role by name")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved role"),
        @ApiResponse(responseCode = "404", description = "Role not found"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping("/name/{name}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomRoleDTO> getRoleByName(
            @Parameter(description = "Name of the role to retrieve") @PathVariable String name) {
        return customRoleService.getRoleByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get system roles", description = "Returns all system roles")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved system roles"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping("/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomRoleDTO>> getSystemRoles() {
        return ResponseEntity.ok(customRoleService.getSystemRoles());
    }

    @Operation(summary = "Get custom roles", description = "Returns all custom roles")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved custom roles"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping("/custom")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomRoleDTO>> getCustomRoles() {
        return ResponseEntity.ok(customRoleService.getCustomRoles());
    }

    @Operation(summary = "Get roles by creator", description = "Returns roles created by a specific user")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved roles"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping("/creator/{creatorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomRoleDTO>> getRolesByCreator(
            @Parameter(description = "ID of the creator") @PathVariable Long creatorId) {
        return ResponseEntity.ok(customRoleService.getRolesByCreator(creatorId));
    }

    @Operation(summary = "Get roles by permission", description = "Returns roles that have a specific permission")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Successfully retrieved roles"),
        @ApiResponse(responseCode = "403", description = "Not authorized to view roles")
    })
    @GetMapping("/by-permission/{permissionName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomRoleDTO>> getRolesByPermission(
            @Parameter(description = "Name of the permission") @PathVariable String permissionName) {
        return ResponseEntity.ok(customRoleService.getRolesByPermission(permissionName));
    }

    @Operation(summary = "Create a new role", description = "Creates a new custom role")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Role successfully created"),
        @ApiResponse(responseCode = "403", description = "Not authorized to create roles")
    })
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomRoleDTO> createRole(
            @Parameter(description = "Role details", required = true) @RequestBody CustomRoleDTO roleDTO) {
        
        // Get current authenticated user
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        // Get user ID from username (implementation depends on your UserService)
        // For now, using a placeholder - in a real implementation, you would look up the user ID
        Long creatorId = 1L; // Replace with actual implementation
        
        CustomRoleDTO createdRole = customRoleService.createRole(roleDTO, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdRole);
    }

    @Operation(summary = "Update a role", description = "Updates an existing custom role")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Role successfully updated"),
        @ApiResponse(responseCode = "404", description = "Role not found"),
        @ApiResponse(responseCode = "400", description = "Cannot update system role"),
        @ApiResponse(responseCode = "403", description = "Not authorized to update roles")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomRoleDTO> updateRole(
            @Parameter(description = "ID of the role to update") @PathVariable Long id,
            @Parameter(description = "Updated role details", required = true) @RequestBody CustomRoleDTO roleDTO) {
        return customRoleService.updateRole(id, roleDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Delete a role", description = "Deletes a custom role")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Role successfully deleted"),
        @ApiResponse(responseCode = "404", description = "Role not found"),
        @ApiResponse(responseCode = "400", description = "Cannot delete system role"),
        @ApiResponse(responseCode = "403", description = "Not authorized to delete roles")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRole(
            @Parameter(description = "ID of the role to delete") @PathVariable Long id) {
        boolean deleted = customRoleService.deleteRole(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Add permission to role", description = "Adds a permission to a role")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Permission successfully added to role"),
        @ApiResponse(responseCode = "404", description = "Role or permission not found"),
        @ApiResponse(responseCode = "400", description = "Cannot modify system role"),
        @ApiResponse(responseCode = "403", description = "Not authorized to modify roles")
    })
    @PostMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomRoleDTO> addPermissionToRole(
            @Parameter(description = "ID of the role") @PathVariable Long roleId,
            @Parameter(description = "ID of the permission to add") @PathVariable Long permissionId) {
        return customRoleService.addPermissionToRole(roleId, permissionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Remove permission from role", description = "Removes a permission from a role")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Permission successfully removed from role"),
        @ApiResponse(responseCode = "404", description = "Role or permission not found"),
        @ApiResponse(responseCode = "400", description = "Cannot modify system role"),
        @ApiResponse(responseCode = "403", description = "Not authorized to modify roles")
    })
    @DeleteMapping("/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomRoleDTO> removePermissionFromRole(
            @Parameter(description = "ID of the role") @PathVariable Long roleId,
            @Parameter(description = "ID of the permission to remove") @PathVariable Long permissionId) {
        return customRoleService.removePermissionFromRole(roleId, permissionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
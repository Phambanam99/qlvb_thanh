package com.managementcontent.service;

import com.managementcontent.dto.CustomRoleDTO;
import com.managementcontent.dto.PermissionDTO;
import com.managementcontent.model.CustomRole;
import com.managementcontent.model.Permission;
import com.managementcontent.repository.CustomRoleRepository;
import com.managementcontent.repository.PermissionRepository;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomRoleService {

    private final CustomRoleRepository customRoleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PermissionService permissionService;
    
    public List<CustomRoleDTO> getAllRoles() {
        return customRoleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<CustomRoleDTO> getSystemRoles() {
        return customRoleRepository.findByIsSystemRole(true).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<CustomRoleDTO> getCustomRoles() {
        return customRoleRepository.findByIsSystemRole(false).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Optional<CustomRoleDTO> getRoleById(Long id) {
        return customRoleRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    public Optional<CustomRoleDTO> getRoleByName(String name) {
        return customRoleRepository.findByName(name)
                .map(this::convertToDTO);
    }
    
    public List<CustomRoleDTO> getRolesByCreator(Long userId) {
        return userRepository.findById(userId)
                .map(user -> customRoleRepository.findByCreatedBy(user).stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }
    
    public List<CustomRoleDTO> getRolesByPermission(String permissionName) {
        return customRoleRepository.findByPermission(permissionName).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public CustomRoleDTO createRole(CustomRoleDTO roleDTO, Long creatorId) {
        CustomRole role = new CustomRole();
        role.setName(roleDTO.getName());
        role.setDescription(roleDTO.getDescription());
        role.setSystemRole(false); // Custom roles are not system roles
        
        // Set creator
        userRepository.findById(creatorId).ifPresent(role::setCreatedBy);
        
        // Process permissions
        Set<Permission> permissions = new HashSet<>();
        if (roleDTO.getPermissions() != null) {
            for (PermissionDTO permissionDTO : roleDTO.getPermissions()) {
                permissionRepository.findById(permissionDTO.getId())
                        .ifPresent(permissions::add);
            }
        }
        role.setPermissions(permissions);
        
        CustomRole savedRole = customRoleRepository.save(role);
        return convertToDTO(savedRole);
    }
    
    @Transactional
    public Optional<CustomRoleDTO> updateRole(Long id, CustomRoleDTO roleDTO) {
        return customRoleRepository.findById(id)
                .map(role -> {
                    // Don't allow changing system roles
                    if (role.isSystemRole()) {
                        return role;
                    }
                    
                    role.setName(roleDTO.getName());
                    role.setDescription(roleDTO.getDescription());
                    
                    // Process permissions
                    if (roleDTO.getPermissions() != null) {
                        Set<Permission> permissions = new HashSet<>();
                        for (PermissionDTO permissionDTO : roleDTO.getPermissions()) {
                            permissionRepository.findById(permissionDTO.getId())
                                    .ifPresent(permissions::add);
                        }
                        role.setPermissions(permissions);
                    }
                    
                    CustomRole updatedRole = customRoleRepository.save(role);
                    return updatedRole;
                })
                .map(this::convertToDTO);
    }
    
    @Transactional
    public boolean deleteRole(Long id) {
        return customRoleRepository.findById(id)
                .map(role -> {
                    // Don't allow deleting system roles
                    if (role.isSystemRole()) {
                        return false;
                    }
                    
                    customRoleRepository.delete(role);
                    return true;
                })
                .orElse(false);
    }
    
    @Transactional
    public Optional<CustomRoleDTO> addPermissionToRole(Long roleId, Long permissionId) {
        Optional<CustomRole> roleOpt = customRoleRepository.findById(roleId);
        Optional<Permission> permissionOpt = permissionRepository.findById(permissionId);
        
        if (roleOpt.isPresent() && permissionOpt.isPresent()) {
            CustomRole role = roleOpt.get();
            Permission permission = permissionOpt.get();
            
            // Don't allow modifying system roles
            if (role.isSystemRole()) {
                return Optional.empty();
            }
            
            role.addPermission(permission);
            CustomRole updatedRole = customRoleRepository.save(role);
            return Optional.of(convertToDTO(updatedRole));
        }
        
        return Optional.empty();
    }
    
    @Transactional
    public Optional<CustomRoleDTO> removePermissionFromRole(Long roleId, Long permissionId) {
        Optional<CustomRole> roleOpt = customRoleRepository.findById(roleId);
        Optional<Permission> permissionOpt = permissionRepository.findById(permissionId);
        
        if (roleOpt.isPresent() && permissionOpt.isPresent()) {
            CustomRole role = roleOpt.get();
            Permission permission = permissionOpt.get();
            
            // Don't allow modifying system roles
            if (role.isSystemRole()) {
                return Optional.empty();
            }
            
            role.removePermission(permission);
            CustomRole updatedRole = customRoleRepository.save(role);
            return Optional.of(convertToDTO(updatedRole));
        }
        
        return Optional.empty();
    }
    
    public CustomRoleDTO convertToDTO(CustomRole role) {
        CustomRoleDTO dto = new CustomRoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setDescription(role.getDescription());
        dto.setSystemRole(role.isSystemRole());
        dto.setCreatedAt(role.getCreatedAt());
        dto.setUpdatedAt(role.getUpdatedAt());
        
        if (role.getCreatedBy() != null) {
            dto.setCreatedById(role.getCreatedBy().getId());
            dto.setCreatedByName(role.getCreatedBy().getName());
        }
        
        // Convert permissions
        Set<PermissionDTO> permissionDTOs = role.getPermissions().stream()
                .map(permissionService::convertToDTO)
                .collect(Collectors.toSet());
        dto.setPermissions(permissionDTOs);
        
        return dto;
    }
}
package com.managementcontent.service;

import com.managementcontent.dto.PermissionDTO;
import com.managementcontent.model.Permission;
import com.managementcontent.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;
    
    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<PermissionDTO> getPermissionsByCategory(String category) {
        return permissionRepository.findByCategory(category).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<PermissionDTO> getSystemPermissions() {
        return permissionRepository.findByIsSystemPermission(true).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<PermissionDTO> getCustomPermissions() {
        return permissionRepository.findByIsSystemPermission(false).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Optional<PermissionDTO> getPermissionById(Long id) {
        return permissionRepository.findById(id)
                .map(this::convertToDTO);
    }
    
    public Optional<PermissionDTO> getPermissionByName(String name) {
        return permissionRepository.findByName(name)
                .map(this::convertToDTO);
    }
    
    @Transactional
    public PermissionDTO createPermission(PermissionDTO permissionDTO) {
        Permission permission = new Permission();
        permission.setName(permissionDTO.getName());
        permission.setDescription(permissionDTO.getDescription());
        permission.setCategory(permissionDTO.getCategory());
        permission.setSystemPermission(false); // Custom permissions are not system permissions
        
        Permission savedPermission = permissionRepository.save(permission);
        return convertToDTO(savedPermission);
    }
    
    @Transactional
    public Optional<PermissionDTO> updatePermission(Long id, PermissionDTO permissionDTO) {
        return permissionRepository.findById(id)
                .map(permission -> {
                    // Don't allow changing system permissions
                    if (permission.isSystemPermission()) {
                        return permission;
                    }
                    
                    permission.setName(permissionDTO.getName());
                    permission.setDescription(permissionDTO.getDescription());
                    permission.setCategory(permissionDTO.getCategory());
                    
                    Permission updatedPermission = permissionRepository.save(permission);
                    return updatedPermission;
                })
                .map(this::convertToDTO);
    }
    
    @Transactional
    public boolean deletePermission(Long id) {
        return permissionRepository.findById(id)
                .map(permission -> {
                    // Don't allow deleting system permissions
                    if (permission.isSystemPermission()) {
                        return false;
                    }
                    
                    permissionRepository.delete(permission);
                    return true;
                })
                .orElse(false);
    }
    
    public PermissionDTO convertToDTO(Permission permission) {
        return PermissionDTO.builder()
                .id(permission.getId())
                .name(permission.getName())
                .description(permission.getDescription())
                .category(permission.getCategory())
                .systemPermission(permission.isSystemPermission())
                .build();
    }
    
    public Permission convertToEntity(PermissionDTO dto) {
        Permission permission = new Permission();
        permission.setName(dto.getName());
        permission.setDescription(dto.getDescription());
        permission.setCategory(dto.getCategory());
        permission.setSystemPermission(dto.isSystemPermission());
        return permission;
    }
}
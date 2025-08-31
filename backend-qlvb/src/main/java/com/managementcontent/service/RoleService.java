package com.managementcontent.service;

import com.managementcontent.dto.CreateRoleDTO;
import com.managementcontent.dto.RoleDTO;
import com.managementcontent.dto.UpdateRoleDTO;
import com.managementcontent.model.Role;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    /**
     * Get all roles
     */
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all roles with pagination
     */
    public Page<RoleDTO> getAllRolesPaginated(Pageable pageable) {
        return roleRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    /**
     * Get role by ID
     */
    public Optional<RoleDTO> getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(this::convertToDTO);
    }

    /**
     * Get role by name
     */
    public Optional<RoleDTO> getRoleByName(String name) {
        return roleRepository.findByName(name)
                .map(this::convertToDTO);
    }

    /**
     * Create a new role
     */
    @Transactional
    public RoleDTO createRole(CreateRoleDTO createRoleDTO) {
        // Check if a role with this name already exists
        if (roleRepository.existsByName(createRoleDTO.getName())) {
            throw new IllegalArgumentException("Role with name " + createRoleDTO.getName() + " already exists");
        }

        Role role = new Role();
        role.setName(createRoleDTO.getName());
        role.setDisplayName(createRoleDTO.getDisplayName());
        // Try to map to a UserRole enum if possible
        UserRole userRole = UserRole.fromDisplayName(createRoleDTO.getDisplayName());
        if (userRole != null) {
            role.setUserRole(userRole);
        }

        Role savedRole = roleRepository.save(role);
        return convertToDTO(savedRole);
    }

    /**
     * Update an existing role
     */
    @Transactional
    public Optional<RoleDTO> updateRole(Long id, UpdateRoleDTO updateRoleDTO) {
        return roleRepository.findById(id)
                .map(role -> {
                    // Check if name is being changed and if the new name already exists
                    if (updateRoleDTO.getName() != null &&
                            !role.getName().equals(updateRoleDTO.getName()) &&
                            roleRepository.existsByName(updateRoleDTO.getName())) {
                        throw new IllegalArgumentException(
                                "Role with name " + updateRoleDTO.getName() + " already exists");
                    }

                    if (updateRoleDTO.getName() != null) {
                        role.setName(updateRoleDTO.getName());
                    }

                    // Try to map to a UserRole enum if possible
                    if (updateRoleDTO.getDisplayName() != null) {
                        UserRole userRole = UserRole.fromDisplayName(updateRoleDTO.getDisplayName());
                        if (userRole != null) {
                            role.setUserRole(userRole);
                        }else {
                            role.setDisplayName(updateRoleDTO.getDisplayName());
                        }

                    }
                    if (updateRoleDTO.getDescription() != null) {
                        role.setDescription(updateRoleDTO.getDescription());
                    }
                    Role updatedRole = roleRepository.save(role);
                    return convertToDTO(updatedRole);
                });
    }

    /**
     * Delete a role by ID
     */
    @Transactional
    public boolean deleteRole(Long id) {
        return roleRepository.findById(id)
                .map(role -> {
                    // Check if role has users
                    if (role.getUsers() != null && !role.getUsers().isEmpty()) {
                        throw new IllegalStateException("Cannot delete role that is assigned to users");
                    }

                    roleRepository.delete(role);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Convert Role entity to RoleDTO
     */
    public RoleDTO convertToDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getRid());
        dto.setName(role.getName());
        dto.setDisplayName(role.getDisplayName());
        dto.setUserCount(role.getUsers() != null ? role.getUsers().size() : 0);
        return dto;
    }
}
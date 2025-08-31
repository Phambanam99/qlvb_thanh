package com.managementcontent.service;

import com.managementcontent.dto.CreateUserDTO;
import com.managementcontent.dto.UpdateUserDTO;
import com.managementcontent.dto.UserDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.Role;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.model.enums.UserStatus;
import com.managementcontent.repository.RoleRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final DocumentAccessControlService documentAccessControlService;

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByName(String username) {
        return userRepository.findByName(username);
    }

    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    public boolean existsByName(String username) {
        return userRepository.findByName(username).isPresent();
    }

    public User update(User user) {
        // Only encode password if it was changed (not null and not already encoded)
        if (user.getPass() != null && !user.getPass().startsWith("$2a$")) {
            user.setPass(passwordEncoder.encode(user.getPass()));
        }
        return userRepository.save(user);
    }

    public boolean authenticate(String username, String password) {
        Optional<User> userOpt = userRepository.findByName(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return passwordEncoder.matches(password, user.getPass());
        }
        return false;
    }

    /**
     * get all user by department id
     */
    public List<UserDTO> findByDepartmentId(Long departmentId) {
        return userRepository.findByDepartmentId(departmentId)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Convert a User entity to UserDTO
     */
    public UserDTO convertToDTO(User user) {
        if (user == null) {
            return null;
        }

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getName());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getMail());
        dto.setPhone(user.getPhone());

        dto.setStatus(user.getStatus());

        Role role = user.getRoles().stream()
                .findFirst()
                .orElse(null);
        if (role != null) {
            dto.setRoleId(role.getRid());
        }
        dto.setRoleId(role != null ? role.getRid() : null);
        // Set status label (removed unused variable)

        dto.setCreated(user.getCreated());
        dto.setLastAccess(user.getLastAccess());
        dto.setLastLogin(user.getLastLogin());

        // Add department info
        if (user.getDepartment() != null) {
            dto.setDepartmentId(user.getDepartment().getId());
            dto.setDepartmentName(user.getDepartment().getName());
        }

        // Set roles
        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        dto.setRoles(roles);

        // Set isCommanderOfUnit
        dto.setIsCommanderOfUnit(user.getIsCommanderOfUnit());

        return dto;
    }

    /**
     * Get user by ID and return as DTO
     */
    public Optional<UserDTO> getUserDTOById(Long id) {
        return userRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Get user by ID and return as DTO (for controller compatibility)
     */
    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Get user by username and return as DTO (for controller compatibility)
     */
    public Optional<UserDTO> getUserByUsername(String username) {
        return userRepository.findByName(username).map(this::convertToDTO);
    }

    /**
     * Get all users as DTOs
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new user from CreateUserDTO
     */
    @Transactional
    public UserDTO createUser(CreateUserDTO createUserDTO) {
        // Check if username already exists
        if (userRepository.existsByName(createUserDTO.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }

        User user = new User();
        user.setName(createUserDTO.getUsername());
        user.setPass(passwordEncoder.encode(createUserDTO.getPassword()));
        user.setFullName(createUserDTO.getFullName());
        user.setMail(createUserDTO.getEmail());
        user.setPhone(createUserDTO.getPhone());

        // Handle department if specified
        if (createUserDTO.getDepartmentId() != null) {
            departmentRepository.findById(createUserDTO.getDepartmentId())
                    .ifPresent(user::setDepartment);
        }

        // Set status
        if (createUserDTO.getUserStatus() != null) {
            user.setUserStatus(createUserDTO.getUserStatus());
        } else {
            user.setUserStatus(UserStatus.PENDING_APPROVAL);
        }

        // Set isCommanderOfUnit
        if (createUserDTO.getIsCommanderOfUnit() != null) {
            user.setIsCommanderOfUnit(createUserDTO.getIsCommanderOfUnit());
        }

        // Handle roles (prefer enum if available)
        if (createUserDTO.getUserRoles() != null && !createUserDTO.getUserRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            createUserDTO.getUserRoles().forEach(userRole -> {
                roleRepository.findByName(userRole.getCode())
                        .ifPresent(roles::add);
            });
            if (!roles.isEmpty()) {
                user.setRoles(roles);
            }
        } else if (createUserDTO.getRoles() != null && !createUserDTO.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            createUserDTO.getRoles().forEach(roleName -> {
                roleRepository.findByName(roleName)
                        .ifPresent(roles::add);
            });
            if (!roles.isEmpty()) {
                user.setRoles(roles);
            }
        }
        System.out.println(user);
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    /**
     * Update a user by ID with new UpdateUserDTO data
     * Cải thiện: Loại bỏ code duplication và logging không phù hợp
     */
    @Transactional
    public Optional<UserDTO> updateUserWithNewDTO(Long id, UpdateUserDTO updateUserDTO) {
        log.debug("Updating user with ID: {} using UpdateUserDTO: {}", id, updateUserDTO);

        try {
            return userRepository.findById(id).map(user -> {
                log.debug("Found user to update: {}", user.getName());

                // Update username if provided and not already taken by another user
                updateUsernameIfChanged(user, updateUserDTO.getUsername());

                // Update basic fields if provided
                updateBasicFields(user, updateUserDTO);

                // Handle department update
                updateDepartmentIfProvided(user, updateUserDTO.getDepartmentId());

                // Handle user status update (single location)
                if (updateUserDTO.getUserStatus() != null) {
                    user.setUserStatus(updateUserDTO.getUserStatus());
                    log.debug("Updated user status to: {}", updateUserDTO.getUserStatus());
                }

                // Update commander status
                if (updateUserDTO.getIsCommanderOfUnit() != null) {
                    user.setIsCommanderOfUnit(updateUserDTO.getIsCommanderOfUnit());
                }

                // Handle roles update
                updateUserRoles(user, updateUserDTO);

                User savedUser = userRepository.save(user);
                log.info("Successfully updated user with ID: {}", savedUser.getId());
                return convertToDTO(savedUser);
            });
        } catch (Exception e) {
            log.error("Error updating user with ID: {} - {}", id, e.getMessage(), e);
            throw e; // Re-throw to propagate the exception
        }
    }

    /**
     * Helper method to update username if changed and validate uniqueness
     */
    private void updateUsernameIfChanged(User user, String newUsername) {
        if (newUsername != null && !newUsername.equals(user.getName())) {
            if (userRepository.existsByName(newUsername)) {
                throw new IllegalArgumentException("Username already exists: " + newUsername);
            }
            user.setName(newUsername);
        }
    }

    /**
     * Helper method to update basic user fields
     */
    private void updateBasicFields(User user, UpdateUserDTO updateUserDTO) {
        if (updateUserDTO.getFullName() != null) {
            user.setFullName(updateUserDTO.getFullName());
        }
        if (updateUserDTO.getEmail() != null) {
            user.setMail(updateUserDTO.getEmail());
        }
        if (updateUserDTO.getPhone() != null) {
            user.setPhone(updateUserDTO.getPhone());
        }
    }

    /**
     * Helper method to update department if provided
     */
    private void updateDepartmentIfProvided(User user, Long departmentId) {
        if (departmentId != null) {
            departmentRepository.findById(departmentId)
                    .ifPresent(user::setDepartment);
        }
    }

    /**
     * Helper method to handle role updates with improved logic
     */
    private void updateUserRoles(User user, UpdateUserDTO updateUserDTO) {
        // Handle roles using enum (preferred)
        if (updateUserDTO.getUserRoles() != null && !updateUserDTO.getUserRoles().isEmpty()) {
            Set<Role> roles = updateUserDTO.getUserRoles().stream()
                    .map(userRole -> roleRepository.findByName(userRole.getCode()))
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toSet());

            if (!roles.isEmpty()) {
                user.setRoles(roles);
            }
        }
        // Handle roles using string names (fallback) - Support both code and
        // displayName
        else if (updateUserDTO.getRoles() != null && !updateUserDTO.getRoles().isEmpty()) {
            Set<Role> roles = updateUserDTO.getRoles().stream()
                    .map(this::getRoleCodeFromString)
                    .filter(Objects::nonNull)
                    .map(roleRepository::findByName)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toSet());

            if (!roles.isEmpty()) {
                user.setRoles(roles);
            }
        }
    }

    /**
     * Helper method to get role code from string (supports both code and display
     * name)
     */
    private String getRoleCodeFromString(String roleString) {
        if (roleString == null) {
            return null;
        }

        // First try to find by code (if it's already a role code like "ROLE_TRO_LY")
        UserRole roleByCode = UserRole.fromCode(roleString);
        if (roleByCode != null) {
            return roleByCode.getCode();
        }

        // Then try to find by display name (like "Trợ lý")
        UserRole roleByDisplayName = UserRole.fromDisplayName(roleString);
        if (roleByDisplayName != null) {
            return roleByDisplayName.getCode();
        }

        log.warn("Unable to find role for string: {}", roleString);
        return null;
    }

    /**
     * Delete a user by ID
     */
    public boolean deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Update a user's password by ID
     */
    public boolean updatePassword(Long id, String newPassword) {
        return userRepository.findById(id).map(user -> {
            user.setPass(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return true;
        }).orElse(false);
    }

    /**
     * Get users filtered by role and/or status
     * 
     * @param role   The role to filter by (optional)
     * @param status The status to filter by (optional)
     * @return List of filtered users as DTOs
     */
    public List<UserDTO> getUsersByFilter(UserRole role, UserStatus status) {
        List<User> users = userRepository.findAll();

        return users.stream()
                .filter(user -> {
                    // Filter by role if specified
                    if (role != null) {
                        boolean hasRole = user.getRoles().stream()
                                .map(Role::getName)
                                .anyMatch(roleName -> roleName.equals(role.getCode()));
                        if (!hasRole) {
                            return false;
                        }
                    }

                    // Filter by status if specified
                    if (status != null) {
                        UserStatus userStatus = user.getUserStatus();
                        return userStatus != null && userStatus.equals(status);
                    }

                    // No filters or passed all filters
                    return true;
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // method find users by department id and role
    public List<UserDTO> findByDepartmentIdAndRolesIn(Long departmentId, Set<String> roles) {

        return userRepository.findByDepartmentIdAndRoles(departmentId, roles)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách người dùng có thể phê duyệt theo vai trò:
     * - Nếu là văn thư (ROLE_VAN_THU): trả về danh sách chỉ huy tất cả các cấp
     * - Nếu là trợ lý, nhân viên: trả về danh sách chỉ huy của đơn vị đó
     * - Nếu là chỉ huy đơn vị: trả về danh sách chỉ huy đơn vị cha
     *
     * @param userId ID của người dùng hiện tại
     * @return Danh sách người dùng có thể phê duyệt
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getUserForApproved(Long userId) {
        // Tìm thông tin người dùng
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // Kiểm tra xem người dùng có vai trò văn thư không
        boolean isRecordsClerk = currentUser.getRoles().stream()
                .anyMatch(role -> role.getName().equals("ROLE_VAN_THU"));

        // Nếu là văn thư, trả về danh sách chỉ huy tất cả các cấp
        if (isRecordsClerk) {
            return userRepository.findByIsCommanderOfUnitTrue()
                    .stream().map(this::convertToDTO).collect(Collectors.toList());
        }

        // Lấy phòng ban của người dùng
        if (currentUser.getDepartment() == null) {
            return Collections.emptyList();
        }

        // Nếu là chỉ huy đơn vị
        if (Boolean.TRUE.equals(currentUser.getIsCommanderOfUnit())) {
            // Lấy đơn vị cha
            Department parentDepartment = currentUser.getDepartment().getParentDepartment();
            if (parentDepartment == null) {
                return Collections.emptyList(); // Không có đơn vị cha
            }

            // Trả về danh sách chỉ huy đơn vị cha
            return userRepository.findByDepartmentIdAndIsCommanderOfUnitTrue(parentDepartment.getId())
                    .stream().map(this::convertToDTO).collect(Collectors.toList());
        } else {
            // Trường hợp là trợ lý hoặc nhân viên thường
            // Trả về danh sách chỉ huy của đơn vị hiện tại
            return userRepository.findByDepartmentIdAndIsCommanderOfUnitTrue(currentUser.getDepartment().getId())
                    .stream().map(this::convertToDTO).collect(Collectors.toList());
        }
    }

    /**
     * Kiểm tra xem mật khẩu được cung cấp có khớp với mật khẩu hiện tại của người
     * dùng không
     *
     * @param userId          ID của người dùng
     * @param currentPassword Mật khẩu hiện tại cần kiểm tra
     * @return true nếu mật khẩu khớp, false nếu không khớp hoặc không tìm thấy
     *         người dùng
     */
    public boolean checkCurrentPassword(Long userId, String currentPassword) {
        return userRepository.findById(userId)
                .map(user -> passwordEncoder.matches(currentPassword, user.getPass()))
                .orElse(false);
    }

    /**
     * Create a new user from UserDTO and password (for backward compatibility)
     */
    @Transactional
    public UserDTO createUser(UserDTO userDTO, String rawPassword) {

        User user = new User();
        user.setName(userDTO.getUsername());
        user.setPass(passwordEncoder.encode(rawPassword));
        user.setFullName(userDTO.getFullName());
        user.setMail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());

        // Handle department if specified
        if (userDTO.getDepartmentId() != null) {
            departmentRepository.findById(userDTO.getDepartmentId())
                    .ifPresent(user::setDepartment);
        }

        // Set status
        if (userDTO.getStatus() != null) {
            user.setStatus(userDTO.getStatus());
        } else {
            user.setStatus(UserStatus.PENDING_APPROVAL.getValue());
        }

        // Handle roles
        if (userDTO.getRoles() != null && !userDTO.getRoles().isEmpty()) {
            Set<Role> roles = new HashSet<>();
            for (String roleName : userDTO.getRoles()) {
                roleRepository.findByName(roleName)
                        .ifPresent(roles::add);
            }
            user.setRoles(roles);
            // use roles for check is commander of unit
            // commader of unit is
            // ROLE_TRUONG_BAN or
            // ROLE_CUM_TRUONG
            // or ROLE_TRAM_TRUONG or
            // ROLE_CHINH_UY or
            // ROLE_PHO_CHINH_UY
            // ROLE_CHINH_TRI_VIEN_CUM or
            // ROLE_CHINH_TRI_VIEN_TRAM or
            // ROLE_PHO_TRAM_TRUONG or
            // ROLE_PHO_PHONG or
            // ROLE_TRUONG_PHONG or
            // ROLE_CUC_TRUONG or
            // ROLE_CUC_PHO or
            user.setIsCommanderOfUnit(roles.stream()
                    .anyMatch(role -> role.getName().equals(UserRole.TRUONG_BAN.getCode()) ||
                            role.getName().equals(UserRole.CUM_TRUONG.getCode()) ||
                            role.getName().equals(UserRole.TRAM_TRUONG.getCode()) ||
                            role.getName().equals(UserRole.CHINH_UY.getCode()) ||
                            role.getName().equals(UserRole.PHO_CHINH_UY.getCode()) ||
                            role.getName().equals(UserRole.CHINH_TRI_VIEN_CUM.getCode()) ||
                            role.getName().equals(UserRole.CHINH_TRI_VIEN_TRAM.getCode()) ||
                            role.getName().equals(UserRole.PHO_TRAM_TRUONG.getCode()) ||
                            role.getName().equals(UserRole.PHO_PHONG.getCode()) ||
                            role.getName().equals(UserRole.TRUONG_PHONG.getCode()) ||
                            role.getName().equals(UserRole.CUC_TRUONG.getCode()) ||
                            role.getName().equals(UserRole.CUC_PHO.getCode())));
        }

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    /**
     * Update a user by ID with new UserDTO data (for backward compatibility)
     */
    @Transactional
    public Optional<UserDTO> updateUser(Long id, UserDTO userDTO) {
        return userRepository.findById(id).map(user -> {
            if (userDTO.getUsername() != null)
                user.setName(userDTO.getUsername());
            else if (userDTO.getFullName() != null) {
                user.setFullName(userDTO.getFullName());
            }

            if (userDTO.getEmail() != null)
                user.setMail(userDTO.getEmail());

            if (userDTO.getPhone() != null)
                user.setPhone(userDTO.getPhone());

            // Handle status (prefer enum if available)
            if (userDTO.getUserStatus() != null) {
                user.setUserStatus(userDTO.getUserStatus());
            } else if (userDTO.getStatus() != null) {
                user.setStatus(userDTO.getStatus());
            }

            if (userDTO.getLastAccess() != null)
                user.setLastAccess(userDTO.getLastAccess());
            if (userDTO.getLastLogin() != null)
                user.setLastLogin(userDTO.getLastLogin());
            if (userDTO.getDepartmentId() != null) {
                departmentRepository.findById(userDTO.getDepartmentId())
                        .ifPresent(user::setDepartment);
            }

            // Cập nhật trạng thái chỉ huy đơn vị
            if (userDTO.getIsCommanderOfUnit() != null) {
                user.setIsCommanderOfUnit(userDTO.getIsCommanderOfUnit());
            }

            // Handle roles (prefer enum if available)
            if (userDTO.getUserRoles() != null && !userDTO.getUserRoles().isEmpty()) {
                Set<Role> roles = new HashSet<>();
                userDTO.getUserRoles().forEach(userRole -> {
                    roleRepository.findByName(userRole.getCode())
                            .ifPresent(roles::add);
                });
                if (!roles.isEmpty()) {
                    user.setRoles(roles);
                }
            } else if (userDTO.getRoles() != null && !userDTO.getRoles().isEmpty()) {
                Set<Role> roles = new HashSet<>();
                userDTO.getRoles().forEach(roleName -> {
                    roleRepository.findByName(roleName)
                            .ifPresent(roles::add);
                });
                if (!roles.isEmpty()) {
                    user.setRoles(roles);
                }
            }

            User saved = userRepository.save(user);
            return convertToDTO(saved);
        });
    }

    /**
     * Get filtered users with pagination parameters
     * 
     * @param roleId       Role ID to filter by (optional)
     * @param status       Status to filter by (optional)
     * @param keyword      Keyword to search in name, username, email (optional)
     * @param departmentId Department ID to filter by (optional)
     * @return List of filtered users as DTOs
     */
    public List<UserDTO> getFilteredUsers(String roleId, Integer status, String keyword, Long departmentId) {
        List<User> users = userRepository.findAll();

        return users.stream()
                .filter(user -> {
                    // Filter by role if specified
                    if (roleId != null && !roleId.trim().isEmpty()) {
                        // Check if user has the specified role ID
                        boolean hasRole = user.getRoles().stream()
                                .anyMatch(role -> role.getRid().toString().equals(roleId));
                        if (!hasRole) {
                            return false;
                        }
                    }

                    // Filter by status if specified
                    if (status != null) {
                        System.out.println("User status: " + user.getStatus());
                        
                        // Get user status from either field
                        Integer userStatus = user.getStatus() != null ? user.getStatus()
                                : (user.getUserStatus() != null ? user.getUserStatus().getValue() : null);
                        
                        // If status is 1 (active), filter for active users (status == 1)
                        if (status == 1) {
                            if (userStatus == null || userStatus != 1) {
                                return false;
                            }
                        }
                        // If status is 0, filter for non-active users (status != 1)
                        else if (status == 0) {
                            if (userStatus != null && userStatus == 1) {
                                return false;
                            }
                        }
                        // For other status values, match exactly
                        else if (userStatus == null || !userStatus.equals(status)) {
                            return false;
                        }
                    }

                    // Filter by keyword if specified (search in name, username, email)
                    if (keyword != null && !keyword.trim().isEmpty()) {
                        String lowerKeyword = keyword.toLowerCase().trim();
                        boolean matchesKeyword = (user.getName() != null
                                && user.getName().toLowerCase().contains(lowerKeyword)) ||
                                (user.getFullName() != null && user.getFullName().toLowerCase().contains(lowerKeyword))
                                ||
                                (user.getMail() != null && user.getMail().toLowerCase().contains(lowerKeyword));
                        if (!matchesKeyword) {
                            return false;
                        }
                    }

                    // Filter by department if specified
                    if (departmentId != null) {
                        if (user.getDepartment() == null || !user.getDepartment().getId().equals(departmentId)) {
                            return false;
                        }
                    }

                    // Passed all filters
                    return true;
                })
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
}
package com.managementcontent.controller;

import com.managementcontent.dto.CreateUserDTO;
import com.managementcontent.dto.UpdateUserDTO;
import com.managementcontent.dto.UserDTO;
import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.model.enums.UserStatus;
import com.managementcontent.service.UserService;
import com.managementcontent.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "APIs for managing users")
public class UserController {

        private final UserService userService;
        private final UserRepository userRepository;

        @Operation(summary = "Get all users", description = "Returns a list of all users. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved all users"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view users")
        })
        @GetMapping
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<List<UserDTO>>> getAllUsers(
                        @Parameter(description = "Optional parameter to request paginated results. If 'paginated' is provided, use the /paginated endpoint instead.") @RequestParam(required = false) String paginated) {
                try {
                        // Check if pagination is requested, redirect to paginated endpoint
                        if (paginated != null) {
                                return ResponseEntity.ok()
                                                .header("Warning", "Use /api/users/paginated endpoint for pagination")
                                                .body(ResponseDTO.success(Collections.emptyList()));
                        }

                        List<UserDTO> users = userService.getAllUsers();
                        return ResponseEntity.ok(ResponseDTO.success(users));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get paginated users", description = "Returns a paginated list of users with filtering support. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved paginated users"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view users")
        })
        @GetMapping("/paginated")
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<Page<UserDTO>>> getPaginatedUsers(
                        Pageable pageable,
                        @Parameter(description = "Role ID to filter by") @RequestParam(required = false) String roleId,
                        @Parameter(description = "Status to filter by (0=inactive, 1=active)") @RequestParam(required = false) Integer status,
                        @Parameter(description = "Keyword to search in name, username, email") @RequestParam(required = false) String keyword,
                        @Parameter(description = "Department ID to filter by") @RequestParam(required = false) Long departmentId) {
                try {
                        // Get filtered users from service
                        List<UserDTO> filteredUsers = userService.getFilteredUsers(roleId, status, keyword, departmentId);

                        // Manual pagination on filtered results
                        int start = (int) pageable.getOffset();
                        int end = Math.min((start + pageable.getPageSize()), filteredUsers.size());
                        List<UserDTO> pageContent = start < filteredUsers.size() ? 
                                filteredUsers.subList(start, end) : new ArrayList<>();

                        Page<UserDTO> page = new PageImpl<>(pageContent, pageable, filteredUsers.size());
                        return ResponseEntity.ok(ResponseDTO.success(page));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách người dùng phân trang: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get user by ID", description = "Returns a single user by ID. Requires ADMIN role or to be the user requested.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved user"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view this user")
        })
        @GetMapping("/{id}")
        // @PreAuthorize("hasRole('ADMIN') or authentication.principal.username ==
        // #username")
        public ResponseEntity<ResponseDTO<UserDTO>> getUserById(
                        @Parameter(description = "ID of the user to retrieve") @PathVariable Long id) {
                try {
                        return userService.getUserById(id)
                                        .map(user -> ResponseEntity.ok(ResponseDTO.success(user)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy người dùng")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
                }
        }

        // Get Users by department id
        @Operation(summary = "Get users by department ID", description = "Returns a list of users by department ID. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved users by department ID"),
                        @ApiResponse(responseCode = "404", description = "Department not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view users by department")
        })
        @GetMapping("/department/{departmentId}")
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<List<UserDTO>>> getUsersByDepartmentId(
                        @Parameter(description = "ID of the department to retrieve users from") @PathVariable Long departmentId) {
                try {
                        List<UserDTO> users = userService.findByDepartmentId(departmentId);
                        return ResponseEntity.ok(ResponseDTO.success(users));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy danh sách người dùng theo phòng ban: "
                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Get user by username", description = "Returns a single user by username. Requires ADMIN role or to be the user requested.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved user"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view this user")
        })
        @GetMapping("/username/{username}")
        // @PreAuthorize("hasRole('ADMIN') or authentication.principal.username ==
        // #username")
        public ResponseEntity<ResponseDTO<UserDTO>> getUserByUsername(
                        @Parameter(description = "Username of the user to retrieve") @PathVariable String username) {
                try {
                        return userService.getUserByUsername(username)
                                        .map(user -> ResponseEntity.ok(ResponseDTO.success(user)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy người dùng")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
                }
        }

        // controller get users by department id and roles
        @Operation(summary = "Get users by department ID and roles", description = "Returns a list of users by department ID and roles. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved users by department ID and roles"),
                        @ApiResponse(responseCode = "404", description = "Department not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view users by department and roles")
        })
        @GetMapping("/department/{departmentId}/roles")
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<List<UserDTO>>> getUsersByDepartmentIdAndRoles(
                        @Parameter(description = "ID of the department to retrieve users from") @PathVariable Long departmentId,
                        @Parameter(description = "Roles to filter by") @RequestParam Set<String> roles) {
                try {
                        // Convert role codes to UserRole enums
                        List<UserDTO> users = userService.findByDepartmentIdAndRolesIn(departmentId, roles);
                        return ResponseEntity.ok(ResponseDTO.success(users));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error(
                                                        "Lỗi khi lấy danh sách người dùng theo phòng ban và vai trò: "
                                                                        + e.getMessage()));
                }
        }

        @Operation(summary = "Update user", description = "Updates a user's information. Requires ADMIN role or to be the user being updated.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "User successfully updated"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to update this user")
        })
        @PutMapping("/{id}")
        // @PreAuthorize("hasRole('ADMIN') or authentication.principal.username ==
        // @userService.getUserById(#id).get().username")
        public ResponseEntity<ResponseDTO<UserDTO>> updateUser(
                        @Parameter(description = "ID of the user to update") @PathVariable Long id,
                        @Parameter(description = "Updated user information", required = true) @RequestBody UserDTO userDTO) {
                try {
                        return userService.updateUser(id, userDTO)
                                        .map(user -> ResponseEntity.ok(
                                                        ResponseDTO.success("Cập nhật người dùng thành công", user)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy người dùng")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi cập nhật người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Delete user", description = "Deletes a user by ID. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "204", description = "User successfully deleted"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to delete users")
        })
        @DeleteMapping("/{id}")
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<String>> deleteUser(
                        @Parameter(description = "ID of the user to delete") @PathVariable Long id) {
                try {
                        boolean deleted = userService.deleteUser(id);
                        if (deleted) {
                                return ResponseEntity.ok(ResponseDTO.success("Xóa người dùng thành công"));
                        }
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy người dùng"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi xóa người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Update user password", description = "Updates a user's password. Requires ADMIN role or to be the user being updated.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Password successfully updated"),
                        @ApiResponse(responseCode = "400", description = "Invalid password provided"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to update this user's password")
        })
        @PutMapping("/{id}/password")
        public ResponseEntity<ResponseDTO<String>> updatePassword(
                        @Parameter(description = "ID of the user to update password") @PathVariable Long id,
                        @Parameter(description = "New password", required = true) @RequestBody Map<String, String> passwordMap) {

                try {
                        String newPassword = passwordMap.get("newPassword");
                        if (newPassword == null || newPassword.isBlank()) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Mật khẩu không được để trống"));
                        }

                        boolean updated = userService.updatePassword(id, newPassword);
                        if (updated) {
                                return ResponseEntity.ok(ResponseDTO.success("Cập nhật mật khẩu thành công"));
                        }
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy người dùng"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi cập nhật mật khẩu: " + e.getMessage()));
                }
        }

        @Operation(summary = "Check current password", description = "Kiểm tra xem mật khẩu hiện tại của người dùng có chính xác không")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Password check successful"),
                        @ApiResponse(responseCode = "400", description = "Invalid request"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to check this password")
        })
        @PostMapping("/{id}/check-password")
        public ResponseEntity<ResponseDTO<Map<String, Boolean>>> checkCurrentPassword(
                        @Parameter(description = "ID của người dùng") @PathVariable Long id,
                        @Parameter(description = "Mật khẩu cần kiểm tra", required = true) @RequestBody Map<String, String> passwordMap) {

                try {
                        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                        User currentUser = userRepository.findByName(auth.getName()).orElse(null);

                        if (currentUser == null ||
                                        (!Objects.equals(currentUser.getId(), id)
                                                        && auth.getAuthorities().stream().noneMatch(
                                                                        a -> a.getAuthority().equals("ROLE_ADMIN")))) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                .body(ResponseDTO.error("Không có quyền kiểm tra mật khẩu này"));
                        }

                        String password = passwordMap.get("password");
                        if (password == null || password.isBlank()) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Mật khẩu không được để trống"));
                        }

                        boolean isMatched = userService.checkCurrentPassword(id, password);
                        Map<String, Boolean> response = Map.of("valid", isMatched);

                        return ResponseEntity.ok(ResponseDTO.success(response));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi kiểm tra mật khẩu: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get users by role or status", description = "Returns a filtered list of users by role and/or status. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved filtered users"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view users")
        })
        @GetMapping("/filter")
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<List<UserDTO>>> getUsersByFilter(
                        @Parameter(description = "Role to filter by. Can be either role code (ROLE_ADMIN), display name (Trưởng phòng), "
                                        +
                                        "or enum name (DEPARTMENT_HEAD). See /api/users/roles endpoint for available roles.") @RequestParam(required = false) UserRole role,

                        @Parameter(description = "Status to filter by. Can be status value (0,1,2,3), display name (Active), "
                                        +
                                        "or enum name (ACTIVE). See /api/users/statuses endpoint for available statuses.") @RequestParam(required = false) UserStatus status) {

                try {
                        List<UserDTO> users = userService.getUsersByFilter(role, status);
                        return ResponseEntity.ok(ResponseDTO.success(users));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi lọc người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get available user roles", description = "Returns all available user roles with their codes and display names. Useful for UI dropdowns.")
        @GetMapping("/roles")
        public ResponseEntity<ResponseDTO<Map<String, String>>> getAvailableRoles() {
                Map<String, String> roles = Arrays.stream(UserRole.values())
                                .collect(Collectors.toMap(
                                                UserRole::getCode,
                                                UserRole::getDisplayName));
                return ResponseEntity.ok(ResponseDTO.success(roles));
        }

        @Operation(summary = "Get available user statuses", description = "Returns all available user statuses with their values and display names. Useful for UI dropdowns.")
        @GetMapping("/statuses")
        public ResponseEntity<ResponseDTO<Map<Integer, String>>> getAvailableStatuses() {
                Map<Integer, String> statuses = Arrays.stream(UserStatus.values())
                                .collect(Collectors.toMap(
                                                UserStatus::getValue,
                                                UserStatus::getDisplayName));
                return ResponseEntity.ok(ResponseDTO.success(statuses));
        }

        @Operation(summary = "Approve a pending user", description = "Approves a user with PENDING_APPROVAL status. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "User successfully approved"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "400", description = "User is not in pending approval status"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to approve users")
        })
        @PostMapping("/{id}/approve")
        public ResponseEntity<ResponseDTO<String>> approveUser(
                        @Parameter(description = "ID of the user to approve") @PathVariable Long id) {

                try {
                        Optional<User> userOpt = userService.findById(id);
                        if (userOpt.isEmpty()) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy người dùng"));
                        }

                        User user = userOpt.get();
                        if (user.getUserStatus() != UserStatus.PENDING_APPROVAL) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Người dùng không ở trạng thái chờ phê duyệt"));
                        }

                        user.setUserStatus(UserStatus.ACTIVE);
                        userService.update(user);

                        return ResponseEntity.ok(ResponseDTO.success("Phê duyệt người dùng thành công"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi phê duyệt người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get all pending users", description = "Returns a list of all users with PENDING_APPROVAL status. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved pending users"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view pending users")
        })
        @GetMapping("/pending")
        // @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ResponseDTO<List<UserDTO>>> getPendingUsers() {
                List<UserDTO> pendingUsers = userService.getUsersByFilter(null, UserStatus.PENDING_APPROVAL);
                return ResponseEntity.ok(ResponseDTO.success(pendingUsers));
        }

        @Operation(summary = "Reject a pending user", description = "Rejects and removes a user with PENDING_APPROVAL status. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "User successfully rejected"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "400", description = "User is not in pending approval status"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to reject users")
        })
        @PostMapping("/{id}/reject")
        public ResponseEntity<ResponseDTO<String>> rejectUser(
                        @Parameter(description = "ID of the user to reject") @PathVariable Long id) {

                try {
                        Optional<User> userOpt = userService.findById(id);
                        if (userOpt.isEmpty()) {
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(ResponseDTO.error("Không tìm thấy người dùng"));
                        }

                        User user = userOpt.get();
                        if (user.getUserStatus() != UserStatus.PENDING_APPROVAL) {
                                return ResponseEntity.badRequest()
                                                .body(ResponseDTO.error("Người dùng không ở trạng thái chờ phê duyệt"));
                        }

                        userService.deleteById(id);
                        return ResponseEntity.ok(ResponseDTO.success("Từ chối và xóa người dùng thành công"));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi từ chối người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Create new user", description = "Creates a new user with the provided details. Requires ADMIN role.")
        @ApiResponses({
                        @ApiResponse(responseCode = "201", description = "User successfully created"),
                        @ApiResponse(responseCode = "400", description = "Invalid user data provided"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to create users")
        })
        @PostMapping
        public ResponseEntity<ResponseDTO<UserDTO>> createUser(
                        @Parameter(description = "User details", required = true) @RequestBody CreateUserDTO createUserDTO) {
                try {
                        UserDTO createdUser = userService.createUser(createUserDTO);
                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(ResponseDTO.success("Tạo người dùng thành công", createdUser));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi tạo người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Update user with new DTO", description = "Updates a user's information using the new DTO. Requires ADMIN role or to be the user being updated.")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "User successfully updated"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "400", description = "Invalid user data provided"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to update this user")
        })
        @PutMapping("/{id}/update")
        public ResponseEntity<ResponseDTO<UserDTO>> updateUserWithNewDTO(
                        @Parameter(description = "ID of the user to update") @PathVariable Long id,
                        @Parameter(description = "Updated user information", required = true) @RequestBody UpdateUserDTO updateUserDTO) {
                try {
                        System.out.println(updateUserDTO);
                        return userService.updateUserWithNewDTO(id, updateUserDTO)
                                        .map(user -> ResponseEntity.ok(
                                                        ResponseDTO.success("Cập nhật người dùng thành công", user)))
                                        .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                        .body(ResponseDTO.error("Không tìm thấy người dùng")));
                } catch (Exception e) {
                        return ResponseEntity.badRequest()
                                        .body(ResponseDTO.error("Lỗi khi cập nhật người dùng: " + e.getMessage()));
                }
        }

        @Operation(summary = "Get users for approval", description = "Lấy danh sách người dùng có thể phê duyệt dựa trên vai trò người dùng hiện tại")
        @ApiResponses({
                        @ApiResponse(responseCode = "200", description = "Successfully retrieved users for approval"),
                        @ApiResponse(responseCode = "404", description = "User not found"),
                        @ApiResponse(responseCode = "403", description = "Not authorized to view users")
        })
        @GetMapping("/{id}/for-approval")
        public ResponseEntity<ResponseDTO<List<UserDTO>>> getUsersForApproval(
                        @Parameter(description = "ID của người dùng") @PathVariable Long id) {
                try {
                        List<UserDTO> users = userService.getUserForApproved(id);
                        return ResponseEntity.ok(ResponseDTO.success(users));
                } catch (IllegalArgumentException e) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(ResponseDTO.error("Không tìm thấy người dùng"));
                }
        }
}
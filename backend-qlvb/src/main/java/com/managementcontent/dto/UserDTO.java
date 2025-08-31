package com.managementcontent.dto;

import com.managementcontent.model.enums.UserStatus;
import com.managementcontent.model.enums.UserRole;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@AllArgsConstructor
@Setter
@Data
@NoArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String phone;

    // Status as integer for backward compatibility
    private Integer status;
    private Long roleId;
    // Status as enum
    private UserStatus userStatus;

    private LocalDateTime created;
    private LocalDateTime lastAccess;
    private LocalDateTime lastLogin;
    // Add department fields
    private Long departmentId;
    private String departmentName;
    // Roles as strings for backward compatibility
    private Set<String> roles;

    // Roles as enums for improved type safety
    private Set<UserRole> userRoles;

    // Đánh dấu người dùng có phải là chỉ huy đơn vị hay không
    private Boolean isCommanderOfUnit;

    // Helper method to get status display name
    public String getStatusDisplayName() {
        if (userStatus != null) {
            return userStatus.getDisplayName();
        } else if (status != null) {
            UserStatus derivedStatus = UserStatus.fromValue(status);
            return derivedStatus != null ? derivedStatus.getDisplayName() : "Unknown";
        }
        return "Unknown";
    }

    // Helper method to get role display names
    public Set<String> getRoleDisplayNames() {
        return roles.stream()
                .map(roleName -> {
                    UserRole role = UserRole.fromCode(roleName);
                    return role != null ? role.getDisplayName() : roleName;
                })
                .collect(java.util.stream.Collectors.toSet());
    }
}
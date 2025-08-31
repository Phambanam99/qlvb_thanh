package com.managementcontent.dto;

import com.managementcontent.model.enums.UserRole;
import com.managementcontent.model.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserDTO {
    private String username;
    private String password;
    private String fullName;
    private String email;
    private String phone;
    private Long departmentId;
    private UserStatus userStatus;
    private Set<String> roles;
    private Set<UserRole> userRoles;
    private Boolean isCommanderOfUnit;
}
package com.managementcontent.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    private boolean rememberMe = false;

    // Custom setter to handle both boolean and string values
    @JsonSetter("rememberMe")
    public void setRememberMe(Object rememberMe) {
        if (rememberMe instanceof Boolean) {
            this.rememberMe = (Boolean) rememberMe;
        } else if (rememberMe instanceof String) {
            String strValue = (String) rememberMe;
            this.rememberMe = "true".equalsIgnoreCase(strValue) || "1".equals(strValue);
        } else {
            this.rememberMe = false;
        }
    }
}
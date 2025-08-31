package com.managementcontent.config.converter;

import com.managementcontent.model.enums.UserRole;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Converter to convert String to UserRole enum
 */
@Component
public class StringToUserRoleConverter implements Converter<String, UserRole> {
    
    @Override
    public UserRole convert(String source) {
        if (source == null || source.isEmpty()) {
            return null;
        }
        
        // Try first by code
        UserRole role = UserRole.fromCode(source);
        if (role != null) {
            return role;
        }
        
        // If code lookup fails, try by display name
        role = UserRole.fromDisplayName(source);
        if (role != null) {
            return role;
        }
        
        // If all lookups fail, try by enum name
        try {
            return UserRole.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + source);
        }
    }
}
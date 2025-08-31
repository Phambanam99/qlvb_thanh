package com.managementcontent.config.converter;

import com.managementcontent.model.enums.UserStatus;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Converter to convert String to UserStatus enum
 */
@Component
public class StringToUserStatusConverter implements Converter<String, UserStatus> {
    
    @Override
    public UserStatus convert(String source) {
        if (source == null || source.isEmpty()) {
            return null;
        }
        
        // Try to convert as integer
        try {
            int statusValue = Integer.parseInt(source);
            UserStatus status = UserStatus.fromValue(statusValue);
            if (status != null) {
                return status;
            }
        } catch (NumberFormatException ignored) {
            // Not a number, continue with string conversion
        }
        
        // If not an integer or not found, try by display name
        for (UserStatus status : UserStatus.values()) {
            if (status.getDisplayName().equalsIgnoreCase(source)) {
                return status;
            }
        }
        
        // If all lookups fail, try by enum name
        try {
            return UserStatus.valueOf(source.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + source);
        }
    }
}
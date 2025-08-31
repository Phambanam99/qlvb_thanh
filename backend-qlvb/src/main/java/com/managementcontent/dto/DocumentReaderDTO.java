package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for document reader information
 * Contains user details and read status information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReaderDTO {
    
    /**
     * User ID
     */
    private Long userId;
    
    /**
     * User's full name
     */
    private String userName;
    
    /**
     * User's username/login
     */
    private String username;
    
    /**
     * User's email
     */
    private String email;
    
    /**
     * User's position/title
     */
    private String position;
    
    /**
     * User's department ID
     */
    private Long departmentId;
    
    /**
     * User's department name
     */
    private String departmentName;
    
    /**
     * User's role names (comma separated)
     */
    private String roles;
    
    /**
     * Whether the user has read the document
     */
    private Boolean isRead;
    
    /**
     * When the document was read (null if not read)
     */
    private LocalDateTime readAt;
    
    /**
     * When the read status record was created
     */
    private LocalDateTime createdAt;
    
    /**
     * When the read status record was last updated
     */
    private LocalDateTime updatedAt;
    
    /**
     * User's avatar URL (if available)
     */
    private String avatarUrl;
    
    /**
     * User's phone number (if available)
     */
    private String phoneNumber;
    
    /**
     * Whether the user is currently active
     */
    private Boolean isActive;
}

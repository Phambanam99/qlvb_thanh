package com.managementcontent.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class for generating BCrypt password hashes
 */
public class PasswordHasher {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "Pass@123";
        String hashedPassword = encoder.encode(password);
        
        System.out.println("Original password: " + password);
        System.out.println("BCrypt hash: " + hashedPassword);
        
        // Verify the hash works
        boolean matches = encoder.matches(password, hashedPassword);
        System.out.println("Verification: " + matches);
    }
}

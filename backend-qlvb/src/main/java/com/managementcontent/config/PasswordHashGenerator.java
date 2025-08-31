package com.managementcontent.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Utility component to generate BCrypt password hash for "Pass@123"
 * Run this once to get the hash, then use it in your migration script
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(10) // Run after other initializers
public class PasswordHashGenerator implements CommandLineRunner {
    
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if this is specifically for generating password hash
        boolean generateHash = false;
        for (String arg : args) {
            if ("--generate-password-hash".equals(arg)) {
                generateHash = true;
                break;
            }
        }
        
        if (generateHash) {
            String password = "Pass@123";
            String hashedPassword = passwordEncoder.encode(password);
            
            log.info("=== PASSWORD HASH GENERATOR ===");
            log.info("Original password: {}", password);
            log.info("BCrypt hash: {}", hashedPassword);
            log.info("================================");
            
            // Verify the hash
            boolean matches = passwordEncoder.matches(password, hashedPassword);
            log.info("Hash verification: {}", matches);
            
            // Print SQL update statement
            log.info("\nSQL UPDATE STATEMENT:");
            log.info("UPDATE users SET pass = '{}' WHERE id > 0;", hashedPassword);
            
            System.exit(0); // Exit after generating hash
        }
    }
}

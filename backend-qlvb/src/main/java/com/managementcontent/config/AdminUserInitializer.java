package com.managementcontent.config;

import com.managementcontent.model.Role;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.model.enums.UserStatus;
import com.managementcontent.repository.RoleRepository;
import com.managementcontent.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Component để khởi tạo user Admin mặc định
 * Sẽ chạy sau khi RoleInitializer hoàn thành
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // Chạy sau RoleInitializer (Order 1)
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdminUser();
    }

    /**
     * Tạo user Admin mặc định nếu chưa tồn tại
     */
    private void createDefaultAdminUser() {
        String adminUsername = "Admin";
        String adminPassword = "Pass@123";

        // Kiểm tra xem user Admin đã tồn tại chưa
        if (userRepository.findByName(adminUsername).isPresent()) {
            log.info("User Admin đã tồn tại, bỏ qua việc tạo mới");
            return;
        }

        try {
            // Tìm role ADMIN
            Role adminRole = roleRepository.findByName(UserRole.ADMIN.getCode())
                    .orElseThrow(() -> new RuntimeException("Role ADMIN không tồn tại. Vui lòng kiểm tra RoleInitializer"));

            // Tạo Set roles chứa ADMIN role
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);

            // Tạo user Admin
            User adminUser = User.builder()
                    .name(adminUsername)
                    .pass(passwordEncoder.encode(adminPassword))
                    .fullName("Administrator")
                    .mail("admin@system.com")
                    .status(UserStatus.ACTIVE.getValue())
                    .roles(roles)
                    .isCommanderOfUnit(false)
                    .build();

            // Lưu user vào database
            User savedUser = userRepository.save(adminUser);
            
            log.info("=== TẠO THÀNH CÔNG USER ADMIN MỚI ===");
            log.info("Username: {}", adminUsername);
            log.info("Password: {}", adminPassword);
            log.info("Full Name: {}", savedUser.getFullName());
            log.info("Email: {}", savedUser.getMail());
            log.info("Status: {}", savedUser.getUserStatus().getDisplayName());
            log.info("Roles: {}", savedUser.getRoles().stream()
                    .map(Role::getName)
                    .reduce("", (a, b) -> a.isEmpty() ? b : a + ", " + b));
            log.info("======================================");

        } catch (Exception e) {
            log.error("Lỗi khi tạo user Admin: {}", e.getMessage(), e);
        }
    }
}

package com.managementcontent.config;

import com.managementcontent.model.Role;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Chạy đầu tiên để tạo roles trước khi tạo users
public class RoleInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initRoles();
    }

    private void initRoles() {
        log.info("Initializing roles");
        
        Arrays.stream(UserRole.values()).forEach(userRole -> {
            if (!roleRepository.existsByName(userRole.getCode())) {
                Role role = new Role();
                role.setName(userRole.getCode());
                roleRepository.save(role);
                log.info("Created role: {}", userRole.getCode());
            }
        });
        
        log.info("Roles initialization completed");
    }
}
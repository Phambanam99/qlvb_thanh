package com.managementcontent.config;

import com.managementcontent.dto.UserDTO;
import com.managementcontent.model.Department;
import com.managementcontent.model.Role;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.DepartmentType;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.repository.DepartmentRepository;
import com.managementcontent.repository.RoleRepository;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Order(3) // Chạy sau RoleInitializer và AdminUserInitializer
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    // Map to store created departments by name for reference
    private Map<String, Department> departmentMap = new HashMap<>();

    @Value("${default.password:Pass@123}")
    private String defaultPassword;

    @Override
    public void run(String... args) throws Exception {
//         First, create all departments
//         createDepartments();
////
//        // Then create users with roles and assign to departments
//        for (UserRole userRole : UserRole.values()) {
//            createUserWithRoleAndDepartment(userRole);
//        }
//
//        // Add 5 users (3 trợ lý, 2 nhân viên) for each phòng 1, 2, 3
//        addUsersToDepartments();

        System.out.println("Database initialization completed!");
    }

    /**
     * Create all required departments
     */
    private void createDepartments() {
       List< Department> department = departmentRepository.findAll();
       if (!department.isEmpty()) { return;}
        List<Department> departments = new ArrayList<>();
        // Create Chỉ huy cục
        Department chiHuyCuc = Department.builder()
                .name("Chỉ huy cục")
                .abbreviation("CHC")
                .email("chihuycuc@example.com")
                // .typeCode(DepartmentType.CUC.getCode())
                .group("Chỉ huy")
                .build();
        departments.add(chiHuyCuc);
        departmentMap.put("Chỉ huy cục", chiHuyCuc);
        // Create Phòng 1-9
        for (int i = 1; i <= 9; i++) {
            String name = "Phòng " + i;
            Department dept = Department.builder()
                    .name(name)
                    .abbreviation("P" + i)
                    .email("phong" + i + "@example.com")
                    // .typeCode(DepartmentType.PHONG.getCode())
                    .group("Phòng ban")
                    .parentDepartment(chiHuyCuc)
                    .build();
            departments.add(dept);
            departmentMap.put(name, dept);
        }

        // Create Cụm 3, 4, 5, 35
        for (int i : new int[] { 3, 4, 5, 35 }) {
            String name = "Cụm " + i;
            Department dept = Department.builder()
                    .name(name)
                    .abbreviation("C" + i)
                    .email("cum" + i + "@example.com")
                    // .typeCode(DepartmentType.CUM.getCode())
                    .group("Cụm đơn vị")
                    .parentDepartment(chiHuyCuc)
                    .build();
            departments.add(dept);
            departmentMap.put(name, dept);
        }

        // Create Trạm
        Department tramTTLL = Department.builder()
                .name("Trạm thông tin liên lạc")
                .abbreviation("TTLL")
                .email("ttll@example.com")
                // .typeCode(DepartmentType.TRAM.getCode())
                .group("Trạm")
                .parentDepartment(chiHuyCuc)
                .build();
        departments.add(tramTTLL);
        departmentMap.put("Trạm thông tin liên lạc", tramTTLL);

        // Create Trạm 31, 37, 39
        for (int i : new int[] { 31, 37, 39 }) {
            String name = "Trạm " + i;
            Department dept = Department.builder()
                    .name(name)
                    .abbreviation("T" + i)
                    .email("tram" + i + "@example.com")
                    // .typeCode(DepartmentType.TRAM.getCode())
                    .group("Trạm")
                    .parentDepartment(chiHuyCuc)
                    .build();
            departments.add(dept);
            departmentMap.put(name, dept);
        }

        // Create Ban tài chính
        Department banTaiChinh = Department.builder()
                .name("Ban tài chính")
                .abbreviation("BTC")
                .email("bantaichinh@example.com")
                // .typeCode(DepartmentType.BAN.getCode())
                .group("Ban chuyên môn")
                .parentDepartment(chiHuyCuc)
                .build();
        departments.add(banTaiChinh);
        departmentMap.put("Ban tài chính", banTaiChinh);



        // Save all departments
        departmentRepository.saveAll(departments);
        System.out.println("Created " + departments.size() + " departments");
    }

    /**
     * Create a user with the specified role if it doesn't already exist and assign
     * to appropriate department
     */
    private void createUserWithRoleAndDepartment(UserRole userRole) {
        // Generate username from the role (lowercase without ROLE_ prefix)
        String roleName = userRole.getCode();
        String username = roleName.replace("ROLE_", "").toLowerCase();

        // Check if user already exists
        if (userRepository.findByName(username).isEmpty()) {
            // Create role
            Role role = roleRepository.findByName(userRole.getCode())
                    .orElseGet(() -> {
                        Role r = Role.builder().name(userRole.getCode()).build();
                        return roleRepository.save(r);
                    });

            Set<Role> roles = new HashSet<>();
            roles.add(role);

            // Assign department based on role
            Department department = assignDepartmentByRole(userRole);

            // Create user
            User user = User.builder()
                    .name(username)
                    .roles(roles)
                    .status(1)
                    .mail(username + "@example.com")
                    .fullName(userRole.getDisplayName())
                    .department(department)
                    .build();

            UserDTO userDTO = userService.convertToDTO(user);
            userService.createUser(userDTO, defaultPassword);

            System.out.println("Created user: " + username + " with role: " + userRole.getDisplayName() +
                    (department != null ? " in department: " + department.getName() : ""));
        } else {
            System.out.println("User '" + username + "' already exists, skipping.");
        }
    }

    /**
     * Assign appropriate department based on user role
     */
    private Department assignDepartmentByRole(UserRole role) {
        switch (role) {
            case TRUONG_PHONG:
                return departmentMap.get("Phòng 1");
            case PHO_PHONG:
                return departmentMap.get("Phòng 2");
            case CUC_TRUONG:
            case CUC_PHO:
            case CHINH_UY:
            case PHO_CHINH_UY:
                return departmentMap.get("Chỉ huy cục");
            case TRUONG_BAN:
                return departmentMap.get("Ban tài chính");
            case CUM_TRUONG:
                return departmentMap.get("Cụm 3");
            case PHO_CUM_TRUONG:
                return departmentMap.get("Cụm 4");
            case CHINH_TRI_VIEN_CUM:
                return departmentMap.get("Cụm 5");
            case TRAM_TRUONG:
                return departmentMap.get("Trạm thông tin liên lạc");
            case PHO_TRAM_TRUONG:
                return departmentMap.get("Trạm 31");
            case CHINH_TRI_VIEN_TRAM:
                return departmentMap.get("Trạm 37");
            case NHAN_VIEN:
                return departmentMap.get("Phòng 3");
            case TRO_LY:
                return departmentMap.get("Phòng 4");
            case VAN_THU:
                return departmentMap.get("Phòng 5");
            case ADMIN:
            case USER:
            case EDITOR:
            default:
                // System roles might not have departments
                return null;
        }
    }

    /**
     * Add 5 users (3 trợ lý, 2 nhân viên) for each phòng 1, 2, 3
     */
    private void addUsersToDepartments() {
        List<String> targetDepartments = Arrays.asList("Phòng 1", "Phòng 2", "Phòng 3");

        for (String departmentName : targetDepartments) {
            Department department = departmentMap.get(departmentName);

            if (department != null) {
                // Add 3 trợ lý
                for (int i = 1; i <= 3; i++) {
                    String username = "troly_" + departmentName.toLowerCase().replace(" ", "_") + "_" + i;
                    createUser(username, UserRole.TRO_LY, department);
                }

                // Add 2 nhân viên
                for (int i = 1; i <= 2; i++) {
                    String username = "nhanvien_" + departmentName.toLowerCase().replace(" ", "_") + "_" + i;
                    createUser(username, UserRole.NHAN_VIEN, department);
                }
            } else {
                System.out.println("Department not found: " + departmentName);
            }
        }
    }

    /**
     * Create a user with the specified username, role, and department
     */
    private void createUser(String username, UserRole role, Department department) {
        // Check if user already exists
        if (userRepository.findByName(username).isEmpty()) {
            // Create role
            Role userRole = roleRepository.findByName(role.getCode())
                    .orElseGet(() -> {
                        Role r = Role.builder().name(role.getCode()).build();
                        return roleRepository.save(r);
                    });

            Set<Role> roles = new HashSet<>();
            roles.add(userRole);

            // Create user
            User user = User.builder()
                    .name(username)
                    .roles(roles)
                    .status(1)
                    .mail(username + "@example.com")
                    .fullName(role.getDisplayName() + " " + department.getName())
                    .department(department)
                    .build();

            UserDTO userDTO = userService.convertToDTO(user);
            userService.createUser(userDTO, defaultPassword);

            System.out.println("Created user: " + username + " with role: " + role.getDisplayName() +
                    " in department: " + department.getName());
        } else {
            System.out.println("User '" + username + "' already exists, skipping.");
        }
    }
}

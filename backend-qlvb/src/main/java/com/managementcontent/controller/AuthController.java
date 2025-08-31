package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.AuthRequest;
import com.managementcontent.dto.UserDTO;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.UserRole;
import com.managementcontent.model.enums.UserStatus;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.security.JwtTokenUtil;
import com.managementcontent.service.UserService;
import org.springframework.security.core.userdetails.UserDetailsService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "APIs for authentication and registration")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final UserRepository userRepository;
    private final UserService userService;
    private final UserDetailsService userDetailsService;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenUtil jwtTokenUtil,
            UserRepository userRepository, UserService userService, UserDetailsService userDetailsService) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenUtil = jwtTokenUtil;
        this.userRepository = userRepository;
        this.userService = userService;
        this.userDetailsService = userDetailsService;
    }

    @Operation(summary = "User login", description = "Authenticates a user and returns a JWT token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully authenticated"),
            @ApiResponse(responseCode = "401", description = "Authentication failed"),
            @ApiResponse(responseCode = "403", description = "Account is disabled")
    })
    @PostMapping("/login")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> login(
            @Parameter(description = "Login credentials", required = true) @RequestBody AuthRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Generate tokens with different expiration times based on rememberMe
            String jwt = jwtTokenUtil.generateToken(userDetails, request.isRememberMe());
            String refreshToken = jwtTokenUtil.generateRefreshToken(userDetails, request.isRememberMe());

            Map<String, Object> response = new HashMap<>();

            // Update last login time
            userRepository.findByName(request.getUsername()).ifPresent(user -> {
                user.setLastLogin(LocalDateTime.now());
                userRepository.save(user);
                UserDTO userDTO = userService.getUserDTOById(user.getId()).get();
                response.put("user", userDTO);
                System.out.println("thanh cong " + jwt);
            });

            response.put("accessToken", jwt);
            response.put("refreshToken", refreshToken);
            response.put("roles", userDetails.getAuthorities());
            response.put("rememberMe", request.isRememberMe());

            return ResponseEntity.ok(ResponseDTO.success("Đăng nhập thành công", response));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ResponseDTO.error("Tài khoản đã bị vô hiệu hóa: " + e.getMessage()));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseDTO.error("Tên đăng nhập hoặc mật khẩu không đúng"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseDTO.error("Xác thực thất bại: " + e.getMessage()));
        }
    }

    @Operation(summary = "Register new user", description = "Creates a new user account")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User successfully created"),
            @ApiResponse(responseCode = "400", description = "Username or email already exists"),
            @ApiResponse(responseCode = "500", description = "Internal server error during registration")
    })
    @PostMapping("/register")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> register(
            @Parameter(description = "User registration details", required = true) @RequestBody UserDTO userDTO) {
        try {
            // Check if username already exists
            if (userRepository.existsByName(userDTO.getUsername())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ResponseDTO.error("Tên đăng nhập đã tồn tại"));
            }

//             Set default status to PENDING_APPROVAL instead of ACTIVE
            userDTO.setUserStatus(UserStatus.PENDING_APPROVAL);

            // Set default roles if not provided
            if ((userDTO.getRoles() == null || userDTO.getRoles().isEmpty()) &&
                    (userDTO.getUserRoles() == null || userDTO.getUserRoles().isEmpty())) {
                Set<UserRole> defaultRoles = new HashSet<>();
                defaultRoles.add(UserRole.USER);
                userDTO.setUserRoles(defaultRoles);
            }

            // Create user with default password (should be changed after first login)
            UserDTO createdUser = userService.createUser(userDTO, userDTO.getPassword());

            Map<String, Object> response = new HashMap<>();
            response.put("user", createdUser);
            response.put("message",
                    "Đăng ký thành công. Tài khoản của bạn đang chờ được phê duyệt bởi quản trị viên.");

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Đăng ký người dùng thành công", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Đăng ký thất bại: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ResponseDTO<UserDTO>> getCurrentUser() {
        try {
            // Get the currently authenticated user from the security context
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            // Check if user is authenticated
            if (authentication == null || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Chưa được xác thực"));
            }
            String username;
            if (authentication.getPrincipal() instanceof UserDetails) {
                username = ((UserDetails) authentication.getPrincipal()).getUsername();
            } else {
                username = authentication.getName();
            }
            // Find and return the user data
            return userRepository.findByName(username)
                    .map(user -> ResponseEntity.ok(ResponseDTO.success(userService.convertToDTO(user))))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(ResponseDTO.error("Không tìm thấy người dùng")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin người dùng: " + e.getMessage()));
        }
    }

    @Operation(summary = "Refresh access token", description = "Uses refresh token to generate new access token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
            @ApiResponse(responseCode = "400", description = "Missing refresh token"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    @PostMapping("/refresh-token")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> refreshAccessToken(
            @RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");

            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ResponseDTO.error("Refresh token là bắt buộc"));
            }

            // Extract username from refresh token
            String username = jwtTokenUtil.extractUsername(refreshToken);

            // Load user details
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Validate refresh token
            if (!jwtTokenUtil.isTokenValid(refreshToken, userDetails)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."));
            }

            // Generate new access token
            String newAccessToken = jwtTokenUtil.generateToken(userDetails);

            // Generate new refresh token for enhanced security (token rotation)
            String newRefreshToken = jwtTokenUtil.generateRefreshToken(userDetails);

            // Get user info
            User user = userRepository.findByName(username).orElse(null);
            UserDTO userDTO = null;
            if (user != null) {
                userDTO = userService.convertToDTO(user);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", newAccessToken);
            response.put("refreshToken", newRefreshToken);
            response.put("user", userDTO);
            response.put("roles", userDetails.getAuthorities());
            response.put("tokenType", "Bearer");
            response.put("expiresIn", 86400); // 24 hours in seconds

            return ResponseEntity.ok(ResponseDTO.success("Làm mới token thành công", response));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ResponseDTO.error("Làm mới token thất bại: " + e.getMessage()));
        }
    }
}
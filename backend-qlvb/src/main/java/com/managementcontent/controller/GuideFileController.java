package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.GuideFile;
import com.managementcontent.model.User;
import com.managementcontent.service.GuideFileService;
import com.managementcontent.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for managing guide files.
 * Provides endpoints for CRUD operations, file upload/download, and search
 * functionality.
 */
@RestController
@RequestMapping("/api/guide-files")
public class GuideFileController {

    private final GuideFileService guideFileService;
    private final UserService userService;

    @Autowired
    public GuideFileController(GuideFileService guideFileService, UserService userService) {
        this.guideFileService = guideFileService;
        this.userService = userService;
    }

    /**
     * Get all guide files
     * 
     * @return List of all guide files
     */
    @GetMapping
    public ResponseEntity<ResponseDTO<List<GuideFile>>> getAllGuideFiles() {
        try {
            List<GuideFile> guideFiles = guideFileService.getAllGuideFiles();
            return ResponseEntity.ok(ResponseDTO.success(guideFiles));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách tệp hướng dẫn: " + e.getMessage()));
        }
    }

    /**
     * Get all active guide files (for public view)
     * 
     * @return List of active guide files
     */
    @GetMapping("/active")
    public ResponseEntity<ResponseDTO<List<GuideFile>>> getActiveGuideFiles() {
        try {
            List<GuideFile> guideFiles = guideFileService.getActiveGuideFiles();
            return ResponseEntity.ok(ResponseDTO.success(guideFiles));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách tệp hướng dẫn đang hoạt động: " + e.getMessage()));
        }
    }

    /**
     * Get guide files with pagination
     * 
     * @param page Page number (default: 0)
     * @param size Page size (default: 10)
     * @return Paginated list of guide files
     */
    @GetMapping("/paginated")
    public ResponseEntity<ResponseDTO<Page<GuideFile>>> getGuideFilesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<GuideFile> guideFiles = guideFileService.getGuideFilesPaginated(page, size);
            return ResponseEntity.ok(ResponseDTO.success(guideFiles));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách tệp hướng dẫn phân trang: " + e.getMessage()));
        }
    }

    /**
     * Get active guide files with pagination
     * 
     * @param page Page number (default: 0)
     * @param size Page size (default: 10)
     * @return Paginated list of active guide files
     */
    @GetMapping("/active/paginated")
    public ResponseEntity<ResponseDTO<Page<GuideFile>>> getActiveGuideFilesPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<GuideFile> guideFiles = guideFileService.getActiveGuideFilesPaginated(page, size);
            return ResponseEntity.ok(ResponseDTO.success(guideFiles));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO
                            .error("Lỗi khi lấy danh sách tệp hướng dẫn đang hoạt động phân trang: " + e.getMessage()));
        }
    }

    /**
     * Get guide file by ID
     * 
     * @param id Guide file ID
     * @return Guide file data
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO<GuideFile>> getGuideFileById(@PathVariable Long id) {
        try {
            Optional<GuideFile> guideFile = guideFileService.getGuideFileById(id);
            if (guideFile.isPresent()) {
                return ResponseEntity.ok(ResponseDTO.success(guideFile.get()));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy tệp hướng dẫn với ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin tệp hướng dẫn: " + e.getMessage()));
        }
    }

    /**
     * Upload new guide file
     * 
     * @param file        File to upload
     * @param name        Display name
     * @param description Description
     * @param category    Category
     * @param isActive    Active status
     * @return Created guide file data
     */
    @PostMapping("/upload")
    public ResponseEntity<ResponseDTO<GuideFile>> uploadGuideFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam(value = "isActive", defaultValue = "true") Boolean isActive) {

        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            GuideFile guideFile = guideFileService.uploadGuideFile(
                    file, name, description, category, isActive, currentUser.get());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tải lên tệp hướng dẫn thành công", guideFile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tải lên tệp: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Không thể tải lên tệp hướng dẫn: " + e.getMessage()));
        }
    }

    /**
     * Update guide file metadata
     * 
     * @param id   Guide file ID
     * @param body Request body containing update data
     * @return Updated guide file data
     */
    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO<GuideFile>> updateGuideFile(@PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            // Get current user for authorization (you may want to add role-based access)
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            String name = (String) body.get("name");
            String description = (String) body.get("description");
            String category = (String) body.get("category");
            Boolean isActive = (Boolean) body.get("isActive");

            GuideFile guideFile = guideFileService.updateGuideFile(id, name, description, category, isActive);
            return ResponseEntity.ok(ResponseDTO.success("Cập nhật tệp hướng dẫn thành công", guideFile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi cập nhật tệp hướng dẫn: " + e.getMessage()));
        }
    }

    /**
     * Replace guide file
     * 
     * @param id   Guide file ID
     * @param file New file to upload
     * @return Updated guide file data
     */
    @PutMapping("/{id}/file")
    public ResponseEntity<ResponseDTO<GuideFile>> replaceGuideFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        try {
            // Get current user for authorization
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            GuideFile guideFile = guideFileService.replaceGuideFile(id, file);
            return ResponseEntity.ok(ResponseDTO.success("Thay thế tệp hướng dẫn thành công", guideFile));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi thay thế tệp: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Không thể thay thế tệp hướng dẫn: " + e.getMessage()));
        }
    }

    /**
     * Delete guide file
     * 
     * @param id Guide file ID
     * @return Success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO<String>> deleteGuideFile(@PathVariable Long id) {
        try {
            // Get current user for authorization
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            guideFileService.deleteGuideFile(id);

            return ResponseEntity.ok(ResponseDTO.success("Xóa tệp hướng dẫn thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi xóa tệp hướng dẫn: " + e.getMessage()));
        }
    }

    /**
     * Download guide file by ID (for frontend API compatibility)
     * 
     * @param id Guide file ID
     * @return File content as response
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<ResponseDTO<Resource>> downloadGuideFileById(@PathVariable Long id) {
        try {
            Optional<GuideFile> guideFileOpt = guideFileService.getGuideFileById(id);
            if (guideFileOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy tệp hướng dẫn"));
            }

            GuideFile guideFile = guideFileOpt.get();
            String fileName = guideFile.getFileUrl().substring("/api/guide-files/download/".length());
            Path filePath = guideFileService.getFilePath(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok(ResponseDTO.success(resource));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy tệp"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp: " + e.getMessage()));
        }
    }

    /**
     * Download guide file by filename (internal use)
     * 
     * @param fileName File name to download
     * @return File content as response
     */
    @GetMapping("/download/{fileName}")
    public ResponseEntity<ResponseDTO<Resource>> downloadGuideFile(@PathVariable String fileName) {
        try {
            Path filePath = guideFileService.getFilePath(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ResponseEntity.ok(ResponseDTO.success(resource));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy tệp"));
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Đường dẫn tệp không hợp lệ: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi tải xuống tệp: " + e.getMessage()));
        }
    }

    /**
     * Search guide files
     * 
     * @param searchTerm Search term
     * @param page       Page number (default: 0)
     * @param size       Page size (default: 10)
     * @param activeOnly Whether to search only active files (default: false)
     * @return Page of matching guide files
     */
    @GetMapping("/search")
    public ResponseEntity<ResponseDTO<Page<GuideFile>>> searchGuideFiles(
            @RequestParam("q") String searchTerm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "false") boolean activeOnly) {

        try {
            Page<GuideFile> guideFiles = guideFileService.searchGuideFiles(searchTerm, page, size, activeOnly);
            return ResponseEntity.ok(ResponseDTO.success(guideFiles));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi tìm kiếm tệp hướng dẫn: " + e.getMessage()));
        }
    }
}
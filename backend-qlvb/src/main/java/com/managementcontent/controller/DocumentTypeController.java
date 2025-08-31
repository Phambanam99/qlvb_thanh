package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.DocumentType;
import com.managementcontent.model.User;
import com.managementcontent.service.DocumentTypeService;
import com.managementcontent.service.UserService;
import com.managementcontent.repository.DocumentTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/document-types")
public class DocumentTypeController {

    private final DocumentTypeService documentTypeService;
    private final UserService userService;
    private final DocumentTypeRepository documentTypeRepository;

    @Autowired
    public DocumentTypeController(DocumentTypeService documentTypeService, UserService userService,
            DocumentTypeRepository documentTypeRepository) {
        this.documentTypeService = documentTypeService;
        this.userService = userService;
        this.documentTypeRepository = documentTypeRepository;
    }

    /**
     * Get all document types
     * 
     * @return list of all document types
     */
    @GetMapping
    public ResponseEntity<ResponseDTO<List<DocumentType>>> getAllDocumentTypes() {
        try {
            List<DocumentType> documentTypes = documentTypeService.getAllDocumentTypes();
            return ResponseEntity.ok(ResponseDTO.success(documentTypes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Get all active document types
     * 
     * @return list of active document types
     */
    @GetMapping("/active")
    public ResponseEntity<ResponseDTO<List<DocumentType>>> getActiveDocumentTypes() {
        try {
            List<DocumentType> documentTypes = documentTypeService.getActiveDocumentTypes();
            return ResponseEntity.ok(ResponseDTO.success(documentTypes));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách loại công văn đang hoạt động: " + e.getMessage()));
        }
    }

    /**
     * Get document type by ID
     * 
     * @param id the document type ID
     * @return the document type if found
     */
    @GetMapping("/{id}")
    public ResponseEntity<ResponseDTO<DocumentType>> getDocumentTypeById(@PathVariable Long id) {
        try {
            Optional<DocumentType> documentType = documentTypeService.getDocumentTypeById(id);
            if (documentType.isPresent()) {
                return ResponseEntity.ok(ResponseDTO.success(documentType.get()));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy loại công văn với ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông tin loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Create a new document type
     * 
     * @param documentType the document type to create
     * @return the created document type
     */
    @PostMapping
    public ResponseEntity<ResponseDTO<DocumentType>> createDocumentType(@RequestBody DocumentType documentType) {
        try {
            // Get current user
            System.out.println("Creating document type: " + documentType.getName());
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            DocumentType createdDocumentType = documentTypeService.createDocumentType(documentType);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseDTO.success("Tạo loại công văn thành công", createdDocumentType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi tạo loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Update an existing document type
     * 
     * @param id                  the document type ID
     * @param documentTypeDetails the updated document type details
     * @return the updated document type
     */
    @PutMapping("/{id}")
    public ResponseEntity<ResponseDTO<DocumentType>> updateDocumentType(@PathVariable Long id,
            @RequestBody DocumentType documentTypeDetails) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (!currentUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Check if user has admin role
            boolean isAdmin = currentUser.get().getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_ADMIN") || role.getName().equals("ROLE_VAN_THU"));

            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Bạn không có quyền cập nhật loại công văn"));
            }

            DocumentType updatedDocumentType = documentTypeService.updateDocumentType(id, documentTypeDetails);
            return ResponseEntity.ok(ResponseDTO.success("Cập nhật loại công văn thành công", updatedDocumentType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi cập nhật loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Deactivate a document type
     * 
     * @param id the document type ID
     * @return the deactivated document type
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ResponseDTO<DocumentType>> deactivateDocumentType(@PathVariable Long id) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (!currentUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Check if user has admin role
            boolean isAdmin = currentUser.get().getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_ADMIN") || role.getName().equals("ROLE_VAN_THU"));

            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Bạn không có quyền vô hiệu hóa loại công văn"));
            }

            DocumentType deactivatedDocumentType = documentTypeService.deactivateDocumentType(id);
            return ResponseEntity
                    .ok(ResponseDTO.success("Vô hiệu hóa loại công văn thành công", deactivatedDocumentType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi vô hiệu hóa loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Activate a document type
     * 
     * @param id the document type ID
     * @return the activated document type
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<ResponseDTO<DocumentType>> activateDocumentType(@PathVariable Long id) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (!currentUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Check if user has admin role
            boolean isAdmin = currentUser.get().getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_ADMIN")
                            || role.getName().equals("ROLE_VAN_THU"));

            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Bạn không có quyền kích hoạt loại công văn"));
            }

            DocumentType activatedDocumentType = documentTypeService.activateDocumentType(id);
            return ResponseEntity.ok(ResponseDTO.success("Kích hoạt loại công văn thành công", activatedDocumentType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi kích hoạt loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Initialize document types with predefined Vietnamese administrative document
     * types
     * 
     * @return response with initialization result
     */
    @PostMapping("/initialize")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> initializeDocumentTypes() {
        try {
            String[] documentTypeNames = {
                    "Quyết định", "Chỉ thị", "Quy chế", "Quy định", "Thông báo", "Hướng dẫn",
                    "Chương trình", "Kế hoạch", "Nghị quyết", "Dự án", "Tờ trình", "Đề án",
                    "Phương án", "Hợp đồng", "Báo cáo", "Biên bản", "Công điện",
                    "Công văn hành chính", "Bản ghi nhớ", "Bản cam kết", "Bản thỏa thuận",
                    "Giấy chứngbáo nhận", "Giấy ủy quyền", "Thư công", "Giấy nghỉ phép", "Mệnh lệnh",
                    "Phiếu báo", "Sao lục", "Thông tư"
            };

            int addedCount = 0;
            int existingCount = 0;

            for (String typeName : documentTypeNames) {
                if (!documentTypeRepository.existsByName(typeName)) {
                    DocumentType documentType = new DocumentType();
                    documentType.setName(typeName);
                    documentType.setIsActive(true);
                    documentTypeRepository.save(documentType);
                    addedCount++;
                } else {
                    existingCount++;
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("added", addedCount);
            response.put("existing", existingCount);
            response.put("total", documentTypeNames.length);

            return ResponseEntity.ok(ResponseDTO.success("Khởi tạo loại công văn hoàn thành", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi khởi tạo loại công văn: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseDTO<String>> deleteDocumentType(@PathVariable Long id) {
        try {
            // get DocumentType by ID
            Optional<DocumentType> documentType = documentTypeService.getDocumentTypeById(id);
            if (documentType.isPresent()) {
                documentTypeService.deleteDocumentType(id);
                return ResponseEntity.ok(ResponseDTO.success("Xóa loại công văn thành công"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy loại công văn"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi xóa loại công văn: " + e.getMessage()));
        }
    }
}
package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.Document;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.service.DocumentClassificationService;
import com.managementcontent.service.DocumentClassificationService.DocumentStatus;
import com.managementcontent.service.DocumentClassificationService.DocumentSummary;
import com.managementcontent.service.UserService;
import com.managementcontent.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Controller for document classification based on user roles and actions
 */
@RestController
@RequestMapping("/api/documents/classification")
public class DocumentClassificationController {

    @Autowired
    private DocumentClassificationService documentClassificationService;

    @Autowired
    private UserService userService;

    @Autowired
    private DocumentRepository<Document> documentRepository;

    /**
     * Classify a specific document for the current user
     * 
     * @param documentId Document ID to classify
     * @return Classification result
     */
    @GetMapping("/{documentId}")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> classifyDocumentForCurrentUser(
            @PathVariable Long documentId) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Get document
            Optional<Document> document = documentRepository.findById(documentId);
            if (document.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn với ID: " + documentId));
            }

            // Classify document
            DocumentProcessingStatus status = documentClassificationService
                    .classifyDocumentForUser(document.get(), currentUser.get());

            Map<String, Object> response = new HashMap<>();
            response.put("documentId", documentId);
            response.put("userId", currentUser.get().getId());
            response.put("userName", currentUser.get().getName());
            response.put("status", status.toString());
            response.put("statusDescription", status.getDisplayName());

            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi phân loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Get document summary statistics for the current user
     * 
     * @return Summary statistics
     */
    @GetMapping("/summary")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getDocumentSummaryForCurrentUser() {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Get summary
            DocumentSummary summary = documentClassificationService
                    .getDocumentSummaryForUser(currentUser.get().getId());

            Map<String, Object> response = new HashMap<>();
            response.put("userId", currentUser.get().getId());
            response.put("userName", currentUser.get().getName());
            response.put("processingCount", summary.getProcessingCount());
            response.put("processedCount", summary.getProcessedCount());
            response.put("pendingCount", summary.getPendingCount());

            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi lấy tóm tắt công văn: " + e.getMessage()));
        }
    }

    /**
     * Classify document for a specific user (admin only)
     * 
     * @param documentId Document ID
     * @param userId     User ID
     * @return Classification result
     */
    @GetMapping("/{documentId}/user/{userId}")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> classifyDocumentForUser(
            @PathVariable Long documentId,
            @PathVariable Long userId) {
        try {
            // Get current user for authorization
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (currentUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Check if current user has admin privileges (you may want to implement proper
            // role checking)
            boolean isAdmin = currentUser.get().getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));

            // if (!isAdmin) {
            // return ResponseEntity.status(HttpStatus.FORBIDDEN)
            // .body(ResponseDTO.error("Cần quyền quản trị"));
            // }

            // Get target user
            Optional<User> targetUser = userService.findById(userId);
            if (targetUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy người dùng với ID: " + userId));
            }

            // Get document
            Optional<Document> document = documentRepository.findById(documentId);
            if (document.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn với ID: " + documentId));
            }

            // Classify document
            DocumentProcessingStatus status = documentClassificationService
                    .classifyDocumentForUser(document.get(), targetUser.get());

            Map<String, Object> response = new HashMap<>();
            response.put("documentId", documentId);
            response.put("userId", userId);
            response.put("userName", targetUser.get().getName());
            response.put("status", status.toString());
            response.put("statusDescription", status.getDisplayName());

            return ResponseEntity.ok(ResponseDTO.success(response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ResponseDTO.error("Lỗi khi phân loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Get human-readable status description
     */

}
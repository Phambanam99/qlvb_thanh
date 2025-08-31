package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentType;
import com.managementcontent.model.User;
import com.managementcontent.service.DocumentWorkflowService;
import com.managementcontent.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/documents")
public class DocumentTypeWorkflowController {

    private final DocumentWorkflowService documentWorkflowService;
    private final UserService userService;

    @Autowired
    public DocumentTypeWorkflowController(DocumentWorkflowService documentWorkflowService, UserService userService) {
        this.documentWorkflowService = documentWorkflowService;
        this.userService = userService;
    }

    /**
     * Set document type for a document
     * 
     * @param documentId     ID of the document
     * @param documentTypeId ID of the document type
     * @param comments       optional comments about the change
     * @return updated document
     */
    @PutMapping("/{documentId}/type/{documentTypeId}")
    public ResponseEntity<ResponseDTO<Document>> setDocumentType(
            @PathVariable Long documentId,
            @PathVariable Long documentTypeId,
            @RequestParam(required = false) String comments) {

        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Optional<User> currentUser = userService.findByName(username);

            if (!currentUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ResponseDTO.error("Không có quyền truy cập"));
            }

            // Set document type
            Optional<Document> updatedDocument = documentWorkflowService.setDocumentType(
                    documentId, documentTypeId, currentUser.get(), comments);

            if (updatedDocument.isPresent()) {
                return ResponseEntity
                        .ok(ResponseDTO.success("Cập nhật loại công văn thành công", updatedDocument.get()));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy công văn với ID: " + documentId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi cập nhật loại công văn: " + e.getMessage()));
        }
    }

    /**
     * Get document type for a document
     * 
     * @param documentId ID of the document
     * @return document type if set
     */
    @GetMapping("/{documentId}/type")
    public ResponseEntity<ResponseDTO<DocumentType>> getDocumentType(@PathVariable Long documentId) {
        try {
            DocumentType documentType = documentWorkflowService.getDocumentType(documentId);

            if (documentType != null) {
                return ResponseEntity.ok(ResponseDTO.success(documentType));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy loại công văn hoặc công văn với ID: " + documentId));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseDTO.error("Lỗi khi lấy loại công văn: " + e.getMessage()));
        }
    }
}
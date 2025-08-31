package com.managementcontent.service;

import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentAttachment;
import com.managementcontent.model.User;
import com.managementcontent.repository.DocumentAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentAttachmentService {

    private final DocumentAttachmentRepository documentAttachmentRepository;
    private final FileStorageService fileStorageService;

    /**
     * Add multiple attachments to a document
     */
    @Transactional
    public List<DocumentAttachment> addMultipleAttachments(Document document, List<MultipartFile> files,
            User uploadedBy) throws IOException {
        List<DocumentAttachment> attachments = new ArrayList<>();

        if (files != null && !files.isEmpty()) {
            // Use FileStorageService.storeFiles() for efficient multi-file storage
            List<String> filePaths = fileStorageService.storeFiles(files, document);

            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                String filePath = filePaths.get(i);

                if (file != null && !file.isEmpty() && filePath != null) {
                    DocumentAttachment attachment = DocumentAttachment.builder()
                            .document(document)
                            .originalFilename(file.getOriginalFilename())
                            .storedFilename(extractFilename(filePath))
                            .filePath(filePath)
                            .contentType(file.getContentType())
                            .fileSize(file.getSize())
                            .uploadedBy(uploadedBy)
                            .build();

                    attachments.add(documentAttachmentRepository.save(attachment));
                }
            }
        }

        return attachments;
    }

    /**
     * Add single attachment to a document
     */
    @Transactional
    public DocumentAttachment addSingleAttachment(Document document, MultipartFile file, User uploadedBy,
            String description) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        String filePath = fileStorageService.storeFile(file, document);

        DocumentAttachment attachment = DocumentAttachment.builder()
                .document(document)
                .originalFilename(file.getOriginalFilename())
                .storedFilename(extractFilename(filePath))
                .filePath(filePath)
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .uploadedBy(uploadedBy)
                .description(description)
                .build();

        return documentAttachmentRepository.save(attachment);
    }

    /**
     * Get all attachments for a document
     */
    public List<DocumentAttachment> getAttachmentsByDocument(Long documentId) {
        return documentAttachmentRepository.findByDocumentIdOrderByUploadedDateDesc(documentId);
    }

    /**
     * Get attachment by ID
     */
    public Optional<DocumentAttachment> getAttachmentById(Long attachmentId) {
        return documentAttachmentRepository.findById(attachmentId);
    }

    /**
     * Delete single attachment
     */
    @Transactional
    public boolean deleteAttachment(Long attachmentId) throws IOException {
        Optional<DocumentAttachment> attachmentOpt = documentAttachmentRepository.findById(attachmentId);

        if (attachmentOpt.isPresent()) {
            DocumentAttachment attachment = attachmentOpt.get();

            // Delete file from storage
            fileStorageService.deleteFile(attachment.getFilePath());

            // Delete database record
            documentAttachmentRepository.delete(attachment);

            return true;
        }

        return false;
    }

    /**
     * Delete all attachments for a document
     */
    @Transactional
    public void deleteAllAttachments(Long documentId) throws IOException {
        List<DocumentAttachment> attachments = documentAttachmentRepository.findByDocumentId(documentId);

        // Delete all files from storage
        List<String> filePaths = attachments.stream()
                .map(DocumentAttachment::getFilePath)
                .toList();
        fileStorageService.deleteFiles(filePaths);

        // Delete all database records
        documentAttachmentRepository.deleteByDocumentId(documentId);
    }

    /**
     * Get total file size for a document
     */
    public Long getTotalFileSize(Long documentId) {
        return documentAttachmentRepository.getTotalFileSizeByDocumentId(documentId);
    }

    /**
     * Count attachments for a document
     */
    public long countAttachments(Long documentId) {
        return documentAttachmentRepository.countByDocumentId(documentId);
    }

    /**
     * Extract filename from file path
     */
    private String extractFilename(String filePath) {
        if (filePath == null) {
            return null;
        }

        int lastSlashIndex = filePath.lastIndexOf('/');
        if (lastSlashIndex >= 0 && lastSlashIndex < filePath.length() - 1) {
            return filePath.substring(lastSlashIndex + 1);
        }

        return filePath;
    }

    /**
     * Encode filename for Content-Disposition header to support Unicode characters
     */
    private String encodeFilename(String filename) {
        if (filename == null) {
            return "attachment";
        }

        try {
            // Use RFC 5987 encoding for Unicode filenames
            String encodedFilename = java.net.URLEncoder.encode(filename, "UTF-8")
                    .replace("+", "%20"); // Replace + with %20 for better compatibility

            // Return both ASCII fallback and UTF-8 encoded version
            return String.format("attachment; filename=\"%s\"; filename*=UTF-8''%s",
                    filename.replaceAll("[^\\x00-\\x7F]", "_"), // ASCII fallback with underscores
                    encodedFilename);
        } catch (Exception e) {
            // Fallback to ASCII-only filename
            String asciiFilename = filename.replaceAll("[^\\x00-\\x7F]", "_");
            return "attachment; filename=\"" + asciiFilename + "\"";
        }
    }

    /**
     * Search attachments by filename
     */
    public List<DocumentAttachment> searchAttachmentsByFilename(Long documentId, String filename) {
        return documentAttachmentRepository.findByDocumentIdAndOriginalFilenameContainingIgnoreCase(documentId,
                filename);
    }

    /**
     * Download a specific attachment
     */
    public ResponseEntity<Resource> downloadAttachment(Long attachmentId) throws IOException {
        Optional<DocumentAttachment> attachmentOpt = documentAttachmentRepository.findById(attachmentId);

        if (attachmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DocumentAttachment attachment = attachmentOpt.get();

        try {
            Path filePath = fileStorageService.getFilePath(attachment.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String filename = attachment.getOriginalFilename();
                String encodedFilename = encodeFilename(filename);

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, encodedFilename)
                        .header(HttpHeaders.CONTENT_TYPE,
                                attachment.getContentType() != null ? attachment.getContentType()
                                        : "application/octet-stream")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to download attachment", e);
        }
    }
}
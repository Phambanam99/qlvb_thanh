package com.managementcontent.service;

import com.managementcontent.model.GuideFile;
import com.managementcontent.model.User;
import com.managementcontent.repository.GuideFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class for managing guide files.
 * Handles business logic for guide file operations including file storage.
 */
@Service
public class GuideFileService {

    @Autowired
    private GuideFileRepository guideFileRepository;

    @Value("${app.upload.guide-files-dir:uploads/guide-files}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:10485760}") // 10MB default
    private long maxFileSize;

    /**
     * Get all guide files
     * 
     * @return List of all guide files
     */
    public List<GuideFile> getAllGuideFiles() {
        return guideFileRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get all active guide files
     * 
     * @return List of active guide files
     */
    public List<GuideFile> getActiveGuideFiles() {
        return guideFileRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    }

    /**
     * Get guide files with pagination
     * 
     * @param page Page number
     * @param size Page size
     * @return Page of guide files
     */
    public Page<GuideFile> getGuideFilesPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return guideFileRepository.findAllWithPagination(pageable);
    }

    /**
     * Get active guide files with pagination
     * 
     * @param page Page number
     * @param size Page size
     * @return Page of active guide files
     */
    public Page<GuideFile> getActiveGuideFilesPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return guideFileRepository.findActiveWithPagination(pageable);
    }

    /**
     * Get guide file by ID
     * 
     * @param id Guide file ID
     * @return Optional containing the guide file if found
     */
    public Optional<GuideFile> getGuideFileById(Long id) {
        return guideFileRepository.findById(id);
    }

    /**
     * Upload new guide file
     * 
     * @param file           File to upload
     * @param name           Display name
     * @param description    Description
     * @param category       Category
     * @param isActive       Active status
     * @param currentUser    Current user
     * @return Created guide file
     * @throws IllegalArgumentException if validation fails
     * @throws IOException              if file operations fail
     */
    public GuideFile uploadGuideFile(MultipartFile file, String name, String description, 
                                     String category, Boolean isActive, User currentUser) 
            throws IOException {
        
        // Validation
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size");
        }
        
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Name is required");
        }
        
        if (!StringUtils.hasText(category)) {
            throw new IllegalArgumentException("Category is required");
        }
        
        if (guideFileRepository.existsByName(name)) {
            throw new IllegalArgumentException("Guide file with this name already exists");
        }

        // Store file
        String fileName = storeFile(file);
        String fileUrl = "/api/guide-files/download/" + fileName;

        // Create guide file entity
        GuideFile guideFile = GuideFile.builder()
                .name(name)
                .description(description)
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .fileUrl(fileUrl)
                .category(category)
                .isActive(isActive != null ? isActive : true)
                .createdById(currentUser.getId())
                .createdByName(currentUser.getName())
                .build();

        return guideFileRepository.save(guideFile);
    }

    /**
     * Update guide file metadata
     * 
     * @param id          Guide file ID
     * @param name        New name
     * @param description New description
     * @param category    New category
     * @param isActive    New active status
     * @return Updated guide file
     * @throws IllegalArgumentException if validation fails
     */
    public GuideFile updateGuideFile(Long id, String name, String description, 
                                     String category, Boolean isActive) {
        
        GuideFile guideFile = guideFileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Guide file not found with ID: " + id));

        // Validation
        if (StringUtils.hasText(name)) {
            if (guideFileRepository.existsByNameAndIdNot(name, id)) {
                throw new IllegalArgumentException("Guide file with this name already exists");
            }
            guideFile.setName(name);
        }
        
        if (description != null) {
            guideFile.setDescription(description);
        }
        
        if (StringUtils.hasText(category)) {
            guideFile.setCategory(category);
        }
        
        if (isActive != null) {
            guideFile.setIsActive(isActive);
        }

        return guideFileRepository.save(guideFile);
    }

    /**
     * Replace guide file
     * 
     * @param id   Guide file ID
     * @param file New file
     * @return Updated guide file
     * @throws IllegalArgumentException if validation fails
     * @throws IOException              if file operations fail
     */
    public GuideFile replaceGuideFile(Long id, MultipartFile file) throws IOException {
        
        GuideFile guideFile = guideFileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Guide file not found with ID: " + id));
        
        // Validation
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size");
        }

        // Delete old file
        deletePhysicalFile(guideFile.getFileUrl());

        // Store new file
        String fileName = storeFile(file);
        String fileUrl = "/api/guide-files/download/" + fileName;

        // Update guide file
        guideFile.setFileName(file.getOriginalFilename());
        guideFile.setFileType(file.getContentType());
        guideFile.setFileSize(file.getSize());
        guideFile.setFileUrl(fileUrl);

        return guideFileRepository.save(guideFile);
    }

    /**
     * Delete guide file
     * 
     * @param id Guide file ID
     * @throws IllegalArgumentException if guide file not found
     */
    public void deleteGuideFile(Long id) {
        GuideFile guideFile = guideFileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Guide file not found with ID: " + id));

        // Delete physical file
        deletePhysicalFile(guideFile.getFileUrl());

        // Delete from database
        guideFileRepository.delete(guideFile);
    }

    /**
     * Get guide file path for download
     * 
     * @param fileName File name
     * @return Path to file
     */
    public Path getFilePath(String fileName) {
        return Paths.get(uploadDir).resolve(fileName);
    }

    /**
     * Search guide files
     * 
     * @param searchTerm Search term
     * @param page       Page number
     * @param size       Page size
     * @param activeOnly Whether to search only active files
     * @return Page of matching guide files
     */
    public Page<GuideFile> searchGuideFiles(String searchTerm, int page, int size, boolean activeOnly) {
        Pageable pageable = PageRequest.of(page, size);
        
        if (activeOnly) {
            return guideFileRepository.searchActiveByNameOrDescription(searchTerm, pageable);
        } else {
            return guideFileRepository.searchByNameOrDescription(searchTerm, pageable);
        }
    }

    /**
     * Store file to filesystem
     * 
     * @param file File to store
     * @return Stored filename
     * @throws IOException if file operations fail
     */
    private String storeFile(MultipartFile file) throws IOException {
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        if (originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

        // Store file
        Path targetLocation = uploadPath.resolve(uniqueFileName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return uniqueFileName;
    }

    /**
     * Delete physical file from filesystem
     * 
     * @param fileUrl File URL
     */
    private void deletePhysicalFile(String fileUrl) {
        try {
            if (fileUrl != null && fileUrl.startsWith("/api/guide-files/download/")) {
                String fileName = fileUrl.substring("/api/guide-files/download/".length());
                Path filePath = Paths.get(uploadDir).resolve(fileName);
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            // Log error but don't throw exception to avoid breaking the delete operation
            System.err.println("Error deleting physical file: " + e.getMessage());
        }
    }
} 
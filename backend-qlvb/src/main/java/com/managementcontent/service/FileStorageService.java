package com.managementcontent.service;

import com.managementcontent.model.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /**
     * Store a single file for a document
     * @param file The file to store
     * @param document The document this file belongs to
     * @return The relative path to the stored file
     */
    public String storeFile(MultipartFile file, Document document) throws IOException {
        // Get current date for folder structure
        LocalDate now = LocalDate.now();
        String year = String.valueOf(now.getYear());
        String month = String.format("%02d", now.getMonthValue());
        String day = String.format("%02d", now.getDayOfMonth());

        // Create year/month/day directory structure
        String relativePath = year + "/" + month + "/" + day;
        Path uploadPath = Paths.get(uploadDir, year, month, day).toAbsolutePath().normalize();

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Use document number if available, otherwise use UUID
        String baseFilename;
        if (document != null && document.getDocumentNumber() != null && !document.getDocumentNumber().trim().isEmpty()) {
            baseFilename = document.getDocumentNumber().replace("/", "-").replace("\\", "-");
        } else {
            baseFilename = "doc";
        }
        String filename = baseFilename + "_" + UUID.randomUUID() + fileExtension;

        // Save file
        Path targetLocation = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        // Return path relative to upload directory (year/month/day/filename)
        return relativePath + "/" + filename;
    }

    /**
     * Store multiple files for a document
     * @param files List of files to store
     * @param document The document these files belong to
     * @return List of relative paths to the stored files
     */
    public List<String> storeFiles(List<MultipartFile> files, Document document) throws IOException {
        List<String> filePaths = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                String filePath = storeFile(file, document);
                filePaths.add(filePath);
            }
        }
        return filePaths;
    }

    public Path getFilePath(String relativePath) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        return uploadPath.resolve(relativePath);
    }

    public void deleteFile(String relativePath) throws IOException {
        if (relativePath != null) {
            Path filePath = getFilePath(relativePath);
            Files.deleteIfExists(filePath);
        }
    }

    /**
     * Delete multiple files
     * @param relativePaths List of relative paths to delete
     */
    public void deleteFiles(List<String> relativePaths) throws IOException {
        if (relativePaths != null) {
            for (String relativePath : relativePaths) {
                deleteFile(relativePath);
            }
        }
    }

    /**
     * Store file with a specific date (useful for testing or importing files)
     * 
     * @param file The file to store
     * @param date The date to use for the directory structure
     * @return The relative path to the stored file
     */
    public String storeFileWithDate(MultipartFile file, LocalDate date) throws IOException {
        String year = String.valueOf(date.getYear());
        String month = String.format("%02d", date.getMonthValue());
        String day = String.format("%02d", date.getDayOfMonth());

        String relativePath = year + "/" + month + "/" + day;
        Path uploadPath = Paths.get(uploadDir, year, month, day).toAbsolutePath().normalize();

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + fileExtension;

        Path targetLocation = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return relativePath + "/" + filename;
    }
}
package com.managementcontent.service.base;

import com.managementcontent.model.Document;
import com.managementcontent.repository.DocumentRepository;
import com.managementcontent.service.FileStorageService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

public abstract class BaseDocumentService<T extends Document, R extends DocumentRepository<T>> {

    protected final R repository;
    protected final FileStorageService fileStorageService;

    public BaseDocumentService(R repository, FileStorageService fileStorageService) {
        this.repository = repository;
        this.fileStorageService = fileStorageService;
    }

    public Page<T> getAllDocuments(Pageable pageable) {
        return (Page<T>) repository.findAll(pageable);
    }

    public Optional<T> findById(Long id) {
        return (Optional<T>) repository.findById(id);
    }

    public Page<T> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return (Page<T>) repository.findByCreatedBetween(start, end, pageable);
    }

    @Transactional
    public void deleteDocument(Long id) {
        repository.findById(id).ifPresent(document -> {
            if (document.getAttachmentFilename() != null && !document.getAttachmentFilename().isEmpty()) {
                try {
                    fileStorageService.deleteFile(document.getAttachmentFilename());
                } catch (Exception e) {
                    // Log error but continue with document deletion
                }
            }
            repository.deleteById(id);
        });
    }

    @Transactional
    public Document  addAttachment(Long id, MultipartFile file) throws IOException {
        return  repository.findById(id).map(document -> {
            try {
                // Delete old file if exists
                if (document.getAttachmentFilename() != null && !document.getAttachmentFilename().isEmpty()) {
                    fileStorageService.deleteFile(document.getAttachmentFilename());
                }

                // Store new file
                String filename = fileStorageService.storeFile(file, document);
                document.setAttachmentFilename(filename);
                return repository.save(document);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }).orElseThrow(() -> new EntityNotFoundException("Document not found with id: " + id));
    }

    protected abstract <D> D convertToDTO(T entity);
}
package com.managementcontent.service;

import com.managementcontent.model.DocumentType;
import com.managementcontent.repository.DocumentTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class DocumentTypeService {

    private final DocumentTypeRepository documentTypeRepository;

    @Autowired
    public DocumentTypeService(DocumentTypeRepository documentTypeRepository) {
        this.documentTypeRepository = documentTypeRepository;
    }

    /**
     * Get all document types
     * 
     * @return list of all document types
     */
    public List<DocumentType> getAllDocumentTypes() {
        return documentTypeRepository.findAll();
    }

    /**
     * Get all active document types
     * 
     * @return list of active document types
     */
    public List<DocumentType> getActiveDocumentTypes() {
        return documentTypeRepository.findByIsActiveTrue();
    }

    /**
     * Get document type by ID
     * 
     * @param id the document type ID
     * @return optional document type
     */
    public Optional<DocumentType> getDocumentTypeById(Long id) {
        return documentTypeRepository.findById(id);
    }

    public void deleteDocumentType(Long id) {
         documentTypeRepository.deleteById(id);
    }

    /**
     * Create a new document type
     * 
     * @param documentType the document type to create
     * @return the created document type
     * @throws IllegalArgumentException if a document type with the same code
     *                                  already exists
     */
    @Transactional
    public DocumentType createDocumentType(DocumentType documentType) {
        if (documentTypeRepository.existsByName(documentType.getName())) {
            throw new IllegalArgumentException("Document type with code " + documentType.getName() + " already exists");
        }
        return documentTypeRepository.save(documentType);
    }

    /**
     * Update an existing document type
     * 
     * @param id                  the document type ID
     * @param documentTypeDetails the updated document type details
     * @return the updated document type
     * @throws IllegalArgumentException if document type not found or if trying to
     *                                  update to an existing code
     */
    @Transactional
    public DocumentType updateDocumentType(Long id, DocumentType documentTypeDetails) {
        DocumentType documentType = documentTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document type not found with ID: " + id));

        // Check if code is being changed and if the new code already exists
        if (!documentType.getName().equals(documentTypeDetails.getName()) &&
                documentTypeRepository.existsByName(documentTypeDetails.getName())) {
            throw new IllegalArgumentException(
                    "Document type with Name " + documentTypeDetails.getName() + " already exists");
        }


        documentType.setName(documentTypeDetails.getName());

        documentType.setIsActive(documentTypeDetails.getIsActive());

        return documentTypeRepository.save(documentType);
    }

    /**
     * Delete a document type (soft delete by setting isActive to false)
     * 
     * @param id the document type ID
     * @return the deactivated document type
     * @throws IllegalArgumentException if document type not found
     */
    @Transactional
    public DocumentType deactivateDocumentType(Long id) {
        DocumentType documentType = documentTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document type not found with ID: " + id));

        documentType.setIsActive(false);
        return documentTypeRepository.save(documentType);
    }

    /**
     * Reactivate a document type
     * 
     * @param id the document type ID
     * @return the reactivated document type
     * @throws IllegalArgumentException if document type not found
     */
    @Transactional
    public DocumentType activateDocumentType(Long id) {
        DocumentType documentType = documentTypeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document type not found with ID: " + id));

        documentType.setIsActive(true);
        return documentTypeRepository.save(documentType);
    }
}
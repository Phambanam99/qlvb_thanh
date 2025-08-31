package com.managementcontent.service;

import com.managementcontent.model.DocumentRelationship;
import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.OutgoingDocument;
import com.managementcontent.repository.DocumentRelationshipRepository;
import com.managementcontent.repository.IncomingDocumentRepository;
import com.managementcontent.repository.OutgoingDocumentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentRelationshipService {

    private final IncomingDocumentRepository incomingDocumentRepository;
    private final OutgoingDocumentRepository outgoingDocumentRepository;
    private final DocumentRelationshipRepository documentRelationshipRepository;

    /**
     * Tạo mối quan hệ giữa công văn đến và công văn đi
     * 
     * @param incomingDocId    ID của công văn đến
     * @param outgoingDocId    ID của công văn đi
     * @param relationshipType Loại quan hệ (ví dụ: "RESPONSE", "REFERENCE", etc.)
     * @return DocumentRelationship đối tượng quan hệ đã tạo
     * @throws EntityNotFoundException nếu không tìm thấy công văn đến hoặc đi
     */
    @Transactional
    public DocumentRelationship createRelationship(Long incomingDocId, Long outgoingDocId, String relationshipType) {
        IncomingDocument incomingDocument = incomingDocumentRepository.findById(incomingDocId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công văn đến với ID: " + incomingDocId));

        OutgoingDocument outgoingDocument = outgoingDocumentRepository.findById(outgoingDocId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công văn đi với ID: " + outgoingDocId));

        // Kiểm tra xem đã có mối quan hệ chưa để tránh lặp
        Optional<DocumentRelationship> existingRelation = documentRelationshipRepository
                .findByIncomingDocumentAndOutgoingDocument(incomingDocument, outgoingDocument);

        if (existingRelation.isPresent()) {
            return existingRelation.get();
        }

        // Tạo mối quan hệ mới
        DocumentRelationship relationship = new DocumentRelationship();
        relationship.setIncomingDocument(incomingDocument);
        relationship.setOutgoingDocument(outgoingDocument);
        relationship.setRelationshipType(relationshipType);
        relationship.setCreatedAt(LocalDateTime.now());

        return documentRelationshipRepository.save(relationship);
    }

    /**
     * Lấy danh sách công văn đi đã trả lời cho một công văn đến
     * 
     * @param incomingDocId ID của công văn đến
     * @return Danh sách các công văn đi
     */
    public List<OutgoingDocument> getResponseDocuments(Long incomingDocId) {
        return documentRelationshipRepository.findResponsesForIncomingDocument(incomingDocId);
    }

    /**
     * Lấy danh sách công văn đến mà một công văn đi trả lời
     * 
     * @param outgoingDocId ID của công văn đi
     * @return Danh sách các công văn đến
     */
    public List<IncomingDocument> getRelatedIncomingDocuments(Long outgoingDocId) {
        return documentRelationshipRepository.findIncomingDocumentsForOutgoingDocument(outgoingDocId);
    }
}
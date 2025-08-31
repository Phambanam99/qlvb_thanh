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
     * Tạo mối quan hệ giữa văn bản đến và văn bản đi
     * 
     * @param incomingDocId    ID của văn bản đến
     * @param outgoingDocId    ID của văn bản đi
     * @param relationshipType Loại quan hệ (ví dụ: "RESPONSE", "REFERENCE", etc.)
     * @return DocumentRelationship đối tượng quan hệ đã tạo
     * @throws EntityNotFoundException nếu không tìm thấy văn bản đến hoặc đi
     */
    @Transactional
    public DocumentRelationship createRelationship(Long incomingDocId, Long outgoingDocId, String relationshipType) {
        IncomingDocument incomingDocument = incomingDocumentRepository.findById(incomingDocId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy văn bản đến với ID: " + incomingDocId));

        OutgoingDocument outgoingDocument = outgoingDocumentRepository.findById(outgoingDocId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy văn bản đi với ID: " + outgoingDocId));

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
     * Lấy danh sách văn bản đi đã trả lời cho một văn bản đến
     * 
     * @param incomingDocId ID của văn bản đến
     * @return Danh sách các văn bản đi
     */
    public List<OutgoingDocument> getResponseDocuments(Long incomingDocId) {
        return documentRelationshipRepository.findResponsesForIncomingDocument(incomingDocId);
    }

    /**
     * Lấy danh sách văn bản đến mà một văn bản đi trả lời
     * 
     * @param outgoingDocId ID của văn bản đi
     * @return Danh sách các văn bản đến
     */
    public List<IncomingDocument> getRelatedIncomingDocuments(Long outgoingDocId) {
        return documentRelationshipRepository.findIncomingDocumentsForOutgoingDocument(outgoingDocId);
    }
}
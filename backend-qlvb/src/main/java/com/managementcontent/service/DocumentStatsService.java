package com.managementcontent.service;

import com.managementcontent.dto.UnifiedDocumentDTO;
import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.OutgoingDocument;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.IncomingDocumentRepository;
import com.managementcontent.repository.OutgoingDocumentRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for document statistics and dashboard data
 */
@Service
public class DocumentStatsService {

    private final IncomingDocumentRepository incomingDocumentRepository;
    private final OutgoingDocumentRepository outgoingDocumentRepository;
    private final DocumentMapperService documentMapperService;

    public DocumentStatsService(
            IncomingDocumentRepository incomingDocumentRepository,
            OutgoingDocumentRepository outgoingDocumentRepository,
            DocumentMapperService documentMapperService) {
        this.incomingDocumentRepository = incomingDocumentRepository;
        this.outgoingDocumentRepository = outgoingDocumentRepository;
        this.documentMapperService = documentMapperService;
    }

    /**
     * Generate document statistics for the dashboard
     * 
     * @return Map containing statistics data
     */
    public Map<String, Object> getDocumentStats() {
        Map<String, Object> stats = new HashMap<>();

        // Incoming document stats
        long incomingTotal = incomingDocumentRepository.count();
        long incomingWaiting = countIncomingByStatus(DocumentProcessingStatus.REGISTERED,
                DocumentProcessingStatus.DISTRIBUTED);
        long incomingInProgress = countIncomingByStatus(
                DocumentProcessingStatus.DEPT_ASSIGNED,
                DocumentProcessingStatus.SPECIALIST_PROCESSING,
                DocumentProcessingStatus.SPECIALIST_SUBMITTED,
                DocumentProcessingStatus.LEADER_REVIEWING,
                DocumentProcessingStatus.LEADER_COMMENTED);
        long incomingProcessed = countIncomingByStatus(
                DocumentProcessingStatus.LEADER_APPROVED,
                DocumentProcessingStatus.COMPLETED);

        // Outgoing document stats
        long outgoingTotal = outgoingDocumentRepository.count();
        long outgoingDraft = countOutgoingByStatus(DocumentProcessingStatus.DRAFT);
        long outgoingPublished = countOutgoingByStatus(DocumentProcessingStatus.PUBLISHED);

        // Create incoming stats
        Map<String, Long> incomingStats = new HashMap<>();
        incomingStats.put("waiting", incomingWaiting);
        incomingStats.put("inProgress", incomingInProgress);
        incomingStats.put("processed", incomingProcessed);
        incomingStats.put("total", incomingTotal);

        // Create outgoing stats
        Map<String, Long> outgoingStats = new HashMap<>();
        outgoingStats.put("draft", outgoingDraft);
        outgoingStats.put("published", outgoingPublished);
        outgoingStats.put("total", outgoingTotal);

        // Add stats to result
        stats.put("incoming", incomingStats);
        stats.put("outgoing", outgoingStats);

        // Get most recent documents (5 from each type)
        List<IncomingDocument> recentIncoming = incomingDocumentRepository
                .findAllByOrderByCreatedDesc(PageRequest.of(0, 5)).getContent();
        List<OutgoingDocument> recentOutgoing = outgoingDocumentRepository
                .findAllByOrderByCreatedDesc(PageRequest.of(0, 5)).getContent();

        // Convert to DTOs
        List<UnifiedDocumentDTO> recentIncomingDTOs = recentIncoming.stream()
                .map(documentMapperService::mapIncomingDocumentToDTO)
                .toList();

        List<UnifiedDocumentDTO> recentOutgoingDTOs = recentOutgoing.stream()
                .map(documentMapperService::mapOutgoingDocumentToDTO)
                .toList();

        // Combine and sort by date (newest first)
        List<UnifiedDocumentDTO> mostRecent = new ArrayList<>(recentIncomingDTOs);
        mostRecent.addAll(recentOutgoingDTOs);

        // Sort by received date descending (most recent first)
        mostRecent.sort((a, b) -> {
            if (a.getReceivedDate() == null)
                return 1;
            if (b.getReceivedDate() == null)
                return -1;
            return b.getReceivedDate().compareTo(a.getReceivedDate());
        });

        // Keep only top 5
        if (mostRecent.size() > 5) {
            mostRecent = mostRecent.subList(0, 5);
        }

        stats.put("mostRecent", mostRecent);

        return stats;
    }

    /**
     * Count incoming documents with the specified statuses
     */
    private long countIncomingByStatus(DocumentProcessingStatus... statuses) {
        long count = 0;
        for (DocumentProcessingStatus status : statuses) {
            count += incomingDocumentRepository.countByStatus(status.ordinal());
        }
        return count;
    }

    /**
     * Count outgoing documents with the specified statuses
     */
    private long countOutgoingByStatus(DocumentProcessingStatus... statuses) {
        long count = 0;
        for (DocumentProcessingStatus status : statuses) {
            count += outgoingDocumentRepository.countByStatus(status.ordinal());
        }
        return count;
    }
}
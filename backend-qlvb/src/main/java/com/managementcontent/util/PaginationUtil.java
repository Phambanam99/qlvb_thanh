package com.managementcontent.util;

import com.managementcontent.dto.UnifiedDocumentDTO;
import com.managementcontent.model.IncomingDocument;
import com.managementcontent.model.OutgoingDocument;
import com.managementcontent.service.DocumentMapperService;
import com.managementcontent.service.IncomingDocumentService;
import com.managementcontent.service.OutgoingDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class for handling pagination of unified documents from multiple
 * sources.
 */
@Component
@RequiredArgsConstructor
public class PaginationUtil {

    private final IncomingDocumentService incomingDocumentService;
    private final OutgoingDocumentService outgoingDocumentService;
    private final DocumentMapperService documentMapperService;

    /**
     * Get a properly paginated list of unified documents
     * 
     * @param pageable Pagination and sorting parameters
     * @return Page of unified document DTOs
     */
    public Page<UnifiedDocumentDTO> getUnifiedDocumentsPage(Pageable pageable) {
        // Determine total elements from both repositories (for accurate pagination)
        long totalIncoming = incomingDocumentService.getAllIncomingDocumentsRaw(Pageable.unpaged()).getTotalElements();
        long totalOutgoing = outgoingDocumentService.getAllOutgoingDocumentsRaw(Pageable.unpaged()).getTotalElements();

        // Request more items than needed to ensure we have enough after merging and
        // sorting
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int totalItems = (int) (totalIncoming + totalOutgoing);

        // For initial page, get more items than needed for proper sorting
        Pageable extendedPageable = PageRequest.of(
                0,
                Math.min(pageSize * 3, totalItems),
                pageable.getSort());

        // Get data from repositories
        List<UnifiedDocumentDTO> allDocs = new ArrayList<>();

        // Fetch incoming documents with extended page size
        Page<IncomingDocument> incomingDocs = incomingDocumentService.getAllIncomingDocumentsRaw(extendedPageable);
        allDocs.addAll(incomingDocs.getContent().stream()
                .map(documentMapperService::mapIncomingDocumentToDTO)
                .collect(Collectors.toList()));

        // Fetch outgoing documents with extended page size
        Page<OutgoingDocument> outgoingDocs = outgoingDocumentService.getAllOutgoingDocumentsRaw(extendedPageable);
        allDocs.addAll(outgoingDocs.getContent().stream()
                .map(documentMapperService::mapOutgoingDocumentToDTO)
                .collect(Collectors.toList()));

        // Sort combined results according to the pageable sort
        Sort sort = pageable.getSort();
        if (sort.isSorted()) {
            for (Sort.Order order : sort) {
                String property = order.getProperty();
                boolean isAscending = order.getDirection() == Sort.Direction.ASC;

                Comparator<UnifiedDocumentDTO> comparator = buildComparator(property, isAscending);
                if (comparator != null) {
                    allDocs.sort(comparator);
                }
            }
        } else {
            // Default sort by created date descending if no sort specified
            allDocs.sort(Comparator.comparing(UnifiedDocumentDTO::getReceivedDate,
                    Comparator.nullsLast(Comparator.reverseOrder())));
        }

        // Calculate start and end indices for the requested page
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, allDocs.size());

        // If start index is beyond available results, return empty page
        if (start >= allDocs.size()) {
            return new PageImpl<>(List.of(), pageable, totalItems);
        }

        // Extract just the required page
        List<UnifiedDocumentDTO> pageContent = allDocs.subList(start, end);

        return new PageImpl<>(pageContent, pageable, totalItems);
    }

    /**
     * Search for unified documents with proper pagination
     * 
     * @param keyword  Search keyword
     * @param pageable Pagination and sorting parameters
     * @return Page of unified document DTOs
     */
    public Page<UnifiedDocumentDTO> searchUnifiedDocuments(String keyword, Pageable pageable) {
        // Same approach as getUnifiedDocumentsPage, but with search

        // Determine total elements from both repositories (for accurate pagination)
        long totalIncoming = incomingDocumentService.searchIncomingDocumentsRaw(keyword, Pageable.unpaged())
                .getTotalElements();
        long totalOutgoing = outgoingDocumentService.searchOutgoingDocumentsRaw(keyword, Pageable.unpaged())
                .getTotalElements();

        // Request more items than needed to ensure we have enough after merging and
        // sorting
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int totalItems = (int) (totalIncoming + totalOutgoing);

        // For initial page, get more items than needed for proper sorting
        Pageable extendedPageable = PageRequest.of(
                0,
                Math.min(pageSize * 3, Math.max(totalItems, 10)),
                pageable.getSort());

        // Get data from repositories
        List<UnifiedDocumentDTO> allDocs = new ArrayList<>();

        // Fetch incoming documents with extended page size
        Page<IncomingDocument> incomingDocs = incomingDocumentService.searchIncomingDocumentsRaw(keyword,
                extendedPageable);
        allDocs.addAll(incomingDocs.getContent().stream()
                .map(documentMapperService::mapIncomingDocumentToDTO)
                .collect(Collectors.toList()));

        // Fetch outgoing documents with extended page size
        Page<OutgoingDocument> outgoingDocs = outgoingDocumentService.searchOutgoingDocumentsRaw(keyword,
                extendedPageable);
        allDocs.addAll(outgoingDocs.getContent().stream()
                .map(documentMapperService::mapOutgoingDocumentToDTO)
                .collect(Collectors.toList()));

        // Sort combined results according to the pageable sort
        Sort sort = pageable.getSort();
        if (sort.isSorted()) {
            for (Sort.Order order : sort) {
                String property = order.getProperty();
                boolean isAscending = order.getDirection() == Sort.Direction.ASC;

                Comparator<UnifiedDocumentDTO> comparator = buildComparator(property, isAscending);
                if (comparator != null) {
                    allDocs.sort(comparator);
                }
            }
        } else {
            // Default sort by relevance (shouldn't reach here for search)
            allDocs.sort(Comparator.comparing(UnifiedDocumentDTO::getReferenceDate,
                    Comparator.nullsLast(Comparator.reverseOrder())));
        }

        // Calculate start and end indices for the requested page
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, allDocs.size());

        // If start index is beyond available results, return empty page
        if (start >= allDocs.size()) {
            return new PageImpl<>(List.of(), pageable, totalItems);
        }

        // Extract just the required page
        List<UnifiedDocumentDTO> pageContent = allDocs.subList(start, end);

        return new PageImpl<>(pageContent, pageable, totalItems);
    }

    /**
     * Get unified documents within a date range with proper pagination
     * 
     * @param start    Start date (inclusive)
     * @param end      End date (inclusive)
     * @param pageable Pagination and sorting parameters
     * @return Page of unified document DTOs
     */
    public Page<UnifiedDocumentDTO> getUnifiedDocumentsByDateRange(LocalDateTime start, LocalDateTime end,
            Pageable pageable) {
        // Same approach as getUnifiedDocumentsPage, but with date range filter

        // Determine total elements from both repositories (for accurate pagination)
        long totalIncoming = incomingDocumentService.findByDateRange(start, end, Pageable.unpaged()).getTotalElements();
        long totalOutgoing = outgoingDocumentService.findByDateRange(start, end, Pageable.unpaged()).getTotalElements();

        // Request more items than needed to ensure we have enough after merging and
        // sorting
        int pageSize = pageable.getPageSize();
        int pageNumber = pageable.getPageNumber();
        int totalItems = (int) (totalIncoming + totalOutgoing);

        // For initial page, get more items than needed for proper sorting
        Pageable extendedPageable = PageRequest.of(
                0,
                Math.min(pageSize * 3, Math.max(totalItems, 10)),
                pageable.getSort());

        // Get data from repositories
        List<UnifiedDocumentDTO> allDocs = new ArrayList<>();

        // Fetch incoming documents with extended page size
        Page<IncomingDocument> incomingDocs = incomingDocumentService.findIncomingDocumentsByDateRange(start, end,
                extendedPageable);
        allDocs.addAll(incomingDocs.getContent().stream()
                .map(documentMapperService::mapIncomingDocumentToDTO)
                .collect(Collectors.toList()));

        // Fetch outgoing documents with extended page size
        Page<OutgoingDocument> outgoingDocs = outgoingDocumentService.findOutgoingDocumentsByDateRange(start, end,
                extendedPageable);
        allDocs.addAll(outgoingDocs.getContent().stream()
                .map(documentMapperService::mapOutgoingDocumentToDTO)
                .collect(Collectors.toList()));

        // Sort combined results according to the pageable sort
        Sort sort = pageable.getSort();
        if (sort.isSorted()) {
            for (Sort.Order order : sort) {
                String property = order.getProperty();
                boolean isAscending = order.getDirection() == Sort.Direction.ASC;

                Comparator<UnifiedDocumentDTO> comparator = buildComparator(property, isAscending);
                if (comparator != null) {
                    allDocs.sort(comparator);
                }
            }
        } else {
            // Default sort by date (since we're filtering by date)
            allDocs.sort(Comparator.comparing(UnifiedDocumentDTO::getReferenceDate,
                    Comparator.nullsLast(Comparator.reverseOrder())));
        }

        // Calculate start and end indices for the requested page
        int start_idx = pageNumber * pageSize;
        int end_idx = Math.min(start_idx + pageSize, allDocs.size());

        // If start index is beyond available results, return empty page
        if (start_idx >= allDocs.size()) {
            return new PageImpl<>(List.of(), pageable, totalItems);
        }

        // Extract just the required page
        List<UnifiedDocumentDTO> pageContent = allDocs.subList(start_idx, end_idx);

        return new PageImpl<>(pageContent, pageable, totalItems);
    }

    /**
     * Build a comparator for the specified property and direction
     * 
     * @param property    Field to sort by
     * @param isAscending Whether to sort ascending or descending
     * @return Comparator for sorting UnifiedDocumentDTOs
     */
    private Comparator<UnifiedDocumentDTO> buildComparator(String property, boolean isAscending) {
        Comparator<UnifiedDocumentDTO> comparator = null;

        switch (property) {
            case "id":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getId,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "subject":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getSubject,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "referenceNumber":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getReferenceNumber,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "number":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getNumber,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "referenceDate":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getReferenceDate,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "receivedDate":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getReceivedDate,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "created":
            case "createdDate":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getReceivedDate,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "status":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getStatus,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            case "documentType":
                comparator = Comparator.comparing(UnifiedDocumentDTO::getDocumentTypeName,
                        Comparator.nullsLast(Comparator.naturalOrder()));
                break;
            default:
                // Default to sort by creation date
                comparator = Comparator.comparing(UnifiedDocumentDTO::getReferenceDate,
                        Comparator.nullsLast(Comparator.naturalOrder()));
        }

        // Reverse comparator if descending order is requested
        if (!isAscending && comparator != null) {
            comparator = comparator.reversed();
        }

        return comparator;
    }
}
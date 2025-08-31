package com.managementcontent.service;

import com.managementcontent.model.Document;
import com.managementcontent.model.DocumentHistory;
import com.managementcontent.model.Role;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.DocumentProcessingStatus;
import com.managementcontent.repository.DocumentHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for classifying documents based on user roles and their interaction history
 */
@Service
public class DocumentClassificationService {

    @Autowired
    private DocumentHistoryRepository documentHistoryRepository;

    /**
     * Document processing status categories for users
     */
    public  enum DocumentStatus {
        PROCESSING,    // Đang xử lý
        PROCESSED,     // Đã xử lý
        PENDING        // Chưa xử lý
    }

    /**
     * Classify document status for current user based on their last action and role
     * 
     * @param document The document to classify
     * @param currentUser The current user
     * @return DocumentStatus indicating the user's relationship with this document
     */
    public DocumentProcessingStatus classifyDocumentForUser(Document document, User currentUser) {
        // Get user roles
        Set<String> userRoles = currentUser.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        // Get last action performed by this user on this document
        Optional<DocumentHistory> lastUserAction = documentHistoryRepository
                .findFirstByDocumentAndPerformedBy_IdOrderByTimestampDesc(document, currentUser.getId());
//        System.out.println("lastUserAction: " + lastUserAction.get().getDocument().getId());
        // Get current document status (latest action by anyone)
        List<DocumentHistory> allHistory = documentHistoryRepository
                .findByDocumentOrderByTimestampDesc(document);
        
        String currentDocumentStatus = document.getStatus().name();
        System.out.println("currentDocumentStatus: " + currentDocumentStatus);
        String lastUserActionStatusOrdinal = lastUserAction.map(DocumentHistory::getNewStatus).orElse(null);
        System.out.println("lastUserActionStatusOrdinal: " + lastUserActionStatusOrdinal);
        String lastUserActionStatus = null;
        if (lastUserActionStatusOrdinal != null)
        { lastUserActionStatus = DocumentProcessingStatus.values()[Integer.parseInt(lastUserActionStatusOrdinal)].toString();
        System.out.println("lastAction "+lastUserActionStatus);}

        // Classify based on role
        if (hasVanThuRole(userRoles)) {
            return classifyForVanThu(currentDocumentStatus, lastUserActionStatus, allHistory);
        } else if (hasStaffRole(userRoles)) {
            return classifyForStaff(currentDocumentStatus, lastUserActionStatus, allHistory);
        } else if (hasBureauLeaderRole(userRoles)) {
            return classifyForBureauLeader(currentDocumentStatus, lastUserActionStatus);
        } else if (hasDepartmentLeaderRole(userRoles)) {
            return classifyForDepartmentLeader(currentDocumentStatus, lastUserActionStatus);
        }

        return DocumentProcessingStatus.NOT_PROCESSED; // Default
    }

    /**
     * Classify for ROLE_VAN_THU
     */
    private DocumentProcessingStatus classifyForVanThu(String currentStatus, String lastUserActionStatus, List<DocumentHistory> allHistory) {
        // Đang xử lý: DRAFT, REGISTERED
        if ("DRAFT".equals(currentStatus) || "REGISTERED".equals(currentStatus)) {
            return DocumentProcessingStatus.IN_PROCESS;
        }

        // Đã xử lý: FORMAT_CORRECTION, FORMAT_CORRECTED, PUBLISHED, COMPLETED
        if ((
                "FORMAT_CORRECTION".equals(lastUserActionStatus) ||
                        "DISTRIBUTED".equals(lastUserActionStatus) ||
                        "FORMAT_CORRECTED".equals(lastUserActionStatus) ||
                        "PUBLISHED".equals(lastUserActionStatus) ||
                        "COMPLETED".equals(lastUserActionStatus))) {
            return DocumentProcessingStatus.PROCESSED;
        }

        // Chưa xử lý: FORMAT_CORRECTION và trạng thái cuối cùng của văn bản trong history là LEADER_APPROVED
        if ("FORMAT_CORRECTION".equals(currentStatus) && 
            allHistory.stream().anyMatch(h -> "LEADER_APPROVED".equals(h.getNewStatus()))) {
            return DocumentProcessingStatus.NOT_PROCESSED;
        }

        return DocumentProcessingStatus.NOT_PROCESSED;
    }

    /**
     * Classify for ROLE_NHAN_VIEN, ROLE_TRO_LY
     */
    private DocumentProcessingStatus classifyForStaff(String currentStatus, String lastUserActionStatus, List<DocumentHistory> allHistory) {
        // Đang xử lý: SPECIALIST_PROCESSING, DRAFT, REGISTERED
        if ("SPECIALIST_PROCESSING".equals(currentStatus) || 
            "DRAFT".equals(currentStatus) || 
            "REGISTERED".equals(currentStatus)) {
            return DocumentProcessingStatus.IN_PROCESS;
        }

        // Đã xử lý: SPECIALIST_SUBMITTED
        if ("SPECIALIST_SUBMITTED".equals(lastUserActionStatus)) {
            return DocumentProcessingStatus.PROCESSED;
        }

        // Chưa xử lý: trạng thái cuối cùng của văn bản trong history là DEPT_ASSIGNED, LEADER_COMMENTED, HEADER_DEPARTMENT_COMMENTED
        String latestStatus = allHistory.isEmpty() ? currentStatus : allHistory.get(0).getNewStatus();
        if ("DEPT_ASSIGNED".equals(latestStatus) || 
            "LEADER_COMMENTED".equals(latestStatus) || 
            "HEADER_DEPARTMENT_COMMENTED".equals(latestStatus)) {
            return DocumentProcessingStatus.NOT_PROCESSED;
        }

        return DocumentProcessingStatus.NOT_PROCESSED;
    }

    /**
     * Classify for Bureau Leaders: CHINH_UY, PHO_CHINH_UY, CUC_TRUONG, CUC_PHO
     */
    private DocumentProcessingStatus classifyForBureauLeader(String currentStatus, String lastUserActionStatus) {
        // Chưa xử lý: LEADER_REVIEWING
        if ("LEADER_REVIEWING".equals(currentStatus)) {
            return DocumentProcessingStatus.NOT_PROCESSED;
        }

        // Đã xử lý: LEADER_COMMENTED, LEADER_APPROVED
        if ("LEADER_COMMENTED".equals(lastUserActionStatus) || 
            "LEADER_APPROVED".equals(lastUserActionStatus)) {
            return DocumentProcessingStatus.PROCESSED;
        }

        return DocumentProcessingStatus.NOT_PROCESSED;
    }

    /**
     * Classify for Department Leaders: TRAM_TRUONG, PHO_TRAM_TRUONG, CHINH_TRI_VIEN_TRAM, 
     * CUM_TRUONG, PHO_CUM_TRUONG, CHINH_TRI_VIEN_CUM, TRUONG_BAN, TRUONG_PHONG, PHO_PHONG
     */
    private DocumentProcessingStatus classifyForDepartmentLeader(String currentStatus, String lastUserActionStatus) {
        System.out.println( lastUserActionStatus );
        // Đang xử lý: HEADER_DEPARTMENT_REVIEWING
        if ("HEADER_DEPARTMENT_REVIEWING".equals(currentStatus)) {
            return DocumentProcessingStatus.IN_PROCESS;
        }

        // Đã xử lý: DEPT_ASSIGNED, HEADER_DEPARTMENT_COMMENTED, HEADER_DEPARTMENT_APPROVED
        if ("DEPT_ASSIGNED".equals(lastUserActionStatus) ||

            "HEADER_DEPARTMENT_COMMENTED".equals(lastUserActionStatus) || 
            "HEADER_DEPARTMENT_APPROVED".equals(lastUserActionStatus)) {
            return DocumentProcessingStatus.PROCESSED;
        }

        return DocumentProcessingStatus.NOT_PROCESSED;
    }

    /**
     * Check if user has Van Thu role
     */
    private boolean hasVanThuRole(Set<String> userRoles) {
        return userRoles.contains("ROLE_VAN_THU");
    }

    /**
     * Check if user has Staff role
     */
    private boolean hasStaffRole(Set<String> userRoles) {
        return userRoles.contains("ROLE_NHAN_VIEN") || userRoles.contains("ROLE_TRO_LY");
    }

    /**
     * Check if user has Bureau Leader role
     */
    private boolean hasBureauLeaderRole(Set<String> userRoles) {
        List<String> bureauLeaderRoles = Arrays.asList(
                "ROLE_CHINH_UY", "PHO_CHINH_UY", "ROLE_CUC_TRUONG", "ROLE_CUC_PHO"
        );
        return userRoles.stream().anyMatch(bureauLeaderRoles::contains);
    }

    /**
     * Check if user has Department Leader role
     */
    private boolean hasDepartmentLeaderRole(Set<String> userRoles) {
        List<String> deptLeaderRoles = Arrays.asList(
                "ROLE_TRAM_TRUONG", "ROLE_PHO_TRAM_TRUONG", "ROLE_CHINH_TRI_VIEN_TRAM",
                "ROLE_CUM_TRUONG", "ROLE_PHO_CUM_TRUONG", "ROLE_CHINH_TRI_VIEN_CUM",
                "ROLE_TRUONG_BAN", "ROLE_TRUONG_PHONG", "ROLE_PHO_PHONG"
        );
        return userRoles.stream().anyMatch(deptLeaderRoles::contains);
    }

    /**
     * Get summary statistics for user's documents
     * 
     * @param userId User ID
     * @return DocumentSummary with counts
     */
    public DocumentSummary getDocumentSummaryForUser(Long userId) {
        // Get all actions by this user
        List<DocumentHistory> userActions = documentHistoryRepository
                .findByPerformedBy_IdOrderByTimestampDesc(userId);

        // Count documents by status
        long processingCount = 0;
        long processedCount = 0;
        long pendingCount = 0;

        // This would need more complex logic to get unique documents and classify them
        // For now, return basic counts
        
        return new DocumentSummary(processingCount, processedCount, pendingCount);
    }

    /**
     * DTO for document summary
     */
    public static class DocumentSummary {
        private final long processingCount;
        private final long processedCount;
        private final long pendingCount;

        public DocumentSummary(long processingCount, long processedCount, long pendingCount) {
            this.processingCount = processingCount;
            this.processedCount = processedCount;
            this.pendingCount = pendingCount;
        }

        public long getProcessingCount() { return processingCount; }
        public long getProcessedCount() { return processedCount; }
        public long getPendingCount() { return pendingCount; }
    }
} 
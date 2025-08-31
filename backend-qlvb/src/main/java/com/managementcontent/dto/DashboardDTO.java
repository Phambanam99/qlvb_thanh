package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    // Tổng số công văn
    private int totalDocuments;

    // Thống kê theo loại công văn
    private int incomingDocumentCount;
    private int outgoingDocumentCount;

    // Thống kê theo trạng thái công văn
    private Map<String, Integer> documentsByStatus;

    // Thống kê số công văn theo tháng
    private Map<String, Integer> documentsByMonth;

    // Các công văn đang chờ xử lý
    private long pendingDocumentCount;
    private List<DocumentSummaryDTO> pendingDocuments;
    // Các công văn gần đến hạn
    private List<DocumentSummaryDTO> upcomingDeadlines;

    private List<DocumentSummaryDTO> overdueDocuments;
    // Các công văn quá hạn
    private long overdueDocumentCount;

    // Kế hoạch công việc hiện tại
    private List<WorkPlanSummaryDTO> activeWorkPlans;

    // Thông báo chưa đọc
    private int unreadNotifications;

    // Thống kê hiệu suất xử lý
    private Map<String, Object> performanceMetrics;

    // Khởi tạo các collections để tránh NPE
    public DashboardDTO initializeCollections() {
        if (documentsByStatus == null) {
            documentsByStatus = new HashMap<>();
        }
        if (documentsByMonth == null) {
            documentsByMonth = new HashMap<>();
        }

        if (upcomingDeadlines == null) {
            upcomingDeadlines = new ArrayList<>();
        }
       
        if (activeWorkPlans == null) {
            activeWorkPlans = new ArrayList<>();
        }
        if (performanceMetrics == null) {
            performanceMetrics = new HashMap<>();
        }
        return this;
    }



    // DTO tóm tắt thông tin công văn cho dashboard
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentSummaryDTO {
        private Long id;
        private String title;
        private String documentNumber;
        private String documentType;
        private String status;
        private String deadline;
        private String assignedTo;
        private String department;
    }

    // DTO tóm tắt thông tin kế hoạch công việc cho dashboard
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkPlanSummaryDTO {
        private Long id;
        private String title;
        private String department;
        private String period;
        private String status;
        private int completedTasks;
        private int totalTasks;
        private String progress;
    }
}
package com.managementcontent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    
    // Văn bản đến (Incoming Documents)
    private DocumentCategoryStats incomingDocuments;
    
    // Văn bản đi (Outgoing Documents) 
    private DocumentCategoryStats outgoingDocuments;
    
    // Văn bản nội bộ (Internal Documents)
    private DocumentCategoryStats internalDocuments;
    
    // Tổng quan chung
    private OverallStats overallStats;
    
    // Văn bản gần đây
    private List<RecentDocumentDTO> recentDocuments;
    
    // Thống kê theo thời gian
    private PeriodStats periodStats;
    
    // Metadata
    private LocalDateTime generatedAt;
    private String userRole;
    private Long userId;
    private String departmentName;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentCategoryStats {
        // Phân loại theo nguồn
        private Long internal;      // Nội bộ
        private Long external;      // Bên ngoài
        private Long total;         // Tổng số

        // Phân loại theo trạng thái xử lý
        private Long notProcessed;  // Chưa xử lý
        private Long inProcess;     // Đang xử lý  
        private Long processed;     // Đã xử lý
        
        // Phân loại theo trạng thái chi tiết
        private Long draft;         // Dự thảo
        private Long pending;       // Chờ xử lý
        private Long approved;      // Đã duyệt
        private Long rejected;      // Từ chối
        private Long published;     // Đã ban hành
        private Long archived;      // Lưu trữ
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallStats {
        private Long totalDocuments;
        private Long totalUnread;
        private Long totalPendingApproval;
        private Long totalUrgent;
        private Long todayDocuments;
        private Long thisWeekDocuments;
        private Long thisMonthDocuments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentDocumentDTO {
        private Long id;
        private String title;
        private String type;        // "incoming", "outgoing", "internal"
        private String status;
        private String priority;
        private LocalDateTime receivedDate;
        private String senderName;
        private String recipientName;
        private Boolean isRead;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodStats {
        private Long todayCount;
        private Long yesterdayCount;
        private Long thisWeekCount;
        private Long lastWeekCount;
        private Long thisMonthCount;
        private Long lastMonthCount;
        private Double weekGrowthPercent;
        private Double monthGrowthPercent;
    }
} 
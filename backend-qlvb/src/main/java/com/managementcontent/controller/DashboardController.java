package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.dto.DashboardDTO;
import com.managementcontent.dto.ScheduleEventDTO;
import com.managementcontent.model.User;
import com.managementcontent.repository.UserRepository;
import com.managementcontent.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "APIs for dashboard statistics and information")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    @Operation(summary = "Get system dashboard statistics", description = "Returns overall system dashboard statistics")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved system dashboard statistics")
    })
    @GetMapping
    public ResponseEntity<ResponseDTO<DashboardDTO>> getSystemDashboardStatistics() {
        try {
            DashboardDTO statistics = dashboardService.getSystemDashboardStatistics();
            return ResponseEntity.ok(ResponseDTO.success(statistics));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard hệ thống: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get department dashboard statistics", description = "Returns dashboard statistics for a specific department")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved department dashboard statistics"),
            @ApiResponse(responseCode = "404", description = "Department not found")
    })
    @GetMapping("/department/{departmentId}")
    public ResponseEntity<ResponseDTO<DashboardDTO>> getDepartmentDashboardStatistics(
            @Parameter(description = "ID of the department") @PathVariable Long departmentId) {
        try {
            DashboardDTO statistics = dashboardService.getDepartmentDashboardStatistics(departmentId);
            return ResponseEntity.ok(ResponseDTO.success(statistics));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy phòng ban"));
            }
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard phòng ban: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard phòng ban: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get user dashboard statistics", description = "Returns dashboard statistics for a specific user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved user dashboard statistics"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<ResponseDTO<DashboardDTO>> getUserDashboardStatistics(
            @Parameter(description = "ID of the user") @PathVariable Long userId) {
        try {
            DashboardDTO statistics = dashboardService.getUserDashboardStatistics(userId);
            return ResponseEntity.ok(ResponseDTO.success(statistics));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy người dùng"));
            }
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard người dùng: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard người dùng: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get current user's dashboard statistics", description = "Returns comprehensive dashboard statistics for the current authenticated user including internal documents")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved current user's dashboard statistics"),
            @ApiResponse(responseCode = "404", description = "Current user not found")
    })
    @GetMapping("/me")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getCurrentUserDashboardStatistics() {
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy thông tin người dùng hiện tại"));
            }

            Map<String, Object> statistics = dashboardService.getDashboardStats();
            return ResponseEntity.ok(ResponseDTO.success(statistics));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard cá nhân: " + e.getMessage()));
        }
    }

    @Operation(summary = "Get today's schedule events", description = "Returns schedule events for today or a specified date")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Successfully retrieved schedule events")
    })
    @GetMapping("/schedules/today")
    public ResponseEntity<ResponseDTO<List<ScheduleEventDTO>>> getTodayScheduleEvents(
            @Parameter(description = "Optional date parameter (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        try {
            List<ScheduleEventDTO> events = dashboardService.getTodayScheduleEvents(date);
            return ResponseEntity.ok(ResponseDTO.success(events));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy lịch làm việc hôm nay: " + e.getMessage()));
        }
    }

    /**
     * Get comprehensive dashboard statistics
     * Returns statistics based on user role and permissions:
     * - Admin/Leadership: See all documents
     * - Department Head: See department documents
     * - Regular User: See assigned documents
     */
    @GetMapping("/stats")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getDashboardStats() {
        try {
            Map<String, Object> stats = dashboardService.getDashboardStats();
            return ResponseEntity.ok(ResponseDTO.success(stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê dashboard: " + e.getMessage()));
        }
    }

    /**
     * Get incoming documents statistics
     * Includes internal/external breakdown and processing status
     */
    @GetMapping("/incoming-stats")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getIncomingDocumentStats() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Map<String, Object> incomingStats = (Map<String, Object>) allStats.get("incomingDocuments");
            return ResponseEntity.ok(ResponseDTO.success(incomingStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê công văn đến: " + e.getMessage()));
        }
    }

    /**
     * Get outgoing documents statistics
     * Includes internal/external breakdown and processing status
     */
    @GetMapping("/outgoing-stats")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getOutgoingDocumentStats() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Map<String, Object> outgoingStats = (Map<String, Object>) allStats.get("outgoingDocuments");
            return ResponseEntity.ok(ResponseDTO.success(outgoingStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê công văn đi: " + e.getMessage()));
        }
    }

    /**
     * Get internal documents statistics
     * Includes sent/received breakdown and read status
     */
    @GetMapping("/internal-stats")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getInternalDocumentStats() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Map<String, Object> internalStats = (Map<String, Object>) allStats.get("internalDocuments");
            return ResponseEntity.ok(ResponseDTO.success(internalStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê công văn nội bộ: " + e.getMessage()));
        }
    }

    /**
     * Get overall statistics summary
     * Includes total counts and time-based metrics
     */
    @GetMapping("/overall-stats")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getOverallStats() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Map<String, Object> overallStats = (Map<String, Object>) allStats.get("overallStats");
            return ResponseEntity.ok(ResponseDTO.success(overallStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê tổng quan: " + e.getMessage()));
        }
    }

    /**
     * Get period-based statistics
     * Includes daily, weekly, monthly comparisons with growth percentages
     */
    @GetMapping("/period-stats")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getPeriodStats() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Map<String, Object> periodStats = (Map<String, Object>) allStats.get("periodStats");
            return ResponseEntity.ok(ResponseDTO.success(periodStats));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê theo thời gian: " + e.getMessage()));
        }
    }

    /**
     * Get recent documents for the current user
     */
    @GetMapping("/recent-documents")
    public ResponseEntity<ResponseDTO<Object>> getRecentDocuments() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Object recentDocs = allStats.get("recentDocuments");
            return ResponseEntity.ok(ResponseDTO.success(recentDocs));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách công văn gần đây: " + e.getMessage()));
        }
    }

    /**
     * Get document count by processing status
     * Useful for charts and visualizations
     */
    @GetMapping("/status-breakdown")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getStatusBreakdown() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();

            Map<String, Object> breakdown = new java.util.HashMap<>();

            // Extract status counts from all document types
            Map<String, Object> incoming = (Map<String, Object>) allStats.get("incomingDocuments");
            Map<String, Object> outgoing = (Map<String, Object>) allStats.get("outgoingDocuments");
            Map<String, Object> internal = (Map<String, Object>) allStats.get("internalDocuments");

            breakdown.put("incoming", incoming);
            breakdown.put("outgoing", outgoing);
            breakdown.put("internal", internal);

            return ResponseEntity.ok(ResponseDTO.success(breakdown));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thống kê theo trạng thái: " + e.getMessage()));
        }
    }

    /**
     * Get quick metrics for dashboard cards
     * Returns key numbers for front-page dashboard widgets
     */
    @GetMapping("/quick-metrics")
    public ResponseEntity<ResponseDTO<Map<String, Object>>> getQuickMetrics() {
        try {
            Map<String, Object> allStats = dashboardService.getDashboardStats();
            Map<String, Object> overall = (Map<String, Object>) allStats.get("overallStats");
            Map<String, Object> period = (Map<String, Object>) allStats.get("periodStats");

            Map<String, Object> quickMetrics = new java.util.HashMap<>();
            quickMetrics.put("totalDocuments", overall.get("totalDocuments"));
            quickMetrics.put("totalUnread", overall.get("totalUnread"));
            quickMetrics.put("todayDocuments", overall.get("todayDocuments"));
            quickMetrics.put("weekGrowth", period.get("weekGrowthPercent"));

            return ResponseEntity.ok(ResponseDTO.success(quickMetrics));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy chỉ số tổng quan: " + e.getMessage()));
        }
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        String username = auth.getName();
        return userRepository.findByName(username).orElse(null);
    }
}
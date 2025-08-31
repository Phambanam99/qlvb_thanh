package com.managementcontent.controller;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.Notification;
import com.managementcontent.model.User;
import com.managementcontent.repository.NotificationRepository;
import com.managementcontent.service.DocumentAccessControlService;
import com.managementcontent.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification API", description = "Quản lý thông báo hệ thống")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
    private final DocumentAccessControlService documentAccessControlService;

    @GetMapping
    @Operation(summary = "Lấy danh sách thông báo", description = "Trả về danh sách thông báo phân trang")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy danh sách thông báo thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi lấy danh sách thông báo")
    })
    public ResponseEntity<ResponseDTO<Page<Notification>>> getUserNotifications(
            Pageable pageable) {
        try {
            User currentUser = this.documentAccessControlService.getCurrentUser();
            Page<Notification> notifications = notificationRepository.findByUser(currentUser, pageable);
            return ResponseEntity.ok(ResponseDTO.success(notifications));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy danh sách thông báo: " + e.getMessage()));
        }
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc", description = "Trả về số lượng thông báo chưa đọc của user hiện tại")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy số lượng thông báo chưa đọc thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi lấy số lượng thông báo")
    })
    public ResponseEntity<ResponseDTO<Integer>> getUnreadCount() {
        try {
            User currentUser = documentAccessControlService.getCurrentUser();
            int count = notificationRepository.countByUserIdAndReadFalse(currentUser.getId());
            return ResponseEntity.ok(ResponseDTO.success(count));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy số lượng thông báo chưa đọc: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông báo theo ID", description = "Trả về thông báo cụ thể theo ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy thông báo thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thông báo"),
            @ApiResponse(responseCode = "403", description = "Không có quyền truy cập thông báo này")
    })
    public ResponseEntity<ResponseDTO<Notification>> getNotificationById(
            @Parameter(description = "ID của thông báo") @PathVariable Long id) {
        return notificationService.getNotificationById(id);
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu thông báo đã đọc", description = "Đánh dấu một thông báo cụ thể đã được đọc")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đánh dấu thông báo đã đọc thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thông báo"),
            @ApiResponse(responseCode = "403", description = "Không có quyền cập nhật thông báo này")
    })
    public ResponseEntity<ResponseDTO<Notification>> markAsRead(
            @Parameter(description = "ID của thông báo") @PathVariable Long id) {
        return notificationService.markAsRead(id);
    }

    @PutMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo đã đọc", description = "Đánh dấu tất cả thông báo của user hiện tại đã được đọc")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đánh dấu tất cả thông báo đã đọc thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi đánh dấu thông báo đã đọc")
    })
    public ResponseEntity<ResponseDTO<String>> markAllAsRead() {
        return notificationService.markAllAsRead();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Ẩn thông báo", description = "Ẩn một thông báo cụ thể (soft delete)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ẩn thông báo thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy thông báo"),
            @ApiResponse(responseCode = "403", description = "Không có quyền ẩn thông báo này")
    })
    public ResponseEntity<ResponseDTO<String>> deleteNotification(
            @Parameter(description = "ID của thông báo") @PathVariable Long id) {
        return notificationService.deleteNotification(id);
    }

    @DeleteMapping("/all")
    @Operation(summary = "Ẩn tất cả thông báo", description = "Ẩn tất cả thông báo của user hiện tại (soft delete)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ẩn tất cả thông báo thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi khi ẩn thông báo")
    })
    public ResponseEntity<ResponseDTO<String>> deleteAllNotifications() {
        return notificationService.deleteAllNotifications();
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Lấy thông báo theo loại", description = "Trả về danh sách thông báo phân trang theo loại cụ thể")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Lấy thông báo theo loại thành công"),
            @ApiResponse(responseCode = "400", description = "Loại thông báo không hợp lệ hoặc lỗi khi lấy dữ liệu")
    })
    public ResponseEntity<ResponseDTO<Page<Notification>>> getNotificationsByType(
            @Parameter(description = "Loại thông báo (VD: INTERNAL_DOCUMENT_RECEIVED, INTERNAL_DOCUMENT_READ)") @PathVariable String type,
            Pageable pageable) {
        return notificationService.getNotificationsByType(type, pageable);
    }
}

package com.managementcontent.service;

import com.managementcontent.dto.ResponseDTO;
import com.managementcontent.model.*;
import com.managementcontent.model.enums.NotificationType;
import com.managementcontent.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final DocumentAccessControlService documentAccessControlService;

    /**
     * Tạo và gửi thông báo cho một thực thể bất kỳ
     * 
     * @param entityId   ID của thực thể (Document, InternalDocument, etc.)
     * @param entityType Loại thực thể ("document", "internal_document", etc.)
     * @param user       Người nhận thông báo
     * @param type       Loại thông báo
     * @param content    Nội dung thông báo
     */
    public void createAndSendNotification(Long entityId, String entityType, User user, NotificationType type,
            String content) {
        Notification notification = new Notification();
        notification.setEntityId(entityId);
        notification.setEntityType(entityType);
        notification.setUser(user);
        notification.setType(type);
        notification.setContent(content);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setActive(true); // Đảm bảo notification mới luôn active

        Notification savedNotification = notificationRepository.save(notification);

        messagingTemplate.convertAndSendToUser(
                user.getName(),
                "/queue/notifications",
                savedNotification);
    }

    /**
     * Phương thức backward compatibility cho Document
     * 
     * @deprecated Sử dụng createAndSendNotification(Long, String, User,
     *             NotificationType, String) thay thế
     */
    @Deprecated
    public void createAndSendNotification(Document document, User user, NotificationType type, String content) {
        createAndSendNotification(document.getId(), "document", user, type, content);
    }

    /**
     * Lấy thông báo theo ID (chỉ active)
     */
    public ResponseEntity<ResponseDTO<Notification>> getNotificationById(Long id) {
        try {
            User currentUser = getCurrentUser();
            Optional<Notification> notification = notificationRepository.findById(id);

            if (notification.isEmpty() || !notification.get().isActive()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy thông báo"));
            }

            // Kiểm tra quyền truy cập - chỉ cho phép user xem thông báo của mình
            if (!notification.get().getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Không có quyền truy cập thông báo này"));
            }

            return ResponseEntity.ok(ResponseDTO.success(notification.get()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông báo: " + e.getMessage()));
        }
    }

    /**
     * Đánh dấu thông báo đã đọc (chỉ active notifications)
     */
    @Transactional
    public ResponseEntity<ResponseDTO<Notification>> markAsRead(Long id) {
        try {
            User currentUser = getCurrentUser();
            Optional<Notification> notificationOpt = notificationRepository.findById(id);

            if (notificationOpt.isEmpty() || !notificationOpt.get().isActive()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy thông báo"));
            }

            Notification notification = notificationOpt.get();

            // Kiểm tra quyền truy cập
            if (!notification.getUser().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Không có quyền cập nhật thông báo này"));
            }

            // Đánh dấu đã đọc
            notification.setRead(true);
            Notification updatedNotification = notificationRepository.save(notification);

            return ResponseEntity.ok(ResponseDTO.success("Đã đánh dấu thông báo đã đọc", updatedNotification));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi đánh dấu thông báo đã đọc: " + e.getMessage()));
        }
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    @Transactional
    public ResponseEntity<ResponseDTO<String>> markAllAsRead() {
        try {
            User currentUser = getCurrentUser();
            List<Notification> unreadNotifications = notificationRepository
                    .findByUserAndReadFalseAndActiveTrue(currentUser);

            for (Notification notification : unreadNotifications) {
                notification.setRead(true);
            }

            notificationRepository.saveAll(unreadNotifications);

            return ResponseEntity.ok(ResponseDTO.success(
                    "Đã đánh dấu " + unreadNotifications.size() + " thông báo đã đọc",
                    "Thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi đánh dấu tất cả thông báo đã đọc: " + e.getMessage()));
        }
    }

    /**
     * Ẩn thông báo (soft delete)
     */
    @Transactional
    public ResponseEntity<ResponseDTO<String>> deleteNotification(Long id) {
        try {
            User currentUser = getCurrentUser();
            Optional<Notification> notificationOpt = notificationRepository.findById(id);

            if (notificationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ResponseDTO.error("Không tìm thấy thông báo"));
            }

            Notification notification = notificationOpt.get();

            // Kiểm tra quyền truy cập và notification còn active
            if (!notification.getUser().getId().equals(currentUser.getId()) || !notification.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ResponseDTO.error("Không có quyền ẩn thông báo này"));
            }

            // Soft delete: đặt active = false
            int updated = notificationRepository.softDeleteByIdAndUser(id, currentUser);

            if (updated > 0) {
                return ResponseEntity.ok(ResponseDTO.success("Đã ẩn thông báo thành công"));
            } else {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Không thể ẩn thông báo"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi ẩn thông báo: " + e.getMessage()));
        }
    }

    /**
     * Ẩn tất cả thông báo của user hiện tại (soft delete)
     */
    @Transactional
    public ResponseEntity<ResponseDTO<String>> deleteAllNotifications() {
        try {
            User currentUser = getCurrentUser();
            long activeCount = notificationRepository.findByUserAndActiveTrue(currentUser, Pageable.unpaged())
                    .getTotalElements();

            notificationRepository.softDeleteByUser(currentUser);

            return ResponseEntity.ok(ResponseDTO.success(
                    "Đã ẩn tất cả thông báo thành công",
                    "Đã ẩn " + activeCount + " thông báo"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi ẩn tất cả thông báo: " + e.getMessage()));
        }
    }

    /**
     * Lấy thông báo theo loại (chỉ active)
     */
    public ResponseEntity<ResponseDTO<Page<Notification>>> getNotificationsByType(String type, Pageable pageable) {
        try {
            User currentUser = getCurrentUser();
            NotificationType notificationType;

            try {
                notificationType = NotificationType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(ResponseDTO.error("Loại thông báo không hợp lệ: " + type));
            }

            Page<Notification> notifications = notificationRepository.findByUserAndTypeAndActiveTrue(currentUser,
                    notificationType, pageable);

            return ResponseEntity.ok(ResponseDTO.success(notifications));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ResponseDTO.error("Lỗi khi lấy thông báo theo loại: " + e.getMessage()));
        }
    }

    /**
     * Lấy user hiện tại từ SecurityContext
     */
    private User getCurrentUser() {
        return documentAccessControlService.getCurrentUser();
    }
}

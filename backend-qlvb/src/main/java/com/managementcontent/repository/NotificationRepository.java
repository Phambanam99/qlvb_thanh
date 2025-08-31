package com.managementcontent.repository;

import com.managementcontent.model.Notification;
import com.managementcontent.model.User;
import com.managementcontent.model.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Find active notifications only
    Page<Notification> findByUserAndActiveTrue(User user, Pageable pageable);

    // Count unread active notifications
    int countByUserIdAndReadFalseAndActiveTrue(Long userId);

    // Find notifications by user and type with pagination (active only)
    Page<Notification> findByUserAndTypeAndActiveTrue(User user, NotificationType type, Pageable pageable);

    // Find unread active notifications for a user
    List<Notification> findByUserAndReadFalseAndActiveTrue(User user);

    // Soft delete all notifications for a user
    @Modifying
    @Query("UPDATE Notification n SET n.active = false WHERE n.user = :user AND n.active = true")
    void softDeleteByUser(@Param("user") User user);

    // Soft delete a specific notification
    @Modifying
    @Query("UPDATE Notification n SET n.active = false WHERE n.id = :id AND n.user = :user AND n.active = true")
    int softDeleteByIdAndUser(@Param("id") Long id, @Param("user") User user);

    // Backward compatibility methods (kept for existing code)
    @Deprecated
    default Page<Notification> findByUser(User user, Pageable pageable) {
        return findByUserAndActiveTrue(user, pageable);
    }

    @Deprecated
    default int countByUserIdAndReadFalse(Long userId) {
        return countByUserIdAndReadFalseAndActiveTrue(userId);
    }
}

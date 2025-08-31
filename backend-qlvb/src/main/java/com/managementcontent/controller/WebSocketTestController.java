package com.managementcontent.controller;

import com.managementcontent.service.DocumentAccessControlService;
import com.managementcontent.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class WebSocketTestController {

    private final SimpMessagingTemplate messagingTemplate;
    private final DocumentAccessControlService documentAccessControlService;

    @PostMapping("/send-notification")
    public Map<String, String> testSendNotification(@RequestParam String username, @RequestParam String message) {
        Map<String, String> response = new HashMap<>();

        try {
            Map<String, Object> testNotification = new HashMap<>();
            testNotification.put("id", 999);
            testNotification.put("type", "TEST_MESSAGE");
            testNotification.put("content", message);
            testNotification.put("entityType", "test");
            testNotification.put("createdAt", java.time.LocalDateTime.now().toString());
            testNotification.put("read", false);

            messagingTemplate.convertAndSendToUser(username, "/queue/notifications", testNotification);

            response.put("status", "success");
            response.put("message", "Test notification sent to " + username);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error: " + e.getMessage());
        }

        return response;
    }

    @PostMapping("/send-to-current-user")
    public Map<String, String> testSendToCurrentUser(@RequestParam String message) {
        Map<String, String> response = new HashMap<>();

        try {
            User currentUser = documentAccessControlService.getCurrentUser();

            Map<String, Object> testNotification = new HashMap<>();
            testNotification.put("id", 888);
            testNotification.put("type", "TEST_CURRENT_USER");
            testNotification.put("content", message);
            testNotification.put("entityType", "test");
            testNotification.put("createdAt", java.time.LocalDateTime.now().toString());
            testNotification.put("read", false);

            messagingTemplate.convertAndSendToUser(currentUser.getName(), "/queue/notifications", testNotification);

            response.put("status", "success");
            response.put("message", "Test notification sent to current user: " + currentUser.getName());
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "Error: " + e.getMessage());
        }

        return response;
    }
}

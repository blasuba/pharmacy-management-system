package com.pharmacy.pms.controller;

import com.pharmacy.pms.dto.response.ApiResponse;
import com.pharmacy.pms.model.entity.Announcement;
import com.pharmacy.pms.model.enums.NotificationType;
import com.pharmacy.pms.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Announcement>>> getNotifications() {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadAnnouncements()));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasAuthority('ROLE_OWNER') or hasAuthority('NOTIF_BROADCAST')")
    public ResponseEntity<ApiResponse<Announcement>> broadcast(@RequestBody Map<String, String> payload) {
        String title = payload.getOrDefault("title", "Announcement");
        String message = payload.getOrDefault("message", "");
        String priority = payload.getOrDefault("priority", "HIGH");

        Announcement announcement = notificationService.createAnnouncement(title, message, NotificationType.BROADCAST, priority);
        return ResponseEntity.ok(ApiResponse.success(announcement, "Broadcast sent to all staff"));
    }
}

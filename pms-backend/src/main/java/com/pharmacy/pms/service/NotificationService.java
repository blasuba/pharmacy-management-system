package com.pharmacy.pms.service;

import com.pharmacy.pms.model.entity.Announcement;
import com.pharmacy.pms.model.enums.NotificationType;

import java.util.List;

public interface NotificationService {
    List<Announcement> getUnreadAnnouncements();
    Announcement createAnnouncement(String title, String message, NotificationType type, String priority);
    void checkAndBroadcastExpiryAndLowStockAlerts();
}

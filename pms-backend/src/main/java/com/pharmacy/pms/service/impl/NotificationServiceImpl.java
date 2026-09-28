package com.pharmacy.pms.service.impl;

import com.pharmacy.pms.model.entity.Announcement;
import com.pharmacy.pms.model.entity.Drug;
import com.pharmacy.pms.model.entity.DrugBatch;
import com.pharmacy.pms.model.enums.NotificationType;
import com.pharmacy.pms.repository.AnnouncementRepository;
import com.pharmacy.pms.repository.DrugBatchRepository;
import com.pharmacy.pms.repository.DrugRepository;
import com.pharmacy.pms.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final AnnouncementRepository announcementRepository;
    private final DrugBatchRepository batchRepository;
    private final DrugRepository drugRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationServiceImpl(AnnouncementRepository announcementRepository, DrugBatchRepository batchRepository, DrugRepository drugRepository, SimpMessagingTemplate messagingTemplate) {
        this.announcementRepository = announcementRepository;
        this.batchRepository = batchRepository;
        this.drugRepository = drugRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Announcement> getUnreadAnnouncements() {
        return announcementRepository.findTop20ByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional
    public Announcement createAnnouncement(String title, String message, NotificationType type, String priority) {
        return saveAndBroadcastAnnouncement(title, message, type, priority);
    }

    private Announcement saveAndBroadcastAnnouncement(String title, String message, NotificationType type, String priority) {
        Announcement announcement = new Announcement(title, message, type, priority);
        Announcement saved = announcementRepository.save(announcement);
        try {
            messagingTemplate.convertAndSend("/topic/alerts", saved);
        } catch (Exception ex) {
            log.warn("Failed to broadcast announcement via WebSocket: {}", ex.getMessage());
        }
        return saved;
    }

    @Override
    @Scheduled(cron = "0 0 8 * * *") // Daily automated scan at 8:00 AM
    @Transactional
    public void checkAndBroadcastExpiryAndLowStockAlerts() {
        LocalDate today = LocalDate.now();

        // 1. Expiry alerts (within 30 days)
        List<DrugBatch> expiring = batchRepository.findBatchesExpiringBetween(today, today.plusDays(30));
        for (DrugBatch b : expiring) {
            String msg = "Batch " + b.getBatchNumber() + " of " + b.getDrug().getName() + " expires on " + b.getExpiryDate() + " (" + b.getQuantityOnHand() + " units remaining)";
            saveAndBroadcastAnnouncement("Drug Expiry Alert", msg, NotificationType.EXPIRY_WARNING, "HIGH");
        }

        // 2. Low stock alerts
        List<Drug> drugs = drugRepository.findAll();
        for (Drug d : drugs) {
            int stock = batchRepository.getTotalAvailableStockForDrug(d.getId(), today);
            if (stock <= d.getReorderThreshold()) {
                String msg = d.getName() + " is running low! Current stock: " + stock + " (Reorder threshold: " + d.getReorderThreshold() + ")";
                saveAndBroadcastAnnouncement("Low Stock Warning", msg, NotificationType.LOW_STOCK, "MEDIUM");
            }
        }
    }
}

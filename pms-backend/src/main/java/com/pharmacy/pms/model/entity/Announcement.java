package com.pharmacy.pms.model.entity;

import com.pharmacy.pms.model.enums.NotificationType;
import jakarta.persistence.*;

@Entity
@Table(name = "announcements")
public class Announcement extends BaseEntity {

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private NotificationType type = NotificationType.BROADCAST;

    @Column(name = "priority", length = 20)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    public Announcement() {}

    public Announcement(String title, String message, NotificationType type, String priority) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.priority = priority;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
}

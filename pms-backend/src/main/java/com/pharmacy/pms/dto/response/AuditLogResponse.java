package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.AuditLog;
import java.time.LocalDateTime;

public class AuditLogResponse {
    private Long id;
    private String username;
    private String action;
    private String entityName;
    private String entityId;
    private String detailsJson;
    private String ipAddress;
    private LocalDateTime createdAt;

    public AuditLogResponse() {}

    public AuditLogResponse(AuditLog log) {
        if (log != null) {
            this.id = log.getId();
            this.username = log.getUsername();
            this.action = log.getAction();
            this.entityName = log.getEntityName();
            this.entityId = log.getEntityId();
            this.detailsJson = log.getDetailsJson();
            this.ipAddress = log.getIpAddress();
            this.createdAt = log.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getDetailsJson() { return detailsJson; }
    public void setDetailsJson(String detailsJson) { this.detailsJson = detailsJson; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.BackupSchedule;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class BackupScheduleResponse {
    private Long id;
    private String frequency;
    private LocalTime backupTime;
    private Integer retentionDays;
    private LocalDateTime lastBackupAt;
    private LocalDateTime updatedAt;

    public BackupScheduleResponse() {}

    public BackupScheduleResponse(BackupSchedule entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.frequency = entity.getFrequency();
            this.backupTime = entity.getBackupTime();
            this.retentionDays = entity.getRetentionDays();
            this.lastBackupAt = entity.getLastBackupAt();
            this.updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public LocalTime getBackupTime() { return backupTime; }
    public void setBackupTime(LocalTime backupTime) { this.backupTime = backupTime; }
    public Integer getRetentionDays() { return retentionDays; }
    public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }
    public LocalDateTime getLastBackupAt() { return lastBackupAt; }
    public void setLastBackupAt(LocalDateTime lastBackupAt) { this.lastBackupAt = lastBackupAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

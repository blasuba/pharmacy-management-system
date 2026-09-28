package com.pharmacy.pms.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "backup_schedule")
public class BackupSchedule extends BaseEntity {

    @Column(name = "frequency", length = 20)
    private String frequency = "DAILY";

    @Column(name = "backup_time")
    private LocalTime backupTime = LocalTime.of(2, 0);

    @Column(name = "retention_days")
    private Integer retentionDays = 30;

    @Column(name = "last_backup_at")
    private LocalDateTime lastBackupAt;

    public BackupSchedule() {}

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public LocalTime getBackupTime() { return backupTime; }
    public void setBackupTime(LocalTime backupTime) { this.backupTime = backupTime; }

    public Integer getRetentionDays() { return retentionDays; }
    public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }

    public LocalDateTime getLastBackupAt() { return lastBackupAt; }
    public void setLastBackupAt(LocalDateTime lastBackupAt) { this.lastBackupAt = lastBackupAt; }
}

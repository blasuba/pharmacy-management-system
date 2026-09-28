package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalTime;

public class BackupScheduleRequest {

    @NotBlank(message = "Backup frequency is required")
    private String frequency = "DAILY";

    private LocalTime backupTime = LocalTime.of(2, 0);

    @Min(value = 1, message = "Retention days must be >= 1")
    private Integer retentionDays = 30;

    public BackupScheduleRequest() {}

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public LocalTime getBackupTime() { return backupTime; }
    public void setBackupTime(LocalTime backupTime) { this.backupTime = backupTime; }

    public Integer getRetentionDays() { return retentionDays; }
    public void setRetentionDays(Integer retentionDays) { this.retentionDays = retentionDays; }
}

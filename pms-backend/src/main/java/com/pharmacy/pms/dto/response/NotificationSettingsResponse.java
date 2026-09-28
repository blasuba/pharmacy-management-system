package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.NotificationSettings;
import java.time.LocalDateTime;

public class NotificationSettingsResponse {
    private Long id;
    private Boolean emailEnabled;
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String senderEmail;
    private Boolean smsEnabled;
    private String smsApiKey;
    private String smsSenderId;
    private Boolean telegramEnabled;
    private String telegramBotToken;
    private String telegramChatId;
    private Boolean lowStockAlertEnabled;
    private Boolean expiryAlertEnabled;
    private Boolean dailyReportEnabled;
    private LocalDateTime updatedAt;

    public NotificationSettingsResponse() {}

    public NotificationSettingsResponse(NotificationSettings entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.emailEnabled = entity.getEmailEnabled();
            this.smtpHost = entity.getSmtpHost();
            this.smtpPort = entity.getSmtpPort();
            this.smtpUsername = entity.getSmtpUsername();
            this.senderEmail = entity.getSenderEmail();
            this.smsEnabled = entity.getSmsEnabled();
            this.smsApiKey = entity.getSmsApiKey();
            this.smsSenderId = entity.getSmsSenderId();
            this.telegramEnabled = entity.getTelegramEnabled();
            this.telegramBotToken = entity.getTelegramBotToken();
            this.telegramChatId = entity.getTelegramChatId();
            this.lowStockAlertEnabled = entity.getLowStockAlertEnabled();
            this.expiryAlertEnabled = entity.getExpiryAlertEnabled();
            this.dailyReportEnabled = entity.getDailyReportEnabled();
            this.updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Boolean getEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }
    public String getSmtpHost() { return smtpHost; }
    public void setSmtpHost(String smtpHost) { this.smtpHost = smtpHost; }
    public Integer getSmtpPort() { return smtpPort; }
    public void setSmtpPort(Integer smtpPort) { this.smtpPort = smtpPort; }
    public String getSmtpUsername() { return smtpUsername; }
    public void setSmtpUsername(String smtpUsername) { this.smtpUsername = smtpUsername; }
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
    public Boolean getSmsEnabled() { return smsEnabled; }
    public void setSmsEnabled(Boolean smsEnabled) { this.smsEnabled = smsEnabled; }
    public String getSmsApiKey() { return smsApiKey; }
    public void setSmsApiKey(String smsApiKey) { this.smsApiKey = smsApiKey; }
    public String getSmsSenderId() { return smsSenderId; }
    public void setSmsSenderId(String smsSenderId) { this.smsSenderId = smsSenderId; }
    public Boolean getTelegramEnabled() { return telegramEnabled; }
    public void setTelegramEnabled(Boolean telegramEnabled) { this.telegramEnabled = telegramEnabled; }
    public String getTelegramBotToken() { return telegramBotToken; }
    public void setTelegramBotToken(String telegramBotToken) { this.telegramBotToken = telegramBotToken; }
    public String getTelegramChatId() { return telegramChatId; }
    public void setTelegramChatId(String telegramChatId) { this.telegramChatId = telegramChatId; }
    public Boolean getLowStockAlertEnabled() { return lowStockAlertEnabled; }
    public void setLowStockAlertEnabled(Boolean lowStockAlertEnabled) { this.lowStockAlertEnabled = lowStockAlertEnabled; }
    public Boolean getExpiryAlertEnabled() { return expiryAlertEnabled; }
    public void setExpiryAlertEnabled(Boolean expiryAlertEnabled) { this.expiryAlertEnabled = expiryAlertEnabled; }
    public Boolean getDailyReportEnabled() { return dailyReportEnabled; }
    public void setDailyReportEnabled(Boolean dailyReportEnabled) { this.dailyReportEnabled = dailyReportEnabled; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

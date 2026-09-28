package com.pharmacy.pms.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "notification_settings")
public class NotificationSettings extends BaseEntity {

    @Column(name = "email_enabled")
    private Boolean emailEnabled = false;

    @Column(name = "smtp_host", length = 100)
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort = 587;

    @Column(name = "smtp_username", length = 100)
    private String smtpUsername;

    @Column(name = "smtp_password", length = 255)
    private String smtpPassword;

    @Column(name = "sender_email", length = 100)
    private String senderEmail;

    @Column(name = "sms_enabled")
    private Boolean smsEnabled = false;

    @Column(name = "sms_api_key", length = 255)
    private String smsApiKey;

    @Column(name = "sms_sender_id", length = 50)
    private String smsSenderId;

    @Column(name = "telegram_enabled")
    private Boolean telegramEnabled = false;

    @Column(name = "telegram_bot_token", length = 255)
    private String telegramBotToken;

    @Column(name = "telegram_chat_id", length = 50)
    private String telegramChatId;

    @Column(name = "low_stock_alert_enabled")
    private Boolean lowStockAlertEnabled = true;

    @Column(name = "expiry_alert_enabled")
    private Boolean expiryAlertEnabled = true;

    @Column(name = "daily_report_enabled")
    private Boolean dailyReportEnabled = false;

    public NotificationSettings() {}

    public Boolean getEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(Boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public String getSmtpHost() { return smtpHost; }
    public void setSmtpHost(String smtpHost) { this.smtpHost = smtpHost; }

    public Integer getSmtpPort() { return smtpPort; }
    public void setSmtpPort(Integer smtpPort) { this.smtpPort = smtpPort; }

    public String getSmtpUsername() { return smtpUsername; }
    public void setSmtpUsername(String smtpUsername) { this.smtpUsername = smtpUsername; }

    public String getSmtpPassword() { return smtpPassword; }
    public void setSmtpPassword(String smtpPassword) { this.smtpPassword = smtpPassword; }

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
}

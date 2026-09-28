package com.pharmacy.pms.dto.request;

public class NotificationSettingsRequest {

    private Boolean emailEnabled = false;
    private String smtpHost;
    private Integer smtpPort = 587;
    private String smtpUsername;
    private String smtpPassword;
    private String senderEmail;

    private Boolean smsEnabled = false;
    private String smsApiKey;
    private String smsSenderId;

    private Boolean telegramEnabled = false;
    private String telegramBotToken;
    private String telegramChatId;

    private Boolean lowStockAlertEnabled = true;
    private Boolean expiryAlertEnabled = true;
    private Boolean dailyReportEnabled = false;

    public NotificationSettingsRequest() {}

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

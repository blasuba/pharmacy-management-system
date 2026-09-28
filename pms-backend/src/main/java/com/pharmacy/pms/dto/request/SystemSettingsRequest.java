package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SystemSettingsRequest {

    private String currency = "ETB";

    @NotBlank(message = "Currency symbol cannot be empty")
    private String currencySymbol = "Br";

    private String dateFormat = "DD/MM/YYYY";
    private String timeZone = "Africa/Addis_Ababa";
    private String language = "en";
    private String receiptFooter = "Thank you! Get well soon!";
    private String receiptPrinter = "PDF";

    @NotNull(message = "Low stock threshold is required")
    @Min(value = 1, message = "Low stock threshold must be >= 1")
    private Integer lowStockThreshold = 20;

    @NotNull(message = "Expiry alert days is required")
    @Min(value = 1, message = "Expiry alert days must be >= 1")
    private Integer expiryAlertDays = 30;

    @Min(value = 1, message = "Session timeout must be at least 1 minute")
    private Integer sessionTimeoutMinutes = 15;

    @Min(value = 1, message = "Session warning time must be at least 1 minute")
    private Integer sessionWarningMinutes = 2;

    public SystemSettingsRequest() {}

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }

    public String getDateFormat() { return dateFormat; }
    public void setDateFormat(String dateFormat) { this.dateFormat = dateFormat; }

    public String getTimeZone() { return timeZone; }
    public void setTimeZone(String timeZone) { this.timeZone = timeZone; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getReceiptFooter() { return receiptFooter; }
    public void setReceiptFooter(String receiptFooter) { this.receiptFooter = receiptFooter; }

    public String getReceiptPrinter() { return receiptPrinter; }
    public void setReceiptPrinter(String receiptPrinter) { this.receiptPrinter = receiptPrinter; }

    public Integer getLowStockThreshold() { return lowStockThreshold; }
    public void setLowStockThreshold(Integer lowStockThreshold) { this.lowStockThreshold = lowStockThreshold; }

    public Integer getExpiryAlertDays() { return expiryAlertDays; }
    public void setExpiryAlertDays(Integer expiryAlertDays) { this.expiryAlertDays = expiryAlertDays; }

    public Integer getSessionTimeoutMinutes() { return sessionTimeoutMinutes; }
    public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) { this.sessionTimeoutMinutes = sessionTimeoutMinutes; }

    public Integer getSessionWarningMinutes() { return sessionWarningMinutes; }
    public void setSessionWarningMinutes(Integer sessionWarningMinutes) { this.sessionWarningMinutes = sessionWarningMinutes; }
}

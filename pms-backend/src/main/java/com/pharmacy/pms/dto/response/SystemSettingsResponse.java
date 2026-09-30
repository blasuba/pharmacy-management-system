package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.SystemSettings;
import java.time.LocalDateTime;

public class SystemSettingsResponse {
    private Long id;
    private String currency;
    private String currencySymbol;
    private String dateFormat;
    private String timeZone;
    private String language;
    private String receiptFooter;
    private String receiptPrinter;
    private Integer lowStockThreshold;
    private Integer expiryAlertDays;
    private Integer sessionTimeoutMinutes;
    private Integer sessionWarningMinutes;
    private Boolean autoPrintReceipt;
    private Boolean requireShiftOpen;
    private Double maxDiscountPercent;
    private String defaultPaymentMethod;
    private LocalDateTime updatedAt;

    public SystemSettingsResponse() {}

    public SystemSettingsResponse(SystemSettings entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.currency = entity.getCurrency();
            this.currencySymbol = entity.getCurrencySymbol();
            this.dateFormat = entity.getDateFormat();
            this.timeZone = entity.getTimeZone();
            this.language = entity.getLanguage();
            this.receiptFooter = entity.getReceiptFooter();
            this.receiptPrinter = entity.getReceiptPrinter();
            this.lowStockThreshold = entity.getLowStockThreshold();
            this.expiryAlertDays = entity.getExpiryAlertDays();
            this.sessionTimeoutMinutes = entity.getSessionTimeoutMinutes() != null ? entity.getSessionTimeoutMinutes() : 15;
            this.sessionWarningMinutes = entity.getSessionWarningMinutes() != null ? entity.getSessionWarningMinutes() : 2;
            this.autoPrintReceipt = Boolean.TRUE.equals(entity.getAutoPrintReceipt());
            this.requireShiftOpen = Boolean.TRUE.equals(entity.getRequireShiftOpen());
            this.maxDiscountPercent = entity.getMaxDiscountPercent() != null ? entity.getMaxDiscountPercent() : 10.0;
            this.defaultPaymentMethod = entity.getDefaultPaymentMethod() != null ? entity.getDefaultPaymentMethod() : "CASH";
            this.updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public Boolean getAutoPrintReceipt() { return autoPrintReceipt; }
    public void setAutoPrintReceipt(Boolean autoPrintReceipt) { this.autoPrintReceipt = autoPrintReceipt; }
    public Boolean getRequireShiftOpen() { return requireShiftOpen; }
    public void setRequireShiftOpen(Boolean requireShiftOpen) { this.requireShiftOpen = requireShiftOpen; }
    public Double getMaxDiscountPercent() { return maxDiscountPercent; }
    public void setMaxDiscountPercent(Double maxDiscountPercent) { this.maxDiscountPercent = maxDiscountPercent; }
    public String getDefaultPaymentMethod() { return defaultPaymentMethod; }
    public void setDefaultPaymentMethod(String defaultPaymentMethod) { this.defaultPaymentMethod = defaultPaymentMethod; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

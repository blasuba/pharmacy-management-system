package com.pharmacy.pms.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "system_settings")
public class SystemSettings extends BaseEntity {

    @Column(name = "currency", length = 10)
    private String currency = "ETB";

    @Column(name = "currency_symbol", nullable = false, length = 10)
    private String currencySymbol = "Br";

    @Column(name = "date_format", length = 20)
    private String dateFormat = "DD/MM/YYYY";

    @Column(name = "time_zone", length = 50)
    private String timeZone = "Africa/Addis_Ababa";

    @Column(name = "language", length = 10)
    private String language = "en";

    @Column(name = "receipt_footer", columnDefinition = "TEXT")
    private String receiptFooter = "Thank you! Get well soon!";

    @Column(name = "receipt_printer", length = 20)
    private String receiptPrinter = "PDF";

    @Column(name = "low_stock_threshold")
    private Integer lowStockThreshold = 20;

    @Column(name = "expiry_alert_days")
    private Integer expiryAlertDays = 30;

    @Column(name = "session_timeout_minutes")
    private Integer sessionTimeoutMinutes = 15;

    @Column(name = "session_warning_minutes")
    private Integer sessionWarningMinutes = 2;

    @Column(name = "auto_print_receipt")
    private Boolean autoPrintReceipt = false;

    @Column(name = "require_shift_open")
    private Boolean requireShiftOpen = false;

    @Column(name = "max_discount_percent")
    private Double maxDiscountPercent = 10.0;

    @Column(name = "default_payment_method", length = 30)
    private String defaultPaymentMethod = "CASH";

    public SystemSettings() {}

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
}

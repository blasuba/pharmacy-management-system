package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.TaxConfig;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TaxConfigResponse {
    private Long id;
    private BigDecimal vatRate;
    private Boolean taxInclusive;
    private String taxRegistrationNumber;
    private String defaultTaxCode;
    private String taxExemptCategories;
    private LocalDateTime updatedAt;

    public TaxConfigResponse() {}

    public TaxConfigResponse(TaxConfig entity) {
        if (entity != null) {
            this.id = entity.getId();
            this.vatRate = entity.getVatRate();
            this.taxInclusive = entity.getTaxInclusive();
            this.taxRegistrationNumber = entity.getTaxRegistrationNumber();
            this.defaultTaxCode = entity.getDefaultTaxCode();
            this.taxExemptCategories = entity.getTaxExemptCategories();
            this.updatedAt = entity.getUpdatedAt() != null ? entity.getUpdatedAt() : entity.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public BigDecimal getVatRate() { return vatRate; }
    public void setVatRate(BigDecimal vatRate) { this.vatRate = vatRate; }
    public Boolean getTaxInclusive() { return taxInclusive; }
    public void setTaxInclusive(Boolean taxInclusive) { this.taxInclusive = taxInclusive; }
    public String getTaxRegistrationNumber() { return taxRegistrationNumber; }
    public void setTaxRegistrationNumber(String taxRegistrationNumber) { this.taxRegistrationNumber = taxRegistrationNumber; }
    public String getDefaultTaxCode() { return defaultTaxCode; }
    public void setDefaultTaxCode(String defaultTaxCode) { this.defaultTaxCode = defaultTaxCode; }
    public String getTaxExemptCategories() { return taxExemptCategories; }
    public void setTaxExemptCategories(String taxExemptCategories) { this.taxExemptCategories = taxExemptCategories; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

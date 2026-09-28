package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class TaxConfigRequest {

    @NotNull(message = "VAT rate is required")
    @DecimalMin(value = "0.00", message = "VAT rate must be >= 0")
    @DecimalMax(value = "100.00", message = "VAT rate must be <= 100")
    private BigDecimal vatRate = new BigDecimal("15.00");

    private Boolean taxInclusive = false;
    private String taxRegistrationNumber;
    private String defaultTaxCode = "VAT-15";
    private String taxExemptCategories;

    public TaxConfigRequest() {}

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
}

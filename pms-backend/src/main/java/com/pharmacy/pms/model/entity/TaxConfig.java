package com.pharmacy.pms.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "tax_config")
public class TaxConfig extends BaseEntity {

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate = new BigDecimal("15.00");

    @Column(name = "tax_inclusive")
    private Boolean taxInclusive = false;

    @Column(name = "tax_registration_number", length = 50)
    private String taxRegistrationNumber;

    @Column(name = "default_tax_code", length = 20)
    private String defaultTaxCode = "VAT-15";

    @Column(name = "tax_exempt_categories", columnDefinition = "TEXT")
    private String taxExemptCategories;

    public TaxConfig() {}

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

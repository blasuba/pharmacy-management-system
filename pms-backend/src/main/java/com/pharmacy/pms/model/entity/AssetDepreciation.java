package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "asset_depreciation", indexes = {
    @Index(name = "idx_deprec_asset_year", columnList = "asset_id, fiscal_year", unique = true)
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssetDepreciation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private FixedAsset fixedAsset;

    @Column(name = "fiscal_year", nullable = false)
    private int fiscalYear;

    @Column(name = "opening_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal openingValue = BigDecimal.ZERO;

    @Column(name = "depreciation_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depreciationAmount = BigDecimal.ZERO;

    @Column(name = "closing_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal closingValue = BigDecimal.ZERO;

    @Column(name = "is_locked", nullable = false)
    private boolean isLocked = true;

    public AssetDepreciation() {}

    public AssetDepreciation(FixedAsset fixedAsset, int fiscalYear, BigDecimal openingValue, BigDecimal depreciationAmount, BigDecimal closingValue, boolean isLocked) {
        this.fixedAsset = fixedAsset;
        this.fiscalYear = fiscalYear;
        this.openingValue = openingValue;
        this.depreciationAmount = depreciationAmount;
        this.closingValue = closingValue;
        this.isLocked = isLocked;
    }

    public FixedAsset getFixedAsset() { return fixedAsset; }
    public void setFixedAsset(FixedAsset fixedAsset) { this.fixedAsset = fixedAsset; }

    public int getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(int fiscalYear) { this.fiscalYear = fiscalYear; }

    public BigDecimal getOpeningValue() { return openingValue; }
    public void setOpeningValue(BigDecimal openingValue) { this.openingValue = openingValue; }

    public BigDecimal getDepreciationAmount() { return depreciationAmount; }
    public void setDepreciationAmount(BigDecimal depreciationAmount) { this.depreciationAmount = depreciationAmount; }

    public BigDecimal getClosingValue() { return closingValue; }
    public void setClosingValue(BigDecimal closingValue) { this.closingValue = closingValue; }

    public boolean isLocked() { return isLocked; }
    public void setLocked(boolean locked) { isLocked = locked; }
}

package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.AssetDepreciation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AssetDepreciationResponse {
    private Long id;
    private Long assetId;
    private String assetCode;
    private String assetName;
    private int fiscalYear;
    private BigDecimal openingValue;
    private BigDecimal depreciationAmount;
    private BigDecimal closingValue;
    private boolean locked;
    private LocalDateTime createdAt;

    public AssetDepreciationResponse() {}

    public AssetDepreciationResponse(AssetDepreciation dep) {
        if (dep == null) return;
        this.id = dep.getId();
        if (dep.getFixedAsset() != null) {
            this.assetId = dep.getFixedAsset().getId();
            this.assetCode = dep.getFixedAsset().getAssetCode();
            this.assetName = dep.getFixedAsset().getName();
        }
        this.fiscalYear = dep.getFiscalYear();
        this.openingValue = dep.getOpeningValue();
        this.depreciationAmount = dep.getDepreciationAmount();
        this.closingValue = dep.getClosingValue();
        this.locked = dep.isLocked();
        this.createdAt = dep.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssetId() { return assetId; }
    public void setAssetId(Long assetId) { this.assetId = assetId; }

    public String getAssetCode() { return assetCode; }
    public void setAssetCode(String assetCode) { this.assetCode = assetCode; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public int getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(int fiscalYear) { this.fiscalYear = fiscalYear; }

    public BigDecimal getOpeningValue() { return openingValue; }
    public void setOpeningValue(BigDecimal openingValue) { this.openingValue = openingValue; }

    public BigDecimal getDepreciationAmount() { return depreciationAmount; }
    public void setDepreciationAmount(BigDecimal depreciationAmount) { this.depreciationAmount = depreciationAmount; }

    public BigDecimal getClosingValue() { return closingValue; }
    public void setClosingValue(BigDecimal closingValue) { this.closingValue = closingValue; }

    public boolean isLocked() { return locked; }
    public void setLocked(boolean locked) { this.locked = locked; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

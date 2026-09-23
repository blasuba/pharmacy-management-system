package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.AssetMaintenance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AssetMaintenanceResponse {
    private Long id;
    private Long assetId;
    private String assetCode;
    private String assetName;
    private LocalDate maintenanceDate;
    private String description;
    private BigDecimal cost;
    private String performedBy;
    private LocalDate nextMaintenanceDate;
    private String createdByUsername;
    private LocalDateTime createdAt;

    public AssetMaintenanceResponse() {}

    public AssetMaintenanceResponse(AssetMaintenance m) {
        if (m == null) return;
        this.id = m.getId();
        if (m.getFixedAsset() != null) {
            this.assetId = m.getFixedAsset().getId();
            this.assetCode = m.getFixedAsset().getAssetCode();
            this.assetName = m.getFixedAsset().getName();
        }
        this.maintenanceDate = m.getMaintenanceDate();
        this.description = m.getDescription();
        this.cost = m.getCost();
        this.performedBy = m.getPerformedBy();
        this.nextMaintenanceDate = m.getNextMaintenanceDate();
        if (m.getCreatedBy() != null) {
            this.createdByUsername = m.getCreatedBy().getUsername();
        }
        this.createdAt = m.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAssetId() { return assetId; }
    public void setAssetId(Long assetId) { this.assetId = assetId; }

    public String getAssetCode() { return assetCode; }
    public void setAssetCode(String assetCode) { this.assetCode = assetCode; }

    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }

    public LocalDate getMaintenanceDate() { return maintenanceDate; }
    public void setMaintenanceDate(LocalDate maintenanceDate) { this.maintenanceDate = maintenanceDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public LocalDate getNextMaintenanceDate() { return nextMaintenanceDate; }
    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) { this.nextMaintenanceDate = nextMaintenanceDate; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

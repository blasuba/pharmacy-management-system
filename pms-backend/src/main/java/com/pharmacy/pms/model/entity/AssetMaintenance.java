package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "asset_maintenance", indexes = {
    @Index(name = "idx_maint_asset_id", columnList = "asset_id"),
    @Index(name = "idx_maint_date", columnList = "maintenance_date")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssetMaintenance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    private FixedAsset fixedAsset;

    @Column(name = "maintenance_date", nullable = false)
    private LocalDate maintenanceDate;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal cost = BigDecimal.ZERO;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(name = "next_maintenance_date")
    private LocalDate nextMaintenanceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    public AssetMaintenance() {}

    public AssetMaintenance(FixedAsset fixedAsset, LocalDate maintenanceDate, String description, BigDecimal cost, String performedBy, LocalDate nextMaintenanceDate, User createdBy) {
        this.fixedAsset = fixedAsset;
        this.maintenanceDate = maintenanceDate;
        this.description = description;
        this.cost = cost;
        this.performedBy = performedBy;
        this.nextMaintenanceDate = nextMaintenanceDate;
        this.createdBy = createdBy;
    }

    public FixedAsset getFixedAsset() { return fixedAsset; }
    public void setFixedAsset(FixedAsset fixedAsset) { this.fixedAsset = fixedAsset; }

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

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
}

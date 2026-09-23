package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.FixedAsset;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;
import com.pharmacy.pms.model.enums.DepreciationMethod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AssetResponse {
    private Long id;
    private String assetCode;
    private String name;
    private AssetCategory category;
    private String description;
    private LocalDate purchaseDate;
    private BigDecimal purchaseCost;
    private Long supplierId;
    private String supplierName;
    private String location;
    private String serialNumber;
    private LocalDate warrantyExpiry;
    private int usefulLifeYears;
    private BigDecimal salvageValue;
    private DepreciationMethod depreciationMethod;
    private BigDecimal currentBookValue;
    private AssetStatus status;
    private Long assignedToId;
    private String assignedToName;
    private LocalDate assignedDate;
    private String assignmentNotes;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Derived fields
    private boolean warrantyExpiringSoon;
    private boolean nearEndOfLife;
    private BigDecimal totalMaintenanceCost = BigDecimal.ZERO;
    private boolean replacementSuggested;

    public AssetResponse() {}

    public AssetResponse(FixedAsset asset) {
        if (asset == null) return;
        this.id = asset.getId();
        this.assetCode = asset.getAssetCode();
        this.name = asset.getName();
        this.category = asset.getCategory();
        this.description = asset.getDescription();
        this.purchaseDate = asset.getPurchaseDate();
        this.purchaseCost = asset.getPurchaseCost();
        if (asset.getSupplier() != null) {
            this.supplierId = asset.getSupplier().getId();
            this.supplierName = asset.getSupplier().getName();
        }
        this.location = asset.getLocation();
        this.serialNumber = asset.getSerialNumber();
        this.warrantyExpiry = asset.getWarrantyExpiry();
        this.usefulLifeYears = asset.getUsefulLifeYears();
        this.salvageValue = asset.getSalvageValue();
        this.depreciationMethod = asset.getDepreciationMethod();
        this.currentBookValue = asset.getCurrentBookValue();
        this.status = asset.getStatus();
        if (asset.getAssignedTo() != null) {
            this.assignedToId = asset.getAssignedTo().getId();
            this.assignedToName = asset.getAssignedTo().getFullName();
        }
        this.assignedDate = asset.getAssignedDate();
        this.assignmentNotes = asset.getAssignmentNotes();
        if (asset.getCreatedBy() != null) {
            this.createdByUsername = asset.getCreatedBy().getUsername();
        }
        this.createdAt = asset.getCreatedAt();
        this.updatedAt = asset.getUpdatedAt();

        // Calculate derived alert flags
        if (asset.getWarrantyExpiry() != null) {
            LocalDate now = LocalDate.now();
            this.warrantyExpiringSoon = !asset.getWarrantyExpiry().isBefore(now) && !asset.getWarrantyExpiry().isAfter(now.plusDays(30));
        }

        if (asset.getPurchaseDate() != null && asset.getUsefulLifeYears() > 0) {
            LocalDate endOfLife = asset.getPurchaseDate().plusYears(asset.getUsefulLifeYears());
            LocalDate now = LocalDate.now();
            this.nearEndOfLife = !now.isBefore(endOfLife.minusMonths(6));
        }

        if (asset.getMaintenances() != null && !asset.getMaintenances().isEmpty()) {
            this.totalMaintenanceCost = asset.getMaintenances().stream()
                    .map(m -> m.getCost() != null ? m.getCost() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (this.currentBookValue != null && this.currentBookValue.compareTo(BigDecimal.ZERO) > 0) {
                this.replacementSuggested = this.totalMaintenanceCost.compareTo(this.currentBookValue.multiply(BigDecimal.valueOf(0.5))) > 0;
            }
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAssetCode() { return assetCode; }
    public void setAssetCode(String assetCode) { this.assetCode = assetCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public AssetCategory getCategory() { return category; }
    public void setCategory(AssetCategory category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }

    public BigDecimal getPurchaseCost() { return purchaseCost; }
    public void setPurchaseCost(BigDecimal purchaseCost) { this.purchaseCost = purchaseCost; }

    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public LocalDate getWarrantyExpiry() { return warrantyExpiry; }
    public void setWarrantyExpiry(LocalDate warrantyExpiry) { this.warrantyExpiry = warrantyExpiry; }

    public int getUsefulLifeYears() { return usefulLifeYears; }
    public void setUsefulLifeYears(int usefulLifeYears) { this.usefulLifeYears = usefulLifeYears; }

    public BigDecimal getSalvageValue() { return salvageValue; }
    public void setSalvageValue(BigDecimal salvageValue) { this.salvageValue = salvageValue; }

    public DepreciationMethod getDepreciationMethod() { return depreciationMethod; }
    public void setDepreciationMethod(DepreciationMethod depreciationMethod) { this.depreciationMethod = depreciationMethod; }

    public BigDecimal getCurrentBookValue() { return currentBookValue; }
    public void setCurrentBookValue(BigDecimal currentBookValue) { this.currentBookValue = currentBookValue; }

    public AssetStatus getStatus() { return status; }
    public void setStatus(AssetStatus status) { this.status = status; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }

    public LocalDate getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDate assignedDate) { this.assignedDate = assignedDate; }

    public String getAssignmentNotes() { return assignmentNotes; }
    public void setAssignmentNotes(String assignmentNotes) { this.assignmentNotes = assignmentNotes; }

    public String getCreatedByUsername() { return createdByUsername; }
    public void setCreatedByUsername(String createdByUsername) { this.createdByUsername = createdByUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isWarrantyExpiringSoon() { return warrantyExpiringSoon; }
    public void setWarrantyExpiringSoon(boolean warrantyExpiringSoon) { this.warrantyExpiringSoon = warrantyExpiringSoon; }

    public boolean isNearEndOfLife() { return nearEndOfLife; }
    public void setNearEndOfLife(boolean nearEndOfLife) { this.nearEndOfLife = nearEndOfLife; }

    public BigDecimal getTotalMaintenanceCost() { return totalMaintenanceCost; }
    public void setTotalMaintenanceCost(BigDecimal totalMaintenanceCost) { this.totalMaintenanceCost = totalMaintenanceCost; }

    public boolean isReplacementSuggested() { return replacementSuggested; }
    public void setReplacementSuggested(boolean replacementSuggested) { this.replacementSuggested = replacementSuggested; }
}

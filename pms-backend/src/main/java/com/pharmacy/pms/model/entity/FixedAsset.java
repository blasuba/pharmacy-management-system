package com.pharmacy.pms.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.AssetStatus;
import com.pharmacy.pms.model.enums.DepreciationMethod;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "fixed_assets", indexes = {
    @Index(name = "idx_asset_code", columnList = "asset_code", unique = true),
    @Index(name = "idx_asset_category", columnList = "category"),
    @Index(name = "idx_asset_status", columnList = "status"),
    @Index(name = "idx_asset_assigned_to", columnList = "assigned_to_id")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FixedAsset extends BaseEntity {

    @Column(name = "asset_code", nullable = false, unique = true, length = 50)
    private String assetCode;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private AssetCategory category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "purchase_cost", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchaseCost = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "warranty_expiry")
    private LocalDate warrantyExpiry;

    @Column(name = "useful_life_years", nullable = false)
    private int usefulLifeYears;

    @Column(name = "salvage_value", precision = 12, scale = 2)
    private BigDecimal salvageValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "depreciation_method", length = 30)
    private DepreciationMethod depreciationMethod = DepreciationMethod.STRAIGHT_LINE;

    @Column(name = "current_book_value", precision = 12, scale = 2)
    private BigDecimal currentBookValue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private AssetStatus status = AssetStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(name = "assigned_date")
    private LocalDate assignedDate;

    @Column(name = "assignment_notes", length = 255)
    private String assignmentNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @OneToMany(mappedBy = "fixedAsset", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssetDepreciation> depreciations = new ArrayList<>();

    @OneToMany(mappedBy = "fixedAsset", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AssetMaintenance> maintenances = new ArrayList<>();

    @OneToOne(mappedBy = "fixedAsset", cascade = CascadeType.ALL)
    private AssetDisposal disposal;

    public FixedAsset() {}

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

    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }

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

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public LocalDate getAssignedDate() { return assignedDate; }
    public void setAssignedDate(LocalDate assignedDate) { this.assignedDate = assignedDate; }

    public String getAssignmentNotes() { return assignmentNotes; }
    public void setAssignmentNotes(String assignmentNotes) { this.assignmentNotes = assignmentNotes; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public List<AssetDepreciation> getDepreciations() { return depreciations; }
    public void setDepreciations(List<AssetDepreciation> depreciations) { this.depreciations = depreciations; }

    public List<AssetMaintenance> getMaintenances() { return maintenances; }
    public void setMaintenances(List<AssetMaintenance> maintenances) { this.maintenances = maintenances; }

    public AssetDisposal getDisposal() { return disposal; }
    public void setDisposal(AssetDisposal disposal) { this.disposal = disposal; }
}

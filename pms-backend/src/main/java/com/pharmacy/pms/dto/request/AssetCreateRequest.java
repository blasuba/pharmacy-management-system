package com.pharmacy.pms.dto.request;

import com.pharmacy.pms.model.enums.AssetCategory;
import com.pharmacy.pms.model.enums.DepreciationMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AssetCreateRequest {

    @NotBlank(message = "Asset name is required")
    private String name;

    @NotNull(message = "Asset category is required")
    private AssetCategory category;

    private String description;

    @NotNull(message = "Purchase date is required")
    private LocalDate purchaseDate;

    @NotNull(message = "Purchase cost is required")
    @DecimalMin(value = "0.01", message = "Purchase cost must be greater than zero")
    private BigDecimal purchaseCost;

    private Long supplierId;

    private String location;

    private String serialNumber;

    private LocalDate warrantyExpiry;

    @NotNull(message = "Useful life in years is required")
    @Min(value = 1, message = "Useful life must be at least 1 year")
    private Integer usefulLifeYears;

    private BigDecimal salvageValue = BigDecimal.ZERO;

    private DepreciationMethod depreciationMethod = DepreciationMethod.STRAIGHT_LINE;

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

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public LocalDate getWarrantyExpiry() { return warrantyExpiry; }
    public void setWarrantyExpiry(LocalDate warrantyExpiry) { this.warrantyExpiry = warrantyExpiry; }

    public Integer getUsefulLifeYears() { return usefulLifeYears; }
    public void setUsefulLifeYears(Integer usefulLifeYears) { this.usefulLifeYears = usefulLifeYears; }

    public BigDecimal getSalvageValue() { return salvageValue; }
    public void setSalvageValue(BigDecimal salvageValue) { this.salvageValue = salvageValue; }

    public DepreciationMethod getDepreciationMethod() { return depreciationMethod; }
    public void setDepreciationMethod(DepreciationMethod depreciationMethod) { this.depreciationMethod = depreciationMethod; }
}

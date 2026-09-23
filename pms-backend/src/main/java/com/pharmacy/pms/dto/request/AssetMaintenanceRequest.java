package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class AssetMaintenanceRequest {

    @NotNull(message = "Maintenance date is required")
    private LocalDate maintenanceDate;

    @NotBlank(message = "Maintenance description is required")
    private String description;

    @NotNull(message = "Maintenance cost is required")
    @DecimalMin(value = "0.0", message = "Maintenance cost cannot be negative")
    private BigDecimal cost;

    private String performedBy;

    private LocalDate nextMaintenanceDate;

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
}

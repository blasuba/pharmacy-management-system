package com.pharmacy.pms.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class PosCartItemRequest {
    @NotNull(message = "Drug ID is required")
    private Long drugId;

    private Long batchId; // Optional: If null, FEFO engine automatically selects nearest active batch

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private int quantity;

    private BigDecimal customUnitPrice; // Optional: discount or tier override
    private BigDecimal discountAmount = BigDecimal.ZERO;

    public Long getDrugId() { return drugId; }
    public void setDrugId(Long drugId) { this.drugId = drugId; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getCustomUnitPrice() { return customUnitPrice; }
    public void setCustomUnitPrice(BigDecimal customUnitPrice) { this.customUnitPrice = customUnitPrice; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
}

package com.pharmacy.pms.dto.request;

import com.pharmacy.pms.model.enums.MovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class StockAdjustmentRequest {
    @NotNull(message = "Drug Batch ID is required")
    private Long batchId;

    @NotNull(message = "Adjustment type is required")
    private MovementType movementType; // DAMAGE_WRITE_OFF, EXPIRY_WRITE_OFF, MANUAL_ADJUSTMENT

    @NotNull(message = "Quantity delta is required")
    private Integer quantityDelta; // Negative for loss/write-off, positive for count adjustment

    @NotBlank(message = "Reason for adjustment is required")
    private String reason;

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public MovementType getMovementType() { return movementType; }
    public void setMovementType(MovementType movementType) { this.movementType = movementType; }

    public Integer getQuantityDelta() { return quantityDelta; }
    public void setQuantityDelta(Integer quantityDelta) { this.quantityDelta = quantityDelta; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}

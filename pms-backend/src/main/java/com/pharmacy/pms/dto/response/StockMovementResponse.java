package com.pharmacy.pms.dto.response;

import com.pharmacy.pms.model.entity.StockMovement;
import com.pharmacy.pms.model.enums.MovementType;

import java.time.LocalDateTime;

public class StockMovementResponse {
    private Long id;
    private Long batchId;
    private String batchNumber;
    private Long drugId;
    private String drugName;
    private MovementType movementType;
    private int quantity;
    private int quantityDelta;
    private String referenceType;
    private Long referenceId;
    private String reason;
    private String performedByUsername;
    private LocalDateTime createdAt;

    public StockMovementResponse() {}

    public StockMovementResponse(StockMovement movement) {
        if (movement == null) return;
        this.id = movement.getId();
        this.movementType = movement.getMovementType();
        this.quantity = movement.getQuantityDelta();
        this.quantityDelta = movement.getQuantityDelta();
        this.referenceType = movement.getReferenceType();
        this.referenceId = movement.getReferenceId();
        this.reason = movement.getReason();
        this.createdAt = movement.getCreatedAt();

        if (movement.getDrugBatch() != null) {
            this.batchId = movement.getDrugBatch().getId();
            this.batchNumber = movement.getDrugBatch().getBatchNumber();
            if (movement.getDrugBatch().getDrug() != null) {
                this.drugId = movement.getDrugBatch().getDrug().getId();
                this.drugName = movement.getDrugBatch().getDrug().getName();
            }
        }

        if (movement.getUser() != null) {
            this.performedByUsername = movement.getUser().getUsername();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBatchId() { return batchId; }
    public void setBatchId(Long batchId) { this.batchId = batchId; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Long getDrugId() { return drugId; }
    public void setDrugId(Long drugId) { this.drugId = drugId; }

    public String getDrugName() { return drugName; }
    public void setDrugName(String drugName) { this.drugName = drugName; }

    public MovementType getMovementType() { return movementType; }
    public void setMovementType(MovementType movementType) { this.movementType = movementType; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public int getQuantityDelta() { return quantityDelta; }
    public void setQuantityDelta(int quantityDelta) { this.quantityDelta = quantityDelta; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getPerformedByUsername() { return performedByUsername; }
    public void setPerformedByUsername(String performedByUsername) { this.performedByUsername = performedByUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

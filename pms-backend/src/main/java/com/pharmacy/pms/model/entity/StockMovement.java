package com.pharmacy.pms.model.entity;

import com.pharmacy.pms.model.enums.MovementType;
import jakarta.persistence.*;

@Entity
@Table(name = "stock_movements", indexes = {
    @Index(name = "idx_movement_batch", columnList = "drug_batch_id"),
    @Index(name = "idx_movement_created", columnList = "created_at")
})
public class StockMovement extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "drug_batch_id", nullable = false)
    private DrugBatch drugBatch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private MovementType movementType;

    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta; // Positive (+) or Negative (-)

    @Column(name = "reference_type", length = 50)
    private String referenceType; // SALE, PURCHASE_ORDER, MANUAL_ADJUSTMENT

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    public StockMovement() {
        // Default constructor for JPA
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final StockMovement movement = new StockMovement();

        public Builder drugBatch(DrugBatch drugBatch) {
            movement.drugBatch = drugBatch;
            return this;
        }

        public Builder branch(Branch branch) {
            movement.branch = branch;
            return this;
        }

        public Builder user(User user) {
            movement.user = user;
            return this;
        }

        public Builder movementType(MovementType movementType) {
            movement.movementType = movementType;
            return this;
        }

        public Builder quantityDelta(int quantityDelta) {
            movement.quantityDelta = quantityDelta;
            return this;
        }

        public Builder referenceType(String referenceType) {
            movement.referenceType = referenceType;
            return this;
        }

        public Builder referenceId(Long referenceId) {
            movement.referenceId = referenceId;
            return this;
        }

        public Builder reason(String reason) {
            movement.reason = reason;
            return this;
        }

        public StockMovement build() {
            return movement;
        }
    }

    public DrugBatch getDrugBatch() { return drugBatch; }
    public void setDrugBatch(DrugBatch drugBatch) { this.drugBatch = drugBatch; }

    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public MovementType getMovementType() { return movementType; }
    public void setMovementType(MovementType movementType) { this.movementType = movementType; }

    public int getQuantityDelta() { return quantityDelta; }
    public void setQuantityDelta(int quantityDelta) { this.quantityDelta = quantityDelta; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
